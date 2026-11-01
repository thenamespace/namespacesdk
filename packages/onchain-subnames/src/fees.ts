import type { ContractClient } from "./context.js";
import { parseAbi, zeroAddress, type Address } from "viem";
import { OnchainError, toOnchainError } from "./errors.js";
import type { PaymentToken, TransactionCall } from "./types.js";

export interface TransactionCostEstimate {
  networkFeeWei: bigint | null;
  nativeBalanceShortfallWei: bigint;
  tokenBalanceShortfall: bigint;
}

export interface EstimateTransactionCostInput {
  account: Address;
  calls: readonly TransactionCall[];
  payment: { token: PaymentToken; amount: bigint };
}

const balanceAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

async function estimateGasPrice(client: ContractClient): Promise<bigint> {
  const [history, fees] = await Promise.allSettled([
    client.getFeeHistory({ blockCount: 10, rewardPercentiles: [50] }),
    client.estimateFeesPerGas(),
  ]);
  const estimates = fees.status === "fulfilled" ? fees.value : null;
  const baseFee =
    history.status === "fulfilled"
      ? history.value.baseFeePerGas.at(-1)
      : undefined;
  if (baseFee === undefined) {
    const estimate = estimates?.maxFeePerGas ?? estimates?.gasPrice;
    if (estimate === undefined)
      throw new OnchainError(
        "RPC_ERROR",
        "Couldn't estimate the network fee. Try again before submitting.",
        { cause: fees.status === "rejected" ? fees.reason : history },
      );
    return estimate;
  }
  const tips = (
    history.status === "fulfilled" ? (history.value.reward ?? []) : []
  )
    .map((reward) => reward[0])
    .filter((tip): tip is bigint => tip !== undefined)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const median = tips[Math.floor(tips.length / 2)] ?? 0n;
  const rpcTip = estimates?.maxPriorityFeePerGas ?? 0n;
  return baseFee + (median > rpcTip ? median : rpcTip);
}

/** Simulate ordered calls, including approvals, and report balance shortfalls. Requires eth_simulateV1. */
export async function estimateTransactionCost(
  client: ContractClient,
  input: EstimateTransactionCostInput,
): Promise<TransactionCostEstimate> {
  const { account, calls, payment } = input;
  if (calls.length === 0)
    throw new OnchainError(
      "INVALID_INPUT",
      "Provide at least one transaction to estimate.",
    );
  try {
    const native = payment.token.address === zeroAddress;
    const [ethBalance, tokenBalance] = await Promise.all([
      client.getBalance({ address: account }),
      native || payment.amount === 0n
        ? Promise.resolve(0n)
        : client.readContract({
            address: payment.token.address,
            abi: balanceAbi,
            functionName: "balanceOf",
            args: [account],
          }),
    ]);
    const tokenBalanceShortfall =
      native || tokenBalance >= payment.amount
        ? 0n
        : payment.amount - tokenBalance;
    if (tokenBalanceShortfall > 0n)
      return {
        networkFeeWei: null,
        nativeBalanceShortfallWei: 0n,
        tokenBalanceShortfall,
      };
    const [simulation, gasPrice] = await Promise.all([
      client.simulateCalls({
        account,
        calls: [...calls],
        stateOverrides: [{ address: account, balance: 10n ** 30n }],
      }),
      estimateGasPrice(client),
    ]);
    if (simulation.results.length !== calls.length)
      throw new OnchainError(
        "RPC_ERROR",
        "The RPC returned an incomplete simulation. Try again before submitting.",
        { cause: simulation },
      );
    const failed = simulation.results.find(
      (result) => result.status !== "success",
    );
    if (failed)
      throw new OnchainError(
        "CONTRACT_REVERTED",
        "A prepared transaction would fail. Refresh the quote before confirming.",
        { cause: failed },
      );
    const networkFeeWei =
      simulation.results.reduce((sum, result) => sum + result.gasUsed, 0n) *
      gasPrice;
    const ethNeeded =
      networkFeeWei + calls.reduce((sum, call) => sum + call.value, 0n);
    return {
      networkFeeWei,
      nativeBalanceShortfallWei:
        ethBalance >= ethNeeded ? 0n : ethNeeded - ethBalance,
      tokenBalanceShortfall: 0n,
    };
  } catch (cause) {
    throw toOnchainError(
      cause,
      "Couldn't simulate the transactions. Check that your RPC supports eth_simulateV1 and try again.",
    );
  }
}
