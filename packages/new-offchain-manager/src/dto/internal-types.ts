// Internal types should not be exposed

import { ChainName } from "./chains";

export interface CreateSubnameRequest_Internal {
    parentName: string;
    label: string;
    texts?: TextRecord[];
    addresses?: AddressRecord_Internal[];
    metadata?: TextRecord[];
    contenthash?: string;
    ttl?: number;
}

export interface AddressRecord_Internal {
  coin: number;
  value: string;
}

export interface TextRecord {
    key: string;
    value: string;
  }
  
  export interface AddressRecord {
    chain: ChainName;
    value: string;
  }
  