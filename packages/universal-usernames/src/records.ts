import {
  addressToHex,
  chainFromCoinType,
  DEFAULT_EVM_COIN_TYPE,
  isSupportedCoinType,
  toCoinType,
} from './coin-types';
import { encodeContenthash } from './contenthash';
import { describeJsonType, jsonPointer, recordIssue } from './issues';
import { PROFILE_LIMITS } from './schema';
import type { HexString, RecordResult, UsernameProfileV1, ValidationIssue } from './types';

/** Address keys are canonical decimal coin types: no sign, no leading zeros. */
export const COIN_TYPE_KEY = /^(0|[1-9][0-9]*)$/;

const DEFAULT_EVM_KEY = String(DEFAULT_EVM_COIN_TYPE);

type RecordCheck<T> = { ok: true; value: T } | { ok: false; issue: ValidationIssue };

/** Own-property lookup, so keys like `constructor` never hit Object.prototype. */
export function hasOwnRecord(records: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(records, key);
}

/** Sets a key as an own property, so `__proto__` is stored instead of changing the prototype. */
export function setRecord(records: Record<string, string>, key: string, value: string): void {
  Object.defineProperty(records, key, { value, enumerable: true, writable: true, configurable: true });
}

/** Length in code points (JSON Schema `maxLength`), counted only when it could matter. */
function exceedsLength(value: string, max: number): boolean {
  if (value.length <= max) return false;
  let count = 0;
  for (const _codePoint of value) {
    if (++count > max) return true;
  }
  return false;
}

export function checkTextRecord(key: string, value: unknown): RecordCheck<string> {
  const path = jsonPointer('texts', key);
  if (key.length === 0 || exceedsLength(key, PROFILE_LIMITS.maxTextKeyLength)) {
    return {
      ok: false,
      issue: recordIssue('TEXT_KEY_INVALID', path, `Text keys must be 1 to ${PROFILE_LIMITS.maxTextKeyLength} characters`),
    };
  }
  if (typeof value !== 'string') {
    return {
      ok: false,
      issue: recordIssue('TEXT_VALUE_INVALID', path, `Text value must be a string, got ${describeJsonType(value)}`),
    };
  }
  if (exceedsLength(value, PROFILE_LIMITS.maxTextValueLength)) {
    return {
      ok: false,
      issue: recordIssue('TEXT_VALUE_TOO_LONG', path, `Text value is longer than ${PROFILE_LIMITS.maxTextValueLength} characters`),
    };
  }
  return { ok: true, value };
}

export function checkAddressRecord(key: string, value: unknown): RecordCheck<HexString> {
  const path = jsonPointer('addresses', key);
  const coinType = COIN_TYPE_KEY.test(key) ? toCoinType(Number(key)) : null;
  if (coinType === null) {
    return {
      ok: false,
      issue: recordIssue('COIN_TYPE_INVALID', path, 'Address keys must be decimal coin types from 0 to 4294967295'),
    };
  }
  if (!isSupportedCoinType(coinType)) {
    return {
      ok: false,
      issue: recordIssue('COIN_TYPE_UNSUPPORTED', path, `No address encoder for coin type ${coinType}`),
    };
  }
  if (typeof value !== 'string' || value.length === 0 || exceedsLength(value, PROFILE_LIMITS.maxAddressLength)) {
    return {
      ok: false,
      issue: recordIssue('ADDRESS_INVALID', path, `Address must be a string of 1 to ${PROFILE_LIMITS.maxAddressLength} characters`),
    };
  }
  try {
    return { ok: true, value: addressToHex(coinType, value) };
  } catch {
    return {
      ok: false,
      issue: recordIssue('ADDRESS_INVALID', path, `Not a valid address for coin type ${coinType}`),
    };
  }
}

export function checkContenthashRecord(value: unknown): RecordCheck<HexString> {
  const path = jsonPointer('contenthash');
  if (typeof value !== 'string' || value.length === 0 || exceedsLength(value, PROFILE_LIMITS.maxContenthashLength)) {
    return {
      ok: false,
      issue: recordIssue('CONTENTHASH_INVALID', path, `Contenthash must be a string of 1 to ${PROFILE_LIMITS.maxContenthashLength} characters`),
    };
  }
  const encoded = encodeContenthash(value);
  if (encoded.ok) return { ok: true, value: encoded.hex };
  const code = encoded.reason === 'unsupported' ? 'CONTENTHASH_UNSUPPORTED' : 'CONTENTHASH_INVALID';
  return { ok: false, issue: recordIssue(code, path, encoded.message) };
}

function toRecordResult<T>(check: RecordCheck<T>): RecordResult<T> {
  return check.ok ? { status: 'found', value: check.value } : { status: 'invalid', issue: check.issue };
}

export function resolveText(profile: UsernameProfileV1, key: string): RecordResult<string> {
  if (!hasOwnRecord(profile.texts, key)) return { status: 'absent' };
  return toRecordResult(checkTextRecord(key, profile.texts[key]));
}

/**
 * Resolves `addr(node, coinType)` to ENSIP-9 bytes. Applies ENSIP-19 § Default
 * Address: when no record is stored for a coin type with
 * `chainFromCoinType(coinType) > 0` (60 and every EVM chain), the default EVM
 * record (2147483648) answers. An invalid explicit record never falls back.
 */
export function resolveAddress(profile: UsernameProfileV1, coinType: number | bigint): RecordResult<HexString> {
  const value = toCoinType(coinType);
  // Profile keys only hold 0..2^32-1, so nothing can be stored outside it.
  if (value === null) return { status: 'absent' };

  const key = String(value);
  if (hasOwnRecord(profile.addresses, key)) {
    return toRecordResult(checkAddressRecord(key, profile.addresses[key]));
  }
  if (chainFromCoinType(value) > 0 && hasOwnRecord(profile.addresses, DEFAULT_EVM_KEY)) {
    return toRecordResult(checkAddressRecord(DEFAULT_EVM_KEY, profile.addresses[DEFAULT_EVM_KEY]));
  }
  return { status: 'absent' };
}

export function resolveContenthash(profile: UsernameProfileV1): RecordResult<HexString> {
  if (profile.contenthash === undefined) return { status: 'absent' };
  return toRecordResult(checkContenthashRecord(profile.contenthash));
}
