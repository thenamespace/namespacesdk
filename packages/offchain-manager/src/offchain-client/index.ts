import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { SubnameDTO } from "../dto/subname.dto";
import {
  _addAddressRecord,
  _addDataRecord,
  _addTextRecord,
  _createSubname,
  _deleteAddressRecord,
  _deleteDataRecord,
  _deleteSubname,
  _deleteTextRecord,
  _updateSubname,
} from "./private-actions";
import {
  _getDataRecord,
  _getDataRecords,
  _getFilteredSubnames,
  _getSingleSubname,
  _getTextRecord,
  _getTextRecords,
  _isSubnameAvailable,
} from "./public-actions";
import {
  GetAvailableResponse,
  GetRecordResponse,
  PagedResponse,
  QuerySubnamesRequest,
} from "./types";
import { CreateSubnameRequest } from "../dto/create-subname-request.dto";
import { ChainName, getCoinType, UpdateSubnameRequest } from "../dto";

/**
 * Main client interface for managing ENS subnames off-chain.
 * Provides methods for creating, updating, deleting, and querying subnames and their records.
 * 
 * @example
 * ```typescript
 * import { createOffchainClient } from '@namespacesdk/offchain-manager';
 * 
 * const client = createOffchainClient({ mode: 'sepolia' });
 * client.setDefaultApiKey('your-api-key'); // Works with your address based ENS domain
 * 
 * // Create a subname
 * await client.createSubname({
 *   parentName: 'example.eth',
 *   label: 'alice',
 *   addresses: [{ chain: ChainName.Ethereum, value: '0x...' }]
 * });
 * ```
 */
export interface OffchainClient {
  /**
   * Set API key for a specific ENS domain.
   * @param ensName - The ENS domain name (e.g., 'example.eth')
   * @param apiKey - Domain Based API key obtained from https://dev.namespace.ninja
   * @example
   * ```typescript
   * client.setApiKey('example.eth', 'your-domain-based-api-key');
   * ```
   */
  setApiKey(ensName: string, apiKey: string): void;

  /**
   * Set a default API key to be used for all your ENS domains with Namespace Resolver.
   * This is useful when you want to use the same API key for all domains registered with the same address.
   * @param apiKey - Address Based API key obtained from https://dev.namespace.ninja
   * @example
   * ```typescript
   * client.setDefaultApiKey('your-address-based-api-key');
   * ```
   */
  setDefaultApiKey(apiKey: string): void;

  /**
   * Create a new ENS subname with optional records.
   * @param request - Subname creation parameters
   * @throws {ValidationError} When request parameters are invalid
   * @throws {AuthenticationError} When API key is invalid
   * @throws {SubnameAlreadyExistsError} When subname already exists
   * @example
   * ```typescript
   * await client.createSubname({
   *   parentName: 'example.eth',
   *   label: 'alice',
   *   addresses: [{ chain: ChainName.Ethereum, value: '0x...' }],
   *   texts: [{ key: 'com.twitter', value: 'alice' }]
   * });
   */
  createSubname(request: CreateSubnameRequest): Promise<void>;

  /**
   * Update an existing ENS subname's records.
   * @param subname - Full subname (e.g., 'alice.example.eth')
   * @param request - Update parameters
   * @throws {ValidationError} When parameters are invalid
   * @throws {SubnameNotFoundError} When subname doesn't exist
   * @example
   * ```typescript
   * await client.updateSubname('alice.example.eth', {
   *   addresses: [{ chain: ChainName.Ethereum, value: '0x...' }],
   *   texts: [{ key: 'com.twitter', value: 'alice' }]
   * });
   * ```
   */
  updateSubname(subname: string, request: UpdateSubnameRequest): Promise<void>;

  /**
   * Delete an ENS subname and all its records.
   * @param fullSubname - Full subname (e.g., 'alice.example.eth')
   * @throws {SubnameNotFoundError} When subname doesn't exist
   * @example
   * ```typescript
   * await client.deleteSubname('alice.example.eth');
   * ```
   */
  deleteSubname(fullSubname: string): Promise<void>;

