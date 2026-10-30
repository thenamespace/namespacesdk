import {
  DEFAULT_EVM_COIN_TYPE,
  resolveAddress,
  resolveContenthash,
  resolveText,
  SUPPORTED_CONTENTHASH_PROTOCOLS,
} from '../src';
import type { UsernameProfileV1 } from '../src';

const ETH_1 = '0x1111111111111111111111111111111111111111';
const ETH_2 = '0x2222222222222222222222222222222222222222';
const DEFAULT = String(DEFAULT_EVM_COIN_TYPE);
const BASE = 2147492101;
const OPTIMISM = 2147483658;

const profile = (fields: Partial<UsernameProfileV1> = {}): UsernameProfileV1 => ({
  version: 1,
  username: 'happy',
  texts: {},
  addresses: {},
  ...fields,
});

describe('resolveText', () => {
  it('separates found, absent and invalid', () => {
    const p = profile({ texts: { name: 'Happy', empty: '', bad: 42 as unknown as string } });
    expect(resolveText(p, 'name')).toEqual({ status: 'found', value: 'Happy' });
    expect(resolveText(p, 'empty')).toEqual({ status: 'found', value: '' });
    expect(resolveText(p, 'com.twitter')).toEqual({ status: 'absent' });
    expect(resolveText(p, 'bad')).toEqual({
      status: 'invalid',
      issue: expect.objectContaining({ code: 'TEXT_VALUE_INVALID', kind: 'record', path: '/texts/bad' }),
    });
  });

  it('never reads inherited Object.prototype members', () => {
    for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(resolveText(profile(), key)).toEqual({ status: 'absent' });
    }
  });
});

