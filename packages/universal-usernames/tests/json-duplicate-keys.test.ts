import { findDuplicateKey } from '../src/json-duplicate-keys';

describe('findDuplicateKey', () => {
  it('returns null when every object has unique keys', () => {
    expect(findDuplicateKey('{"a":1,"b":{"a":2},"c":[{"a":3},{"a":4}]}')).toBeNull();
    expect(findDuplicateKey('[]')).toBeNull();
    expect(findDuplicateKey('"just a string"')).toBeNull();
    expect(findDuplicateKey('{}')).toBeNull();
  });

  it('finds a duplicate at the root', () => {
    expect(findDuplicateKey('{"a":1,"a":2}')).toBe('/a');
  });

  it('finds duplicates at any depth, including inside arrays', () => {
    expect(findDuplicateKey('{"texts":{"name":"x","name":"y"}}')).toBe('/texts/name');
    expect(findDuplicateKey('{"a":[1,{"b":{}},{"c":1,"c":2}]}')).toBe('/a/2/c');
    expect(findDuplicateKey('[[{"x":1}],[{"y":1,"y":2}]]')).toBe('/1/0/y');
  });

  it('treats escaped and literal spellings of a key as the same key', () => {
    expect(findDuplicateKey('{"username":"a","user\\u006eame":"b"}')).toBe('/username');
  });

  it('ignores structure characters and quotes inside string values', () => {
    expect(findDuplicateKey('{"a":"{\\"a\\":1,\\"a\\":2}","b":"[,],:"}')).toBeNull();
    expect(findDuplicateKey('{"a\\"b":1,"a\\\\":2,"c":"\\\\"}')).toBeNull();
  });

  it('does not confuse a value equal to an earlier key with a key', () => {
    expect(findDuplicateKey('{"a":"a","b":"a"}')).toBeNull();
  });

  it('escapes ~ and / in the returned pointer (RFC 6901)', () => {
    expect(findDuplicateKey('{"texts":{"a/b~c":1,"a/b~c":2}}')).toBe('/texts/a~1b~0c');
  });

  it('handles an empty-string key', () => {
    expect(findDuplicateKey('{"":1,"":2}')).toBe('/');
  });

  it('stays linear on deep nesting', () => {
    const depth = 100_000;
    const deep = '['.repeat(depth) + '{"k":1,"k":2}' + ']'.repeat(depth);
    const started = Date.now();
    expect(findDuplicateKey(deep)).toBe('/0'.repeat(depth) + '/k');
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
