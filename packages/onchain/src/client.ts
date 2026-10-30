import { encodeFunctionData, zeroAddress, type Address } from "viem";
import { issuerAbi, managerAbi } from "./abis.js";
import { readActivation } from "./activation.js";
import type { ReadContext, ContractClient } from "./context.js";
import { getOnchainDeployment } from "./deployment.js";
import { OnchainError, toOnchainError } from "./errors.js";
import { estimateFees, type EstimateFeesInput } from "./fees.js";
import { paymentQuote, preparePayment } from "./payment.js";
import { mintQuote, renewalQuote } from "./quotes.js";
import type {
  MintInput,
  MintQuote,
  OnchainClientOptions,
  PrepareMintInput,
  PreparedTransaction,
  PrepareRenewalInput,
  RenewalInput,
  RenewalQuote,
} from "./types.js";
import { address } from "./validation.js";

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
  async function run<T>(
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
    getActivation: (parentName: string) =>
      run((ctx) => readActivation(ctx, parentName)),
    /** Reads the manager's live resolver precedence, including the platform default. */
    getResolver: (parentName: string, requested: Address = zeroAddress) =>
      run(async (ctx) => {
        const activation = await readActivation(ctx, parentName);
        return ctx.client.readContract({
          address: deployment.manager,
          abi: managerAbi,
          functionName: "getSubnameResolver",
          args: [activation.id, address(requested, "resolver", true)],
          blockNumber: ctx.blockNumber,
        });
      }),
    estimateFees: (input: EstimateFeesInput) =>
      run((ctx) =>
        estimateFees(ctx.client, {
          ...input,
          account: address(input.account, "payer"),
        }),
      ),
    quoteMint: (input: MintInput) => run((ctx) => mintQuote(ctx, input)),
    quoteRenewal: (input: RenewalInput) =>
      run((ctx) => renewalQuote(ctx, input)),
    quotePayment: (usdAmount: bigint, token: Address) =>
      run((ctx) => paymentQuote(ctx, usdAmount, token)),
    /** Rechecks state and proofs, then returns any approval followed by registration. */
    prepareMint: (
      input: PrepareMintInput,
    ): Promise<PreparedTransaction<MintQuote> & { resolver: Address }> =>
      run(async (ctx) => {
        const payer = address(input.minter, "minter");
        const recipient = address(input.recipient ?? payer, "recipient");
        const requested = address(
          input.resolver ?? zeroAddress,
          "resolver",
          true,
        );
        const quote = await mintQuote(ctx, { ...input, minter: payer });
        if (!quote.canMint || !quote.available)
          throw new OnchainError(
            "MINT_BLOCKED",
            quote.reason?.message ?? "This subname can't be minted.",
            { details: { reason: quote.reason } },
          );
        const { calls, payment } = await preparePayment(
          ctx,
          payer,
          quote.priceUsdRaw,
          input.paymentToken,
          input.maxPriceUsdRaw,
        );
        const resolver = await ctx.client.readContract({
          address: deployment.manager,
          abi: managerAbi,
          functionName: "getSubnameResolver",
          args: [quote.activation.id, requested],
          blockNumber: ctx.blockNumber,
        });
        calls.push({
          to: deployment.issuer,
          data: encodeFunctionData({
            abi: issuerAbi,
            functionName: "register",
            args: [
              {
                parentLabel: quote.parentName.slice(0, -4),
                label: quote.label,
                owner: recipient,
                resolver: requested,
                duration: quote.duration,
                extraData: quote.extraData,
              },
              payment.token.address,
            ],
          }),
          value:
            payment.token.address === zeroAddress ? payment.bufferedAmount : 0n,
          title: `Minting ${quote.label}.${quote.parentName}`,
        });
        return {
          chainId: deployment.chainId,
          account: payer,
          quote,
          payment,
          calls,
          resolver,
        };
      }),
    /** Renewal may be paid by any wallet; it does not transfer ownership. */
    prepareRenewal: (
      input: PrepareRenewalInput,
    ): Promise<PreparedTransaction<RenewalQuote>> =>
      run(async (ctx) => {
        const payer = address(input.renewer, "renewer");
        const quote = await renewalQuote(ctx, { ...input, renewer: payer });
        if (!quote.renewable)
          throw new OnchainError(
            "RENEWAL_BLOCKED",
            quote.reason?.message ?? "This subname can't be renewed.",
            { details: { reason: quote.reason } },
          );
        const { calls, payment } = await preparePayment(
          ctx,
          payer,
          quote.priceUsdRaw,
          input.paymentToken,
          input.maxPriceUsdRaw,
        );
        calls.push({
          to: deployment.issuer,
          data: encodeFunctionData({
            abi: issuerAbi,
            functionName: "renew",
            args: [
              {
                parentLabel: quote.parentName.slice(0, -4),
                label: quote.label,
                duration: quote.duration,
                extraData: quote.extraData,
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
          account: payer,
          quote,
          payment,
          calls,
        };
      }),
  };
}
export type OnchainClient = ReturnType<typeof createOnchainClient>;
