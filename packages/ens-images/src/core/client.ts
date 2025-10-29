import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AvatarSDKConfig,
  WalletProvider,
  UploadOptions,
  UploadResult,
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
import { createError, ErrorCodes } from './errors';
import { validateFile, validateSubname, validateAddress } from '../utils/validation';
import {
  generateSIWEMessage,
  createAvatarNonceRequest,
  createHeaderNonceRequest,
  isNonceExpired,
  getDefaultChainId,
} from '../auth/siwe';

/**
 * Main Avatar SDK client interface
 */
export interface AvatarClient {
  /**
   * Upload avatar image (simplified - uses provider if available)
   */
  uploadAvatar(options: UploadOptions): Promise<UploadResult>;
  
  /**
   * Upload header image (simplified - uses provider if available)
   */
  uploadHeader(options: UploadOptions): Promise<UploadResult>;
  
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
  uploadAvatarWithSignature(options: UploadWithSignatureOptions): Promise<UploadResult>;
  
  /**
   * Upload header with pre-signed message
   */
  uploadHeaderWithSignature(options: UploadWithSignatureOptions): Promise<UploadResult>;
  
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
    this.config = {
      apiUrl,
      network: config.network || 'mainnet',
      domain: config.domain,
      provider: config.provider
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
          
          if (status === 401) {
            throw createError.invalidSignature();
          } else if (status === 403) {
            throw createError.notSubnameOwner('unknown');
          } else if (status === 400) {
            throw createError.apiError(status, data?.message || 'Bad Request');
          } else {
            throw createError.apiError(status, data?.message || 'API Error');
          }
        } else if (error.request) {
          // Request was made but no response received
          throw createError.networkError(error);
        } else {
          // Something else happened
          throw createError.networkError(error);
        }
      }
    );
  }

  async uploadAvatar(options: UploadOptions): Promise<UploadResult> {
    if (!this.config.provider) {
      throw createError.missingProvider();
    }

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

  async uploadHeader(options: UploadOptions): Promise<UploadResult> {
    if (!this.config.provider) {
      throw createError.missingProvider();
    }

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
      chainId: options.chainId // Can be undefined - will default to 1
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
      chainId: options.chainId // Can be undefined - will default to 1
    };

    const message = generateSIWEMessage(resolvedOptions, nonceResponse.nonce);

    return {
      message,
      nonce: nonceResponse.nonce,
      expiresAt: nonceResponse.expiresAt
    };
  }

  async uploadAvatarWithSignature(options: UploadWithSignatureOptions): Promise<UploadResult> {
    validateSubname(options.subname);
    validateFile(options.file, 'avatar');
    validateAddress(options.address);

    return this.upload(options.subname, options.file, 'avatar', {
      message: options.message,
      signature: options.signature,
      address: options.address
    }, options.onProgress);
  }

  async uploadHeaderWithSignature(options: UploadWithSignatureOptions): Promise<UploadResult> {
    validateSubname(options.subname);
    validateFile(options.file, 'header');
    validateAddress(options.address);

    return this.upload(options.subname, options.file, 'header', {
      message: options.message,
      signature: options.signature,
      address: options.address
    }, options.onProgress);
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
      if (error instanceof AxiosError) {
        throw createError.apiError(error.response?.status || 500, error.message);
      }
      throw createError.networkError(error as Error);
    }
  }

  private async upload(
    subname: string,
    file: File | Buffer,
    type: 'avatar' | 'header',
    siweData: { message: string; signature: string; address: string },
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
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
        `/profile/${this.config.network}/${subname}/${type}`,
        formData,
        onProgress
      );
      return response.data;
    } catch (error) {
      throw createError.uploadFailed(error as Error);
    }
  }

  private async delete(
    subname: string,
    type: 'avatar' | 'header',
    siweData: { message: string; signature: string; address: string }
  ): Promise<DeleteResult> {
    try {
      const response = await this.http.delete(
        `/profile/${this.config.network}/${subname}/${type}`,
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
      throw createError.deleteFailed(error as Error);
    }
  }

  private async uploadWithProgress(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const fullUrl = `${this.config.apiUrl}${url}`;
    console.log(`   🔗 Upload URL: ${fullUrl}`);
    console.log(`   📤 FormData prepared for upload`);

    try {
      // Use axios for better Node.js compatibility
      const response = await this.http.post(fullUrl, formData, {
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

      console.log(`   📡 Response status: ${response.status}`);
      console.log(`   📡 Response data:`, response.data);
      return { data: response.data };
    } catch (error: any) {
      console.log(`   ❌ Upload error:`, error.message);
      if (error.response) {
        console.log(`   📡 Error response status: ${error.response.status}`);
        console.log(`   📡 Error response data:`, error.response.data);
      }
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
