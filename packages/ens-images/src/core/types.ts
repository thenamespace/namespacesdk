/**
 * Configuration for the Avatar SDK
 */
export interface AvatarSDKConfig {
  /** API URL for the avatar service (defaults to production) */
  apiUrl?: string;
  /** Network to use (defaults to mainnet) */
  network?: 'mainnet' | 'sepolia';
  /** Website URL for SIWE domain (defaults to apiUrl hostname) */
  websiteUrl?: string;
  /** Optional provider for automatic signing */
  provider?: WalletProvider;
}

/**
 * Wallet provider interface for automatic signing
 */
export interface WalletProvider {
  /** Get the connected address */
  getAddress(): Promise<string>;
  /** Sign a message */
  signMessage(message: string): Promise<string>;
  /** Get the current chain ID */
  getChainId(): Promise<number>;
}

/**
 * Upload options for avatar/header
 */
export interface UploadOptions {
  /** ENS subname to upload for */
  subname: string;
  /** File to upload */
  file: File | Buffer;
  /** Upload progress callback */
  onProgress?: (progress: number) => void;
}

/**
 * Upload result
 */
export interface UploadResult {
  /** URL of the uploaded image */
  url: string;
  /** Upload timestamp */
  uploadedAt: string;
  /** File size in bytes */
  fileSize: number;
  /** Whether this was an update to existing image */
  isUpdate: boolean;
  /** Whether the upload is pending (for unregistered names) */
  pending?: boolean;
  /** Optional message from the server */
  message?: string;
}

/**
 * Delete options
 */
export interface DeleteOptions {
  /** ENS subname to delete from */
  subname: string;
}

/**
 * Delete result
 */
export interface DeleteResult {
  /** Success message */
  message: string;
  /** Deletion timestamp */
  deletedAt: string;
}

/**
 * Manual SIWE message generation options
 */
export interface SIWEMessageOptions {
  /** User's wallet address */
  address: string;
  /** Custom domain for SIWE (optional) */
  domain?: string;
  /** Custom URI for SIWE (optional) */
  uri?: string;
  /** Custom chain ID (optional) */
  chainId?: number;
}

/**
 * SIWE message result
 */
export interface SIWEMessageResult {
  /** The SIWE message to sign */
  message: string;
  /** Nonce used in the message */
  nonce: string;
  /** Expiration timestamp */
  expiresAt: number;
}

/**
 * Upload with signature options
 */
export interface UploadWithSignatureOptions extends UploadOptions {
  /** SIWE message */
  message: string;
  /** Signature of the message */
  signature: string;
  /** Address that signed the message */
  address: string;
}

/**
 * Delete with signature options
 */
export interface DeleteWithSignatureOptions extends DeleteOptions {
  /** SIWE message */
  message: string;
  /** Signature of the message */
  signature: string;
  /** Address that signed the message */
  address: string;
}

/**
 * Nonce request for authentication
 */
export interface NonceRequest {
  /** User's wallet address */
  address: string;
  /** Scope of operations */
  scope: 'avatar' | 'header' | 'avatar+header';
}

/**
 * Nonce response from API
 */
export interface NonceResponse {
  /** Nonce for signing */
  nonce: string;
  /** Expiration timestamp */
  expiresAt: number;
}

