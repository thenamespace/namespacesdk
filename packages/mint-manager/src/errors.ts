/**
 * Error codes emitted by `@thenamespace/mint-manager`.
 *
 * Codes are stable across minor versions. Branch on `code` rather than
 * matching `message` text, which is free to change.
 */
export type MintManagerErrorCode =
  /** A full ENS name failed ENSIP-15 normalization or was empty/not a string. */
  | "INVALID_NAME"
  /** A single label was empty, contained a ".", was an encoded labelhash, or failed ENSIP-15. */
  | "INVALID_LABEL"
  /** A value that must be a 20-byte EVM address was not one. */
  | "INVALID_ADDRESS"
  /** The requested chain has no Namespace deployment in this environment. */
  | "UNSUPPORTED_CHAIN"
  /** The listing exists but its type is not one this SDK version can mint from. */
  | "UNSUPPORTED_LISTING"
  /** A name that is not mintable was passed to the transaction builder. */
  | "NAME_NOT_AVAILABLE"
  /** No listing exists for the requested parent name. */
  | "LISTING_NOT_FOUND"
  /** A JSON-RPC / contract read failed. */
  | "RPC_ERROR"
  /** The Namespace HTTP API returned a non-2xx response. */
  | "API_ERROR"
  /** Mint parameters returned by the API do not match what was requested. */
  | "MINT_PARAMS_MISMATCH"
  /** The quoted mint price is above the caller's stated maximum. */
  | "PRICE_EXCEEDS_MAX"
  /** The mint authorization signature is past its expiry. */
  | "SIGNATURE_EXPIRED"
  /** The client was constructed with an invalid or incomplete configuration. */
  | "CONFIG_ERROR";

/** Extra context attached to a {@link MintManagerError}. */
export interface MintManagerErrorOptions {
  /** Structured, machine-readable context about the failure. */
  details?: Record<string, unknown>;
  /** Link to documentation that explains the failure in full. */
  docsUrl?: string;
  /** The lower-level error this one wraps. */
  cause?: unknown;
}

const DOCS_BASE = "https://docs.namespace.ninja/developer-guide/mint-manager";
const ENSIP15_DOCS = "https://docs.ens.domains/ensip/15";

/**
 * Base error class for all `@thenamespace/mint-manager` failures.
 *
 * Consumers can branch on `instanceof MintManagerError` and read `code`
 * instead of parsing free-text `message` strings.
 *
 * @example
 * ```typescript
 * import { MintManagerError } from "@thenamespace/mint-manager";
 *
 * try {
 *   await client.getMintTransactionParameters({ ... });
 * } catch (err) {
 *   if (err instanceof MintManagerError) {
 *     console.error(err.code, err.message, err.details);
 *   }
 * }
 * ```
 */
export class MintManagerError extends Error {
  /** Stable machine-readable error code. */
  readonly code: MintManagerErrorCode;

  /** Structured context about what failed. Safe to log. */
  readonly details?: Record<string, unknown>;

  /** Documentation link that explains this failure. */
  readonly docsUrl?: string;

  constructor(
    code: MintManagerErrorCode,
    message: string,
    options: MintManagerErrorOptions = {}
  ) {
    super(message);
    this.name = "MintManagerError";
    this.code = code;
    this.details = options.details;
    this.docsUrl = options.docsUrl;

    // `cause` is only assigned when supplied so that `"cause" in err` stays
    // meaningful on runtimes that predate ES2022 error causes.
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }

    // Restore prototype chain across ES5 compilation targets.
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MintManagerError);
    }
  }
}

/** Renders an arbitrary input for inclusion in an error message. */
const show = (value: unknown): string => {
  if (typeof value === "string") {
    return value.length === 0 ? '"" (empty string)' : JSON.stringify(value);
  }
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return `${typeof value} value`;
};

