import { ValidationError } from './errors';
import { ChainName } from '../dto';

/**
 * Validates that a string is a properly formatted ENS domain name.
 * ENS supports many TLDs including .eth, .com, .art, .xyz, and others through ENS import.
 * 
 * Validation follows ENS normalization rules:
 * - Names must be lowercase
 * - Variation selectors (U+FE00-U+FE0F) are not allowed
 * - Zero-width characters are not allowed (prevents homoglyph attacks)
 * - Supports emojis, accented characters, and many Unicode characters
 * 
 * @param name - The ENS name to validate (e.g., 'example.eth', 'mysite.com', 'art.gallery.art')
 * @throws {ValidationError} When the name format is invalid
 * 
 * @example
 * ```typescript
 * import { validateEnsName } from '@thenamespace/offchain-manager';
 * 
 * validateEnsName('example.eth'); // ✅ Valid
 * validateEnsName('mysite.com'); // ✅ Valid (ENS supports imported domains)
 * validateEnsName('gallery.art'); // ✅ Valid
 * validateEnsName('sub.example.eth'); // ✅ Valid
 * validateEnsName('🚀.eth'); // ✅ Valid (emojis supported)
 * validateEnsName('café.eth'); // ✅ Valid (accented characters supported)
 * validateEnsName('Example.eth'); // ❌ Throws ValidationError (uppercase not allowed)
 * validateEnsName('invalid..domain'); // ❌ Throws ValidationError
 * ```
 */
export const validateEnsName = (name: string): void => {
    if (!name || typeof name !== 'string') {
        throw new ValidationError('ENS name must be a non-empty string');
    }

    // Check for uppercase characters (ENS normalizes to lowercase)
    if (name !== name.toLowerCase()) {
        throw new ValidationError(`Invalid ENS domain format: ${name}. ENS names must be lowercase.`);
    }

    // Check for variation selectors (U+FE00 to U+FE0F) - these are stripped in ENS normalization
    const variationSelectorRegex = /[\uFE00-\uFE0F]/;
    if (variationSelectorRegex.test(name)) {
        throw new ValidationError(`Invalid ENS domain format: ${name}. Variation selectors are not allowed in ENS names.`);
    }

    // Check for zero-width characters that could be used for homoglyph attacks
    const zeroWidthChars = /[\u200B-\u200D\uFEFF\u2060]/;
    if (zeroWidthChars.test(name)) {
        throw new ValidationError(`Invalid ENS domain format: ${name}. Zero-width characters are not allowed in ENS names.`);
    }

    // Basic domain name validation - ENS supports many characters including emojis
    // Must have at least one dot and proper structure
    // Allow any character except dots, and ensure proper domain structure
    const domainRegex = /^[^.]+\.[^.]+(\.[^.]+)*$/;

    if (!domainRegex.test(name)) {
        throw new ValidationError(`Invalid ENS domain format: ${name}. Must be a valid domain name with at least one TLD (e.g., example.eth, mysite.com, gallery.art).`);
    }

    // Check for invalid patterns
    if (name.includes('..') || name.startsWith('.') || name.endsWith('.')) {
        throw new ValidationError(`Invalid ENS domain format: ${name}. Cannot have consecutive dots or start/end with dots.`);
    }

    // Check length constraints (ENS has some practical limits)
    if (name.length > 253) {
        throw new ValidationError(`ENS domain name too long: ${name}. Maximum length is 253 characters.`);
    }

    // Check individual label lengths (max 63 characters per label)
    const labels = name.split('.');
    for (const label of labels) {
        if (label.length === 0) {
            throw new ValidationError(`Invalid ENS domain format: ${name}. Empty labels are not allowed.`);
        }
        if (label.length > 63) {
            throw new ValidationError(`Invalid ENS domain format: ${name}. Label '${label}' exceeds 63 character limit.`);
        }
    }
};

/**
 * Validates that a string is a properly formatted ENS subname.
 * A subname must have at least one label before the parent domain.
 * Supports all ENS-compatible TLDs (.eth, .com, .art, .xyz, etc.).
 * 
 * @param subname - The subname to validate (e.g., 'alice.example.eth', 'app.mysite.com')
 * @throws {ValidationError} When the subname format is invalid
 * 
 * @example
 * ```typescript
 * import { validateSubname } from '@thenamespace/offchain-manager';
 * 
 * validateSubname('alice.example.eth'); // ✅ Valid
 * validateSubname('app.mysite.com'); // ✅ Valid
 * validateSubname('user.gallery.art'); // ✅ Valid
 * validateSubname('app.subdomain.example.eth'); // ✅ Valid
 * validateSubname('example.eth'); // ❌ Throws ValidationError (not a subname, just 2 parts)
 * validateSubname('.example.eth'); // ❌ Throws ValidationError (empty label)
 * ```
 */
export const validateSubname = (subname: string): void => {
    if (!subname || typeof subname !== 'string') {
        throw new ValidationError('Subname must be a non-empty string');
    }

    // Normalize to lowercase for validation
    const normalizedSubname = subname.toLowerCase();

    // Subname should be in format: label.parent.tld (minimum 3 parts)
    const parts = normalizedSubname.split('.');
    if (parts.length < 3) {
        throw new ValidationError(`Invalid subname format: ${subname}. Expected format: label.parent.tld (e.g., alice.example.eth, app.mysite.com)`);
    }

    const label = parts[0];
    if (!label || label.length === 0) {
        throw new ValidationError('Subname label cannot be empty');
    }

    // Validate the parent domain (everything after the first label)
    const parent = parts.slice(1).join('.');
    validateEnsName(parent);
};

