import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import {
  L2RegistryResponse,
  L2SubnameRequest,
  L2SubnameResponse,
  L2SubnamesRequest,
  L2SubnamesResponse,
} from "../dto";

/**
 * Interface for the Namespace Indexer client
 * Provides methods to query L2 subnames and registry data
 */
export interface IndexerClient {
  /**
   * Get a single L2 subname by chain ID and name/namehash
   * @param request - The request parameters containing chainId and nameOrNamehash
   * @returns Promise resolving to the L2 subname data
   * @throws {AxiosError} When the API request fails
   * @example 
   * ```typescript
   * const subname = await client.getL2Subname({
   *   chainId: 10,
   *   nameOrNamehash: 'lucas.oppunk.eth'
   * });
   * ```
   */
  getL2Subname(request: L2SubnameRequest): Promise<L2SubnameResponse>;
  
  /**
   * Get L2 registry information by chain ID and name/namehash
   * @param request - The request parameters containing chainId and nameOrNamehash
   * @returns Promise resolving to the L2 registry data
   * @throws {AxiosError} When the API request fails
   * @example
   * ```typescript
   * const registry = await client.getL2Registry({
   *   chainId: 10,
   *   nameOrNamehash: 'oppunk.eth'
   * });
   * ```
   */
  getL2Registry(request: L2SubnameRequest): Promise<L2RegistryResponse>;
  
  /**
   * Get multiple L2 subnames with optional filtering and pagination
   * @param request - The request parameters for filtering and pagination
   * @returns Promise resolving to paginated L2 subnames data
   * @throws {AxiosError} When the API request fails
   * @example
   * ```typescript
   * const subnames = await client.getL2Subnames({
   *   chainId: 10,
   *   page: 0,
   *   size: 10
   * });
   */
  getL2Subnames(request: L2SubnamesRequest): Promise<L2SubnamesResponse>;
}

/** Default indexer API endpoint */
const DEFAULT_INDEXER_URI = "https://indexer.namespace.ninja";

/**
 * Configuration interface for the IndexerClient
 * Extends AxiosRequestConfig to allow custom HTTP client configuration
 */
export interface IndexerClientConfig extends AxiosRequestConfig {
  /** Custom indexer API endpoint (defaults to production endpoint) */
  indexerUri?: string;
}

/**
 * HTTP-based implementation of the IndexerClient
 * Uses axios for HTTP requests to the Namespace Indexer API
 */
class HttpIndexerClient implements IndexerClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a new HTTP IndexerClient instance
   * @param config - Configuration options for the client
   */
  constructor(private readonly config: IndexerClientConfig = {}) {
    const uri = config.indexerUri || DEFAULT_INDEXER_URI;
    this.http = axios.create({ 
      ...config, 
      baseURL: uri,
      timeout: config.timeout || 30000, // 30 second default timeout
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      }
    });

    // Add response interceptor for better error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data;
          console.error(`Indexer API Error ${status}:`, data);
        } else if (error.request) {
          // Request was made but no response received
          console.error('Indexer API Network Error:', error.message);
        } else {
          // Something else happened
          console.error('Indexer API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get a single L2 subname by chain ID and name/namehash
   * @param request - The request parameters
   * @returns Promise resolving to the L2 subname data
   */
  public async getL2Subname({
    chainId,
    nameOrNamehash,
  }: L2SubnameRequest): Promise<L2SubnameResponse> {
    try {
      const response = await this.http.get<L2SubnameResponse>(
        `/api/v1/l2-subnames/chainId/${chainId}/namehash/${nameOrNamehash}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getL2Subname', { chainId, nameOrNamehash });
    }
  }

  /**
   * Get L2 registry information by chain ID and name/namehash
   * @param request - The request parameters
   * @returns Promise resolving to the L2 registry data
   */
  public async getL2Registry({
    chainId,
    nameOrNamehash,
  }: L2SubnameRequest): Promise<L2RegistryResponse> {
    try {
      const response = await this.http.get<L2RegistryResponse>(
        `/api/v1/l2-subnames/registry/chainId/${chainId}/namehash/${nameOrNamehash}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getL2Registry', { chainId, nameOrNamehash });
    }
  }

  /**
   * Get multiple L2 subnames with optional filtering and pagination
   * @param request - The request parameters for filtering and pagination
   * @returns Promise resolving to paginated L2 subnames data
   */
  public async getL2Subnames(
    request: L2SubnamesRequest
  ): Promise<L2SubnamesResponse> {
    try {
      const response = await this.http.get<L2SubnamesResponse>(
        `/api/v1/l2-subnames/all`, 
        { params: request }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'getL2Subnames', request);
    }
  }

  /**
   * Handle and enhance errors with context information
   * @param error - The original error
   * @param method - The method name where the error occurred
   * @param params - The parameters that were passed to the method
   * @returns Enhanced error with additional context
   */
  private handleError(error: unknown, method: string, params: unknown): Error {
    if (error instanceof AxiosError) {
      const enhancedError = new Error(
        `Indexer API Error in ${method}: ${error.message}`
      );
      (enhancedError as any).originalError = error;
      (enhancedError as any).method = method;
      (enhancedError as any).params = params;
      return enhancedError;
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Factory function to create a new IndexerClient instance
 * @param config - Optional configuration for the client
 * @returns A new IndexerClient instance
 * 
 * @example
 * ```typescript
 * // Create client with default configuration
 * const client = createIndexerClient();
 * 
 * // Create client with custom configuration
 * const client = createIndexerClient({
 *   indexerUri: 'https://test-indexer.namespace.ninja',
 *   timeout: 10000,
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 * ```
 */
export const createIndexerClient = (
  config?: IndexerClientConfig
): IndexerClient => {
  return new HttpIndexerClient(config);
};