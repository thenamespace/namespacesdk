import type {
  EndpointValidationReport,
  ValidationIssue,
} from "@thenamespace/universal-usernames";
import type { UsernameOwnerWallet } from "./wallet-adapters";

export type {
  EndpointValidationReport,
  ValidationIssue,
  ValidationIssueCode,
} from "@thenamespace/universal-usernames";

/** The validation report offchain-manager returns for an endpoint and one sample username. */
export type UsernameValidationReport = EndpointValidationReport;

export type UsernameConnectionStatus =
  | "draft"
  | "validated"
  | "verifying"
  | "active"
  | "paused"
  | "suspended"
  | "disconnected";

export type UsernameRevisionState =
  | "candidate"
  | "validated"
  | "active"
  | "superseded"
  | "rejected";

/** How Namespace calls the endpoint: no auth, or `Authorization: Bearer <credential>`. */
export type UsernameAuthMode = "none" | "bearer";

/** The changes that each need a fresh operation signature from the parent owner. */
export type UsernameOperation =
  | "save"
  | "activate"
  | "rotate-credential"
  | "pause"
  | "resume"
  | "disconnect";

export type ParentOwnerSource = "v1" | "v1-wrapped" | "v2";

export interface UsernameConnectionRevision {
  revisionNo: number;
  endpointUrl: string;
  authMode: UsernameAuthMode;
  /** Whether a credential is stored. The value itself is never returned. */
  hasCredential: boolean;
  credentialUpdatedAt: string | null;
  sampleUsername: string;
  state: UsernameRevisionState;
  validation: UsernameValidationReport | null;
  createdAt: string;
  /** Address of the owner who created the revision. */
  createdBy: string;
}

export type UsernameActivation =
  | { verifiedAt: string; checkedRecords: string[] }
  | { failedAt: string; errors: ValidationIssue[] };

export interface UsernameConnection {
  parentName: string;
  parentNode: `0x${string}`;
  chain: "mainnet" | "sepolia";
  status: UsernameConnectionStatus;
  /** Optimistic concurrency counter. Send it back as `expectedRevision` with the next change. */
  revision: number;
  activeRevision: UsernameConnectionRevision | null;
  latestRevision: UsernameConnectionRevision | null;
  owner: {
    address: `0x${string}`;
    source: ParentOwnerSource;
    checkedAt: string;
  };
  storedSubnamesAcknowledged: boolean;
  suspendedReason: "owner-changed" | "expired" | null;
  activation: UsernameActivation | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParentInspection {
  parentName: string;
  parentNode: `0x${string}`;
  /** Second-level `.eth`, normalized and not expired. */
  supported: boolean;
  owner: {
    address: `0x${string}`;
    source: ParentOwnerSource;
    expiresAt: string | null;
  };
  resolver: { address: `0x${string}` | null; isHybridResolverV2: boolean };
  route: { id: number | null; isOffchain: boolean };
  /** False when the name is wrapped with CANNOT_SET_RESOLVER burned. */
  canSetResolver: boolean;
  storedSubnames: { count: number };
  /** For example `L2_ROUTE`, `CANNOT_SET_RESOLVER`, `EXPIRED`, `NOT_ETH_2LD`. */
  blockers: { code: string; message: string }[];
}

export type UsernameConnectionEventAction =
  | "save"
  | "validate"
  | "activate"
  | "activation-failed"
  | "rotate-credential"
  | "pause"
  | "resume"
  | "suspend"
  | "disconnect"
  | "acknowledge-stored-subnames";

export interface UsernameConnectionEvent {
  action: UsernameConnectionEventAction;
  /** An address, `namespace-admin` or `system`. */
  actor: string;
  revisionNo: number | null;
  createdAt: string;
  /** Redacted by the server; never holds secrets. */
  details: Record<string, unknown>;
}

export interface ValidateUsernameEndpointRequest {
  endpointUrl: string;
  authMode: UsernameAuthMode;
  /** Bearer token, only with `authMode: "bearer"`. Sent to Namespace, never returned. */
  credential?: string;
  /** A normalized username the endpoint serves. */
  username: string;
}

export interface SaveUsernameConnectionRequest {
  endpointUrl: string;
  authMode: UsernameAuthMode;
  /** New bearer token, only with `authMode: "bearer"`. Sent to Namespace, never returned. */
  credential?: string;
  /** Reuse the bearer token of the latest revision instead of sending it again. */
  keepCredential?: boolean;
  /** A normalized username the endpoint serves, used to validate and activate. */
  sampleUsername: string;
  /** Required when the parent already has stored offchain subnames: they stop resolving. */
  acknowledgeStoredSubnames?: boolean;
  /**
   * The connection's current `revision`. `0` only when the parent never had a connection;
   * after a disconnect, send the disconnected connection's revision.
   */
  expectedRevision: number;
}

export interface ExpectedRevisionRequest {
  /** The connection's current `revision`. The change fails with a conflict if it moved on. */
  expectedRevision: number;
}

export interface RotateUsernameCredentialRequest extends ExpectedRevisionRequest {
  /** New bearer token. Sent to Namespace, never returned. */
  credential: string;
}

/**
 * A signed-in wallet session for the parent owner, used for reads.
 * `token` works like a password for this address on offchain-manager until `expiresAt`:
 * keep it in memory and never log it.
 */
export interface UsernameOwnerSession {
  /** EIP-55 checksummed address that signed the session. */
  address: string;
  /** `<base64(message)>.<base64(signature)>`, sent as `x-auth-token: siwe:<token>`. */
  token: string;
  /** Unix time in milliseconds. */
  expiresAt: number;
}

export interface CreateUsernameOwnerSessionOptions {
  /** Signs with this wallet instead of the client's `provider`. */
  wallet?: UsernameOwnerWallet;
  /** @default 3600 */
  expiresInSeconds?: number;
}