/**
 * Validates that an address is properly formatted for the specified blockchain network.
 * Each blockchain has its own address format and validation rules.
 * 
 * @param address - The wallet address to validate
 * @param chain - The blockchain network this address belongs to
 * @throws {ValidationError} When the address format is invalid for the specified chain
 * 
 * @example
 * ```typescript
 * import { validateAddress, ChainName } from '@thenamespace/offchain-manager';
 * 
 * // Ethereum-style addresses (40 hex characters)
 * validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ChainName.Ethereum); // ✅
 * validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ChainName.Base); // ✅
 * 
 * // Solana addresses (base58 encoded)
 * validateAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', ChainName.Solana); // ✅
 * 
 * // NEAR addresses (.near suffix)
 * validateAddress('alice.near', ChainName.Near); // ✅
 * 
 * // Invalid examples
 * validateAddress('invalid', ChainName.Ethereum); // ❌ Throws ValidationError
 * validateAddress('0x123', ChainName.Ethereum); // ❌ Throws ValidationError (too short)
 * ```
 */
export const validateAddress = (address: string, chain: ChainName): void => {
    if (!address || typeof address !== 'string') {
        throw new ValidationError('Address must be a non-empty string');
    }

    // Basic address validation based on chain
    switch (chain) {
        case ChainName.Ethereum:
        case ChainName.Default:
        case ChainName.Arbitrum:
        case ChainName.Optimism:
        case ChainName.Base:
        case ChainName.Polygon:
        case ChainName.Bsc:
        case ChainName.Avalanche:
        case ChainName.Gnosis:
        case ChainName.Zksync:
        case ChainName.Linea:
        case ChainName.Scroll:
        case ChainName.Unichain:
        case ChainName.Berachain:
        case ChainName.WorldChain:
        case ChainName.Zora:
        case ChainName.Celo:
        case ChainName.Monad:
        case ChainName.Push:
            // Ethereum-style addresses (EVM chains)
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                throw new ValidationError(`Invalid Ethereum-style address: ${address}`);
            }
            break;
        
        case ChainName.Starknet:
            // Starknet addresses are up to 64 hex characters (leading zeros can be omitted)
            if (!/^0x[a-fA-F0-9]{1,64}$/.test(address)) {
                throw new ValidationError(`Invalid Starknet address: ${address}`);
            }
            break;
        
        case ChainName.Solana:
            // Solana addresses are base58 encoded, typically 32-44 characters
            if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
                throw new ValidationError(`Invalid Solana address: ${address}`);
            }
            break;
        
        case ChainName.Bitcoin:
            // Bitcoin addresses - supports Legacy (P2PKH), Script (P2SH), Bech32 (P2WPKH/P2WSH), and Taproot (P2TR)
            const bitcoinRegex = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
            if (!bitcoinRegex.test(address)) {
                throw new ValidationError(`Invalid Bitcoin address: ${address}`);
            }
            break;
        
        case ChainName.Cosmos:
            // Cosmos addresses use bech32 format with 'cosmos' prefix
            if (!/^cosmos1[a-z0-9]{38}$/.test(address)) {
                throw new ValidationError(`Invalid Cosmos address: ${address}`);
            }
            break;
        
        case ChainName.Near:
            // NEAR addresses: either implicit (64 hex chars) or named accounts ending with .near
            const nearImplicit = /^[a-f0-9]{64}$/;
            const nearNamed = /^[a-z0-9._-]+\.near$/;
            if (!nearImplicit.test(address) && !nearNamed.test(address)) {
                throw new ValidationError(`Invalid NEAR address: ${address}`);
            }
            break;
        
        case ChainName.Sui:
            // Sui addresses are up to 64 hex characters (leading zeros can be omitted)
            if (!/^0x[a-fA-F0-9]{1,64}$/.test(address)) {
                throw new ValidationError(`Invalid Sui address: ${address}`);
            }
            break;
        
        case ChainName.Aptos:
            // Aptos addresses are up to 64 hex characters (leading zeros can be omitted)
            if (!/^0x[a-fA-F0-9]{1,64}$/.test(address)) {
                throw new ValidationError(`Invalid Aptos address: ${address}`);
            }
            break;
        
        case ChainName.Algorand:
            // Algorand addresses are 58-character Base32 strings (A-Z, 2-7)
            if (!/^[A-Z2-7]{58}$/.test(address)) {
                throw new ValidationError(`Invalid Algorand address: ${address}`);
            }
            break;
        
        default:
            throw new ValidationError(`Unsupported chain: ${chain}`);
    }
};
/**
 * Validates that an API key appears to be in the correct format.
 * This performs basic sanity checks but doesn't verify the key with the server.
 * 
 * @param apiKey - The API key to validate
 * @throws {ValidationError} When the API key format appears invalid
 * 
 * @example
 * ```typescript
 * import { validateApiKey } from '@thenamespace/offchain-manager';
 * 
 * validateApiKey('ns-123fcc-1126-1234-1234-c63047985fe2'); // ✅ Valid format
 * validateApiKey('short'); // ❌ Throws ValidationError (too short)
 * validateApiKey(''); // ❌ Throws ValidationError (empty)
 * ```
 */
export const validateApiKey = (apiKey: string): void => {
    if (!apiKey || typeof apiKey !== 'string') {
        throw new ValidationError('API key must be a non-empty string');
    }

    if (apiKey.length < 10) {
        throw new ValidationError('API key appears to be too short');
    }
}; 