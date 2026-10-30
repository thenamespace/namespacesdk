import { coinNameToTypeMap, getCoderByCoinType } from '@ensdomains/address-encoder';
import type { HexString } from './types';

/** ENSIP-19 default EVM address (`chainId = 0`). */
export const DEFAULT_EVM_COIN_TYPE = 2147483648;

const ETH_COIN_TYPE = 60;
const MAX_COIN_TYPE = 0xffffffff;

/** Returns the coin type as a number, or null when it is not an integer in 0..2^32-1. */
export function toCoinType(coinType: number | bigint): number | null {
  if (typeof coinType === 'bigint') {
    return coinType >= 0n && coinType <= BigInt(MAX_COIN_TYPE) ? Number(coinType) : null;
  }
  if (!Number.isInteger(coinType) || coinType < 0 || coinType > MAX_COIN_TYPE) return null;
  return coinType;
}

/**
 * ENSIP-19 `chainFromCoinType`: 60 is chain 1, `0x8000_0000..0xffff_ffff` is
 * `coinType ^ 0x8000_0000`, anything else is 0. Subtraction instead of XOR
 * because JS bitwise operators work on signed 32-bit integers.
 */
export function chainFromCoinType(coinType: number): number {
  if (coinType === ETH_COIN_TYPE) return 1;
  if (coinType >= DEFAULT_EVM_COIN_TYPE && coinType <= MAX_COIN_TYPE) {
    return coinType - DEFAULT_EVM_COIN_TYPE;
  }
  return 0;
}

/** True for 60, the default EVM coin type, and every ENSIP-11 EVM chain coin type. */
export function isEvmCoinType(coinType: number | bigint): boolean {
  const value = toCoinType(coinType);
  if (value === null) return false;
  return value === DEFAULT_EVM_COIN_TYPE || chainFromCoinType(value) > 0;
}

/** True when `@ensdomains/address-encoder` has a coder for the coin type. */
export function isSupportedCoinType(coinType: number | bigint): boolean {
  const value = toCoinType(coinType);
  if (value === null) return false;
  try {
    getCoderByCoinType(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Maps an address-encoder chain name to its coin type, e.g. `eth` 60, `btc` 0,
 * `sol` 501, `base` 2147492101. `evm` is the ENSIP-19 default EVM coin type.
 *
 * @throws Error for an unknown name.
 */
export function coinTypeForChain(name: string): number {
  const key = name.trim().toLowerCase();
  if (key === 'evm') return DEFAULT_EVM_COIN_TYPE;

  const names = coinNameToTypeMap as Record<string, number>;
  if (!Object.prototype.hasOwnProperty.call(names, key)) {
    throw new Error(`Unknown chain name: ${name}`);
  }
  return names[key];
}

/**
 * Converts a human-readable address to ENSIP-9 bytes. The coin type must be
 * supported (see `isSupportedCoinType`).
 *
 * @throws Error when the address is not valid for the coin type.
 */
export function addressToHex(coinType: number, address: string): HexString {
  const bytes = getCoderByCoinType(coinType).decode(address);
  let hex = '0x';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex as HexString;
}
