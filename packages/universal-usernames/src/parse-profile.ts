import { envelopeIssue, jsonPointer, transportIssue } from './issues';
import { findDuplicateKey } from './json-duplicate-keys';
import {
  checkAddressRecord,
  checkContenthashRecord,
  checkTextRecord,
  hasOwnRecord,
  setRecord,
} from './records';
import { PROFILE_LIMITS, PROFILE_SCHEMA_VERSION } from './schema';
import type { ProfilePreview, UsernameProfileV1, ValidationIssue } from './types';

export interface ParsedUsernameProfile {
  /** Issues that fail the whole profile. */
  envelopeErrors: ValidationIssue[];
  /** Issues that fail one record each; the other records still resolve. */
  recordErrors: ValidationIssue[];
  /** Null when `envelopeErrors` is non-empty. Keeps invalid records so lookups can report them. */
  profile: UsernameProfileV1 | null;
}

export interface ProfileParseOptions {
  /** The normalized label that was requested. `username` must equal it exactly. */
  expectedUsername: string;
}

const PROFILE_FIELDS = new Set(['version', 'username', 'texts', 'addresses', 'contenthash']);

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exceedsByteLimit(text: string): boolean {
  // A UTF-16 code unit is 1 to 3 UTF-8 bytes, so most inputs skip encoding.
  if (text.length > PROFILE_LIMITS.maxBytes) return true;
  if (text.length * 3 <= PROFILE_LIMITS.maxBytes) return false;
  return new TextEncoder().encode(text).byteLength > PROFILE_LIMITS.maxBytes;
}

function checkEnvelope(body: JsonObject, expectedUsername: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (body.version !== PROFILE_SCHEMA_VERSION) {
    issues.push(envelopeIssue('UNSUPPORTED_VERSION', '/version', 'version must be 1'));
  }
  for (const field of Object.keys(body)) {
    if (!PROFILE_FIELDS.has(field)) {
      issues.push(envelopeIssue('UNKNOWN_FIELD', jsonPointer(field), 'Field is not part of profile v1'));
    }
  }

  const { username, texts, addresses } = body;
  if (typeof username !== 'string' || username.length === 0) {
    issues.push(envelopeIssue('USERNAME_MISSING', '/username', 'username must be a non-empty string'));
  } else if (username !== expectedUsername) {
    issues.push(envelopeIssue('USERNAME_MISMATCH', '/username', `username must equal the requested username "${expectedUsername}"`));
  }

  if (!isJsonObject(texts)) {
    issues.push(envelopeIssue('TEXTS_NOT_OBJECT', '/texts', 'texts must be an object'));
  } else if (Object.keys(texts).length > PROFILE_LIMITS.maxTexts) {
    issues.push(envelopeIssue('TOO_MANY_TEXTS', '/texts', `texts has more than ${PROFILE_LIMITS.maxTexts} entries`));
  }

  if (!isJsonObject(addresses)) {
    issues.push(envelopeIssue('ADDRESSES_NOT_OBJECT', '/addresses', 'addresses must be an object'));
  } else if (Object.keys(addresses).length > PROFILE_LIMITS.maxAddresses) {
    issues.push(envelopeIssue('TOO_MANY_ADDRESSES', '/addresses', `addresses has more than ${PROFILE_LIMITS.maxAddresses} entries`));
  }

  return issues;
}

function checkRecords(profile: UsernameProfileV1): { issues: ValidationIssue[]; preview: ProfilePreview } {
  const issues: ValidationIssue[] = [];
  const preview: ProfilePreview = { texts: {}, addresses: {}, contenthash: null };

  for (const [key, value] of Object.entries(profile.texts)) {
    const check = checkTextRecord(key, value);
    if (check.ok) setRecord(preview.texts, key, check.value);
    else issues.push(check.issue);
  }
  for (const [key, value] of Object.entries(profile.addresses)) {
    const check = checkAddressRecord(key, value);
    if (check.ok) setRecord(preview.addresses, key, value);
    else issues.push(check.issue);
  }
  if (profile.contenthash !== undefined) {
    const check = checkContenthashRecord(profile.contenthash);
    if (check.ok) preview.contenthash = profile.contenthash;
    else issues.push(check.issue);
  }

  return { issues, preview };
}

function inspectProfile(
  rawBody: string,
  options: ProfileParseOptions
): ParsedUsernameProfile & { preview: ProfilePreview | null } {
  const rejected = (envelopeErrors: ValidationIssue[]) => ({
    envelopeErrors,
    recordErrors: [],
    profile: null,
    preview: null,
  });

  if (exceedsByteLimit(rawBody)) {
    return rejected([transportIssue('RESPONSE_TOO_LARGE', `Body is larger than ${PROFILE_LIMITS.maxBytes} bytes`)]);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return rejected([envelopeIssue('INVALID_JSON', '', 'Body is not valid JSON')]);
  }

  const duplicatePath = findDuplicateKey(rawBody);
  if (duplicatePath !== null) {
    return rejected([envelopeIssue('DUPLICATE_KEY', duplicatePath, 'Object has the same key more than once')]);
  }
  if (!isJsonObject(body)) {
    return rejected([envelopeIssue('NOT_AN_OBJECT', '', 'Body must be a JSON object')]);
  }

  const envelopeErrors = checkEnvelope(body, options.expectedUsername);
  if (envelopeErrors.length > 0) return rejected(envelopeErrors);

  const profile: UsernameProfileV1 = {
    version: 1,
    username: body.username as string,
    texts: body.texts as Record<string, string>,
    addresses: body.addresses as Record<string, string>,
  };
  if (hasOwnRecord(body, 'contenthash')) profile.contenthash = body.contenthash as string;

  const records = checkRecords(profile);
  return { envelopeErrors: [], recordErrors: records.issues, profile, preview: records.preview };
}

/**
 * Parses a brand endpoint response body. Works on the raw text so duplicate
 * keys are caught. A body over `PROFILE_LIMITS.maxBytes` is rejected with a
 * `RESPONSE_TOO_LARGE` transport issue in `envelopeErrors`.
 */
export function parseUsernameProfile(rawBody: string, options: ProfileParseOptions): ParsedUsernameProfile {
  const { envelopeErrors, recordErrors, profile } = inspectProfile(rawBody, options);
  return { envelopeErrors, recordErrors, profile };
}

/** Setup validation: every envelope and record issue, plus a preview of the valid records. */
export function validateUsernameProfile(
  rawBody: string,
  options: ProfileParseOptions
): { issues: ValidationIssue[]; preview: ProfilePreview | null } {
  const { envelopeErrors, recordErrors, preview } = inspectProfile(rawBody, options);
  return { issues: [...envelopeErrors, ...recordErrors], preview };
}
