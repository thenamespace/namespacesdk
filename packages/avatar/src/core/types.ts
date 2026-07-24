/**
 * Configuration for the Avatar SDK
 */
export interface AvatarSDKConfig {
  /** API URL for the avatar service endpoint (defaults to production) */
  apiUrl?: string;
  /** Network to use (defaults to mainnet) */
  network?: 'mainnet' | 'sepolia';
  /** Domain of the website integrating this SDK (required for SIWE authentication) */
  domain: string;
  /** Optional provider for automatic signing - can be a WalletProvider, Viem WalletClient, or Ethers Wallet/Signer */
  provider?: WalletProvider | any;
}

/**
 * Wallet provider interface for automatic signing
 * You can also pass Viem's WalletClient or Ethers' Wallet/Signer directly
 */
export interface WalletProvider {
  /** Get the connected address */
  getAddress(): Promise<string>;
  /** Sign a message */
  signMessage(message: string): Promise<string>;
  /** Get the current chain ID */
  getChainId(): Promise<number>;
  /** Switch the connected wallet to a chain, when supported */
  switchChain?(chainId: number): Promise<void>;
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
  /** URL of the uploaded image (stable SDK alias) */
  url: string;
  /** Avatar URL returned by the Metadata Service for avatar uploads */
  avatarUrl?: string;
  /** Compact header URL returned by the Metadata Service for header uploads */
  headerUrl?: string;
  /** ENS subname returned by the Metadata Service */
  subname?: string;
  /** Network returned by the Metadata Service */
  network?: 'mainnet' | 'sepolia';
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

/** Avatar upload response with the canonical public avatar URL */
export interface AvatarUploadResult extends UploadResult {
  avatarUrl: string;
}

/** Header upload response with the canonical public header URL */
export interface HeaderUploadResult extends UploadResult {
  headerUrl: string;
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
 * Manual SIWE message generation options (external API)
 */
export interface SIWEMessageOptions {
  /** User's wallet address */
  address: string;
  /** Domain for SIWE (optional if provided during initialization) */
  domain?: string;
  /** Custom URI for SIWE (optional, will default to https://domain) */
  uri?: string;
  /** Custom chain ID (optional) */
  chainId?: number;
}

/**
 * Internal SIWE options with all required fields resolved
 * Used internally after resolving domain from config
 */
export interface SIWEOptionsResolved {
  /** User's wallet address */
  address: string;
  /** Domain for SIWE (required) */
  domain: string;
  /** Custom URI for SIWE (optional, will be auto-generated if not provided) */
  uri?: string;
  /** Chain ID (resolved from the configured network if not provided) */
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
