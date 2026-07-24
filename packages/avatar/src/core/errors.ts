/**
 * Custom error class for Avatar SDK errors
 */
export class AvatarSDKError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;
  public readonly status?: number;
  public readonly serviceCode?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    originalError?: Error,
    metadata?: { status?: number; serviceCode?: string; details?: unknown }
  ) {
    super(message);
    this.name = 'AvatarSDKError';
    this.code = code;
    this.originalError = originalError;
    this.status = metadata?.status;
    this.serviceCode = metadata?.serviceCode;
    this.details = metadata?.details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AvatarSDKError);
    }
  }
}

/**
 * Error codes for different types of errors
 */
export const ErrorCodes = {
  // File validation errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Authentication errors
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED_NONCE: 'EXPIRED_NONCE',
  INVALID_NONCE: 'INVALID_NONCE',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  
  // ENS errors
  NOT_SUBNAME_OWNER: 'NOT_SUBNAME_OWNER',
  INVALID_SUBNAME: 'INVALID_SUBNAME',
  SUBNAME_NOT_FOUND: 'SUBNAME_NOT_FOUND',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  API_ERROR: 'API_ERROR',
  
  // Provider errors
  PROVIDER_NOT_CONNECTED: 'PROVIDER_NOT_CONNECTED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  PROVIDER_CHAIN_MISMATCH: 'PROVIDER_CHAIN_MISMATCH',
  
  // Configuration errors
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_PROVIDER: 'MISSING_PROVIDER',
  
  // Upload errors
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Helper function to create specific error types
 */
export const createError = {
  fileTooLarge: (type: 'avatar' | 'header', maxSize: number) => 
    new AvatarSDKError(
      `File too large. Max size for ${type}: ${maxSize / (1024 * 1024)}MB`,
      ErrorCodes.FILE_TOO_LARGE
    ),
    
  invalidFileFormat: (allowedFormats: string[]) =>
    new AvatarSDKError(
      `Invalid file format. Allowed: ${allowedFormats.join(', ')}`,
      ErrorCodes.INVALID_FILE_FORMAT
    ),
    
  invalidSignature: (originalError?: Error) =>
    new AvatarSDKError(
      'Invalid signature provided',
      ErrorCodes.INVALID_SIGNATURE,
      originalError
    ),
    
  expiredNonce: () =>
    new AvatarSDKError(
      'Nonce has expired. Please request a new one.',
      ErrorCodes.EXPIRED_NONCE
    ),
  
  invalidConfiguration: (message: string) =>
    new AvatarSDKError(
      message,
      ErrorCodes.INVALID_CONFIG
    ),
    
  notSubnameOwner: (subname: string) =>
    new AvatarSDKError(
      `You do not own the ENS subname: ${subname}`,
      ErrorCodes.NOT_SUBNAME_OWNER
    ),
    
  invalidSubname: (subname: string) =>
    new AvatarSDKError(
      `Invalid ENS subname format: ${subname}`,
      ErrorCodes.INVALID_SUBNAME
    ),
    
  networkError: (originalError?: Error) =>
    new AvatarSDKError(
      'Network error occurred. Please check your connection.',
      ErrorCodes.NETWORK_ERROR,
      originalError
    ),
    
  apiError: (
    status: number,
    message: string,
    serviceCode?: string,
    details?: unknown,
    originalError?: Error
  ) =>
    new AvatarSDKError(
      `API Error ${status}: ${message}`,
      ErrorCodes.API_ERROR,
      originalError,
      { status, serviceCode, details }
    ),
    
  providerNotConnected: () =>
    new AvatarSDKError(
      'Wallet provider is not connected',
      ErrorCodes.PROVIDER_NOT_CONNECTED
    ),
    
  missingProvider: () =>
    new AvatarSDKError(
      'Wallet provider is required for this operation',
      ErrorCodes.MISSING_PROVIDER
    ),

  providerChainMismatch: (expectedChainId: number, actualChainId: number) =>
    new AvatarSDKError(
      `Wallet is connected to chain ${actualChainId}, but the configured SDK network requires chain ${expectedChainId}. Switch the wallet network and try again.`,
      ErrorCodes.PROVIDER_CHAIN_MISMATCH,
      undefined,
      { details: { expectedChainId, actualChainId } }
    ),
    
  uploadFailed: (originalError?: Error) =>
    new AvatarSDKError(
      'Upload failed. Please try again.',
      ErrorCodes.UPLOAD_FAILED,
      originalError
    ),
    
  deleteFailed: (originalError?: Error) =>
    new AvatarSDKError(
      'Delete failed. Please try again.',
      ErrorCodes.DELETE_FAILED,
      originalError
    ),
};
