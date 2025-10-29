import { SiweMessage } from 'siwe';
import { SIWEOptionsResolved, NonceRequest, NonceResponse } from '../core/types';
import { validateSIWEOptionsResolved } from '../utils/validation';

/**
 * Generate SIWE message with resolved options
 * @param options - Fully resolved SIWE options with domain guaranteed
 * @param nonce - Nonce from the server
 * @returns Formatted SIWE message string
 * 
 * @internal This function expects all options to be resolved:
 * - domain: must be provided (resolved from config or options)
 * - uri: if not provided, will automatically be set to https://domain
 * - chainId: if not provided, defaults to 1 (mainnet)
 */
export function generateSIWEMessage(
  options: SIWEOptionsResolved,
  nonce: string
): string {
  // Validate all resolved options
  validateSIWEOptionsResolved(options);
  
  // Apply defaults for optional fields
  const uri = options.uri || `https://${options.domain}`;
  const chainId = options.chainId || 1; // Default to mainnet
  
  const message = new SiweMessage({
    domain: options.domain,
    address: options.address,
    statement: `Sign in to Avatar Service`,
    uri: uri,
    version: '1',
    chainId: chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  });

  return message.prepareMessage();
}

/**
 * Create nonce request for avatar operations
 */
export function createAvatarNonceRequest(address: string): NonceRequest {
  return {
    address,
    scope: 'avatar'
  };
}

/**
 * Create nonce request for header operations
 */
export function createHeaderNonceRequest(address: string): NonceRequest {
  return {
    address,
    scope: 'header'
  };
}

/**
 * Create nonce request for both avatar and header operations
 */
export function createCombinedNonceRequest(address: string): NonceRequest {
  return {
    address,
    scope: 'avatar+header'
  };
}

/**
 * Check if nonce is expired
 */
export function isNonceExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Get default chain ID for network
 */
export function getDefaultChainId(network: 'mainnet' | 'sepolia'): number {
  return network === 'mainnet' ? 1 : 11155111;
}

