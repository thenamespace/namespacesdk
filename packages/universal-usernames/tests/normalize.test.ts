import { isNormalizedUsername, normalizeUsername, UsernameError } from '../src';

describe('normalizeUsername', () => {
  it.each([
    ['Happy', 'happy'],
    ['HAPPY', 'happy'],
    ['ＨＡＰＰＹ', 'happy'],
    ['ℌappy', 'happy'],
    ['jöhn', 'jöhn'],
    ['💩', '💩'],
    ['0x1', '0x1'],
  ])('normalizes %p to %p (ENSIP-15)', (input, expected) => {
    expect(normalizeUsername(input)).toBe(expected);
  });

  it.each([
    ['', 'empty'],
    ['happy.eth', 'dots'],
    ['a..b', 'empty label'],
    ['.', 'empty label'],
    ['happy．eth', 'fullwidth full stop'],
    ['a b', 'space'],
    ['a‍b', 'zero-width joiner'],
    ['xn--abc', 'punycode prefix'],
    ['аpple', 'mixed scripts'],
  ])('rejects %p (%s) with UsernameError', (input) => {
    expect(() => normalizeUsername(input)).toThrow(UsernameError);
  });
});

describe('isNormalizedUsername', () => {
  it('is true only for an already-normalized single label', () => {
    expect(isNormalizedUsername('happy')).toBe(true);
    expect(isNormalizedUsername('jöhn')).toBe(true);
    expect(isNormalizedUsername('Happy')).toBe(false);
    expect(isNormalizedUsername('happy.eth')).toBe(false);
    expect(isNormalizedUsername('')).toBe(false);
    expect(isNormalizedUsername('a b')).toBe(false);
  });
});
