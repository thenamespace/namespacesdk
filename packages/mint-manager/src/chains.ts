import { Chain } from "viem";
import { base, mainnet, sepolia, optimism, baseSepolia } from "viem/chains";

export enum ListingChain {
  Mainnet = "MAINNET",
  Sepolia = "SEPOLIA",
  BaseSepolia = "BASE_SEPOLIA",
  Optimism = "OPTIMISM",
  Base = "BASE",
}

const chains: Record<ListingChain, Chain> = {
  BASE: base,
  BASE_SEPOLIA: baseSepolia,
  MAINNET: mainnet,
  OPTIMISM: optimism,
  SEPOLIA: sepolia,
};

export const getChainId = (chain: ListingChain) => {
  return getChain(chain).id;
};

export const getChain = (chain: ListingChain) => {
  return chains[chain];
};

export const getChainName = (chainId: number): ListingChain => {
  for (const chain of Object.keys(chains)) {
    const chainKey = chain as ListingChain;
    if (chains[chainKey].id === chainId) {
      return chainKey;
    }
  }

  throw new Error("Unsupported chain provided: " + chainId);
};
