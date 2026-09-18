import { Address } from "viem";
import { ChainName } from "./constants/address-records";
import { ContenthashType } from "./constants/contenthash-record";

/** Minimal logging surface. Supply one to see SDK diagnostics. */
export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** Parameters for estimating mint details and price. */
export interface MintDetailsRequest {
  parentName: string;
  label: string;
  minterAddress: string;
  expiryInYears?: number;
  /**
   * @deprecated Ignored. The network comes from the client's own `isTestnet`,
   * so a quote can no longer disagree with the transaction it precedes.
   */
  isTestnet?: boolean;
}

/** Estimated details and validations for a mint request. */
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
 * Why a mint was refused.
 *
 * These are not interchangeable. Two axes matter when you handle them: whether
 * the obstacle is the *name* or the *minter*, and whether trying a different
 * label would help. Getting that wrong is how a UI tells someone to pick a new
 * name when the real problem was their wallet.
 *
 * Note that the API stops at the first failure, so this list is not exhaustive
 * for a given request, clearing one reason can reveal another.
 *
 * | Reason | Obstacle | Does another label help? |
 * | --- | --- | --- |
 * | `SUBNAME_TAKEN` | name | yes |
 * | `SUBNAME_RESERVED` | name | yes |
 * | `MINTER_NOT_WHITELISTED` | minter | no |
 * | `MINTER_NOT_TOKEN_OWNER` | minter | no |
 * | `VERIFIED_MINTER_ADDRESS_REQUIRED` | minter | no |
 * | `LISTING_EXPIRED` | listing | no |
 */
export type MintingValidationErrorType =
  /**
   * The name is already registered. It is gone for everyone, permanently.
   *
   * Tell the user to choose a different label.
   */
  | "SUBNAME_TAKEN"
  /**
   * The parent owner holds this specific label back, commonly short or
   * high-value labels, or ones promised to a particular address.
   *
   * The name is *not* registered, so the registry will report it as free. It is
   * simply not available to this minter. A different label usually works; the
   * same label will not, unless the reservation is for this address.
   */
  | "SUBNAME_RESERVED"
  /**
   * The parent is allowlist-gated and this address is not on the list.
   *
   * Nothing about the name is wrong. Trying other labels will fail identically,
   * so do not prompt for a new one, prompt to switch wallets, or point at
   * however the parent grants access.
   */
  | "MINTER_NOT_WHITELISTED"
  /**
   * The parent is token-gated and this address does not hold the required
   * token.
   *
   * Distinct from an allowlist: access follows a token the user can usually
   * acquire, rather than a list they must be added to. Switching to a wallet
   * that holds the token is the fix.
   */
  | "MINTER_NOT_TOKEN_OWNER"
  /**
   * The parent requires a minter address that has completed verification, and
   * this one has not.
   *
   * The wallet is recognised but not yet cleared. Send the user through the
   * parent's verification flow rather than suggesting another name.
   */
  | "VERIFIED_MINTER_ADDRESS_REQUIRED"
  /**
   * The listing's minting window has closed, the deadline passed.
   *
   * Nothing the user does with names or wallets will help, and no label is
   * mintable under this parent until the owner relists it. Treat it as a
   * temporary end state and say so plainly.
   */
  | "LISTING_EXPIRED";

/** Prepared transaction data for calling the mint function on-chain. */
export interface MintTransactionResponse {
  contractAddress: Address;
  args: any[];
  account: string;
  abi: any;
  functionName: string;
  value: bigint;
}

/** Parameters for preparing a mint transaction. */
export interface MintTransactionRequest {
  parentName: string;
  label: string;
  owner?: string;
  minterAddress: Address;
  expiryInYears?: number;
  records?: EnsRecords;
  /**
   * Hard cap on `price + fee`, in wei. If the signed quote exceeds it the call
   * throws `PRICE_EXCEEDS_MAX` instead of returning a transaction. Set this
   * whenever the price was shown to a user before signing.
   */
  maxValue?: bigint;
}

