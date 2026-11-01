import { encodeFunctionData, zeroAddress, type Address } from "viem";
import { erc20Abi, subnameIssuerAbi } from "./abis.js";
import type { ReadContext } from "./context.js";
import { OnchainError } from "./errors.js";
import type {
  PaymentToken,
  PaymentQuote,
  PaymentQuoteInput,
  TransactionCall,
  UsdAmount,
} from "./types.js";
import { validateAddress } from "./validation.js";

/** Two percent headroom. Native excess is refunded; ERC20 approvals are not a price cap. */
const addPaymentBuffer = (amount: bigint): bigint =>
  amount + (amount * 200n + 9_999n) / 10_000n;

function validateUsdAmount(price: UsdAmount, field: string) {
  if (
    !price ||
    price.currency !== "USD" ||
    price.decimals !== 12 ||
    typeof price.amount !== "bigint" ||
    price.amount < 0n
  )
    throw new OnchainError(
      "INVALID_INPUT",
      "Provide a nonnegative USD bigint amount with currency USD and decimals 12.",
      { details: { field } },
    );
}

function getSupportedPaymentToken(
  ctx: ReadContext,
  input: Address,
): PaymentToken {
  const tokenAddress = validateAddress(input, "payment token", true);
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

export async function readPaymentQuote(
  ctx: ReadContext,
  input: PaymentQuoteInput,
): Promise<PaymentQuote> {
  validateUsdAmount(input.price, "price");
  const token = getSupportedPaymentToken(ctx, input.paymentToken);
  // Even free registrations reject unsupported payment tokens onchain.
  const amount = await ctx.client.readContract({
    address: ctx.deployment.subnameIssuer,
    abi: subnameIssuerAbi,
    functionName: "quotePayment",
    args: [input.price.amount, token.address],
    blockNumber: ctx.blockNumber,
  });
  return { token, amount };
}

export async function preparePayment(
  ctx: ReadContext,
  account: Address,
  price: UsdAmount,
  paymentToken: Address,
  maxPriceUsd?: UsdAmount,
) {
  if (maxPriceUsd !== undefined) {
    validateUsdAmount(maxPriceUsd, "maxPriceUsd");
    if (price.amount > maxPriceUsd.amount)
      throw new OnchainError(
        "PRICE_CHANGED",
        "The price increased. Refresh the quote before confirming.",
        { details: { previous: maxPriceUsd, current: price } },
      );
  }
  const { token, amount } = await readPaymentQuote(ctx, {
    price,
    paymentToken,
  });
  const bufferedAmount = addPaymentBuffer(amount);
  const calls: TransactionCall[] = [];
  if (token.address !== zeroAddress && amount > 0n) {
    const allowance = await ctx.client.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account, ctx.deployment.subnameIssuer],
      blockNumber: ctx.blockNumber,
    });
    if (allowance < bufferedAmount)
      calls.push({
        to: token.address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [ctx.deployment.subnameIssuer, bufferedAmount],
        }),
        value: 0n,
        title: `Approving ${token.symbol}`,
      });
  }
  return { payment: { token, amount, bufferedAmount }, calls };
}
