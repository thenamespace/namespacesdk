export enum ChainName {
    Ethereum = "eth",
    Solana = "sol",
    Arbitrum = "arb",
    Optimism = "op",
    Base = "base",
    Polygon = "polygon",
    Bsc = "bsc",
    Avalanche = "avax",
    Gnosis = "gnosis",
    Zksync = "zksync",
    Cosmos = "cosmos",
    Near = "near",
    Linea = "linea",
    Scroll = "scroll",
    Bitcoin = "btc",
    Starknet = "starknet",
}

export interface ChainMetadata {
    chain?: ChainName;
    label: string;
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
      coin: 234567891,
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
  };
  
  export const getCoinType = (chain: ChainName): number => {
    return chainMetadata[chain].coin;
  }
