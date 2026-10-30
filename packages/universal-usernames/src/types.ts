/** A brand endpoint's answer for one username (profile schema v1). */
export interface UsernameProfileV1 {
  version: 1;
  username: string;
  texts: Record<string, string>;
  /** Keyed by decimal ENS coin type (ENSIP-9 / ENSIP-11). */
  addresses: Record<string, string>;
  contenthash?: string;
}

/** Fails the whole profile. */
export type EnvelopeIssueCode =
  | 'INVALID_JSON'
  | 'DUPLICATE_KEY'
  | 'NOT_AN_OBJECT'
  | 'UNSUPPORTED_VERSION'
  | 'UNKNOWN_FIELD'
  | 'USERNAME_MISSING'
  | 'USERNAME_MISMATCH'
  | 'TEXTS_NOT_OBJECT'
  | 'ADDRESSES_NOT_OBJECT'
  | 'TOO_MANY_TEXTS'
  | 'TOO_MANY_ADDRESSES';

/** Fails only the record at `path`. */
export type RecordIssueCode =
  | 'TEXT_KEY_INVALID'
  | 'TEXT_VALUE_INVALID'
  | 'TEXT_VALUE_TOO_LONG'
  | 'COIN_TYPE_INVALID'
  | 'COIN_TYPE_UNSUPPORTED'
  | 'ADDRESS_INVALID'
  | 'CONTENTHASH_INVALID'
  | 'CONTENTHASH_UNSUPPORTED';

/** Raised while reaching the endpoint, before the body is parsed. */
export type TransportIssueCode =
  | 'INVALID_URL'
  | 'DESTINATION_BLOCKED'
  | 'HTTP_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'HTTP_REDIRECT'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'HTTP_ERROR_STATUS'
  | 'USERNAME_NOT_FOUND'
  | 'CONTENT_TYPE_INVALID'
  | 'RESPONSE_TOO_LARGE';

export type ValidationIssueCode = EnvelopeIssueCode | RecordIssueCode | TransportIssueCode;

export type ValidationIssueKind = 'envelope' | 'record' | 'transport';

export interface ValidationIssue {
  code: ValidationIssueCode;
  kind: ValidationIssueKind;
  /** RFC 6901 JSON Pointer into the response body; `""` is the root. */
  path: string;
  /** Human-readable. Never contains credentials or the full profile. */
  message: string;
}

/** Valid records only, in the human-readable form the endpoint returned. */
export interface ProfilePreview {
  texts: Record<string, string>;
  /** Keyed by decimal coin type. */
  addresses: Record<string, string>;
  contenthash: string | null;
}

export interface EndpointValidationReport {
  /** True only when `issues` is empty. */
  ok: boolean;
  /** ISO 8601. */
  checkedAt: string;
  /** Normalized sample label. */
  username: string;
  /** `endpointUrl + "/" + label`. Never includes credentials. */
  requestUrl: string;
  httpStatus: number | null;
  latencyMs: number | null;
  /** Every transport, envelope and record issue. */
  issues: ValidationIssue[];
  /** Null when the transport or envelope failed. */
  preview: ProfilePreview | null;
  /** Set by offchain-manager when the sample child has an onchain owner. */
  onchainConflict?: boolean;
}

export type RecordResult<T> =
  | { status: 'found'; value: T }
  | { status: 'absent' }
  | { status: 'invalid'; issue: ValidationIssue };

export type HexString = `0x${string}`;
