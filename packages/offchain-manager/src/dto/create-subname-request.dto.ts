import { AddressRecord, TextRecord } from "./internal-types";

/**
 * Request payload for creating a new ENS subname.
 * 
 * @example
 * ```typescript
 * import { CreateSubnameRequest, ChainName } from '@namespacesdk/offchain-manager';
 * 
 * const request: CreateSubnameRequest = {
 *   parentName: 'example.eth',
 *   label: 'alice',
 *   addresses: [{
 *     chain: ChainName.Ethereum,
 *     value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 *   }],
 *   texts: [{
 *     key: 'com.twitter',
 *     value: 'alice'
 *   }]
 * };
 * ```
 */
export interface CreateSubnameRequest {
  /** The parent ENS domain (e.g., 'example.eth') */
  parentName: string;
  /** The subname label (e.g., 'alice' for 'alice.example.eth') */
  label: string;
  /** Optional text records for social media, websites, etc. */
  texts?: TextRecord[];
  /** Optional address records for different blockchain networks */
  addresses?: AddressRecord[];
  /** Optional metadata records for custom data */
  metadata?: TextRecord[];
  /** Optional IPFS content hash */
  contenthash?: string;
  /** Optional time-to-live in seconds for DNS records */
  ttl?: number;
}