  /**
   * Check if a subname is available for registration.
   * @param fullSubname - Full subname to check (e.g., 'alice.example.eth')
   * @returns Promise resolving to availability status
   * @example
   * ```typescript
   * const availability = await client.isSubnameAvailable('alice.example.eth');
   * ```
   */
  isSubnameAvailable(fullSubname: string): Promise<GetAvailableResponse>;

  /**
   * Get details of a specific subname.
   * @param fullName - Full subname (e.g., 'alice.example.eth')
   * @returns Promise resolving to subname data or null if not found
   * @example
   * ```typescript
   * const subname = await client.getSingleSubname('alice.example.eth');
   * ```
   */
  getSingleSubname(fullName: string): Promise<SubnameDTO | null>;

  /**
   * Search and filter subnames with pagination.
   * @param query - Search and filter parameters
   * @returns Promise resolving to paginated subname results
   * @example
   * ```typescript
   * const subnames = await client.getFilteredSubnames({
   *   parentName: 'example.eth',
   *   page: 1,
   *   size: 50,
   * });
   * ```
   */
  getFilteredSubnames(
    query: QuerySubnamesRequest
  ): Promise<PagedResponse<SubnameDTO[]>>;

  /**
   * Add an address record for a specific blockchain to a subname.
   * @param subname - Full subname (e.g., 'alice.example.eth')
   * @param chain - Blockchain network
   * @param value - Wallet address on the specified chain
   * @throws {ValidationError} When address format is invalid for the chain
   * @example
   * ```typescript
   * await client.addAddressRecord('alice.example.eth', ChainName.Ethereum, '0x...');
   * ```
   */
  addAddressRecord(
    subname: string,
    chain: ChainName,
    value: string
  ): Promise<void>;

  /**
   * Remove an address record for a specific blockchain from a subname.
   * @param subname - Full subname (e.g., 'alice.example.eth')
   * @param chain - Blockchain network to remove
   * @example
   * ```typescript
   * await client.deleteAddressRecord('alice.example.eth', ChainName.Ethereum);
   * ```
   */
  deleteAddressRecord(subname: string, chain: ChainName): Promise<void>;

  /**
   * Add a text record to a subname.
   * @param subname - Full subname (e.g., 'alice.example.eth')
   * @param key - Record key (e.g., 'com.twitter', 'com.github', 'url')
   * @param value - Record value (e.g., 'alice', 'https://alice.dev')
   * @example
   * ```typescript
   * await client.addTextRecord('alice.example.eth', 'com.twitter', 'alice');
   * ```
   */
  addTextRecord(subname: string, key: string, value: string): Promise<void>;

  /**
   * Remove a text record from a subname.
   * @param subname - Full subname (e.g., 'alice.example.eth')
   * @param key - Record key to remove
   * @example
   * ```typescript
   * await client.deleteTextRecord('alice.example.eth', 'com.twitter');
   * ```
   */
  deleteTextRecord(subname: string, key: string): Promise<void>;

  /**
   * Get all text records for a subname.
   * @param fullSubname - Full subname (e.g., 'alice.example.eth')
   * @returns Promise resolving to all the text records for the subname
   * @example
   * ```typescript
   * const textRecords = await client.getTextRecords('alice.example.eth');
   * ```
   */
  getTextRecords(fullSubname: string): Promise<Record<string, string>>;

  /**
   * Get a specific text record for a subname.
   * @param fullSubname - Full subname (e.g., 'alice.example.eth')
   * @param key - Record key to retrieve
   * @returns Promise resolving to the record response
   * @example
   * ```typescript
   * const textRecord = await client.getTextRecord('alice.example.eth', 'com.twitter');
   * ```
   */
  getTextRecord(fullSubname: string, key: string): Promise<GetRecordResponse>;

