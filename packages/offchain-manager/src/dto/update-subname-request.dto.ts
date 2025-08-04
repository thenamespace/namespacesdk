import { AddressRecord, TextRecord } from "./internal-types";

/**
 * Request payload for updating an existing ENS subname.
 * All fields are optional - only provided fields will be updated.
 * 
 * @example
 * ```typescript
 * import { UpdateSubnameRequest, ChainName } from '@namespacesdk/offchain-manager';
 * 
 * const updateRequest: UpdateSubnameRequest = {
 *   texts: [{
 *     key: 'url',
 *     value: 'https://alice.dev'
 *   }],
 *   addresses: [{
 *     chain: ChainName.Base,
 *     value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 *   }]
 * };
 * ```
 */
export interface UpdateSubnameRequest {
  /** Text records to update (replaces existing text records) */
  texts?: TextRecord[];
  /** Address records to update (replaces existing address records) */
  addresses?: AddressRecord[];
  /** Metadata records to update (replaces existing metadata) */
  metadata?: TextRecord[];
  /** IPFS content hash to set */
  contenthash?: string;
  /** Time-to-live in seconds for DNS records */
  ttl?: number;
}
