import type { Address, Hex, PublicClient, Abi } from "viem";

export type OnchainPublicClient = Pick<
  PublicClient,
  "getChainId" | "getBlockNumber" | "getBalance" | "getFeeHistory"
> & {
  chain?: { id: number };
  readContract(input: {
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    blockNumber?: bigint;
  }): Promise<unknown>;
  estimateFeesPerGas(): Promise<{
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasPrice?: bigint;
  }>;
  simulateCalls(input: {
    account: Address;
    calls: readonly { to: Address; data: Hex; value: bigint }[];
    stateOverrides?: { address: Address; balance: bigint }[];
  }): Promise<{
    results: { status: "success" | "failure"; gasUsed: bigint }[];
  }>;
};

export interface PaymentToken {
  symbol: string;
  address: Address;
  decimals: number;
}

export interface OnchainDeployment {
  chainId: number;
  manager: Address;
  issuer: Address;
  sharedResolver: Address;
  ethRegistry: Address;
  whitelistFeature: Address;
  reservationFeature: Address;
  managerApiUrl: string;
  paymentTokens: PaymentToken[];
}

export interface OnchainClientOptions {
  publicClient: OnchainPublicClient;
  /** Ethereum mainnet (1) or Sepolia (11155111). */
  chainId: number;
  /** Override the proof service URL when testing or self-hosting Namespace's manager. */
  managerApiUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export interface NameInput {
  parentName: string;
  label: string;
  /** Seconds. Defaults to 365 days for minting. */
  duration?: bigint;
}

export interface MintInput extends NameInput {
  /** Caller whose eligibility is checked and who pays, separate from the recipient. */
  minter: Address;
}

export interface RenewalInput extends NameInput {
  renewer: Address;
  duration: bigint;
}

export interface Activation {
  id: Hex;
  parentName: string;
  configured: boolean;
  active: boolean;
  expirable: boolean;
  subregistry: Address;
  liveSubregistry: Address;
  resolver: Address;
  features: readonly Address[];
  parentExpiry: bigint;
}

export interface BlockedReason {
  code: string;
  message: string;
  /** Original Types.DeniedReason value when the contract returned a denial. */
  contractReason?: number;
}

export interface MintQuote {
  parentName: string;
  label: string;
  minter: Address;
  duration: bigint;
  available: boolean;
  canMint: boolean;
  reason: BlockedReason | null;
  reserved: boolean;
  expirable: boolean;
  priceUsdRaw: bigint;
  extraData: Hex;
  activation: Activation;
}

export interface RenewalQuote {
  parentName: string;
  label: string;
  renewer: Address;
  duration: bigint;
  renewable: boolean;
  reason: BlockedReason | null;
  priceUsdRaw: bigint;
  extraData: Hex;
  owner: Address;
  expiry: bigint | null;
  parentExpiry: bigint;
  activation: Activation;
}

export interface TransactionCall {
  to: Address;
  data: Hex;
  value: bigint;
  title: string;
}

export interface PrepareMintInput extends MintInput {
  recipient?: Address;
  paymentToken: Address;
  resolver?: Address;
  /** Reject a price increase since the UI's displayed quote. This is not an onchain price cap. */
  maxPriceUsdRaw?: bigint;
}

export interface PrepareRenewalInput extends RenewalInput {
  paymentToken: Address;
  maxPriceUsdRaw?: bigint;
}

export interface PreparedTransaction<Q> {
  chainId: number;
  account: Address;
  quote: Q;
  payment: { token: PaymentToken; amount: bigint; bufferedAmount: bigint };
  calls: TransactionCall[];
}
