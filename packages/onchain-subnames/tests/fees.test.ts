import { zeroAddress } from "viem";
import { createOnchainClient } from "../src";
import { deployment, fixture, payer, usdc } from "./fixture";

function feesFixture() {
  const f = fixture();
  const simulateCalls = jest.fn(async () => ({
    results: [{ status: "success" as "success" | "failure", gasUsed: 21_000n }],
  }));
  const client = createOnchainClient({
    chainId: 11155111,
    publicClient: {
      ...f.publicClient,
      simulateCalls,
      getBalance: async () => 50_000n,
      estimateFeesPerGas: async () => ({
        maxFeePerGas: 2n,
        maxPriorityFeePerGas: 1n,
      }),
      getFeeHistory: async () => ({
        oldestBlock: 1n,
        gasUsedRatio: [0.5],
        baseFeePerGas: [1n, 1n],
        reward: [[1n]],
      }),
    },
  });
  const input = {
    account: payer,
    calls: [
      {
        to: deployment.subnameIssuer,
        data: "0x" as const,
        value: 10_000n,
        title: "Mint",
      },
    ],
    payment: { token: deployment.paymentTokens[0], amount: 10_000n },
  };
  return { ...f, client, input, simulateCalls };
}

test("includes call value and gas in the ETH shortfall", async () => {
  const f = feesFixture();
  expect(await f.client.estimateTransactionCost(f.input)).toEqual({
    networkFeeWei: 42_000n,
    nativeBalanceShortfallWei: 2_000n,
    tokenBalanceShortfall: 0n,
  });
});

test("reports ERC20 shortfall before attempting a failing simulation", async () => {
  const f = feesFixture();
  f.readContract.mockResolvedValue(1n);
  const token = deployment.paymentTokens.find(
    (token) => token.address === usdc,
  )!;
  expect(
    await f.client.estimateTransactionCost({
      ...f.input,
      payment: { token, amount: 10n },
    }),
  ).toMatchObject({ networkFeeWei: null, tokenBalanceShortfall: 9n });
  expect(f.simulateCalls).not.toHaveBeenCalled();
});

test("preserves the cause when the RPC cannot simulate calls", async () => {
  const f = feesFixture();
  const cause = new Error("eth_simulateV1 unsupported");
  f.simulateCalls.mockRejectedValue(cause);
  await expect(f.client.estimateTransactionCost(f.input)).rejects.toMatchObject(
    {
      code: "RPC_ERROR",
      cause,
    },
  );
});

test("reports a reverted simulation instead of a zero fee", async () => {
  const f = feesFixture();
  f.simulateCalls.mockResolvedValue({
    results: [{ status: "failure", gasUsed: 100n }],
  });
  await expect(f.client.estimateTransactionCost(f.input)).rejects.toMatchObject(
    {
      code: "CONTRACT_REVERTED",
    },
  );
});

test("rejects an incomplete simulation instead of reporting zero fees", async () => {
  const f = feesFixture();
  f.simulateCalls.mockResolvedValue({ results: [] });
  await expect(f.client.estimateTransactionCost(f.input)).rejects.toMatchObject(
    {
      code: "RPC_ERROR",
    },
  );
});
