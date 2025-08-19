/**
 * @thenamespace/indexer
 * 
 * TypeScript SDK for interacting with the Namespace Indexer API.
 * 
 * This package provides a comprehensive client for querying L2 subnames,
 * registries, and metadata from the Namespace Indexer service.
 * 
 * @example
 * ```typescript
 * import { createIndexerClient } from '@thenamespace/indexer';
 * 
 * const client = createIndexerClient();
 * 
 * const subname = await client.getL2Subname({
 *   chainId: 10,
 *   nameOrNamehash: 'lucas.oppunk.eth'
 * });
 * ```
 * 
 * @packageDocumentation
 */

// Client exports
export {
  IndexerClient,
  IndexerClientConfig,
  createIndexerClient,
} from "./indexer-client";

// DTO exports
export {
  L2RegistryResponse,
  L2SubnameRequest,
  L2SubnameResponse,
  L2SubnamesRequest,
  L2SubnamesResponse,
} from "./dto";