import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import { ValidationError } from "../offchain-client/errors";

export interface SiweMessageFields {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  chainId: number;
  nonce: string;
  issuedAt: Date;
  expirationTime: Date;
  resources?: string[];
}

/** EIP-55 mixed-case checksum of a 20-byte hex address. */
export const toChecksumAddress = (address: string): string => {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new ValidationError(`Wallet returned an invalid address: ${address}`);
  }
  const lower = address.slice(2).toLowerCase();
  const hash = bytesToHex(keccak_256(utf8ToBytes(lower)));
  let checksummed = "0x";
  for (let i = 0; i < lower.length; i++) {
    checksummed +=
      parseInt(hash[i], 16) >= 8 ? lower[i].toUpperCase() : lower[i];
  }
  return checksummed;
};

/**
 * Formats an EIP-4361 message exactly like viem's `createSiweMessage`, which offchain-manager
 * parses with `parseSiweMessage`. The statement may hold a Unicode parent name: viem accepts it,
 * while strict EIP-4361 parsers (ASCII-only statements) would not.
 */
export const formatSiweMessage = (fields: SiweMessageFields): string => {
  if (/[\r\n]/.test(fields.statement)) {
    throw new ValidationError("SIWE statement must be a single line");
  }
  if (!/^[a-zA-Z0-9]{8,}$/.test(fields.nonce)) {
    throw new ValidationError("SIWE nonce must be at least 8 alphanumeric characters");
  }

  const lines = [
    `${fields.domain} wants you to sign in with your Ethereum account:`,
    toChecksumAddress(fields.address),
    "",
    fields.statement,
    "",
    `URI: ${fields.uri}`,
    "Version: 1",
    `Chain ID: ${fields.chainId}`,
    `Nonce: ${fields.nonce}`,
    `Issued At: ${fields.issuedAt.toISOString()}`,
    `Expiration Time: ${fields.expirationTime.toISOString()}`,
  ];
  if (fields.resources?.length) {
    lines.push("Resources:", ...fields.resources.map((r) => `- ${r}`));
  }
  return lines.join("\n");
};

// Base64 of the UTF-8 bytes (btoa alone throws on non-Latin-1 text such as an emoji name)
const toBase64 = (text: string) => {
  let binary = "";
  for (const byte of utf8ToBytes(text)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

/** `<base64(message)>.<base64(signature)>`, the token offchain-manager reads after `siwe:`. */
export const encodeSiweToken = (message: string, signature: string) =>
  `${toBase64(message)}.${toBase64(signature)}`;