/** Single ENS text record to set for the subname. */
export interface EnsTextRecord {
  key: string
  value: string
}

/** Address record for a specific chain (by coin type or ChainName). */
export interface EnsAddressRecord {
  chain: ChainName | number
  value: string
}

/** Contenthash record (ipfs, ipns, swarm, etc.). */
export interface ContenthashRecord {
  type: ContenthashType
  value: string
}

/** Optional records to be applied at mint time. */
export interface EnsRecords {
  texts?: EnsTextRecord[];
  addresses?: EnsAddressRecord[]
  contenthash?: ContenthashRecord
}

/** Listing type indicating L1 or L2 mint path. */
export type ListingType = "L1" | "L2";

/** Listing metadata returned by the listing service. */
export interface NameListing {
  name: string;
  nameNetwork: string;
  type: ListingType;
  l2Metadata?: {
    registryNetwork: string;
  };
}

/** Request body for fetching mint parameters from the mint service. */
export interface MintParametersRequest {
  label: string;
  parentName: string;
  minterAddress: string;
  expiryInYears?: number;
  owner?: string;
  isTestnet?: boolean;
}

/** Response body with signed content and parameters for minting. */
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

/** Fields present on every {@link NameCheck} result. */
export interface NameCheckBase {
  /** The ENSIP-15 normalized full name that was checked. */
  name: string;
  /** Leftmost label of {@link NameCheckBase.name}. */
  label: string;
  /** Everything to the right of the label. */
  parentName: string;
  /** Whether the parent is minted on L1 or an L2 registry. */
  listingType: ListingType;
  /** Chain the name is minted on. Derived from the listing, not supplied. */
  chainId: number;
}

/**
 * The outcome of {@link MintClient.checkName}.
 *
 * Narrow on `status` before reading the rest. Price fields exist only on
 * `"available"`, so the compiler stops you reading a quote that was never
 * returned.
 */
export type NameCheck =
  | (NameCheckBase & {
      /** The name is free and this minter may mint it right now. */
      status: "available";
      estimatedPriceEth: number;
      estimatedFeeEth: number;
      /** True when the fee is fixed rather than taken out of the price. */
      isStandardFee: boolean;
    })
  | (NameCheckBase & {
      /** The name is already registered. Choosing another label is the fix. */
      status: "taken";
      /** Everything the API objected to, which may also include gate errors. */
      reasons: MintingValidationErrorType[];
    })
  | (NameCheckBase & {
      /**
       * The name itself is free, but this minter cannot mint it, typically an
       * allowlist, a reservation, or an expired listing.
       */
      status: "blocked";
      reasons: MintingValidationErrorType[];
      /**
       * Whether the name's availability could actually be confirmed. False only
       * when {@link CheckNameOptions.rpc} was `"never"` and the API's response
       * left it unresolved.
       */
      nameAvailabilityConfirmed: boolean;
    });

/** Options for {@link MintClient.checkName}. */
export interface CheckNameOptions {
  /** Address that intends to mint. Gate checks are evaluated against it. */
  minterAddress: string;
  expiryInYears?: number;
  /**
   * When to consult the registry directly.
   *
   * - `"auto"` (default) queries it only when the API's answer leaves the
   *   name's availability unresolved, which happens on gated listings where
   *   validation stops at the gate before it ever looks at the name.
   * - `"always"` queries it on every call.
   * - `"never"` skips it, at the cost of an unresolved `"blocked"` result.
   */
  rpc?: "auto" | "always" | "never";
}

/** Options for {@link MintClient.prepareMint}. */
export interface PrepareMintOptions {
  minterAddress: string;
  owner?: string;
  expiryInYears?: number;
  records?: EnsRecords;
  /** Hard cap on `price + fee` in wei. See {@link MintTransactionRequest.maxValue}. */
  maxValue?: bigint;
}
