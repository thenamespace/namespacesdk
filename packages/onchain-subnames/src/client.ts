import { encodeFunctionData, zeroAddress, type Address } from "viem";
import { subnameIssuerAbi, activationManagerAbi } from "./abis.js";
import { readParentState } from "./activation.js";
import type { ReadContext, ContractClient } from "./context.js";
import { getOnchainDeployment } from "./deployment.js";
import { OnchainError, toOnchainError } from "./errors.js";
import {
  estimateTransactionCost,
  type EstimateTransactionCostInput,
} from "./fees.js";
import { readPaymentQuote, preparePayment } from "./payment.js";
import { readRegistrationQuote, readRenewalQuote } from "./quotes.js";
import type {
  RegistrationInput,
  PaymentQuoteInput,
  RegistrationQuote,
  OnchainClientOptions,
  PrepareRegistrationInput,
  PreparedOperation,
  PrepareRenewalInput,
  RenewalInput,
  RenewalQuote,
} from "./types.js";
import { validateAddress } from "./validation.js";

/** A headless client. It reads contracts and prepares calls; it never signs or sends transactions. */
export function createOnchainClient(options: OnchainClientOptions) {
  const deployment = getOnchainDeployment(options.chainId);
  if (
    options.publicClient.chain &&
    options.publicClient.chain.id !== deployment.chainId
  )
    throw new OnchainError(
      "CHAIN_MISMATCH",
      "The public client and SDK must use the same chain.",
    );
  if (options.managerApiUrl !== undefined) {
    let url: URL;
    try {
      url = new URL(options.managerApiUrl);
    } catch (cause) {
      throw new OnchainError(
        "INVALID_INPUT",
        "The proof service URL must be an absolute HTTP or HTTPS URL.",
        { cause },
      );
    }
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new OnchainError(
        "INVALID_INPUT",
        "Use an HTTP or HTTPS proof service URL without credentials, query parameters or fragments.",
      );
    deployment.managerApiUrl = url.href.replace(/\/$/, "");
  }
  async function withReadContext<T>(
    operation: (ctx: ReadContext) => Promise<T>,
  ): Promise<T> {
    try {
      const chainId = await options.publicClient.getChainId();
      if (chainId !== deployment.chainId)
        throw new OnchainError(
          "CHAIN_MISMATCH",
          "The RPC endpoint is connected to a different chain.",
          { details: { expected: deployment.chainId, actual: chainId } },
        );
      const blockNumber = await options.publicClient.getBlockNumber({
        cacheTime: 0,
      });
      return await operation({
        // Keep Viem's ABI inference inside the SDK, without exporting its recursive account types.
        client: {
          ...options.publicClient,
          readContract: options.publicClient
            .readContract as ContractClient["readContract"],
        },
        deployment,
        fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
        blockNumber,
      });
    } catch (cause) {
      throw toOnchainError(
        cause,
        "Couldn't read the onchain subname state. Check your RPC connection and try again.",
      );
    }
  }
  return {
    /** Deployment metadata for token selectors and explorer links. */
    deployment,
    /** Read advanced parent configuration and registry binding state. */
    getParentState: (parentName: string) =>
      withReadContext((ctx) => readParentState(ctx, parentName)),
    /** Reads the manager's live resolver precedence, including the platform default. */
    getRegistrationResolver: (
      parentName: string,
      requested: Address = zeroAddress,
    ) =>
      withReadContext(async (ctx) => {
        const parent = await readParentState(ctx, parentName);
        return ctx.client.readContract({
          address: deployment.activationManager,
          abi: activationManagerAbi,
          functionName: "getSubnameResolver",
          args: [
            parent.activationId,
            validateAddress(requested, "resolver", true),
          ],
          blockNumber: ctx.blockNumber,
        });
      }),
    /** Simulate prepared calls and report network fees and balance shortfalls. */
    estimateTransactionCost: (input: EstimateTransactionCostInput) =>
      withReadContext((ctx) =>
        estimateTransactionCost(ctx.client, {
          ...input,
          account: validateAddress(input.account, "account"),
        }),
      ),
    /** Check registration and pricing. Omit account for disconnected browsing. */
    getRegistrationQuote: (input: RegistrationInput) =>
      withReadContext(
        async (ctx) => (await readRegistrationQuote(ctx, input)).quote,
      ),
    /** Check renewal and project expiry without assuming the payer owns the name. */
    getRenewalQuote: (input: RenewalInput) =>
      withReadContext(
        async (ctx) => (await readRenewalQuote(ctx, input)).quote,
      ),
    /** Convert an exact USD amount into a supported token denomination. */
    getPaymentQuote: (input: PaymentQuoteInput) =>
      withReadContext((ctx) => readPaymentQuote(ctx, input)),
    /** Rechecks state and proofs, then returns any approval followed by registration. */
    prepareRegistration: (
      input: PrepareRegistrationInput,
    ): Promise<
      PreparedOperation<RegistrationQuote & { status: "ready" }> & {
        resolver: Address;
      }
    > =>
      withReadContext(async (ctx) => {
        const account = validateAddress(input.account, "account");
        const recipient = validateAddress(
          input.recipient ?? account,
          "recipient",
        );
        const requested = validateAddress(
          input.resolver ?? zeroAddress,
          "resolver",
          true,
        );
        const { quote, parent, encodedClaims } = await readRegistrationQuote(
          ctx,
          { ...input, account },
        );
        if (quote.status !== "ready")
          throw new OnchainError(
            "REGISTRATION_BLOCKED",
            quote.reason?.message ?? "This subname can't be registered.",
            { details: { reason: quote.reason } },
          );
        const { calls, payment } = await preparePayment(
          ctx,
          account,
          quote.price,
          input.paymentToken,
          input.maxPriceUsd,
        );
        const resolver = await ctx.client.readContract({
          address: deployment.activationManager,
          abi: activationManagerAbi,
          functionName: "getSubnameResolver",
          args: [parent.activationId, requested],
          blockNumber: ctx.blockNumber,
        });
        calls.push({
          to: deployment.subnameIssuer,
          data: encodeFunctionData({
            abi: subnameIssuerAbi,
            functionName: "register",
            args: [
              {
                parentLabel: quote.parentName.slice(0, -4),
                label: quote.label,
                owner: recipient,
                resolver: requested,
                duration: quote.durationSeconds,
                extraData: encodedClaims,
              },
              payment.token.address,
            ],
          }),
          value:
            payment.token.address === zeroAddress ? payment.bufferedAmount : 0n,
          title: `Registering ${quote.label}.${quote.parentName}`,
        });
        return {
          chainId: deployment.chainId,
          account,
          quote,
          payment,
          calls,
          resolver,
        };
      }),
    /** Renewal may be paid by any wallet; it does not transfer ownership. */
    prepareRenewal: (
      input: PrepareRenewalInput,
    ): Promise<PreparedOperation<RenewalQuote & { status: "ready" }>> =>
      withReadContext(async (ctx) => {
        const account = validateAddress(input.account, "account");
        const { quote, encodedClaims } = await readRenewalQuote(ctx, {
          ...input,
          account,
        });
        if (quote.status !== "ready")
          throw new OnchainError(
            "RENEWAL_BLOCKED",
            quote.reason?.message ?? "This subname can't be renewed.",
            { details: { reason: quote.reason } },
          );
        const { calls, payment } = await preparePayment(
          ctx,
          account,
          quote.price,
          input.paymentToken,
          input.maxPriceUsd,
        );
        calls.push({
          to: deployment.subnameIssuer,
          data: encodeFunctionData({
            abi: subnameIssuerAbi,
            functionName: "renew",
            args: [
              {
                parentLabel: quote.parentName.slice(0, -4),
                label: quote.label,
                duration: quote.durationSeconds,
                extraData: encodedClaims,
              },
              payment.token.address,
            ],
          }),
          value:
            payment.token.address === zeroAddress ? payment.bufferedAmount : 0n,
          title: `Renewing ${quote.label}.${quote.parentName}`,
        });
        return {
          chainId: deployment.chainId,
          account,
          quote,
          payment,
          calls,
        };
      }),
  };
}
export type OnchainClient = ReturnType<typeof createOnchainClient>;
