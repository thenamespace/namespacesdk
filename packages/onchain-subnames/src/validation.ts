import {
  getAddress,
  isAddress,
  keccak256,
  toBytes,
  zeroAddress,
  type Address,
} from "viem";
import { normalize } from "viem/ens";
import { OnchainError } from "./errors.js";
import type { SubnameInput } from "./types.js";

export const SECONDS_PER_YEAR = 31_536_000n;
export const MAX_UINT64 = (1n << 64n) - 1n;
export const getLabelId = (label: string) => BigInt(keccak256(toBytes(label)));

export function normalizeParentName(input: string): string {
  try {
    const name = normalize(input);
    const parts = name.split(".");
    if (parts.length !== 2 || parts[1] !== "eth")
      throw new Error("Expected a second-level .eth parent");
    return name;
  } catch (cause) {
    throw new OnchainError(
      "INVALID_INPUT",
      "Enter a parent name such as example.eth.",
      { cause, details: { field: "parentName" } },
    );
  }
}

export function validateSubnameInput(
  input: SubnameInput,
  requireDuration = false,
) {
  const parent = normalizeParentName(input.parentName);
  let label: string;
  try {
    label = normalize(input.label);
    if (!label || label.includes(".")) throw new Error("Expected one label");
  } catch (cause) {
    throw new OnchainError(
      "INVALID_INPUT",
      "Enter one valid subname label without dots.",
      { cause, details: { field: "label" } },
    );
  }
  if (requireDuration && input.durationSeconds === undefined)
    throw new OnchainError(
      "INVALID_INPUT",
      "Provide durationSeconds for renewal.",
      {
        details: { field: "durationSeconds" },
      },
    );
  const durationSeconds = input.durationSeconds ?? SECONDS_PER_YEAR;
  if (
    typeof durationSeconds !== "bigint" ||
    durationSeconds < 0n ||
    durationSeconds > MAX_UINT64
  )
    throw new OnchainError(
      "INVALID_INPUT",
      "Duration must be seconds expressed as a uint64 bigint.",
      { details: { field: "durationSeconds" } },
    );
  return {
    parentName: parent,
    parentLabel: parent.slice(0, -4),
    label,
    durationSeconds,
  };
}

export function validateAddress(
  input: Address,
  field: string,
  allowZero = false,
): Address {
  if (!isAddress(input) || (!allowZero && input.toLowerCase() === zeroAddress))
    throw new OnchainError("INVALID_INPUT", `Enter a valid ${field} address.`, {
      details: { field },
    });
  return getAddress(input);
}
