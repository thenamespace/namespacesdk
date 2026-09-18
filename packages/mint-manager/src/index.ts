export { createMintClient, MintClient, MintClientConfig } from "./mint-client";
export {
  MintDetailsRequest,
  MintDetailsResponse,
  MintTransactionResponse,
  MintTransactionRequest,
  EnsRecords,
  EnsAddressRecord,
  ContenthashRecord,
  EnsTextRecord,
  MintingValidationErrorType,
  ListingType,
  NameListing,
  Logger,
  NameCheck,
  NameCheckBase,
  CheckNameOptions,
  PrepareMintOptions,
} from "./types";
export { ChainName } from "./constants/address-records";
export { ContenthashType } from "./constants/contenthash-record";

// Typed errors. Branch on `code` rather than parsing messages.
export {
  MintManagerError,
  MintManagerErrorCode,
  MintManagerErrorOptions,
} from "./errors";

// ENSIP-15 helpers, so callers can normalize before storing or comparing names.
export {
  normalizeName,
  normalizeLabel,
  normalizeSubname,
  MAX_NAME_BYTES,
  MAX_LABEL_BYTES,
} from "./validation";

// Chain conversion helpers. Previously present but unreachable from the entrypoint.
export { ListingChain, getChainId, getChainName } from "./chains";
export {
  SUPPORTED_NETWORK_IDS,
  networkIdToChainName,
  chainNameToNetworkId,
  getCoinTypeForChain,
  isSupportedL2Network,
  getSupportedNetworkIds,
  getSupportedChainNames,
  getChainDisplayName,
  isSupportedNetworkId,
  isValidChainName,
} from "./chain-utils";
