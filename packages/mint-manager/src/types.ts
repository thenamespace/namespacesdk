import { Address } from "viem";

export interface MintDetailsRequest {
  parentName: string;
  label: string;
  minterAddress: string;
  expiryInYears?: number;
  isTestnet?: boolean;
}

export interface MintDetailsResponse {
  /**
   * Flag indicating if subname can be minted based on passed parameters.
   */
  canMint: boolean;

  /**
   * Estimated price of minting in ETH
   */
  estimatedPriceEth: number;

  /**
   * Estimated fee for minting in ETH
   */
  estimatedFeeEth: number;

  /**
   * Flag indicating if standard fee is a fixed fee which is not subtracted from the minting price.
   */
  isStandardFee: boolean;

  /**
   * List of validation errors if there were any. Populated if {@link canMint} is false.
   */
  validationErrors: MintingValidationErrorType[];
}

/**
 * Describes all possible error codes that could be thrown while attempting to mint the subname.
 */
export type MintingValidationErrorType =
  | "SUBNAME_TAKEN"
  | "MINTER_NOT_TOKEN_OWNER"
  | "MINTER_NOT_WHITELISTED"
  | "LISTING_EXPIRED"
  | "SUBNAME_RESERVED"
  | "VERIFIED_MINTER_ADDRESS_REQUIRED";

export interface MintTransactionResponse {
  contractAddress: Address;
  args: any[];
  account: string;
  abi: any;
  functionName: string;
  value: bigint;
}

export interface MintTransactionRequest {
  parentName: string;
  label: string;
  owner?: string;
  minterAddress: Address;
  expiryInYears?: number;
  records?: EnsRecords;
}

export interface EnsRecords {
  texts?: { key: string; value: string }[];
  addresses?: { coin: number; value: string }[];
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
