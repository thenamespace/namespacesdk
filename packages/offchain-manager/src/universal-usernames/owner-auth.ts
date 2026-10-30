import { keccak_256 } from "@noble/hashes/sha3";
import {
  bytesToHex,
  concatBytes,
  randomBytes,
  utf8ToBytes,
} from "@noble/hashes/utils";
import { ValidationError } from "../offchain-client/errors";
import { encodeSiweToken, formatSiweMessage, toChecksumAddress } from "./siwe-message";
import { UsernameOperation, UsernameOwnerSession } from "./types";
import { ensureWalletChain, WalletProvider } from "./wallet-adapters";

// offchain-manager rejects operation signatures valid for more than 10 minutes
export const OPERATION_SIGNATURE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60;

/** Where the signed EIP-4361 messages say they come from, and the chain they are bound to. */
export interface SiweSigningContext {
  /** Must be one of offchain-manager's allowed SIWE domains. */
  domain: string;
  uri: string;
  /** 1 on mainnet, 11155111 on Sepolia. */
  chainId: number;
}

export interface OperationScope {
  parentName: string;
  action: UsernameOperation;
  expectedRevision: number;
}

/** ENS namehash (EIP-137) of a normalized name. */
export const namehash = (name: string): `0x${string}` => {
  let node: Uint8Array = new Uint8Array(32);
  if (name) {
    for (const label of name.split(".").reverse()) {
      node = keccak_256(concatBytes(node, keccak_256(utf8ToBytes(label))));
    }
  }
  return `0x${bytesToHex(node)}`;
};

export const operationStatement = (
  action: UsernameOperation,
  parentName: string
) => `Authorize ${action} for Universal Usernames on ${parentName}`;

/** Binds an operation signature to one parent, action and revision. */
export const operationResource = (
  parentNode: string,
  action: UsernameOperation,
  expectedRevision: number
) => `urn:namespace:uun:${parentNode}:${action}:${expectedRevision}`;

/** The `x-auth-token` value for a session token or an operation signature. */
export const siweAuthHeader = (token: string) => `siwe:${token}`;

const signSiweMessage = async (
  wallet: WalletProvider,
  context: SiweSigningContext,
  fields: {
    statement: string;
    getNonce: () => Promise<string>;
    ttlMs: number;
    resources?: string[];
  }
) => {
  await ensureWalletChain(wallet, context.chainId);
  const address = toChecksumAddress(await wallet.getAddress());
  // Fetched last: a server nonce only lives for a short time
  const nonce = await fields.getNonce();
  const issuedAt = new Date();
  const expirationTime = new Date(issuedAt.getTime() + fields.ttlMs);

  const message = formatSiweMessage({
    domain: context.domain,
    address,
    statement: fields.statement,
    uri: context.uri,
    chainId: context.chainId,
    nonce,
    issuedAt,
    expirationTime,
    resources: fields.resources,
  });
  const signature = await wallet.signMessage(message);
  return {
    address,
    token: encodeSiweToken(message, signature),
    expiresAt: expirationTime.getTime(),
  };
};

/**
 * Signs a wallet session for reads. Sessions carry a nonce made here: offchain-manager
 * accepts them until they expire and doesn't consume a server nonce for them.
 */
export const createOwnerSession = async (
  wallet: WalletProvider,
  context: SiweSigningContext,
  expiresInSeconds = DEFAULT_SESSION_TTL_SECONDS
): Promise<UsernameOwnerSession> => {
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new ValidationError("expiresInSeconds must be a positive integer");
  }
  return signSiweMessage(wallet, context, {
    statement: "Sign in to Namespace",
    getNonce: async () => bytesToHex(randomBytes(16)),
    ttlMs: expiresInSeconds * 1000,
  });
};

/**
 * Signs one change with a fresh server nonce and returns the `x-auth-token` value.
 * The request consumes the nonce, so every change needs a new signature.
 */
export const signOperation = async (
  wallet: WalletProvider,
  context: SiweSigningContext,
  scope: OperationScope,
  getNonce: () => Promise<string>
): Promise<string> => {
  const { parentName, action, expectedRevision } = scope;
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new ValidationError(
      "expectedRevision must be a non-negative integer (the connection's revision, or 0 when the parent never had one)"
    );
  }
  // Normalized names are lowercase; catching this here saves a signature the API would reject
  if (!parentName || parentName !== parentName.toLowerCase()) {
    throw new ValidationError(
      `Pass the normalized parent name, e.g. brand.eth: ${parentName}`
    );
  }

  const { token } = await signSiweMessage(wallet, context, {
    statement: operationStatement(action, parentName),
    getNonce,
    ttlMs: OPERATION_SIGNATURE_TTL_MS,
    resources: [
      operationResource(namehash(parentName), action, expectedRevision),
    ],
  });
  return siweAuthHeader(token);
};
