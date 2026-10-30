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
import type { NameInput } from "./types.js";

export const ONE_YEAR = 31_536_000n;
export const MAX_UINT64 = (1n << 64n) - 1n;
export const labelId = (label: string) => BigInt(keccak256(toBytes(label)));

export function parentName(input: string): string {
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

export function nameInput(input: NameInput) {
  const parent = parentName(input.parentName);
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
  const duration = input.duration ?? ONE_YEAR;
  if (typeof duration !== "bigint" || duration < 0n || duration > MAX_UINT64)
    throw new OnchainError(
      "INVALID_INPUT",
      "Duration must be seconds expressed as a uint64 bigint.",
      { details: { field: "duration" } },
    );
  return {
    parentName: parent,
    parentLabel: parent.slice(0, -4),
    label,
    duration,
  };
}

export function address(
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
