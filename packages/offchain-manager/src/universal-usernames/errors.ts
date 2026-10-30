import { isAxiosError } from "axios";
import { NamespaceSDKError } from "../offchain-client/errors";
import { UsernameValidationReport } from "./types";

// The API's way of saying "nothing is wrong with the request, try again shortly"
const RETRYABLE_CODES = ["UPSTREAM_UNAVAILABLE", "RATE_LIMITED"];

/**
 * An error answer from the Universal Usernames API. `code` is the API's stable code,
 * such as `INVALID_STATE`, `PRECONDITION_FAILED` or `UPSTREAM_UNAVAILABLE`, when the body has one.
 */
export class UniversalUsernamesError extends NamespaceSDKError {
  /**
   * True when the same request may succeed later: a chain RPC or the gateway was down
   * (503 `UPSTREAM_UNAVAILABLE`) or the request was rate limited (429 `RATE_LIMITED`).
   */
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string | undefined,
    /** HTTP status, or undefined when no response arrived. */
    public readonly status: number | undefined,
    /** Extra data the API sent, such as the failed preconditions on a 412. */
    public readonly details?: unknown
  ) {
    super(message, code);
    this.name = "UniversalUsernamesError";
    this.retryable = code !== undefined && RETRYABLE_CODES.includes(code);
  }
}

/** 403 `NOT_PARENT_OWNER`: the signer is not the exact owner of the parent name, or it expired. */
export class NotParentOwnerError extends UniversalUsernamesError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, "NOT_PARENT_OWNER", status, details);
    this.name = "NotParentOwnerError";
  }
}

/** 409 `REVISION_CONFLICT`: the connection changed since `expectedRevision`. Reload it and retry. */
export class ConnectionRevisionConflictError extends UniversalUsernamesError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, "REVISION_CONFLICT", status, details);
    this.name = "ConnectionRevisionConflictError";
  }
}

/** 422 `VALIDATION_FAILED`: the request or the endpoint did not validate. */
export class EndpointValidationError extends UniversalUsernamesError {
  /** The validation report, when the API sent one. */
  public readonly report: UsernameValidationReport | null;

  constructor(message: string, status: number, details?: unknown) {
    super(message, "VALIDATION_FAILED", status, details);
    this.name = "EndpointValidationError";
    this.report = isValidationReport(details) ? details : null;
  }
}

const isValidationReport = (
  value: unknown
): value is UsernameValidationReport => {
  const report = value as Partial<UsernameValidationReport> | null;
  return (
    typeof report?.ok === "boolean" &&
    typeof report.username === "string" &&
    Array.isArray(report.issues)
  );
};

const messageOf = (body: unknown): string | undefined => {
  const message = (body as { message?: unknown } | null)?.message;
  if (typeof message === "string") {
    return message;
  }
  // Request validation errors carry a list of messages
  if (Array.isArray(message)) {
    return message.filter((m) => typeof m === "string").join("; ");
  }
  return undefined;
};

/**
 * Maps a failed Universal Usernames request to a typed error.
 * The AxiosError is never passed on, not even as `cause`: its request config holds the
 * `x-auth-token` and, for some requests, the endpoint credential.
 */
export const toUniversalUsernamesError = (error: unknown): unknown => {
  if (!isAxiosError(error)) {
    return error;
  }

  const status = error.response?.status;
  if (status === undefined) {
    return new UniversalUsernamesError(
      `Universal Usernames request failed: ${error.message}`,
      undefined,
      undefined
    );
  }

  const body = error.response?.data as
    | { code?: unknown; details?: unknown }
    | undefined;
  const code = typeof body?.code === "string" ? body.code : undefined;
  const message =
    messageOf(body) || `Universal Usernames request failed with status ${status}`;
  const details = body?.details;

  switch (code) {
    case "NOT_PARENT_OWNER":
      return new NotParentOwnerError(message, status, details);
    case "REVISION_CONFLICT":
      return new ConnectionRevisionConflictError(message, status, details);
    case "VALIDATION_FAILED":
      return new EndpointValidationError(message, status, details);
    default:
      return new UniversalUsernamesError(message, code, status, details);
  }
};
