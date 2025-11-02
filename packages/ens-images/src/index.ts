/**
 * @fileoverview Namespace SDK - ENS Images
 * 
 * A TypeScript SDK for managing ENS avatar and header images with SIWE authentication.
 * This library provides a simple interface for uploading, updating, and deleting
 * avatar and header images for ENS subnames.
 * 
 * Supports both automatic and manual authentication flows:
 * - Automatic: Pass your existing Viem WalletClient, Ethers Wallet/Signer, or WalletProvider directly
 * - Manual: Developers handle signing themselves
 * 
 * @example
 * ```typescript
 * import { createAvatarClient } from '@thenamespace/ens-images';
 * import { createWalletClient } from 'viem'; // or import from 'ethers'
 * 
 * // Initialize with your existing wallet client (Viem, Ethers, or WalletProvider)
 * // No need to create adapters - just pass your wallet directly!
 * const client = createAvatarClient({
 *   network: 'mainnet',
 *   domain: 'example.com',
 *   provider: walletClient  // Pass viem/ethers wallet directly
 * });
 * 
 * // Simple upload - SDK handles everything
 * const result = await client.uploadAvatar({
 *   subname: 'myavatar.offchainsub.eth',
 *   file: avatarFile,
 *   onProgress: (progress) => console.log(`Upload: ${progress}%`)
 * });
 * ```
 * 
 * @author Namespace Team
 * @version 1.0.0
 * @license MIT
 */

// Core client exports
export {
  createAvatarClient,
  AvatarClient,
} from './core/client';

// Type exports
export type {
  AvatarSDKConfig,
  WalletProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  DeleteResult,
  SIWEMessageOptions,
  SIWEMessageResult,
  UploadWithSignatureOptions,
  DeleteWithSignatureOptions,
  NonceRequest,
  NonceResponse
} from './core/types';

// Error exports
export {
  AvatarSDKError,
  ErrorCodes,
  createError
} from './core/errors';

// Utility exports
export {
  validateFile,
  validateSubname,
  validateAddress,
  validateSIWEOptionsResolved,
  AVATAR_MAX_SIZE,
  HEADER_MAX_SIZE,
  ALLOWED_FORMATS
} from './utils/validation';

// Wallet adapter exports (for advanced use cases)
export {
  adaptWallet
} from './utils/wallet-adapters';

// SIWE exports
export {
  generateSIWEMessage,
  createAvatarNonceRequest,
  createHeaderNonceRequest,
  createCombinedNonceRequest,
  isNonceExpired,
  getDefaultChainId,
} from './auth/siwe';

