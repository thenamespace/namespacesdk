// Internal types should not be exposed

import { ChainName } from "./chains";

export interface CreateSubnameRequest_Internal {
    parentName: string;
    label: string;
    texts?: TextRecord[];
    addresses?: AddressRecord_Internal[];
    metadata?: TextRecord[];
    contenthash?: string;
    ttl?: number;
    owner?: string
}

export interface AddressRecord_Internal {
  coin: number;
  value: string;
}

/**
 * Represents a text record for ENS subnames.
 * Text records store arbitrary key-value pairs like social media handles, websites, etc.
 * 
 * @example
 * ```typescript
 * const textRecord: TextRecord = {
 *   key: 'com.twitter',
 *   value: 'myhandle'
 * };
 * ```
 */
export interface TextRecord {
  /** The record key (e.g., 'description', 'com.twitter', 'com.github', 'url', 'avatar') */
  key: string;
  /** The record value (e.g., 'myhandle', 'https://mysite.com') */
  value: string;
}

/**
 * Represents an address record for ENS subnames.
 * Address records map blockchain networks to wallet addresses.
 * 
 * @example
 * ```typescript
 * const addressRecord: AddressRecord = {
 *   chain: ChainName.Ethereum,
 *   value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 * };
 * ```
 */
export interface AddressRecord {
  /** The blockchain network for this address */
  chain: ChainName;
  /** The wallet address on the specified chain */
  value: string;
}
