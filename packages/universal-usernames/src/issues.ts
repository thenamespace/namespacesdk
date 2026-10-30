import type {
  EnvelopeIssueCode,
  RecordIssueCode,
  TransportIssueCode,
  ValidationIssue,
} from './types';

/** Builds an RFC 6901 JSON Pointer, e.g. `jsonPointer('texts', 'com.x/y')` is `/texts/com.x~1y`. */
export function jsonPointer(...segments: Array<string | number>): string {
  return segments
    .map((segment) => '/' + String(segment).replace(/~/g, '~0').replace(/\//g, '~1'))
    .join('');
}

export function envelopeIssue(
  code: EnvelopeIssueCode,
  path: string,
  message: string
): ValidationIssue {
  return { code, kind: 'envelope', path, message };
}

export function recordIssue(code: RecordIssueCode, path: string, message: string): ValidationIssue {
  return { code, kind: 'record', path, message };
}

export function transportIssue(code: TransportIssueCode, message: string): ValidationIssue {
  return { code, kind: 'transport', path: '', message };
}

/** Names a JSON value's type for messages without echoing the value itself. */
export function describeJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