  /**
   * Add a metadata record to a subname.
   * @param fullSubname - Full subname (e.g., 'alice.example.eth')
   * @param key - Metadata key
   * @param data - Metadata value (will be JSON stringified if object)
   * @example
   * ```typescript
   * await client.addDataRecord('alice.example.eth', 'data', 'HODL ENS!');
   * ```
   */
  addDataRecord(fullSubname: string, key: string, data: unknown): Promise<void>;

  /**
   * Remove a metadata record from a subname.
   * @param subname - Full subname (e.g., 'alice.example.eth')
   * @param key - Metadata key to remove
   * @example
   * ```typescript
   * await client.deleteDataRecord('alice.example.eth', 'data');
   * ```
   */
  deleteDataRecord(subname: string, key: string): Promise<void>;

  /**
   * Get all metadata records for a subname.
   * @param fullSubname - Full subname (e.g., 'alice.example.eth')
   * @returns Promise resolving to key-value pairs of metadata records
   * @example
   * ```typescript
   * const dataRecords = await client.getDataRecords('alice.example.eth');
   * ```
   */
  getDataRecords(fullSubname: string): Promise<Record<string, unknown>>;

  /**
   * Get a specific metadata record for a subname.
   * @param fullSubname - Full subname (e.g., 'alice.example.eth')
   * @param key - Metadata key to retrieve
   * @returns Promise resolving to the record response
   * @example
   * ```typescript
   * const dataRecord = await client.getDataRecord('alice.example.eth', 'data');
   * ```
   */
  getDataRecord(fullSubname: string, key: string): Promise<GetRecordResponse>;
}

/** Network modes supported by the Namespace SDK */
type Mode = "mainnet" | "sepolia";

/** Backend URI mappings for different network modes */
const backendUris: Record<Mode, string> = {
  mainnet: "https://offchain-manager.namespace.ninja",
  sepolia: "https://staging.offchain-manager.namespace.ninja",
};

/**
 * Configuration options for creating an OffchainClient.
 * Extends AxiosRequestConfig to allow customization of HTTP client behavior.
 * 
 * @example
 * ```typescript
 * const config: OffchainClientConfig = {
 *   mode: 'sepolia', // Use testnet
 *   timeout: 5000,  // 5 second timeout
 * };
 * ```
 */
export interface OffchainClientConfig extends AxiosRequestConfig {
  /** 
   * Network mode - 'mainnet' for production, 'sepolia' for testing.
   * @default 'mainnet'
   */
  mode?: Mode;
  /** 
   * Custom backend URI. If not provided, uses the default URI for the selected mode.
   */
  backendUri?: string;
}

class HttpOffchainClient implements OffchainClient {
  private HTTP: AxiosInstance;
  private apiKeys: Record<string, string> = {};
  private defaultApiKey?: string;

  constructor(private readonly config: OffchainClientConfig) {
    const mode = config.mode || "mainnet";
    const uri = config.backendUri || backendUris[mode];
    this.HTTP = axios.create({ ...this.config, baseURL: uri });
  }
  public async updateSubname(
    subname: string,
    request: UpdateSubnameRequest
  ): Promise<void> {
    return _updateSubname(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      request
    );
  }

