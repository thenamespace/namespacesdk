import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AvatarSDKConfig,
  WalletProvider,
  UploadOptions,
  UploadResult,
  AvatarUploadResult,
  HeaderUploadResult,
  DeleteOptions,
  DeleteResult,
  SIWEMessageOptions,
  SIWEOptionsResolved,
  SIWEMessageResult,
  UploadWithSignatureOptions,
  DeleteWithSignatureOptions,
  NonceRequest,
  NonceResponse
} from './types';
import { AvatarSDKError, createError } from './errors';
import { validateFile, validateSubname, validateAddress, normalizeSubname } from '../utils/validation';
import {
  generateSIWEMessage,
  createAvatarNonceRequest,
  createHeaderNonceRequest,
  isNonceExpired,
  getDefaultChainId,
} from '../auth/siwe';
import { adaptWallet } from '../utils/wallet-adapters';

/**
 * Axios errors may retain request configs and multipart bodies containing SIWE
 * signatures. Keep only the human-readable message when exposing a cause.
 */
function safeError(error: unknown): Error | undefined {
  return error instanceof Error ? new Error(error.message) : undefined;
}

/**
 * Main Avatar SDK client interface
 */
export interface AvatarClient {
  /**
   * Upload avatar image (simplified - uses provider if available)
   */
  uploadAvatar(options: UploadOptions): Promise<AvatarUploadResult>;
  
  /**
   * Upload header image (simplified - uses provider if available)
   */
  uploadHeader(options: UploadOptions): Promise<HeaderUploadResult>;
  
  /**
   * Delete avatar image (simplified - uses provider if available)
   */
  deleteAvatar(options: DeleteOptions): Promise<DeleteResult>;
  
  /**
   * Delete header image (simplified - uses provider if available)
   */
  deleteHeader(options: DeleteOptions): Promise<DeleteResult>;
  
  // Manual flow methods
  /**
   * Get SIWE message for avatar operations
   */
  getSIWEMessageForAvatar(options: SIWEMessageOptions): Promise<SIWEMessageResult>;
  
  /**
   * Get SIWE message for header operations
   */
  getSIWEMessageForHeader(options: SIWEMessageOptions): Promise<SIWEMessageResult>;
  
  /**
   * Upload avatar with pre-signed message
   */
  uploadAvatarWithSignature(options: UploadWithSignatureOptions): Promise<AvatarUploadResult>;
  
  /**
   * Upload header with pre-signed message
   */
  uploadHeaderWithSignature(options: UploadWithSignatureOptions): Promise<HeaderUploadResult>;
  
  /**
   * Delete avatar with pre-signed message
   */
  deleteAvatarWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult>;
  
  /**
   * Delete header with pre-signed message
   */
  deleteHeaderWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult>;
}

/**
 * Default API endpoints
 */
const DEFAULT_API_URLS = {
  mainnet: 'https://metadata.namespace.ninja',
  sepolia: 'https://metadata.namespace.ninja'
};

/**
 * HTTP-based implementation of the AvatarClient
 */
class HttpAvatarClient implements AvatarClient {
  private readonly http: AxiosInstance;
  private readonly config: {
    apiUrl: string;
    network: 'mainnet' | 'sepolia';
    domain: string;
    provider?: WalletProvider;
  };

