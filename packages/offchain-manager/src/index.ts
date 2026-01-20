/**
 * @fileoverview Namespace SDK - Offchain Manager
 * 
 * A TypeScript SDK for managing ENS subnames off-chain using the Namespace API.
 * This library provides a simple interface for creating, updating, deleting, and querying
 * ENS subnames and their associated records (addresses, text records, metadata).
 * 
 * Supports all ENS-compatible domains including:
 * - Native ENS domains (.eth)
 * - Imported web2 domains (.com, .org, .net, etc.)
 * - Alternative TLDs (.art, .xyz, .club, etc.)
 * 
 * @example
 * ```typescript
 * import { createOffchainClient, ChainName } from '@thenamespace/offchain-manager';
 * 
 * // Initialize client with API key inline
 * const client = createOffchainClient({
 *   mode: 'sepolia',
 *   defaultApiKey: 'your-address-based-api-key'
 * });
 * 
 * // Create a subname
 * await client.createSubname({
 *   parentName: 'example.eth',
 *   label: 'alice',
 *   addresses: [{ chain: ChainName.Ethereum, value: '0x...' }],
 *   texts: [{ key: 'com.twitter', value: 'alice' }]
 * });
 * ```
 * 
 * @author Namespace Team
 * @version 3.0.6
 * @license MIT
 */


// Core client exports
export {
  createOffchainClient,
  OffchainClient,
  OffchainClientConfig,
} from "./offchain-client";

// Response and query types
export {
  GetAvailableResponse,
  GetRecordResponse,
  FilterSubnamesQuery,
  PagedResponse,
  QuerySubnamesRequest,
} from "./offchain-client/types";

// Data transfer objects
export {
  SubnameDTO,
  CreateSubnameRequest,
  UpdateSubnameRequest,
  ChainName,
  ChainMetadata,
  getCoinType,
} from "./dto";

// Record types
export { AddressRecord, TextRecord } from "./dto/internal-types";

// Validation utilities (for advanced usage)
export {
  validateEnsName,
  validateSubname,
  validateAddress,
  validateApiKey,
} from "./offchain-client/validation";

// Error classes (for error handling)
export {
  NamespaceSDKError,
  AuthenticationError,
  ValidationError,
  SubnameNotFoundError,
  SubnameAlreadyExistsError,
  RateLimitError,
} from "./offchain-client/errors";