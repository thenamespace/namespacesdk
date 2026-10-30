import {
  createUsernameHandler,
  defineUsernameProfile,
  parseUsernameProfile,
  UsernameError,
} from '../src';
import type { UsernameProfileV1 } from '../src';

const ETH = '0x1111111111111111111111111111111111111111';

describe('defineUsernameProfile', () => {
  it('normalizes the username and maps chain names to coin types', () => {
    const profile = defineUsernameProfile({
      username: 'Happy',
      texts: { name: 'Happy' },
      addresses: { eth: ETH, base: ETH, evm: ETH, btc: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', '501': 'sol' },
      contenthash: 'ipfs://QmYwAPJzv5CZsnAzt8auVZRnGiRAzQmmJYDh4T7SEBuwNA',
    });
    expect(profile).toEqual({
      version: 1,
      username: 'happy',
      texts: { name: 'Happy' },
      addresses: {
        '60': ETH,
        '2147492101': ETH,
        '2147483648': ETH,
        '0': 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        '501': 'sol',
      },
      contenthash: 'ipfs://QmYwAPJzv5CZsnAzt8auVZRnGiRAzQmmJYDh4T7SEBuwNA',
    });
  });

  it('defaults texts and addresses to empty objects and leaves out null and undefined values', () => {
    expect(
      defineUsernameProfile({ username: 'happy', texts: { name: null, bio: undefined }, contenthash: null })
    ).toEqual({ version: 1, username: 'happy', texts: {}, addresses: {} });
  });

  it('throws for an invalid username, an unknown chain or two keys for one coin type', () => {
    expect(() => defineUsernameProfile({ username: 'happy.eth' })).toThrow(UsernameError);
    expect(() => defineUsernameProfile({ username: 'happy', addresses: { ethereum: ETH } })).toThrow(
      'Unknown chain name'
    );
    expect(() => defineUsernameProfile({ username: 'happy', addresses: { eth: ETH, '60': ETH } })).toThrow(
      'coin type 60'
    );
  });

  it('produces a body that passes parseUsernameProfile', () => {
    const profile = defineUsernameProfile({ username: 'happy', addresses: { eth: ETH } });
    const parsed = parseUsernameProfile(JSON.stringify(profile), { expectedUsername: 'happy' });
    expect(parsed.envelopeErrors).toEqual([]);
    expect(parsed.recordErrors).toEqual([]);
  });
});

describe('createUsernameHandler', () => {
  const happy = defineUsernameProfile({ username: 'happy', texts: { name: 'Happy' }, addresses: { eth: ETH } });
  const lookup = jest.fn(async (username: string): Promise<UsernameProfileV1 | null> =>
    username === 'happy' ? happy : null
  );
  const get = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

  beforeEach(() => lookup.mockClear());

  it('answers 200 with the profile as JSON', async () => {
    const handler = createUsernameHandler(lookup);
    const response = await handler(get('https://api.brand.example/happy'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await response.json()).toEqual(happy);
    expect(lookup).toHaveBeenCalledWith('happy');
  });

  it('answers 404 when lookup returns null', async () => {
    const response = await createUsernameHandler(lookup)(get('https://api.brand.example/nobody'));
    expect(response.status).toBe(404);
    expect(lookup).toHaveBeenCalledWith('nobody');
  });

  it('serves under basePath and answers 404 for any other path without calling lookup', async () => {
    const handler = createUsernameHandler(lookup, { basePath: '/ens/users/' });
    expect((await handler(get('https://api.brand.example/ens/users/happy'))).status).toBe(200);

    for (const path of ['/happy', '/ens/users', '/ens/users/', '/ens/users/happy/extra', '/ens/users/happy/', '/other/happy']) {
      expect((await handler(get(`https://api.brand.example${path}`))).status).toBe(404);
    }
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('decodes the label and answers 404 for labels that are not normalized', async () => {
    const handler = createUsernameHandler(lookup);
    await handler(get('https://api.brand.example/j%C3%B6hn'));
    expect(lookup).toHaveBeenLastCalledWith('jöhn');

    lookup.mockClear();
    for (const label of ['Happy', 'happy.eth', '%E0%A4%A', 'a%2Fb']) {
      expect((await handler(get(`https://api.brand.example/${label}`))).status).toBe(404);
    }
    expect(lookup).not.toHaveBeenCalled();
  });

  it('accepts the configured bearer token', async () => {
    const handler = createUsernameHandler(lookup, { bearerToken: 's3cret' });
    const response = await handler(get('https://api.brand.example/happy', { authorization: 'Bearer s3cret' }));
    expect(response.status).toBe(200);
    const lowercaseScheme = await handler(get('https://api.brand.example/happy', { authorization: 'bearer s3cret' }));
    expect(lowercaseScheme.status).toBe(200);
  });

  it.each([
    ['no header', {}],
    ['wrong token', { authorization: 'Bearer s3cret-not' }],
    ['token prefix', { authorization: 'Bearer s3cre' }],
    ['other scheme', { authorization: 'Basic s3cret' }],
    ['bare token', { authorization: 's3cret' }],
  ])('rejects %s with 401 before calling lookup', async (_case, headers) => {
    const handler = createUsernameHandler(lookup, { bearerToken: 's3cret' });
    const response = await handler(get('https://api.brand.example/happy', headers));
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
    expect(lookup).not.toHaveBeenCalled();
  });

  it('answers 405 to methods other than GET', async () => {
    const handler = createUsernameHandler(lookup);
    const response = await handler(new Request('https://api.brand.example/happy', { method: 'POST' }));
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
  });

  it('refuses an empty bearer token, which usually means a missing env var', () => {
    expect(() => createUsernameHandler(lookup, { bearerToken: '' })).toThrow('bearerToken is empty');
  });

  it('lets lookup errors propagate to the framework', async () => {
    const failing = createUsernameHandler(async () => {
      throw new Error('database down');
    });
    await expect(failing(get('https://api.brand.example/happy'))).rejects.toThrow('database down');
  });
});
