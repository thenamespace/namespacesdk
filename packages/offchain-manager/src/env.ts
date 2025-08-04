import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Environment configuration for the Namespace SDK
 */
export interface EnvConfig {
    /** Namespace API Key for authentication */
    NAMESPACE_API_KEY: string;
    /** Test domain for running tests */
    TEST_DOMAIN: string;
    /** Test environment (mainnet/sepolia) */
    TEST_MODE: 'mainnet' | 'sepolia';
}

/**
 * Load and validate environment variables
 * @returns Validated environment configuration
 * @throws Error if required environment variables are missing
 */
export function loadEnvConfig(): EnvConfig {
    const config: EnvConfig = {
        NAMESPACE_API_KEY: process.env.NAMESPACE_API_KEY || '',
        TEST_DOMAIN: process.env.TEST_DOMAIN || 'happ1.eth',
        TEST_MODE: (process.env.TEST_MODE as 'mainnet' | 'sepolia') || 'sepolia',
    };

    // Validate required environment variables
    if (!config.NAMESPACE_API_KEY) {
        throw new Error(
            'NAMESPACE_API_KEY environment variable is required. ' +
            'Please set it in your .env file or as an environment variable. ' +
            'See .env.example for reference.'
        );
    }

    // Validate API key format (basic check)
    if (!config.NAMESPACE_API_KEY.startsWith('ns-')) {
        console.warn('Warning: API key should start with "ns-". Please check your API key format.');
    }

    return config;
}

/**
 * Get environment configuration with fallback to example values for development
 * @returns Environment configuration
 */
export function getEnvConfig(): EnvConfig {
    try {
        return loadEnvConfig();
    } catch (error: any) {
        console.error('❌ Environment configuration error:', error.message);
        console.log('📝 Please create a .env file based on .env.example');
        console.log('💡 Example: cp .env.example .env && edit .env');
        process.exit(1);
    }
} 