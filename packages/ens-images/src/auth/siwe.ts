import { SiweMessage } from 'siwe';
import { SIWEMessageOptions, NonceRequest, NonceResponse } from '../core/types';
import { validateSIWEOptions } from '../utils/validation';

/**
 * Generate SIWE message for authentication
 */
export function generateSIWEMessage(
  address: string,
  nonce: string,
  domain: string,
  chainId: number,
  uri?: string
): string {
  const message = new SiweMessage({
    domain,
    address,
    statement: `Sign in to Avatar Service`,
    uri: uri || `https://${domain}`,
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  });

  return message.prepareMessage();
}

/**
 * Generate SIWE message with options
 */
export function generateSIWEMessageWithOptions(
  options: SIWEMessageOptions,
  nonce: string
): string {
  validateSIWEOptions(options);
  
  const domain = options.domain || 'avatars.namespace.ninja';
  const chainId = options.chainId || 1; // Default to mainnet
  
  return generateSIWEMessage(
    options.address,
    nonce,
    domain,
    chainId,
    options.uri
  );
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

/**
 * Get default domain for network
 */
export function getDefaultDomain(network: 'mainnet' | 'sepolia'): string {
  return network === 'mainnet' ? 'avatars.namespace.ninja' : 'avatars-sepolia.namespace.ninja';
}

