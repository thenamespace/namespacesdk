import { encodeFunctionData, zeroAddress, type Address } from "viem";
import { erc20Abi, issuerAbi } from "./abis.js";
import type { ReadContext } from "./context.js";
import { OnchainError } from "./errors.js";
import type { PaymentToken, TransactionCall } from "./types.js";
import { address } from "./validation.js";

/** Two percent headroom. Native excess is refunded; ERC20 approvals are not a price cap. */
export const withPaymentBuffer = (amount: bigint): bigint =>
  amount + (amount * 200n + 9_999n) / 10_000n;

export function paymentToken(ctx: ReadContext, input: Address): PaymentToken {
  const tokenAddress = address(input, "payment token", true);
  const token = ctx.deployment.paymentTokens.find(
    (token) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
  );
  if (!token)
    throw new OnchainError(
      "UNSUPPORTED_TOKEN",
      "Select one of this deployment's supported payment tokens.",
      { details: { token: tokenAddress } },
    );
  return token;
}

export async function paymentQuote(
  ctx: ReadContext,
  usdAmount: bigint,
  tokenAddress: Address,
): Promise<bigint> {
  if (typeof usdAmount !== "bigint" || usdAmount < 0n)
    throw new OnchainError(
      "INVALID_INPUT",
      "The USD quote must be a nonnegative bigint in 12-decimal units.",
    );
  const token = paymentToken(ctx, tokenAddress);
  // Even free registrations reject unsupported payment tokens onchain.
  return ctx.client.readContract({
    address: ctx.deployment.issuer,
    abi: issuerAbi,
    functionName: "quotePayment",
    args: [usdAmount, token.address],
    blockNumber: ctx.blockNumber,
  });
}

export async function preparePayment(
  ctx: ReadContext,
  payer: Address,
  usdAmount: bigint,
  tokenAddress: Address,
  maxPriceUsdRaw?: bigint,
) {
  if (maxPriceUsdRaw !== undefined) {
    if (typeof maxPriceUsdRaw !== "bigint" || maxPriceUsdRaw < 0n)
      throw new OnchainError(
        "INVALID_INPUT",
        "The maximum USD price must be a nonnegative bigint.",
      );
    if (usdAmount > maxPriceUsdRaw)
      throw new OnchainError(
        "PRICE_CHANGED",
        "The price increased. Refresh the quote before confirming.",
        { details: { previous: maxPriceUsdRaw, current: usdAmount } },
      );
  }
  const token = paymentToken(ctx, tokenAddress);
  const amount = await paymentQuote(ctx, usdAmount, tokenAddress);
  const bufferedAmount = withPaymentBuffer(amount);
  const calls: TransactionCall[] = [];
  if (token.address !== zeroAddress && amount > 0n) {
    const allowance = await ctx.client.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [payer, ctx.deployment.issuer],
      blockNumber: ctx.blockNumber,
    });
    if (allowance < bufferedAmount)
      calls.push({
        to: token.address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [ctx.deployment.issuer, bufferedAmount],
        }),
        value: 0n,
        title: `Approving ${token.symbol}`,
      });
  }
  return { payment: { token, amount, bufferedAmount }, calls };
}
