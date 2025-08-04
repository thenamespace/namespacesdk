import { createOffchainClient, ChainName } from '../src';
import { getEnvConfig } from '../src/env';

// Load environment configuration
const config = getEnvConfig();

// Initialize the client
const client = createOffchainClient({
    mode: config.TEST_MODE, // Using environment-configured mode
});

// Set your API key from environment
client.setDefaultApiKey(config.NAMESPACE_API_KEY);

async function basicExample() {
    try {
        // Create a simple subname
        await client.createSubname({
            parentName: 'happ1.eth',
            label: 'alice',
            addresses: [
                {
                    chain: ChainName.Ethereum,
                    value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
                }
            ]
        });
        console.log('✅ Created subname: alice.happ1.eth');

        // Create a subname with social links
        await client.createSubname({
            parentName: 'happ1.eth',
            label: 'bob',
            addresses: [
                {
                    chain: ChainName.Ethereum,
                    value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
                }
            ],
            texts: [
                { key: 'com.twitter', value: 'bob_dev' },
                { key: 'com.github', value: 'bob-dev' },
                { key: 'url', value: 'https://bob.dev' },
                { key: 'avatar', value: 'https://bob.dev/avatar.png' }
            ]
        });
        console.log('✅ Created social subname: bob.happ1.eth');

        // Check if a subname exists
        const availability = await client.isSubnameAvailable('alice.happ1.eth');
        if (!availability.isAvailable) {
            const existing = await client.getSingleSubname('alice.happ1.eth');
            console.log('📋 Found existing subname:', existing?.fullName);
        }

        // Get subnames for a domain
        const subnames = await client.getFilteredSubnames({
            parentName: 'happ1.eth',
            page: 1,
            size: 100
        });
        console.log(`📊 Found ${subnames.items.length} subnames`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

// Run the example
basicExample(); 