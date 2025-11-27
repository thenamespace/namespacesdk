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
  /** Default (EVM-compatible) */
  Default = "default",
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
  /** Push Chain */
  Push = "push",
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
  /** Whether this chain is EVM-compatible and should mirror default EVM address */
  evm?: boolean;
}


export const chainMetadata: Record<ChainName, ChainMetadata> = {
  eth: {
    label: "Ethereum",
    coin: 60,
    evm: true,
  },
  default: {
    label: "Default",
    coin: 2147483648,
    evm: true,
  },
  base: {
    label: "Base",
    coin: 8453,
    evm: true,
  },
  op: {
    label: "Optimism",
    coin: 10,
    evm: true,
  },
  arb: {
    label: "Arbitrum",
    coin: 42161,
    evm: true,
  },
  bsc: {
    label: "BNB",
    coin: 56,
    evm: true,
  },
  polygon: {
    label: "Polygon",
    coin: 137,
    evm: true,
  },
  avax: {
    label: "Avax",
    coin: 43114,
    evm: true,
  },
  gnosis: {
    label: "Gnosis",
    coin: 100,
    evm: true,
  },
  zksync: {
    label: "ZkSync",
    coin: 324,
    evm: true,
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
    evm: true,
  },
  scroll: {
    label: "Scroll",
    coin: 534352,
    evm: true,
  },
  sui: {
    label: "Sui",
    coin: 784,
  },
  unichain: {
    label: "Unichain",
    coin: 130,
    evm: true,
  },
  berachain: {
    label: "Berachain",
    coin: 80094,
    evm: true,
  },
  world_chain: {
    label: "WorldChain",
    coin: 480,
    evm: true,
  },
  zora: {
    label: "Zora",
    coin: 7777777,
    evm: true,
  },
  celo: {
    label: "Celo",
    coin: 42220,
    evm: true,
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
    coin: 143,
    evm: true,
  },
  push: {
    label: "Push Chain",
    coin: 42101,
    evm: true,
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