describe('resolveAddress', () => {
  it('encodes records per chain: ETH, Bitcoin, Solana, Base and Vara', () => {
    const p = profile({
      addresses: {
        '60': '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0': 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        '501': '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        [String(BASE)]: ETH_2,
        '913': 'kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW',
      },
    });
    expect(resolveAddress(p, 60)).toEqual({ status: 'found', value: '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed' });
    expect(resolveAddress(p, 0)).toEqual({ status: 'found', value: '0x0014e8df018c7e326cc253faac7e46cdc51e68542c42' });
    expect(resolveAddress(p, 501)).toEqual({
      status: 'found',
      value: '0x7e8c088760bfde1dddcf32c17f209b8242ee52aaf131facd88d0ea2c6d0b06f2',
    });
    expect(resolveAddress(p, BASE)).toEqual({ status: 'found', value: ETH_2 });
    // Vara (SS58) for the well-known Substrate dev account "Alice".
    expect(resolveAddress(p, 913)).toEqual({
      status: 'found',
      value: '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
    });
  });

  it('answers addr(node) and addr(node, 60) identically, for number and bigint coin types', () => {
    const p = profile({ addresses: { '60': ETH_1, [String(BASE)]: ETH_2 } });
    // The gateway resolves addr(node) as coin type 60 (ENSIP-9 backwards compatibility).
    expect(resolveAddress(p, 60n)).toEqual(resolveAddress(p, 60));
    expect(resolveAddress(p, BigInt(BASE))).toEqual(resolveAddress(p, BASE));
    expect(resolveAddress(p, 60)).toEqual({ status: 'found', value: ETH_1 });
  });

  it('separates absent from invalid', () => {
    const p = profile({ addresses: { '60': '0x1234' } });
    expect(resolveAddress(p, 0)).toEqual({ status: 'absent' });
    expect(resolveAddress(p, 60)).toEqual({
      status: 'invalid',
      issue: expect.objectContaining({ code: 'ADDRESS_INVALID', path: '/addresses/60' }),
    });
  });

  it('isolates records: one bad address does not affect the others', () => {
    const p = profile({ addresses: { '60': ETH_1, '0': 'not-bitcoin', '501': '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' } });
    expect(resolveAddress(p, 0).status).toBe('invalid');
    expect(resolveAddress(p, 60).status).toBe('found');
    expect(resolveAddress(p, 501).status).toBe('found');
  });

  it('reports a stored record for a coin type without an encoder as unsupported', () => {
    const p = profile({ addresses: { '999999': 'anything' } });
    expect(resolveAddress(p, 999999)).toEqual({
      status: 'invalid',
      issue: expect.objectContaining({ code: 'COIN_TYPE_UNSUPPORTED' }),
    });
  });

  it('treats coin types that no profile key can hold as absent', () => {
    const p = profile({ addresses: { [DEFAULT]: ETH_1 } });
    expect(resolveAddress(p, 2n ** 32n)).toEqual({ status: 'absent' });
    expect(resolveAddress(p, 0x1_8000_0002)).toEqual({ status: 'absent' });
    expect(resolveAddress(p, -1)).toEqual({ status: 'absent' });
    expect(resolveAddress(p, 1.5)).toEqual({ status: 'absent' });
  });

  describe('ENSIP-19 § Default Address', () => {
    // ENSIP-19: "If chainFromCoinType(coinType) > 0, the value returned by addr(node, coinType),
    // when no address is stored for coinType, should always match the value returned by
    // addr(node, 0x8000_0000)." and chainFromCoinType(60) returns 1.
    it('ENSIP-19: coin type 60 inherits the default EVM address because chainFromCoinType(60) = 1', () => {
      const p = profile({ addresses: { [DEFAULT]: ETH_1 } });
      expect(resolveAddress(p, 60)).toEqual({ status: 'found', value: ETH_1 });
    });

    it('ENSIP-19: every EVM chain coin type without a record inherits the default EVM address', () => {
      const p = profile({ addresses: { [DEFAULT]: ETH_1 } });
      expect(resolveAddress(p, BASE)).toEqual({ status: 'found', value: ETH_1 });
      expect(resolveAddress(p, OPTIMISM)).toEqual({ status: 'found', value: ETH_1 });
      expect(resolveAddress(p, 0xffffffff)).toEqual({ status: 'found', value: ETH_1 });
    });

    it('ENSIP-19: an explicit chain record wins over the default', () => {
      const p = profile({ addresses: { [DEFAULT]: ETH_1, '60': ETH_2, [String(BASE)]: ETH_2 } });
      expect(resolveAddress(p, 60)).toEqual({ status: 'found', value: ETH_2 });
      expect(resolveAddress(p, BASE)).toEqual({ status: 'found', value: ETH_2 });
      expect(resolveAddress(p, OPTIMISM)).toEqual({ status: 'found', value: ETH_1 });
    });

    it('ENSIP-19: an invalid explicit chain record fails without falling back to the default', () => {
      const p = profile({ addresses: { [DEFAULT]: ETH_1, '60': '0xnope', [String(BASE)]: '' } });
      expect(resolveAddress(p, 60)).toEqual({
        status: 'invalid',
        issue: expect.objectContaining({ code: 'ADDRESS_INVALID', path: '/addresses/60' }),
      });
      expect(resolveAddress(p, BASE)).toEqual({
        status: 'invalid',
        issue: expect.objectContaining({ code: 'ADDRESS_INVALID', path: `/addresses/${BASE}` }),
      });
    });

    it('ENSIP-19: non-EVM coin types (chainFromCoinType = 0) never inherit the default', () => {
      const p = profile({ addresses: { [DEFAULT]: ETH_1 } });
      expect(resolveAddress(p, 0)).toEqual({ status: 'absent' });
      expect(resolveAddress(p, 501)).toEqual({ status: 'absent' });
      expect(resolveAddress(p, 913)).toEqual({ status: 'absent' });
    });

    it('ENSIP-19: an inherited invalid default is reported at its own path', () => {
      const p = profile({ addresses: { [DEFAULT]: 'not-an-address' } });
      expect(resolveAddress(p, BASE)).toEqual({
        status: 'invalid',
        issue: expect.objectContaining({ code: 'ADDRESS_INVALID', path: `/addresses/${DEFAULT}` }),
      });
    });

    it('ENSIP-19: with neither a chain record nor a default, EVM lookups are absent', () => {
      expect(resolveAddress(profile(), 60)).toEqual({ status: 'absent' });
      expect(resolveAddress(profile(), BASE)).toEqual({ status: 'absent' });
      expect(resolveAddress(profile(), DEFAULT_EVM_COIN_TYPE)).toEqual({ status: 'absent' });
    });
  });
});

