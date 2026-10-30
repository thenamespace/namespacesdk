import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseUsernameProfile,
  resolveAddress,
  resolveContenthash,
  resolveText,
  validateUsernameProfile,
} from '../src';
import type { EnvelopeIssueCode, RecordIssueCode, ValidationIssue } from '../src';

interface FixtureIssue {
  code: string;
  kind: string;
  path: string;
}

interface FixtureIndex {
  valid: Array<{
    file: string;
    expectedUsername: string;
    resolved: {
      texts: Record<string, string | null>;
      addresses: Record<string, string | null>;
      contenthash: string | null;
    };
  }>;
  invalid: Array<{ file: string; expectedUsername: string; issues: FixtureIssue[] }>;
}

const fixturesDir = join(__dirname, '..', 'fixtures');
const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as FixtureIndex;
const readFixture = (file: string) => readFileSync(join(fixturesDir, file), 'utf8');

const comparable = (issues: Array<FixtureIssue | ValidationIssue>) =>
  issues.map(({ code, kind, path }) => ({ code, kind, path }));

// Every code the parser owns (CONTRACT §1.3); transport codes belong to the fetcher.
const ENVELOPE_CODES: EnvelopeIssueCode[] = [
  'INVALID_JSON',
  'DUPLICATE_KEY',
  'NOT_AN_OBJECT',
  'UNSUPPORTED_VERSION',
  'UNKNOWN_FIELD',
  'USERNAME_MISSING',
  'USERNAME_MISMATCH',
  'TEXTS_NOT_OBJECT',
  'ADDRESSES_NOT_OBJECT',
  'TOO_MANY_TEXTS',
  'TOO_MANY_ADDRESSES',
];
const RECORD_CODES: RecordIssueCode[] = [
  'TEXT_KEY_INVALID',
  'TEXT_VALUE_INVALID',
  'TEXT_VALUE_TOO_LONG',
  'COIN_TYPE_INVALID',
  'COIN_TYPE_UNSUPPORTED',
  'ADDRESS_INVALID',
  'CONTENTHASH_INVALID',
  'CONTENTHASH_UNSUPPORTED',
];

describe('fixtures/index.json', () => {
  it('covers every envelope and record issue code', () => {
    const covered = new Set(index.invalid.flatMap((fixture) => fixture.issues.map((issue) => issue.code)));
    for (const code of [...ENVELOPE_CODES, ...RECORD_CODES]) {
      expect(covered).toContain(code);
    }
  });

  it('lists every fixture file', () => {
    const listed = [...index.valid, ...index.invalid].map((fixture) => fixture.file).sort();
    const onDisk = ['valid', 'invalid']
      .flatMap((dir) => readdirSync(join(fixturesDir, dir)).map((name) => `${dir}/${name}`))
      .sort();
    expect(listed).toEqual(onDisk);
  });
});

describe.each(index.valid)('valid fixture $file', (fixture) => {
  const parsed = parseUsernameProfile(readFixture(fixture.file), { expectedUsername: fixture.expectedUsername });

  it('parses without issues', () => {
    expect(parsed.envelopeErrors).toEqual([]);
    expect(parsed.recordErrors).toEqual([]);
    expect(parsed.profile).not.toBeNull();
  });

  it('resolves the expected records', () => {
    const profile = parsed.profile!;
    for (const [key, value] of Object.entries(fixture.resolved.texts)) {
      expect(resolveText(profile, key)).toEqual(value === null ? { status: 'absent' } : { status: 'found', value });
    }
    for (const [coinType, value] of Object.entries(fixture.resolved.addresses)) {
      expect(resolveAddress(profile, Number(coinType))).toEqual(
        value === null ? { status: 'absent' } : { status: 'found', value }
      );
    }
    const contenthash = fixture.resolved.contenthash;
    expect(resolveContenthash(profile)).toEqual(
      contenthash === null ? { status: 'absent' } : { status: 'found', value: contenthash }
    );
  });
});

describe.each(index.invalid)('invalid fixture $file', (fixture) => {
  const raw = readFixture(fixture.file);
  const parsed = parseUsernameProfile(raw, { expectedUsername: fixture.expectedUsername });
  const failsEnvelope = fixture.issues.some((issue) => issue.kind === 'envelope');

  it('reports exactly the expected issues', () => {
    const reported = [...parsed.envelopeErrors, ...parsed.recordErrors];
    expect(comparable(reported)).toEqual(fixture.issues);
  });

  it(failsEnvelope ? 'rejects the whole profile' : 'keeps the profile so other records resolve', () => {
    if (failsEnvelope) {
      expect(parsed.profile).toBeNull();
      expect(parsed.recordErrors).toEqual([]);
    } else {
      expect(parsed.profile).not.toBeNull();
      expect(parsed.envelopeErrors).toEqual([]);
    }
  });

  it('gives every issue a message and the same issues from validateUsernameProfile', () => {
    const validation = validateUsernameProfile(raw, { expectedUsername: fixture.expectedUsername });
    expect(comparable(validation.issues)).toEqual(fixture.issues);
    for (const issue of validation.issues) expect(issue.message.length).toBeGreaterThan(0);
    expect(validation.preview === null).toBe(failsEnvelope);
  });
});
