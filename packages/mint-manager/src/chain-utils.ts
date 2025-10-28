import { ListingChain, getChainId, getChainName } from "./chains";
import { ChainName, chainMetadata } from "./constants/address-records";

/**
 * Chain utilities for converting between different chain representations.
 * 
 * This module provides clear conversion functions to help developers
 * understand when to use which chain type:
 * 
 * - NetworkId (number): For blockchain operations (availability, minting)
 * - ChainName (string): For ENS multi-coin address records
 * - ListingChain (internal): For SDK internal operations
 */

/**
 * Supported network IDs for L2 operations
 */
export const SUPPORTED_NETWORK_IDS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  BASE: 8453,
  BASE_SEPOLIA: 84532,
  OPTIMISM: 10,
} as const;

/**
 * Convert a numeric chain ID to ChainName for ENS records
 * 
 * @param chainId - Numeric chain ID
 * @returns ChainName for use in ENS address records
 * 
 * @example
 * ```typescript
 * const chainName = networkIdToChainName(8453); // ChainName.Base
 * ```
 */
export function networkIdToChainName(chainId: number): ChainName {
  switch (chainId) {
    case SUPPORTED_NETWORK_IDS.MAINNET:
    case SUPPORTED_NETWORK_IDS.SEPOLIA:
      return ChainName.Ethereum;
    case SUPPORTED_NETWORK_IDS.BASE:
    case SUPPORTED_NETWORK_IDS.BASE_SEPOLIA:
      return ChainName.Base;
    case SUPPORTED_NETWORK_IDS.OPTIMISM:
      return ChainName.Optimism;
    default:
      throw new Error(`Unsupported network ID: ${chainId}. Supported IDs: ${Object.values(SUPPORTED_NETWORK_IDS).join(', ')}`);
  }
}

/**
 * Convert ChainName to numeric chain ID
 * 
 * @param chainName - ChainName enum value
 * @returns Numeric chain ID for blockchain operations
 * 
 * @example
 * ```typescript
 * const chainId = chainNameToNetworkId(ChainName.Base); // 8453
 * ```
 */
export function chainNameToNetworkId(chainName: ChainName): number {
  switch (chainName) {
    case ChainName.Ethereum:
      return SUPPORTED_NETWORK_IDS.MAINNET;
    case ChainName.Base:
      return SUPPORTED_NETWORK_IDS.BASE;
    case ChainName.Optimism:
      return SUPPORTED_NETWORK_IDS.OPTIMISM;
    default:
      throw new Error(`ChainName ${chainName} cannot be converted to a supported network ID. Supported: Ethereum, Base, Optimism`);
  }
}

/**
 * Get coin type for a ChainName (for ENS address records)
 * 
 * @param chainName - ChainName enum value
 * @returns Coin type number for ENS resolver
 * 
 * @example
 * ```typescript
 * const coinType = getCoinTypeForChain(ChainName.Base); // 2147485001
 * ```
 */
export function getCoinTypeForChain(chainName: ChainName): number {
  const metadata = chainMetadata[chainName];
  if (!metadata) {
    throw new Error(`Unknown ChainName: ${chainName}`);
  }
  return metadata.coin;
}

/**
 * Check if a chain ID is supported for L2 operations
 * 
 * @param chainId - Numeric chain ID
 * @returns True if supported for L2 operations
 * 
 * @example
 * ```typescript
 * const isSupported = isSupportedL2Network(8453); // true (Base)
 * ```
 */
export function isSupportedL2Network(chainId: number): boolean {
  return Object.values(SUPPORTED_NETWORK_IDS).includes(chainId as any);
}

/**
 * Get all supported network IDs
 * 
 * @returns Array of supported network IDs
 */
export function getSupportedNetworkIds(): number[] {
  return Object.values(SUPPORTED_NETWORK_IDS);
}

/**
 * Get all supported ChainNames for ENS records
 * 
 * @returns Array of supported ChainNames
 */
export function getSupportedChainNames(): ChainName[] {
  return [
    ChainName.Ethereum,
    ChainName.Base,
    ChainName.Optimism,
    ChainName.Arbitrum,
    ChainName.Polygon,
    ChainName.Bsc,
    ChainName.Avalanche,
    ChainName.Gnosis,
    ChainName.Zksync,
    ChainName.Linea,
    ChainName.Scroll,
    ChainName.Bitcoin,
    ChainName.Starknet,
    ChainName.Solana,
    ChainName.Cosmos,
    ChainName.Near,
  ];
}

/**
 * Get human-readable chain name for a network ID
 * 
 * @param chainId - Numeric chain ID
 * @returns Human-readable chain name
 * 
 * @example
 * ```typescript
 * const name = getChainDisplayName(8453); // "Base"
 * ```
 */
export function getChainDisplayName(chainId: number): string {
  switch (chainId) {
    case SUPPORTED_NETWORK_IDS.MAINNET:
      return "Ethereum Mainnet";
    case SUPPORTED_NETWORK_IDS.SEPOLIA:
      return "Sepolia Testnet";
    case SUPPORTED_NETWORK_IDS.BASE:
      return "Base";
    case SUPPORTED_NETWORK_IDS.BASE_SEPOLIA:
      return "Base Sepolia";
    case SUPPORTED_NETWORK_IDS.OPTIMISM:
      return "Optimism";
    default:
      return `Unknown Network (${chainId})`;
  }
}

/**
 * Type guard to check if a value is a supported network ID
 * 
 * @param value - Value to check
 * @returns True if value is a supported network ID
 */
export function isSupportedNetworkId(value: any): value is number {
  return typeof value === 'number' && Object.values(SUPPORTED_NETWORK_IDS).includes(value);
}

/**
 * Type guard to check if a value is a valid ChainName
 * 
 * @param value - Value to check
 * @returns True if value is a valid ChainName
 */
export function isValidChainName(value: any): value is ChainName {
  return typeof value === 'string' && Object.values(ChainName).includes(value);
}