  public async addAddressRecord(
    subname: string,
    chain: ChainName,
    value: string
  ): Promise<void> {
    const coin = getCoinType(chain);
    if (coin === undefined) {
      throw Error(`Unsupported address: ${chain}`);
    }
    await _addAddressRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      coin,
      value
    );
  }
  public async deleteAddressRecord(
    subname: string,
    chain: ChainName
  ): Promise<void> {
    const coin = getCoinType(chain);
    if (coin === undefined) {
      throw Error(`Unsupported address: ${chain}`);
    }

    await _deleteAddressRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      coin
    );
  }

  public async getSingleSubname(
    fullSubname: string
  ): Promise<SubnameDTO | null> {
    try {
      return _getSingleSubname(this.HTTP, fullSubname);
    } catch (err) {
      if (err instanceof AxiosError) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response?.status === 404) {
          return null;
        }
      }
      throw err;
    }
  }

  public async getTextRecords(
    fullSubname: string
  ): Promise<Record<string, string>> {
    return await _getTextRecords(this.HTTP, fullSubname);
  }

  public async getTextRecord(
    fullSubname: string,
    key: string
  ): Promise<GetRecordResponse> {
    return await _getTextRecord(this.HTTP, fullSubname, key);
  }

  public async getDataRecords(
    fullSubname: string
  ): Promise<Record<string, string>> {
    return await _getDataRecords(this.HTTP, fullSubname);
  }

  public async getDataRecord(
    fullSubname: string,
    key: string
  ): Promise<GetRecordResponse> {
    return await _getDataRecord(this.HTTP, fullSubname, key);
  }

  public async isSubnameAvailable(
    fullSubname: string
  ): Promise<GetAvailableResponse> {
    return await _isSubnameAvailable(this.HTTP, fullSubname);
  }

  public async createSubname(request: CreateSubnameRequest) {
    await _createSubname(
      this.HTTP,
      this.fetchApiKeyForName(request.parentName, false),
      request
    );
  }

  public async deleteSubname(fullSubname: string) {
    await _deleteSubname(
      this.HTTP,
      this.fetchApiKeyForName(fullSubname),
      fullSubname
    );
  }

  public async addTextRecord(subname: string, key: string, value: string) {
    await _addTextRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      key,
      value
    );
  }

  public async deleteTextRecord(fullSubname: string, key: string) {
    await _deleteTextRecord(
      this.HTTP,
      this.fetchApiKeyForName(fullSubname),
      fullSubname,
      key
    );
  }

  public async addDataRecord(subname: string, key: string, value: string) {
    await _addDataRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      key,
      value
    );
  }

  public async deleteDataRecord(fullSubname: string, key: string) {
    await _deleteDataRecord(
      this.HTTP,
      this.fetchApiKeyForName(fullSubname),
      fullSubname,
      key
    );
  }

  public async getFilteredSubnames(
    query: QuerySubnamesRequest
  ): Promise<PagedResponse<SubnameDTO[]>> {
    return _getFilteredSubnames(this.HTTP, query);
  }

  public setApiKey(ensName: string, apiKey: string) {
    this.apiKeys[ensName] = apiKey;
  }

  public setDefaultApiKey(apiKey: string) {
    this.defaultApiKey = apiKey;
  }

  private fetchApiKeyForName = (name: string, isSubname: boolean = true) => {
    const extractParent = () => {
      const split = name.split(".");
      const splitLen = split.length;

      if (splitLen < 2) {
        throw Error(`Invalid ENS name: ${name}`);
      }

      if (splitLen === 2) {
        return name;
      }

      return split[splitLen - 2] + "." + split[splitLen - 1];
    };

    let parentName = isSubname ? extractParent() : name;
    if (this.apiKeys[parentName]) {
      return this.apiKeys[parentName];
    }
    if (this.defaultApiKey) {
      return this.defaultApiKey;
    }
    throw new Error(`Api key is not present for name: ${parentName}. Use setApiKey() or setDefaultApiKey() to configure authentication.`);
  };
}

/**
 * Create a new OffchainClient instance for managing ENS subnames.
 * 
 * @param config - Configuration options including network mode and HTTP settings
 * @returns A configured OffchainClient instance
 * 
 * @example
 * ```typescript
 * import { createOffchainClient } from '@namespacesdk/offchain-manager';
 * 
 * // Create client for testnet
 * const client = createOffchainClient({ mode: 'sepolia' });
 * 
 * // Set API key (get from https://dev.namespace.ninja)
 * client.setDefaultApiKey('your-api-key'); // Works with any ENS domain
 * 
 * // Now you can use the client with any ENS-compatible domain
 * const availability1 = await client.isSubnameAvailable('alice.example.eth');
 * const availability2 = await client.isSubnameAvailable('app.mysite.com');
 * const availability3 = await client.isSubnameAvailable('user.gallery.art');
 * ```
 */
export const createOffchainClient = (
  config: OffchainClientConfig
): OffchainClient => {
  return new HttpOffchainClient(config);
};
