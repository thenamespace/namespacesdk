export type L1Network = "sepolia" | "mainnet";
export type L2Network = "base" | "baseSepolia" | "optimism";

export interface GetL2SubnamesQuery {
  network?: L2Network;
  owner?: number;
  pageSize?: number;
  page?: number;
  stringSearch?: string;
  parentName?: string;
  isTestnet?: boolean;
}

export interface L2SubnameResponse {
  name: string;
  namehash: string;
  label: string;
  parentNamehash: string;
  owner: string;
  texts: Record<string, string>;
  addresses: Record<string, string>;
  contenthash?: string;
  chainId: number;
  expiry: number;
  mintTransaction?: {
    price: number;
    paymentReceiver: string;
  };
}

export interface L2SubnamePagedResponse {
  items: L2SubnameResponse[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface L2Stats {
  chainId: number;
  totalSubnames: number;
  totalPrice: number;
  totalFee: number;
}

export interface L2SubnameStats {
  perChain: Record<string, L2Stats>;
  totalSubnames: number;
  totalPrice: number;
  totalFee: number;
}

export interface GetL1SubnamesQuery {
  owner?: string;
  network: L1Network;
  parentNamehash?: string;
}

export interface L1SubnameResponse {
  subnameLabel: string;
  parentNode: string;
  paymentReceiver: string;
  sender: string;
  subnameOwner: string;
  tx: string;
  chainId: number;
  mintPrice: number;
  mintFee: number;
}
