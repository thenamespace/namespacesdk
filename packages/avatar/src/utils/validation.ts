import { ens_normalize } from '@adraffy/ens-normalize';
import { createError, ErrorCodes } from '../core/errors';

/**
 * File size limits
 */
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
export const HEADER_MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Allowed file formats
 */
export const ALLOWED_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

/**
 * Validate file size and format
 */
export function validateFile(file: File | Buffer, type: 'avatar' | 'header'): void {
  const maxSize = type === 'avatar' ? AVATAR_MAX_SIZE : HEADER_MAX_SIZE;
  
  if (file instanceof File) {
    // Check file size
    if (file.size > maxSize) {
      throw createError.fileTooLarge(type, maxSize);
    }
    
    // Check file format
    if (!ALLOWED_FORMATS.includes(file.type)) {
      throw createError.invalidFileFormat(ALLOWED_FORMATS);
    }
  } else if (Buffer.isBuffer(file)) {
    // For Buffer, we can only check size
    if (file.length > maxSize) {
      throw createError.fileTooLarge(type, maxSize);
    }
  } else {
    throw new Error('Invalid file type. Expected File or Buffer.');
  }
}

/**
 * Normalize an ENS subname according to ENSIP-15.
 *
 * The Avatar SDK requires a complete name with at least one parent label. The
 * normalizer handles Unicode composition, case folding, emoji sequences,
 * script mixing, and confusable characters.
 */
export function normalizeSubname(subname: string): string {
  if (!subname || typeof subname !== 'string') {
    throw createError.invalidSubname(subname);
  }

  try {
    const normalizedSubname = ens_normalize(subname);

    if (!normalizedSubname.includes('.')) {
      throw createError.invalidSubname(subname);
    }

    return normalizedSubname;
  } catch {
    throw createError.invalidSubname(subname);
  }
}

/**
 * Validate ENS subname format while preserving the existing public void API.
 */
export function validateSubname(subname: string): void {
  normalizeSubname(subname);
}

/**
 * Validate wallet address format
 */
export function validateAddress(address: string): void {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address: address is required');
  }
  
  // Basic Ethereum address validation
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(address)) {
    throw new Error('Invalid address: must be a valid Ethereum address');
  }
}

/**
 * Validate resolved SIWE options (after domain resolution)
 * At this point, all required fields must be present
 */
export function validateSIWEOptionsResolved(options: { address: string; domain: string; uri?: string; chainId?: number }): void {
  // Validate address
  validateAddress(options.address);
  
  // Domain is required at this stage (after resolution)
  if (!options.domain || typeof options.domain !== 'string' || options.domain.trim() === '') {
    throw new Error('Domain is required and must be a non-empty string');
  }
  
  // URI validation (optional - will be auto-generated if not provided)
  if (options.uri !== undefined) {
    if (typeof options.uri !== 'string' || options.uri.trim() === '') {
      throw new Error('URI must be a non-empty string if provided');
    }
    // Basic URI format validation
    try {
      new URL(options.uri);
    } catch {
      throw new Error('URI must be a valid URL');
    }
  }
  
  // Chain ID validation (optional - will default to 1 if not provided)
  if (options.chainId !== undefined) {
    if (typeof options.chainId !== 'number') {
      throw new Error('Chain ID must be a number');
    }
    if (options.chainId !== 1 && options.chainId !== 11155111) {
      throw new Error('Chain ID must be 1 (mainnet) or 11155111 (sepolia)');
    }
  }
}
