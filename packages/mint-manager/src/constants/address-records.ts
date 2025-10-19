export enum ChainName {
  Ethereum = "eth",
  Default = "default",
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

const convertToCoinType = (coinType: number) => {
  return (0x80000000 | coinType) >>> 0;
};

export const chainMetadata: Record<ChainName, { label: string; coin: number }> =
  {
    eth: {
      label: "Ethereum",
      coin: 60,
    },
    default: {
      label: "Default",
      coin: 2147483648,
    },
    base: {
      label: "Base",
      coin: convertToCoinType(8453),
    },
    op: {
      label: "Optimism",
      coin: convertToCoinType(10),
    },
    arb: {
      label: "Arbitrum",
      coin: convertToCoinType(42161),
    },
    bsc: {
      label: "BNB",
      coin: convertToCoinType(56),
    },
    polygon: {
      label: "Polygon",
      coin: convertToCoinType(137),
    },
    avax: {
      label: "Avax",
      coin: convertToCoinType(43114),
    },
    gnosis: {
      label: "Gnosis",
      coin: convertToCoinType(100),
    },
    zksync: {
      label: "ZkSync",
      coin: convertToCoinType(324),
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
      coin: convertToCoinType(59144),
    },
    scroll: {
      label: "Scroll",
      coin: convertToCoinType(34352),
    },
  };

export const getCoinType = (chainName: ChainName): number => {
  return chainMetadata[chainName]?.coin;
};
