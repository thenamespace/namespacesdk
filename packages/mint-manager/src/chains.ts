import { Chain } from "viem";
import { base, mainnet, sepolia, optimism, baseSepolia } from "viem/chains";

/**
 * Supported networks for listing/minting operations.
 */
export enum ListingChain {
  Mainnet = "MAINNET",
  Sepolia = "SEPOLIA",
  BaseSepolia = "BASE_SEPOLIA",
  Optimism = "OPTIMISM",
  Base = "BASE",
}

/** Internal mapping of supported chains to viem chain configs */
const chains: Record<ListingChain, Chain> = {
  BASE: base,
  BASE_SEPOLIA: baseSepolia,
  MAINNET: mainnet,
  OPTIMISM: optimism,
  SEPOLIA: sepolia,
};

/** Returns numeric chain id for a supported chain */
export const getChainId = (chain: ListingChain) => {
  return getChain(chain).id;
};

/** Returns viem Chain config for a supported chain */
export const getChain = (chain: ListingChain) => {
  return chains[chain];
};

/** Resolves chain id to a supported ListingChain enum */
export const getChainName = (chainId: number): ListingChain => {
  for (const chain of Object.keys(chains)) {
    const chainKey = chain as ListingChain;
    if (chains[chainKey].id === chainId) {
      return chainKey;
    }
  }

  throw new Error("Unsupported chain provided: " + chainId);
};
