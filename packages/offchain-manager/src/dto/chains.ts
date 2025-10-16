/**
 * Supported blockchain networks for address records.
 * Each chain has a corresponding coin type used internally for ENS address records.
 * 
 * @example
 * ```typescript
 * import { ChainName } from '@thenamespace/offchain-manager';
 * 
 * // Use in address records
 * const addressRecord = {
 *   chain: ChainName.Ethereum,
 *   value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 * };
 * ```
 */
export enum ChainName {
  /** Ethereum mainnet */
  Ethereum = "eth",
  /** Solana */
  Solana = "sol",
  /** Arbitrum One */
  Arbitrum = "arb",
  /** Optimism */
  Optimism = "op",
  /** Base */
  Base = "base",
  /** Polygon (formerly Matic) */
  Polygon = "polygon",
  /** BNB Smart Chain (formerly BSC) */
  Bsc = "bsc",
  /** Avalanche C-Chain */
  Avalanche = "avax",
  /** Gnosis Chain (formerly xDai) */
  Gnosis = "gnosis",
  /** zkSync Era */
  Zksync = "zksync",
  /** Cosmos Hub */
  Cosmos = "cosmos",
  /** NEAR Protocol */
  Near = "near",
  /** Linea */
  Linea = "linea",
  /** Scroll */
  Scroll = "scroll",
  /** Bitcoin */
  Bitcoin = "btc",
  /** Starknet */
  Starknet = "starknet",
  /** Sui Network */
  Sui = "sui",
  /** Unichain */
  Unichain = "unichain",
  /** Berachain */
  Berachain = "berachain",
  /** WorldChain */
  WorldChain = "world_chain",
  /** Zora */
  Zora = "zora",
  /** Celo */
  Celo = "celo",
  /** Aptos */
  Aptos = "aptos",
  /** Algorand */
  Algorand = "algorand",
  /** Monad */
  Monad = "monad",
}

/**
 * Metadata for a supported blockchain network.
 * Contains display information and the coin type used for ENS address records.
 */
export interface ChainMetadata {
  /** Optional chain identifier */
  chain?: ChainName;
  /** Human-readable display name for the chain */
  label: string;
  /** SLIP-0044 coin type used for ENS address records */
  coin: number;
}


export const chainMetadata: Record<ChainName, ChainMetadata> = {
  eth: {
    label: "Ethereum",
    coin: 60,
  },
  base: {
    label: "Base",
    coin: 8453,
  },
  op: {
    label: "Optimism",
    coin: 10,
  },
  arb: {
    label: "Arbitrum",
    coin: 42161,
  },
  bsc: {
    label: "BNB",
    coin: 56,
  },
  polygon: {
    label: "Polygon",
    coin: 137,
  },
  avax: {
    label: "Avax",
    coin: 43114,
  },
  gnosis: {
    label: "Gnosis",
    coin: 100,
  },
  zksync: {
    label: "ZkSync",
    coin: 324,
  },
  starknet: {
    label: "Starknet",
    coin: 9004,
  },
  sol: {
    label: "Solana",
    coin: 501,
  },
  btc: {
    label: "Bitcoin",
    coin: 0,
  },
  cosmos: {
    label: "Cosmos",
    coin: 118,
  },
  near: {
    label: "Near",
    coin: 397,
  },
  linea: {
    label: "Linea",
    coin: 59144,
  },
  scroll: {
    label: "Scroll",
    coin: 534352,
  },
  sui: {
    label: "Sui",
    coin: 784,
  },
  unichain: {
    label: "Unichain",
    coin: 130,
  },
  berachain: {
    label: "Berachain",
    coin: 80094,
  },
  world_chain: {
    label: "WorldChain",
    coin: 480,
  },
  zora: {
    label: "Zora",
    coin: 7777777,
  },
  celo: {
    label: "Celo",
    coin: 42220,
  },
  aptos: {
    label: "Aptos",
    coin: 22,
  },
  algorand: {
    label: "Algorand",
    coin: 8,
  },
  monad: {
    label: "Monad",
    coin: 10143,
  },
};

/**
 * Get the SLIP-0044 coin type for a given blockchain network.
 * This coin type is used internally for ENS address records.
 * 
 * @param chain - The blockchain network to get the coin type for
 * @returns The SLIP-0044 coin type number
 * 
 * @example
 * ```typescript
 * import { getCoinType, ChainName } from '@thenamespace/offchain-manager';
 * 
 * const ethCoinType = getCoinType(ChainName.Ethereum); // Returns 60
 * const baseCoinType = getCoinType(ChainName.Base); // Returns 8453
 * ```
 */
export const getCoinType = (chain: ChainName): number => {
  return chainMetadata[chain].coin;
}
