#!/usr/bin/env ts-node

// Load environment variables for testing
import * as dotenv from 'dotenv';
dotenv.config();

import { createOffchainClient, ChainName } from '../src';

// Load environment configuration
const TEST_API_KEY = process.env.NAMESPACE_API_KEY!;
const TEST_DOMAIN = process.env.TEST_DOMAIN!;
const TEST_MODE = (process.env.TEST_MODE as 'mainnet' | 'sepolia') || 'sepolia';

if (!TEST_API_KEY) {
    console.error('❌ NAMESPACE_API_KEY environment variable is required');
    process.exit(1);
}

async function runManualTests() {
    console.log('🧪 Starting Manual SDK Tests...\n');
    console.log('TEST_DOMAIN', TEST_DOMAIN);
    console.log('TEST_API_KEY', TEST_API_KEY);
    console.log('TEST_MODE', TEST_MODE);
    // Initialize client
    const client = createOffchainClient({
        mode: TEST_MODE,
    });

    client.setDefaultApiKey(TEST_API_KEY);

    try {
        // Test 1: Check if a subname is available
        console.log('1️⃣ Testing subname availability...');
        const testSubname = `manual-test-${Date.now()}.${TEST_DOMAIN}`;
        const availability = await client.isSubnameAvailable(testSubname);
        console.log(`   Subname ${testSubname} is available: ${availability.isAvailable}\n`);

        // Test 2: Create a simple subname
        console.log('2️⃣ Testing subname creation...');
        const label = `test-${Date.now()}`;
        await client.createSubname({
            parentName: TEST_DOMAIN,
            label,
            addresses: [
                {
                    chain: ChainName.Ethereum,
                    value: '0x5560650bF336dAfc2AaB23E6C2bCc78028877725'
                }
            ]
        });
        console.log(`   ✅ Created subname: ${label}.${TEST_DOMAIN}\n`);

        // Test 3: Get the created subname
        console.log('3️⃣ Testing subname retrieval...');
        const createdSubname = await client.getSingleSubname(`${label}.${TEST_DOMAIN}`);
        console.log(`   ✅ Retrieved subname: ${createdSubname?.fullName}`);
        console.log(`   Addresses: ${JSON.stringify(createdSubname?.addresses)}\n`);

        // Test 4: Add a text record
        console.log('4️⃣ Testing text record addition...');
        await client.addTextRecord(`${label}.${TEST_DOMAIN}`, 'twitter', '@testuser');
        console.log(`   ✅ Added twitter record\n`);

        // Test 5: Get text records
        console.log('5️⃣ Testing text record retrieval...');
        const textRecords = await client.getTextRecords(`${label}.${TEST_DOMAIN}`);
        console.log(`   ✅ Text records: ${JSON.stringify(textRecords)}\n`);

        // Test 6: Update subname
        console.log('6️⃣ Testing subname update...');
        await client.updateSubname(`${label}.${TEST_DOMAIN}`, {
            texts: [
                { key: 'github', value: 'testuser' },
                { key: 'website', value: 'https://test.com' }
            ]
        });
        console.log(`   ✅ Updated subname with new text records\n`);

        // Test 7: Get updated subname
        console.log('7️⃣ Testing updated subname retrieval...');
        const updatedSubname = await client.getSingleSubname(`${label}.${TEST_DOMAIN}`);
        console.log(`   ✅ Updated text records: ${JSON.stringify(updatedSubname?.texts)}\n`);

        // Test 8: Add address record for different chain
        console.log('8️⃣ Testing multi-chain address addition...');
        await client.addAddressRecord(`${label}.${TEST_DOMAIN}`, ChainName.Base, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
        console.log(`   ✅ Added Base chain address\n`);

        // Test 9: Get subnames for domain
        console.log('9️⃣ Testing subname listing...');
        const subnames = await client.getFilteredSubnames({
            parentName: TEST_DOMAIN,
            page: 1,
            size: 10
        });
        console.log(`   ✅ Found ${subnames.items.length} subnames for ${TEST_DOMAIN}\n`);

        // Test 10: Clean up - delete the test subname
        console.log('🔟 Testing subname deletion...');
        await client.deleteSubname(`${label}.${TEST_DOMAIN}`);
        console.log(`   ✅ Deleted test subname: ${label}.${TEST_DOMAIN}\n`);

        console.log('🎉 All manual tests completed successfully!');

    } catch (error: any) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    if (!TEST_API_KEY) {
        console.error('❌ Please set NAMESPACE_API_KEY environment variable or update the script');
        console.error('   Example: NAMESPACE_API_KEY=your-key ts-node scripts/test-manual.ts');
        process.exit(1);
    }

    if (!TEST_DOMAIN) {
        console.error('❌ Please set TEST_DOMAIN environment variable');
        process.exit(1);
    }

    runManualTests();
} 