/** Extracts a human-readable reason out of whatever a dependency threw. */
export const reasonFrom = (cause: unknown): string => {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === "string" && cause) return cause;
  return "no reason reported";
};

/**
 * Picks the advice that actually applies, because "try another name" is wrong
 * guidance for an allowlist and "switch wallets" is wrong for a taken name.
 */
const remedyFor = (status: string, reasons: readonly string[]): string => {
  if (status === "taken") {
    return "The name is registered, so a different label is the only way forward.";
  }
  if (reasons.includes("LISTING_EXPIRED")) {
    return (
      "The listing's minting window has closed, so no label under this parent " +
      "is mintable until the owner relists it. Changing the label will not help."
    );
  }
  if (reasons.includes("SUBNAME_RESERVED")) {
    return (
      "This label is held back by the parent owner. The name is not registered, " +
      "but it is not available to this address. Try a different label."
    );
  }
  if (
    reasons.includes("MINTER_NOT_WHITELISTED") ||
    reasons.includes("MINTER_NOT_TOKEN_OWNER") ||
    reasons.includes("VERIFIED_MINTER_ADDRESS_REQUIRED")
  ) {
    return (
      "The restriction is on the minting address, not the name, so every other " +
      "label will fail the same way. Use an address that satisfies the parent's " +
      "requirements rather than prompting for a different name."
    );
  }
  return (
    'Handle the "taken" and "blocked" cases from checkName before calling ' +
    "prepareMint."
  );
};

/**
 * Factory helpers for every error code.
 *
 * Each helper writes the whole message: what happened, why, and what to do
 * about it. Call sites stay a single line.
 *
 * @example
 * ```typescript
 * throw createError.invalidLabel("my.name", 'labels cannot contain "."');
 * ```
 */
