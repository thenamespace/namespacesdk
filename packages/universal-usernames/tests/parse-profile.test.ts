import {
  PROFILE_LIMITS,
  parseUsernameProfile,
  resolveText,
  validateUsernameProfile,
} from '../src';

const ETH = '0x1111111111111111111111111111111111111111';

const body = (fields: Record<string, unknown> = {}) =>
  JSON.stringify({ version: 1, username: 'happy', texts: {}, addresses: {}, ...fields });

describe('parseUsernameProfile', () => {
  it('compares username to expectedUsername exactly, without normalizing either side', () => {
    const upper = parseUsernameProfile(body({ username: 'Happy' }), { expectedUsername: 'happy' });
    expect(upper.envelopeErrors.map((issue) => issue.code)).toEqual(['USERNAME_MISMATCH']);
  });

  it('treats an empty username as missing', () => {
    const parsed = parseUsernameProfile(body({ username: '' }), { expectedUsername: 'happy' });
    expect(parsed.envelopeErrors.map((issue) => issue.code)).toEqual(['USERNAME_MISSING']);
  });

  it('accepts a body of exactly maxBytes and rejects one byte more', () => {
    const fits = body({ texts: { a: '' } });
    const padding = PROFILE_LIMITS.maxBytes - Buffer.byteLength(fits);
    const atLimit = fits.replace('"a":""', `"a":""${' '.repeat(padding)}`);
    expect(Buffer.byteLength(atLimit)).toBe(PROFILE_LIMITS.maxBytes);
    expect(parseUsernameProfile(atLimit, { expectedUsername: 'happy' }).envelopeErrors).toEqual([]);

    const tooLarge = atLimit + ' ';
    expect(parseUsernameProfile(tooLarge, { expectedUsername: 'happy' }).envelopeErrors).toEqual([
      expect.objectContaining({ code: 'RESPONSE_TOO_LARGE', kind: 'transport', path: '' }),
    ]);
  });

  it('counts the size limit in UTF-8 bytes, not string length', () => {
    // 100,000 three-byte characters: 100,000 UTF-16 units but 300,000 bytes.
    const multibyte = body({ texts: { a: '€'.repeat(100_000) } });
    expect(multibyte.length).toBeLessThan(PROFILE_LIMITS.maxBytes);
    const parsed = parseUsernameProfile(multibyte, { expectedUsername: 'happy' });
    expect(parsed.envelopeErrors.map((issue) => issue.code)).toEqual(['RESPONSE_TOO_LARGE']);
  });

  it('counts text length in code points, like JSON Schema maxLength', () => {
    const emoji = '😀'.repeat(PROFILE_LIMITS.maxTextValueLength); // 8192 UTF-16 units
    const parsed = parseUsernameProfile(body({ texts: { bio: emoji } }), { expectedUsername: 'happy' });
    expect(parsed.recordErrors).toEqual([]);
  });

  it('keeps invalid records in the profile so lookups report them instead of treating them as absent', () => {
    const parsed = parseUsernameProfile(body({ texts: { age: 42 } }), { expectedUsername: 'happy' });
    expect(parsed.recordErrors).toHaveLength(1);
    expect(resolveText(parsed.profile!, 'age')).toEqual({ status: 'invalid', issue: parsed.recordErrors[0] });
  });

  it('stores a __proto__ text key as a plain record', () => {
    const raw = '{"version":1,"username":"happy","texts":{"__proto__":"x"},"addresses":{}}';
    const parsed = parseUsernameProfile(raw, { expectedUsername: 'happy' });
    expect(parsed.recordErrors).toEqual([]);
    expect(resolveText(parsed.profile!, '__proto__')).toEqual({ status: 'found', value: 'x' });
    expect(Object.getPrototypeOf(parsed.profile!.texts)).toBe(Object.prototype);
  });

  it('rejects a null body and primitives as NOT_AN_OBJECT', () => {
    for (const raw of ['null', '1', '"happy"', 'true']) {
      const parsed = parseUsernameProfile(raw, { expectedUsername: 'happy' });
      expect(parsed.envelopeErrors.map((issue) => issue.code)).toEqual(['NOT_AN_OBJECT']);
    }
  });

  it('rejects an empty body as INVALID_JSON', () => {
    const parsed = parseUsernameProfile('', { expectedUsername: 'happy' });
    expect(parsed.envelopeErrors.map((issue) => issue.code)).toEqual(['INVALID_JSON']);
  });

  it('never puts record values in issue messages', () => {
    const secretLooking = 'do-not-echo-this-value';
    const parsed = parseUsernameProfile(
      body({ texts: { note: secretLooking.repeat(200) }, addresses: { '60': secretLooking } }),
      { expectedUsername: 'happy' }
    );
    expect(parsed.recordErrors).toHaveLength(2);
    for (const issue of parsed.recordErrors) expect(issue.message).not.toContain(secretLooking);
  });
});

describe('validateUsernameProfile', () => {
  it('previews only the valid records, in their human-readable form', () => {
    const result = validateUsernameProfile(
      body({
        texts: { name: 'Happy', age: 42 },
        addresses: { '60': ETH, '0': 'not-bitcoin' },
        contenthash: 'https://brand.example',
      }),
      { expectedUsername: 'happy' }
    );
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'TEXT_VALUE_INVALID',
      'ADDRESS_INVALID',
      'CONTENTHASH_UNSUPPORTED',
    ]);
    expect(result.preview).toEqual({ texts: { name: 'Happy' }, addresses: { '60': ETH }, contenthash: null });
  });

  it('returns a null preview when the envelope fails', () => {
    const result = validateUsernameProfile(body({ version: 2 }), { expectedUsername: 'happy' });
    expect(result.preview).toBeNull();
  });
});
