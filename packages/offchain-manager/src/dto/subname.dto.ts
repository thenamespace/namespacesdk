/**
 * Complete subname data returned by the Namespace API.
 * This represents a fully resolved ENS subname with all its associated records.
 * 
 * @example
 * ```typescript
 * // Retrieved subname data
 * const subname: SubnameDTO = {
 *   id: 'abc123',
 *   fullName: 'alice.example.eth',
 *   parentName: 'example.eth',
 *   label: 'alice',
 *   texts: { com.twitter: 'alice', url: 'https://alice.dev' },
 *   addresses: { '60': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
 *   metadata: {},
 *   namehash: '0x...',
 *   createdAt: '2024-01-01T00:00:00Z'
 * };
 * ```
 */
export interface SubnameDTO {
  /** Unique identifier for this subname */
  id: string;
  /** Full ENS name including parent domain (e.g., 'alice.example.eth') */
  fullName: string;
  /** Parent ENS domain (e.g., 'example.eth') */
  parentName: string;
  /** Subname label (e.g., 'alice') */
  label: string;
  /** Text records as key-value pairs */
  texts: Record<string, string>;
  /** Address records as coin type -> address mappings */
  addresses: Record<string, string>;
  /** Metadata records as key-value pairs */
  metadata: Record<string, string>;
  /** Optional IPFS content hash */
  contenthash?: string;
  /** ENS namehash for this subname */
  namehash: string;
  /** Optional owner address */
  owner?: string;
  /** Optional time-to-live in seconds */
  ttl?: number;
  /** Timestamp when the subname was created */
  createdAt?: string;
  /** Timestamp when the subname was last updated */
  updatedAt?: string;
}