export type OnchainErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_CHAIN"
  | "CHAIN_MISMATCH"
  | "PROOF_UNAVAILABLE"
  | "INVALID_PROOF"
  | "RPC_ERROR"
  | "CONTRACT_REVERTED"
  | "MINT_BLOCKED"
  | "RENEWAL_BLOCKED"
  | "UNSUPPORTED_TOKEN"
  | "PRICE_CHANGED"
  | "CONFIGURATION_CHANGED"
  | "WALLET_REJECTED"
  | "INSUFFICIENT_FUNDS"
  | "TRANSACTION_FAILED";

export class OnchainError extends Error {
  readonly code: OnchainErrorCode;
  readonly details: Readonly<Record<string, unknown>>;
  constructor(
    code: OnchainErrorCode,
    message: string,
    options: {
      cause?: unknown;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "OnchainError";
    this.code = code;
    this.details = options.details ?? {};
  }
}

/** Preserve the original provider error while giving applications a stable code and message. */
export function toOnchainError(
  cause: unknown,
  message = "The request failed. Try again.",
  fallbackCode: OnchainErrorCode = "RPC_ERROR",
): OnchainError {
  if (cause instanceof OnchainError) return cause;
  let current: unknown = cause;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const error = current as {
      name?: string;
      code?: number;
      cause?: unknown;
      data?: { errorName?: string };
    };
    if (error.code === 4001 || error.name === "UserRejectedRequestError")
      return new OnchainError(
        "WALLET_REJECTED",
        "The wallet request was declined.",
        { cause },
      );
    if (error.name === "InsufficientFundsError")
      return new OnchainError(
        "INSUFFICIENT_FUNDS",
        "Your wallet needs more funds for the payment and network fee.",
        { cause },
      );
    if (error.name === "ContractFunctionRevertedError")
      return new OnchainError(
        "CONTRACT_REVERTED",
        "The contract rejected this transaction. Refresh the quote and check your eligibility.",
        {
          cause,
          details: { contractError: error.data?.errorName },
        },
      );
    current = error.cause;
  }
  return new OnchainError(fallbackCode, message, { cause });
}