export const createError = {
  /**
   * A full ENS name could not be normalized.
   *
   * @param name - The raw input as the caller supplied it.
   * @param reason - Why it failed, ideally the ENSIP-15 normalizer's own words.
   */
  invalidName: (name: unknown, reason: string, cause?: unknown) =>
    new MintManagerError(
      "INVALID_NAME",
      `Invalid ENS name ${show(name)}: ${reason}. ` +
        `A name must be a non-empty string that normalizes under ENSIP-15 ` +
        `(for example "namespace.eth" or "app.namespace.eth"). ` +
        `Normalize user input before storing or comparing it, since ` +
        `"Alice.eth" and "alice.eth" are the same name but different strings.`,
      { details: { name }, docsUrl: ENSIP15_DOCS, cause }
    ),

  /**
   * A single label could not be normalized, or was not a single label at all.
   *
   * @param label - The raw input as the caller supplied it.
   * @param reason - The specific rule that was broken.
   */
  invalidLabel: (label: unknown, reason: string, cause?: unknown) =>
    new MintManagerError(
      "INVALID_LABEL",
      `Invalid ENS label ${show(label)}: ${reason}. ` +
        `A label is the single leftmost segment of a name, "alice" in ` +
        `"alice.namespace.eth", so it must be non-empty, must not contain ".", ` +
        `and must normalize under ENSIP-15. ` +
        `Pass the parent name separately instead of embedding it in the label.`,
      { details: { label }, docsUrl: ENSIP15_DOCS, cause }
    ),

  /**
   * A value that must be an EVM address was not one.
   *
   * @param value - The raw input.
   * @param field - Name of the parameter, so the caller knows which one to fix.
   */
  invalidAddress: (value: unknown, field: string) =>
    new MintManagerError(
      "INVALID_ADDRESS",
      `Invalid address for "${field}": ${show(value)}. ` +
        `Expected a 20-byte EVM address as a "0x"-prefixed 40-character hex ` +
        `string, for example "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045". ` +
        `If the value came from an ENS lookup, resolve it to an address first; ` +
        `if it is checksummed, the checksum must be correct.`,
      { details: { field, value } }
    ),

  /**
   * The chain has no Namespace deployment.
   *
   * @param chain - Chain id or name that was requested.
   * @param supported - Chains that are available in the current environment.
   */
  unsupportedChain: (chain: unknown, supported?: readonly (string | number)[]) =>
    new MintManagerError(
      "UNSUPPORTED_CHAIN",
      `Chain ${show(chain)} is not supported by this client. ` +
        (supported && supported.length
          ? `Supported chains: ${supported.join(", ")}. `
          : "") +
        `Mainnet and testnet chains are separate: construct the client with ` +
        `{ isTestnet: true } for Sepolia, Base Sepolia and Optimism Sepolia.`,
      { details: { chain, supported }, docsUrl: `${DOCS_BASE}#networks` }
    ),

  /**
   * A name that is not mintable was handed to the transaction builder.
   *
   * @param name - The name that was rejected.
   * @param status - The status the check reported.
   * @param reasons - What the API objected to, when known.
   */
  nameNotAvailable: (
    name: string,
    status: string,
    reasons: readonly string[] = []
  ) =>
    new MintManagerError(
      "NAME_NOT_AVAILABLE",
      `"${name}" cannot be minted: the check reported "${status}"` +
        (reasons.length ? ` (${reasons.join(", ")})` : "") +
        `. Only a check with status "available" can be prepared. ` +
        remedyFor(status, reasons),
      { details: { name, status, reasons } }
    ),

  /**
   * The listing exists but this SDK cannot mint from it.
   *
   * @param listingType - The `type` field returned by the List Manager API.
   * @param name - The parent name the listing belongs to.
   */
  unsupportedListing: (listingType: unknown, name: string) =>
    new MintManagerError(
      "UNSUPPORTED_LISTING",
      `Listing for "${name}" has type ${show(listingType)}, which this ` +
        `version of @thenamespace/mint-manager cannot mint from. ` +
        `Only "L1" and "L2" listings are supported. ` +
        `Off-chain (gasless) names are minted with @thenamespace/offchain-manager instead.`,
      { details: { listingType, name }, docsUrl: `${DOCS_BASE}#listings` }
    ),

  /**
   * No listing exists for the parent name.
   *
   * @param name - The parent name that was looked up.
   */
  listingNotFound: (name: string, cause?: unknown) =>
    new MintManagerError(
      "LISTING_NOT_FOUND",
      `No listing found for parent name "${name}". ` +
        `A name must be listed on Namespace before its subnames can be minted, ` +
        `and listings are per-network. A name listed on mainnet is not visible ` +
        `to a client constructed with { isTestnet: true }. ` +
        `List the name at https://app.namespace.ninja, or check the spelling of the parent name.`,
      { details: { name }, docsUrl: `${DOCS_BASE}#listings`, cause }
    ),

  /**
   * A contract read or JSON-RPC call failed.
   *
   * @param operation - What the SDK was doing, e.g. "reading subname owner".
   * @param chainId - Chain the call was made against.
   */
  rpcError: (operation: string, chainId: number | undefined, cause?: unknown) =>
    new MintManagerError(
      "RPC_ERROR",
      `RPC call failed while ${operation}` +
        (chainId === undefined ? "" : ` on chain ${chainId}`) +
        `: ${reasonFrom(cause)}. ` +
        `This is not an answer about the name. It is unknown, not taken. ` +
        `Do not show the user "unavailable" on the strength of this error; ` +
        `surface it as a temporary lookup failure and let them retry. ` +
        `The most common cause is rate limiting on the default public endpoint: ` +
        `pass your own via customRpcUrls, keyed by numeric chain id ` +
        `(for example { ${chainId ?? 8453}: process.env.RPC_URL }).`,
      { details: { operation, chainId }, docsUrl: `${DOCS_BASE}#custom-rpc`, cause }
    ),

  /**
   * The Namespace HTTP API returned an error response.
   *
   * @param status - HTTP status code, or undefined if the request never landed.
   * @param endpoint - Path that was called.
   * @param apiMessage - Message body returned by the service, if any.
   */
  apiError: (
    status: number | undefined,
    endpoint: string,
    apiMessage?: string,
    cause?: unknown
  ) =>
    new MintManagerError(
      "API_ERROR",
      `Namespace API request to ${endpoint} failed` +
        (status === undefined
          ? ` before receiving a response: ${reasonFrom(cause)}. Check network connectivity and any proxy settings`
          : ` with HTTP ${status}${apiMessage ? `: ${apiMessage}` : ""}`) +
        `. ` +
        (status === 404
          ? `A 404 here usually means the name is not listed on the selected network.`
          : status !== undefined && status >= 500
            ? `This is a server-side failure; retry with backoff before treating it as fatal.`
            : `Check the request parameters against the documented request shape.`),
      { details: { status, endpoint, apiMessage }, docsUrl: DOCS_BASE, cause }
    ),

  /**
   * The signed mint parameters do not describe the mint that was requested.
   *
   * @param field - The field that disagrees, e.g. "label".
   * @param expected - What the caller asked for.
   * @param actual - What the API signed.
   */
  mintParamsMismatch: (field: string, expected: unknown, actual: unknown) =>
    new MintManagerError(
      "MINT_PARAMS_MISMATCH",
      `Signed mint parameters do not match the request: "${field}" was ` +
        `requested as ${show(expected)} but the API signed ${show(actual)}. ` +
        `Submitting this transaction would mint something other than what was asked for, ` +
        `so it was stopped. ` +
        `This usually means the input was normalized after the request was built. ` +
        `normalize labels and names first, then request mint parameters with the normalized values.`,
      { details: { field, expected, actual } }
    ),

  /**
   * The quoted price is above the caller's ceiling.
   *
   * @param price - Total quoted cost in wei (price + fee).
   * @param maxValue - The caller's stated maximum in wei.
   */
  priceExceedsMax: (price: bigint, maxValue: bigint) =>
    new MintManagerError(
      "PRICE_EXCEEDS_MAX",
      `Mint price ${price.toString()} wei exceeds the maxValue of ` +
        `${maxValue.toString()} wei you allowed. ` +
        `Nothing was submitted and no funds moved. ` +
        `Prices are quoted per request and can move between the quote and the ` +
        `signature, which is exactly what maxValue exists to catch. ` +
        `Re-quote with checkName to see the current price, then either raise ` +
        `maxValue or show the new price to the user before retrying.`,
      { details: { price: price.toString(), maxValue: maxValue.toString() } }
    ),

  /**
   * The mint authorization has expired.
   *
   * @param expiryUnixSeconds - `expiry` from the signed parameters.
   * @param nowUnixSeconds - Current time used for the comparison.
   */
  signatureExpired: (expiryUnixSeconds: number, nowUnixSeconds: number) =>
    new MintManagerError(
      "SIGNATURE_EXPIRED",
      `Mint authorization expired ${nowUnixSeconds - expiryUnixSeconds} seconds ago ` +
        `(expiry ${expiryUnixSeconds}, now ${nowUnixSeconds}). ` +
        `Signed mint parameters are short-lived so a quote cannot be replayed later. ` +
        `Call getMintTransactionParameters again to get a fresh signature, and submit the ` +
        `transaction promptly rather than caching the result.`,
      { details: { expiryUnixSeconds, nowUnixSeconds } }
    ),

  /**
   * The client configuration is unusable.
   *
   * @param reason - What is wrong with it.
   */
  configError: (reason: string, details?: Record<string, unknown>) =>
    new MintManagerError(
      "CONFIG_ERROR",
      `Invalid mint client configuration: ${reason}. ` +
        `Fix the options passed to createMintClient and construct the client again.`,
      { details, docsUrl: `${DOCS_BASE}#configuration` }
    ),
};