  constructor(config: AvatarSDKConfig) {
    // Set defaults
    const apiUrl = config.apiUrl || DEFAULT_API_URLS[config.network || 'mainnet'];
    
    // Adapt the provider if provided
    let adaptedProvider: WalletProvider | undefined;
    if (config.provider) {
      try {
        adaptedProvider = adaptWallet(config.provider);
      } catch (error) {
        throw createError.invalidConfiguration(
          error instanceof Error ? error.message : 'Invalid wallet provider'
        );
      }
    }
    
    this.config = {
      apiUrl,
      network: config.network || 'mainnet',
      domain: config.domain,
      provider: adaptedProvider
    };

    this.http = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add response interceptor for better error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data as any;
          const serviceError = data?.error;
          const message =
            serviceError?.message ||
            serviceError?.details?.message ||
            data?.message ||
            error.message ||
            'API Error';
          throw createError.apiError(
            status,
            message,
            serviceError?.details?.code || serviceError?.code || data?.code,
            serviceError?.details || data?.details
          );
        } else if (error.request) {
          // Request was made but no response received
          throw createError.networkError(safeError(error));
        } else {
          // Something else happened
          throw createError.networkError(safeError(error));
        }
      }
    );
  }

  async uploadAvatar(options: UploadOptions): Promise<AvatarUploadResult> {
    if (!this.config.provider) {
      throw createError.missingProvider();
    }

    await this.ensureProviderNetwork();
    const address = await this.config.provider.getAddress();
    // Use initialized config domain
    const siweResult = await this.getSIWEMessageForAvatar({ 
      address,
      domain: this.config.domain
    });
    const signature = await this.config.provider.signMessage(siweResult.message);

    return this.uploadAvatarWithSignature({
      ...options,
      message: siweResult.message,
      signature,
      address
    });
  }

  async uploadHeader(options: UploadOptions): Promise<HeaderUploadResult> {
    if (!this.config.provider) {
      throw createError.missingProvider();
    }

    await this.ensureProviderNetwork();
    const address = await this.config.provider.getAddress();
    // Use initialized config domain
    const siweResult = await this.getSIWEMessageForHeader({ 
      address,
      domain: this.config.domain
    });
    const signature = await this.config.provider.signMessage(siweResult.message);

    return this.uploadHeaderWithSignature({
      ...options,
      message: siweResult.message,
      signature,
      address
    });
  }

  async deleteAvatar(options: DeleteOptions): Promise<DeleteResult> {
    if (!this.config.provider) {
      throw createError.missingProvider();
    }

    await this.ensureProviderNetwork();
    const address = await this.config.provider.getAddress();
    // Use initialized config domain
    const siweResult = await this.getSIWEMessageForAvatar({ 
      address,
      domain: this.config.domain
    });
    const signature = await this.config.provider.signMessage(siweResult.message);

    return this.deleteAvatarWithSignature({
      ...options,
      message: siweResult.message,
      signature,
      address
    });
  }

  async deleteHeader(options: DeleteOptions): Promise<DeleteResult> {
    if (!this.config.provider) {
      throw createError.missingProvider();
    }

    await this.ensureProviderNetwork();
    const address = await this.config.provider.getAddress();
    // Use initialized config domain
    const siweResult = await this.getSIWEMessageForHeader({ 
      address,
      domain: this.config.domain
    });
    const signature = await this.config.provider.signMessage(siweResult.message);

    return this.deleteHeaderWithSignature({
      ...options,
      message: siweResult.message,
      signature,
      address
    });
  }

  async getSIWEMessageForAvatar(options: SIWEMessageOptions): Promise<SIWEMessageResult> {
    const nonceRequest = createAvatarNonceRequest(options.address);
    const nonceResponse = await this.getNonce(nonceRequest);
    
    if (isNonceExpired(nonceResponse.expiresAt)) {
      throw createError.expiredNonce();
    }

    // Resolve domain from options or config
    const domain = options.domain || this.config.domain;
    if (!domain) {
      throw createError.invalidConfiguration('Domain is required. Provide it during initialization or in the method call.');
    }

    // Build resolved options with all required fields
    const resolvedOptions: SIWEOptionsResolved = {
      address: options.address,
      domain: domain,
      uri: options.uri, // Can be undefined - will be auto-generated as https://domain
      chainId: options.chainId ?? getDefaultChainId(this.config.network)
    };

    const message = generateSIWEMessage(resolvedOptions, nonceResponse.nonce);

    return {
      message,
      nonce: nonceResponse.nonce,
      expiresAt: nonceResponse.expiresAt
    };
  }

  async getSIWEMessageForHeader(options: SIWEMessageOptions): Promise<SIWEMessageResult> {
    const nonceRequest = createHeaderNonceRequest(options.address);
    const nonceResponse = await this.getNonce(nonceRequest);
    
    if (isNonceExpired(nonceResponse.expiresAt)) {
      throw createError.expiredNonce();
    }

    // Resolve domain from options or config
    const domain = options.domain || this.config.domain;
    if (!domain) {
      throw createError.invalidConfiguration('Domain is required. Provide it during initialization or in the method call.');
    }

    // Build resolved options with all required fields
    const resolvedOptions: SIWEOptionsResolved = {
      address: options.address,
      domain: domain,
      uri: options.uri, // Can be undefined - will be auto-generated as https://domain
      chainId: options.chainId ?? getDefaultChainId(this.config.network)
    };

    const message = generateSIWEMessage(resolvedOptions, nonceResponse.nonce);

    return {
      message,
      nonce: nonceResponse.nonce,
      expiresAt: nonceResponse.expiresAt
    };
  }

  async uploadAvatarWithSignature(options: UploadWithSignatureOptions): Promise<AvatarUploadResult> {
    validateSubname(options.subname);
    validateFile(options.file, 'avatar');
    validateAddress(options.address);

    return this.upload(options.subname, options.file, 'avatar', {
      message: options.message,
      signature: options.signature,
      address: options.address
    }, options.onProgress) as Promise<AvatarUploadResult>;
  }

  async uploadHeaderWithSignature(options: UploadWithSignatureOptions): Promise<HeaderUploadResult> {
    validateSubname(options.subname);
    validateFile(options.file, 'header');
    validateAddress(options.address);

    return this.upload(options.subname, options.file, 'header', {
      message: options.message,
      signature: options.signature,
      address: options.address
    }, options.onProgress) as Promise<HeaderUploadResult>;
  }

  async deleteAvatarWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult> {
    validateSubname(options.subname);
    validateAddress(options.address);

    return this.delete(options.subname, 'avatar', {
      message: options.message,
      signature: options.signature,
      address: options.address
    });
  }

  async deleteHeaderWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult> {
    validateSubname(options.subname);
    validateAddress(options.address);

    return this.delete(options.subname, 'header', {
      message: options.message,
      signature: options.signature,
      address: options.address
    });
  }

  private async getNonce(request: NonceRequest): Promise<NonceResponse> {
    try {
      const response = await this.http.post<NonceResponse>('/auth/nonce', request);
      return response.data;
    } catch (error) {
      if (error instanceof AvatarSDKError) {
        throw error;
      }
      if (error instanceof AxiosError) {
        throw createError.apiError(error.response?.status || 500, error.message);
      }
      throw createError.networkError(safeError(error));
    }
  }

  private async upload(
    subname: string,
    file: File | Buffer,
    type: 'avatar' | 'header',
    siweData: { message: string; signature: string; address: string },
    onProgress?: (progress: number) => void
  ): Promise<AvatarUploadResult | HeaderUploadResult> {
    const formData = new FormData();
    
    // Handle both File and Buffer
    if (file instanceof File) {
      formData.append(type, file);
    } else {
      // Convert Buffer to Blob
      const uint8Array = new Uint8Array(file);
      const blob = new Blob([uint8Array], { type: 'image/jpeg' });
      formData.append(type, blob, 'image.jpg');
    }
    
    formData.append('siweMessage', siweData.message);
    formData.append('siweSignature', siweData.signature);
    formData.append('address', siweData.address);

    try {
      const response = await this.uploadWithProgress(
        this.getMutationPath(subname, type),
        formData,
        onProgress
      );
      return this.normalizeUploadResult(response.data, type);
    } catch (error) {
      if (error instanceof AvatarSDKError) {
        throw error;
      }
      throw createError.uploadFailed(safeError(error));
    }
  }

  private async delete(
    subname: string,
    type: 'avatar' | 'header',
    siweData: { message: string; signature: string; address: string }
  ): Promise<DeleteResult> {
    try {
      const response = await this.http.delete(
        this.getMutationPath(subname, type),
        {
          data: {
            siweMessage: siweData.message,
            siweSignature: siweData.signature,
            address: siweData.address,
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AvatarSDKError) {
        throw error;
      }
      throw createError.deleteFailed(safeError(error));
    }
  }

  /**
   * Header media mutations use `/header`. The compact `/h` path is reserved
   * for the stable public header URL returned by the Metadata Service. The
   * multipart field, SIWE nonce scope, and verification action remain
   * `header`.
   */
  private getMutationPath(subname: string, type: 'avatar' | 'header'): string {
    const mediaPath = type === 'header' ? 'header' : 'avatar';
    const normalizedSubname = normalizeSubname(subname);
    return `/profile/${this.config.network}/${encodeURIComponent(normalizedSubname)}/${mediaPath}`;
  }

  /**
   * Metadata Service responses use media-specific URL keys. Keep the SDK's
   * historical `url` field while exposing the service response fields too.
   */
  private normalizeUploadResult(
    result: UploadResult,
    type: 'avatar' | 'header'
  ): AvatarUploadResult | HeaderUploadResult {
    const mediaUrl = type === 'header' ? result.headerUrl : result.avatarUrl;
    const url = mediaUrl || result.url;
    if (!url) {
      throw createError.apiError(
        502,
        `Metadata Service response did not include ${type === 'header' ? 'headerUrl' : 'avatarUrl'}`
      );
    }
    try {
      if (!/^https?:\/\//i.test(url)) {
        throw new Error('Unsupported URL protocol');
      }
      new URL(url);
    } catch {
      throw createError.apiError(
        502,
        `Metadata Service returned an invalid ${type === 'header' ? 'headerUrl' : 'avatarUrl'}`
      );
    }

    return type === 'header'
      ? { ...result, url, headerUrl: url }
      : { ...result, url, avatarUrl: url };
  }

  private async ensureProviderNetwork(): Promise<void> {
    const provider = this.config.provider;
    if (!provider) {
      throw createError.missingProvider();
    }

    const expectedChainId = getDefaultChainId(this.config.network);
    let actualChainId = await provider.getChainId();
    if (actualChainId === expectedChainId) {
      return;
    }

    if (provider.switchChain) {
      try {
        await provider.switchChain(expectedChainId);
      } catch {
        throw createError.providerChainMismatch(expectedChainId, actualChainId);
      }
      actualChainId = await provider.getChainId();
      if (actualChainId === expectedChainId) {
        return;
      }
    }

    throw createError.providerChainMismatch(expectedChainId, actualChainId);
  }

  private async uploadWithProgress(
    path: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    try {
      // The Axios instance owns the API origin through baseURL. Keep the
      // mutation path relative so upload and delete share the same routing.
      const response = await this.http.post(path, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        }
      });

      return { data: response.data };
    } catch (error: any) {
      throw error;
    }
  }
}

/**
 * Create a new AvatarClient instance
 */
export function createAvatarClient(config: AvatarSDKConfig): AvatarClient {
  return new HttpAvatarClient(config);
}