describe('resolveContenthash', () => {
  // Expected bytes cross-checked against @ensdomains/content-hash 2.5.7.
  it.each([
    ['ipfs://QmYwAPJzv5CZsnAzt8auVZRnGiRAzQmmJYDh4T7SEBuwNA', '0xe301017012209d6c2be50f70695347c6da90ab413d0fdb93e73f0c576e4943910844f3fda983'],
    ['ipfs://bafybeibj6lixxzqtsb45ysdjnupvqkufgdvzqbnvmhw2kf7cfkesy7r7d4', '0xe3010170122029f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f'],
    ['ipns://k51qzi5uqu5dihst24f3rp2ej4co9berxohfkxaenbq1wjty7nrd5e9xp4afx1', '0xe50101720024080112205cbd1cc86ac20d6640795809c2a185bb2504538a2de8076da5a6971b8acb4715'],
    ['bzz://d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162', '0xe40101fa011b20d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162'],
    ['ar://ys2Dh2sRYpUpYFIRm0FfqwAHVf4Ii1d4yr9KKSyhBDc', '0x90b2ca05cacd83876b116295296052119b415fab000755fe088b5778cabf4a292ca10437'],
  ])('encodes %s', (contenthash, expected) => {
    expect(resolveContenthash(profile({ contenthash }))).toEqual({ status: 'found', value: expected });
  });

  it('supports exactly ipfs, ipns, bzz and ar', () => {
    expect(SUPPORTED_CONTENTHASH_PROTOCOLS).toEqual(['ipfs', 'ipns', 'bzz', 'ar']);
  });

  it.each([
    'https://brand.example/happy',
    'onion3://p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd',
    'sia://CAA4tO6aAy3HfNY4mIPCAQ7BS5mz0DzqNnHrOzN6KPSI9w',
    'QmYwAPJzv5CZsnAzt8auVZRnGiRAzQmmJYDh4T7SEBuwNA',
    'IPFS://QmYwAPJzv5CZsnAzt8auVZRnGiRAzQmmJYDh4T7SEBuwNA',
  ])('rejects %s as unsupported (never guesses IPFS)', (contenthash) => {
    expect(resolveContenthash(profile({ contenthash }))).toEqual({
      status: 'invalid',
      issue: expect.objectContaining({ code: 'CONTENTHASH_UNSUPPORTED', path: '/contenthash' }),
    });
  });

  it.each([
    'ipfs://',
    'ipfs://notacid',
    'ipfs://QmYwAPJzv5CZsnAzt8auVZRnGiRAzQmmJYDh4T7SEBuwNA/index.html',
    'ipns://app.uniswap.org',
    'bzz://zzzz',
    'bzz://d1de9994',
    'ar://too-short',
  ])('rejects malformed %s as invalid', (contenthash) => {
    expect(resolveContenthash(profile({ contenthash }))).toEqual({
      status: 'invalid',
      issue: expect.objectContaining({ code: 'CONTENTHASH_INVALID' }),
    });
  });

  it('is absent when the profile has no contenthash, and invalid when it is null', () => {
    expect(resolveContenthash(profile())).toEqual({ status: 'absent' });
    expect(resolveContenthash(profile({ contenthash: null as unknown as string }))).toEqual({
      status: 'invalid',
      issue: expect.objectContaining({ code: 'CONTENTHASH_INVALID' }),
    });
  });
});
