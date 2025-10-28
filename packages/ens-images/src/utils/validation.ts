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
  'image/webp'
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
 * Validate ENS subname format
 */
export function validateSubname(subname: string): void {
  if (!subname || typeof subname !== 'string') {
    throw createError.invalidSubname(subname);
  }
  
  // Basic ENS subname validation
  const subnameRegex = /^[a-z0-9-]+\.([a-z0-9-]+\.)*[a-z0-9-]+$/;
  if (!subnameRegex.test(subname)) {
    throw createError.invalidSubname(subname);
  }
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
 * Validate SIWE message options
 */
export function validateSIWEOptions(options: { address: string; domain?: string; uri?: string; chainId?: number }): void {
  validateAddress(options.address);
  
  if (options.domain && typeof options.domain !== 'string') {
    throw new Error('Invalid domain: must be a string');
  }
  
  if (options.uri && typeof options.uri !== 'string') {
    throw new Error('Invalid URI: must be a string');
  }
  
  if (options.chainId && (typeof options.chainId !== 'number' || options.chainId <= 0)) {
    throw new Error('Invalid chain ID: must be a positive number');
  }
}

