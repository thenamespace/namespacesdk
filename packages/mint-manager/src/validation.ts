import { ens_normalize } from "@adraffy/ens-normalize";
import { Address, getAddress, isAddress } from "viem";
import { createError, reasonFrom } from "./errors";

/**
 * Maximum UTF-8 byte length of a full ENS name.
 *
 * ENS does not enforce this on-chain, but DNS and every wallet/indexer in the
 * path does, so a longer name is unusable in practice.
 */
export const MAX_NAME_BYTES = 255;

/** Maximum UTF-8 byte length of a single label, matching the DNS label limit. */
export const MAX_LABEL_BYTES = 63;

/**
 * The encoded-labelhash form, e.g. `[af2caa...]`.
 *
 * viem's `namehash()` treats this as a pre-hashed label and inserts the hex
 * verbatim instead of running keccak over it. Accepting it would let a caller
 * address a node they never named, so it is rejected before it reaches viem.
 */
const ENCODED_LABELHASH = /^\[[0-9a-f]{64}\]$/i;

const utf8Bytes = (value: string): number =>
  typeof TextEncoder === "function"
    ? new TextEncoder().encode(value).length
    : Buffer.byteLength(value, "utf8");

/**
 * Normalize a full ENS name according to ENSIP-15.
 *
 * The normalizer is the single source of truth for Unicode composition (NFC),
 * case folding, emoji and FE0F handling, script mixing, confusables and
 * zero-width characters, this function adds only the length bound around it.
 *
 * @param name - Raw, user-supplied name such as `"Alice.ETH"`.
 * @returns The normalized name, e.g. `"alice.eth"`.
 * @throws {MintManagerError} with code `INVALID_NAME`.
 *
 * @example
 * ```typescript
 * normalizeName("Alice.ETH"); // "alice.eth"
 * ```
 */
export function normalizeName(name: string): string {
  if (typeof name !== "string") {
    throw createError.invalidName(name, "expected a string");
  }

  if (name.length === 0) {
    throw createError.invalidName(name, "the name is empty");
  }

  let normalized: string;
  try {
    normalized = ens_normalize(name);
  } catch (cause) {
    throw createError.invalidName(name, reasonFrom(cause), cause);
  }

  assertNameLength(name, normalized);
  return normalized;
}

/**
 * Normalize a single ENS label.
 *
 * A label is one segment of a name, `"alice"` in `"alice.namespace.eth"`.
 * Passing a full name here is the most common mint bug, so `"."` is rejected
 * outright rather than silently hashed as one long label.
 *
 * @param label - Raw, user-supplied label such as `"Alice"`.
 * @returns The normalized label, e.g. `"alice"`.
 * @throws {MintManagerError} with code `INVALID_LABEL`.
 *
 * @example
 * ```typescript
 * normalizeLabel("Alice");             // "alice"
 * normalizeLabel("alice.namespace.eth"); // throws INVALID_LABEL
 * ```
 */
export function normalizeLabel(label: string): string {
  if (typeof label !== "string") {
    throw createError.invalidLabel(label, "expected a string");
  }

  if (label.length === 0) {
    throw createError.invalidLabel(label, "the label is empty");
  }

  if (label.includes(".")) {
    throw createError.invalidLabel(
      label,
      'a label cannot contain ".". This value looks like a full name, not a label'
    );
  }

  if (ENCODED_LABELHASH.test(label)) {
    throw createError.invalidLabel(
      label,
      "encoded labelhashes are not accepted here, because they address a node " +
        "directly instead of naming one"
    );
  }

  assertLabelLength(label, label);

  let normalized: string;
  try {
    normalized = ens_normalize(label);
  } catch (cause) {
    throw createError.invalidLabel(label, reasonFrom(cause), cause);
  }

  // Normalization can only ever be applied to a single label here, but it can
  // change byte length (for example by expanding a compatibility character).
  if (normalized.includes(".")) {
    throw createError.invalidLabel(
      label,
      'normalization produced a "." separator, so this is more than one label'
    );
  }

  if (normalized.length === 0) {
    throw createError.invalidLabel(
      label,
      "every character was removed during normalization, leaving an empty label"
    );
  }

  assertLabelLength(label, normalized);
  return normalized;
}

/**
 * Normalize a full subname, which must have at least one parent label.
 *
 * Mirrors `normalizeSubname` in `@thenamespace/avatar`.
 *
 * @param subname - Raw subname such as `"Alice.namespace.eth"`.
 * @returns The normalized subname.
 * @throws {MintManagerError} with code `INVALID_NAME`.
 */
export function normalizeSubname(subname: string): string {
  const normalized = normalizeName(subname);

  if (!normalized.includes(".")) {
    throw createError.invalidName(
      subname,
      "a subname needs at least one parent label, so it must contain a \".\" " +
        '(for example "alice.namespace.eth")'
    );
  }

  return normalized;
}

/**
 * Validate an EVM address and return it in EIP-55 checksummed form.
 *
 * @param value - Raw address string.
 * @param field - Parameter name, used to say which input was wrong.
 * @returns The checksummed address.
 * @throws {MintManagerError} with code `INVALID_ADDRESS`.
 *
 * @example
 * ```typescript
 * assertAddress(minter, "minterAddress");
 * ```
 */
export function assertAddress(value: string, field: string): Address {
  // `isAddress` defaults to strict mode: an all-lowercase address is accepted,
  // but a mixed-case one must carry a correct EIP-55 checksum.
  if (typeof value !== "string" || !isAddress(value)) {
    throw createError.invalidAddress(value, field);
  }

  return getAddress(value);
}

function assertNameLength(raw: string, normalized: string): void {
  const bytes = utf8Bytes(normalized);
  if (bytes > MAX_NAME_BYTES) {
    throw createError.invalidName(
      raw,
      `the name is ${bytes} UTF-8 bytes, over the ${MAX_NAME_BYTES}-byte limit`
    );
  }
}

function assertLabelLength(raw: string, candidate: string): void {
  const bytes = utf8Bytes(candidate);
  if (bytes > MAX_LABEL_BYTES) {
    throw createError.invalidLabel(
      raw,
      `the label is ${bytes} UTF-8 bytes, over the ${MAX_LABEL_BYTES}-byte limit`
    );
  }
}
