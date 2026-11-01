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

/** Exact USD amount in the contracts' 12-decimal denomination. */
export interface UsdAmount {
  currency: "USD";
  amount: bigint;
  decimals: 12;
}

export interface PaymentToken {
  symbol: string;
  address: Address;
  decimals: number;
}

export interface PaymentQuote {
  token: PaymentToken;
  /** Base units of token, before the preparation buffer. */
  amount: bigint;
}

export interface PaymentQuoteInput {
  price: UsdAmount;
  paymentToken: Address;
}

export interface OnchainDeployment {
  chainId: number;
  activationManager: Address;
  subnameIssuer: Address;
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

export interface SubnameInput {
  parentName: string;
  label: string;
  /** Defaults to 365 days for registration. */
  durationSeconds?: bigint;
}

export interface RegistrationInput extends SubnameInput {
  /** Sender, payer and account checked for eligibility. Omit while disconnected. */
  account?: Address;
}

export interface RenewalInput extends SubnameInput {
  /** Sender and payer, which may differ from the existing owner. */
  account?: Address;
  durationSeconds: bigint;
}

export type ExpirationType = "expiring" | "permanent";

/** Advanced parent state. An activation ID alone does not prove configuration exists. */
export interface ParentState {
  activationId: Hex;
  parentName: string;
  isConfigured: boolean;
  isActive: boolean;
  expirationType: ExpirationType | null;
  configuredResolver: Address | null;
  boundSubregistry: Address | null;
  currentSubregistry: Address | null;
  featureAddresses: readonly Address[];
  /** Null when the parent is unavailable or permanent. */
  parentExpiresAtSeconds: bigint | null;
}

export type OperationBlockCode =
  | "PARENT_NOT_CONFIGURED"
  | "PARENT_PAUSED"
  | "PARENT_UNAVAILABLE"
  | "SUBREGISTRY_CHANGED"
  | "ISSUER_NOT_AUTHORIZED"
  | "INVALID_LABEL"
  | "NAME_TAKEN"
  | "NAME_NOT_REGISTERED"
  | "REGISTRATION_NOT_STARTED"
  | "REGISTRATION_ENDED"
  | "NOT_ELIGIBLE"
  | "POLICY_DENIED"
  | "RESERVED"
  | "DURATION_TOO_SHORT"
  | "PERMANENT_REGISTRATION"
  | "RENEWAL_DISABLED"
  | "EXPIRY_OVERFLOW"
  | "CONTRACT_DENIED";

export interface OperationBlockReason {
  code: OperationBlockCode;
  message: string;
  /** Diagnostics only. Use code for application logic. */
  details?: { contractReason: number };
}

export type RegistrationBlockReason = OperationBlockReason;
export type RenewalBlockReason = OperationBlockReason;

export type QuoteOutcome =
  | { status: "ready"; account: Address; reason: null; price: UsdAmount }
  | { status: "blocked"; reason: OperationBlockReason; price: UsdAmount | null }
  | {
      status: "account_required";
      account: null;
      reason: null;
      price: UsdAmount | null;
    };

export interface QuoteContext {
  name: string;
  parentName: string;
  label: string;
  account: Address | null;
  chainId: number;
  durationSeconds: bigint;
  /** Block used for contract reads, not a validity guarantee. */
  blockNumber: bigint;
  expirationType: ExpirationType | null;
  parentExpiresAtSeconds: bigint | null;
}

export type RegistrationQuote = QuoteContext & QuoteOutcome;

export type RenewalQuote = QuoteContext &
  QuoteOutcome & {
    /** Null if no live owner exists or the parent prevents reading the registration. */
    owner: Address | null;
    /** Null for permanent registrations or when expiry is unavailable. */
    expiresAtSeconds: bigint | null;
    /** Expected expiry at the quoted state; null when renewal is blocked. */
    newExpiresAtSeconds: bigint | null;
  };

export interface TransactionCall {
  to: Address;
  data: Hex;
  value: bigint;
  title: string;
}

export interface PrepareRegistrationInput extends RegistrationInput {
  account: Address;
  recipient?: Address;
  paymentToken: Address;
  resolver?: Address;
  /** Reject an increase during preparation. This is not an onchain price cap. */
  maxPriceUsd?: UsdAmount;
}

export interface PrepareRenewalInput extends RenewalInput {
  account: Address;
  paymentToken: Address;
  maxPriceUsd?: UsdAmount;
}

export interface PreparedOperation<Q> {
  chainId: number;
  account: Address;
  quote: Q;
  payment: PaymentQuote & { bufferedAmount: bigint };
  calls: TransactionCall[];
}
