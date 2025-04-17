export interface L2SubnameResponse {
    name: string;
    namehash: string;
    owner: string;
    avatar?: string;
    chainId: number
    expiry: number
    parentHash: string
    records: {
      addresses: Record<string, string>;
      texts: Record<string, string>;
      contenthash: string;
    };
    metadata: {
      blockNumber: number;
      price: number;
      fee: number;
      tx: string;
    };
}

export interface L2SubnameRequest {
    chainId: 10 | 8453 | 84532,
    nameOrNamehash: string
}

export interface L2SubnamesResponse {
    size: number
    page: number
    items: L2SubnameResponse[]
    total: number
}

export interface L2SubnamesRequest {
    owner?: string;
    chainId?: number;
    page?: number;
    size?: number;
    parent?: string;
    isTestnet?: boolean;
    stringSearch?: string
}