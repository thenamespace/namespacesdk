import { buildProfileUrl, checkEndpointUrl, UsernameError } from '../src';

describe('checkEndpointUrl', () => {
  it('accepts https with or without a path and drops trailing slashes', () => {
    expect(checkEndpointUrl('https://api.brand.example')).toEqual({ ok: true, url: 'https://api.brand.example' });
    expect(checkEndpointUrl('https://api.brand.example/ens/users/')).toEqual({
      ok: true,
      url: 'https://api.brand.example/ens/users',
    });
    expect(checkEndpointUrl('https://api.brand.example:8443/ens')).toEqual({
      ok: true,
      url: 'https://api.brand.example:8443/ens',
    });
  });

  it.each([
    ['http://api.brand.example', 'https'],
    ['ftp://api.brand.example', 'https'],
    ['https://user:secret@api.brand.example', 'username or password'],
    ['https://user@api.brand.example', 'username or password'],
    ['https://api.brand.example/users?x=1', 'query'],
    ['https://api.brand.example/users?', 'query'],
    ['https://api.brand.example/users#top', 'fragment'],
    ['https://api.brand.example/users#', 'fragment'],
    ['/ens/users', 'absolute URL'],
    ['', 'empty'],
  ])('rejects %p', (url, reason) => {
    const result = checkEndpointUrl(url);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issue).toMatchObject({ code: 'INVALID_URL', kind: 'transport', path: '' });
    expect(result.issue.message).toContain(reason);
  });

  it('never echoes credentials in the issue', () => {
    const result = checkEndpointUrl('https://user:hunter2@api.brand.example');
    expect(JSON.stringify(result)).not.toContain('hunter2');
  });

  it('allows URLs up to 2048 characters', () => {
    const prefix = 'https://api.brand.example/';
    expect(checkEndpointUrl(prefix + 'a'.repeat(2048 - prefix.length)).ok).toBe(true);
    expect(checkEndpointUrl(prefix + 'a'.repeat(2049 - prefix.length)).ok).toBe(false);
  });

  it('allows http only with allowInsecure, and still nothing else', () => {
    expect(checkEndpointUrl('http://127.0.0.1:3000/ens', { allowInsecure: true })).toEqual({
      ok: true,
      url: 'http://127.0.0.1:3000/ens',
    });
    expect(checkEndpointUrl('ftp://127.0.0.1', { allowInsecure: true }).ok).toBe(false);
  });
});

describe('buildProfileUrl', () => {
  it('joins the endpoint and the encoded label with one slash', () => {
    expect(buildProfileUrl('https://api.brand.example/ens/users', 'happy')).toBe(
      'https://api.brand.example/ens/users/happy'
    );
    expect(buildProfileUrl('https://api.brand.example/ens/users/', 'happy')).toBe(
      'https://api.brand.example/ens/users/happy'
    );
    expect(buildProfileUrl('https://api.brand.example', 'jöhn')).toBe('https://api.brand.example/j%C3%B6hn');
  });

  it('refuses labels that are not normalized', () => {
    expect(() => buildProfileUrl('https://api.brand.example', 'Happy')).toThrow(UsernameError);
    expect(() => buildProfileUrl('https://api.brand.example', '..')).toThrow(UsernameError);
    expect(() => buildProfileUrl('https://api.brand.example', 'a/b')).toThrow(UsernameError);
  });
});
