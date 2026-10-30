import { coinTypeForChain, DEFAULT_EVM_COIN_TYPE, isEvmCoinType, isSupportedCoinType } from '../src';

describe('coinTypeForChain', () => {
  it.each([
    ['eth', 60],
    ['btc', 0],
    ['sol', 501],
    ['base', 2147492101],
    ['op', 2147483658],
    ['vara', 913],
    ['evm', DEFAULT_EVM_COIN_TYPE],
  ])('maps %s to %d', (name, coinType) => {
    expect(coinTypeForChain(name)).toBe(coinType);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(coinTypeForChain(' ETH ')).toBe(60);
  });

  it.each(['ethereum', '', 'constructor', 'toString', '__proto__'])('throws for unknown name %p', (name) => {
    expect(() => coinTypeForChain(name)).toThrow('Unknown chain name');
  });
});

describe('isEvmCoinType', () => {
  it('is true for 60, the default EVM coin type and ENSIP-11 chain coin types', () => {
    expect(isEvmCoinType(60)).toBe(true);
    expect(isEvmCoinType(DEFAULT_EVM_COIN_TYPE)).toBe(true);
    expect(isEvmCoinType(2147492101)).toBe(true);
    expect(isEvmCoinType(0xffffffffn)).toBe(true);
  });

  it('is false for non-EVM and out-of-range coin types', () => {
    expect(isEvmCoinType(0)).toBe(false);
    expect(isEvmCoinType(501)).toBe(false);
    expect(isEvmCoinType(0x1_8000_0002)).toBe(false);
    expect(isEvmCoinType(-60)).toBe(false);
  });
});

describe('isSupportedCoinType', () => {
  it('is true for coin types address-encoder can encode, including unknown EVM chains', () => {
    for (const coinType of [0, 60, 501, 913, DEFAULT_EVM_COIN_TYPE, 2147492101, 0x80000000 + 999_999]) {
      expect(isSupportedCoinType(coinType)).toBe(true);
    }
  });

  it('is false without an encoder or outside 0..2^32-1', () => {
    expect(isSupportedCoinType(999999)).toBe(false);
    expect(isSupportedCoinType(2n ** 32n)).toBe(false);
    expect(isSupportedCoinType(1.5)).toBe(false);
  });
});
