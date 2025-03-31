import { Address } from "viem";

export interface MintDetailsRequest {
  parentName: string;
  label: string;
  minterAddress: string;
  expiryInYears?: number
  isTestnet?: boolean
}

export interface MintDetailsResponse {
  name: string;
  price: number;
  fee: number;
  total: number;
  isMintable: boolean;
  errors?: string;
}

export interface MintTransactionResponse {
  contractAddress: Address;
  args: any[];
  account: string;
  abi: any;
  functionName: string;
  value: bigint
}

export interface MintTransactionRequest {
  parentName: string;
  label: string;
  owner?: string;
  minterAddress: Address;
  expiryInYears?: number;
  records?: EnsRecords
}

export interface EnsRecords {
    texts?: { key: string, value: string}[]
    addresses?: { coin: number, value: string }[]
}

export type ListingType = "L1" | "L2";


export interface NameListing {
  name: string;
  nameNetwork: string;
  type: ListingType;
  l2Metadata?: {
    registryNetwork: string;
  };
}

export interface MintParametersRequest {
  label: string;
  parentName: string;
  minterAddress: string;
  expiryInYears?: number;
  owner?: string;
  isTestnet?: boolean;
}

export interface MintParametersResponse {
  content: {
    label: string;
    owner: string;
    fee: string;
    price: string;
    parentNode: string;
    paymentReceiver: string;
    verifiedMinter: string;
    signatureExpiry: number;
    expiry: number;
    fuses?: number;
  };
  signature: string;
}