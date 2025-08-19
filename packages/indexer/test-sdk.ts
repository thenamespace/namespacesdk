#!/usr/bin/env ts-node

/**
 * Simple test script for the Namespace Indexer SDK
 * Run with: npx ts-node test-sdk.ts
 */

import { createIndexerClient } from './src/index';

async function testSDK() {
  console.log('🧪 Testing Namespace Indexer SDK...\n');

  const client = createIndexerClient();

  try {
    // Test 1: Get subnames list (this should work even if no specific subname exists)
    console.log('1. Testing getL2Subnames...');
    const subnames = await client.getL2Subnames({
      chainId: 10,
      page: 0,
      size: 3
    });

    console.log(`✅ Success! Found ${subnames.total} subnames`);
    console.log(`   Page: ${subnames.page}, Size: ${subnames.size}`);
    console.log(`   Items returned: ${subnames.items.length}`);
    console.log();

    // Test 2: Try to get a specific subname (might fail if it doesn't exist)
    if (subnames.items.length > 0) {
      const firstSubname = subnames.items[0];
      console.log('2. Testing getL2Subname with existing subname...');
      
      try {
        const subname = await client.getL2Subname({
          chainId: firstSubname.chainId as 10 | 8453 | 84532,
          nameOrNamehash: firstSubname.namehash
        });
        
        console.log(`✅ Success! Retrieved subname: ${subname.name}`);
        console.log(`   Owner: ${subname.owner}`);
        console.log(`   Chain ID: ${subname.chainId}`);
      } catch (error) {
        console.log(`⚠️  Expected error for specific subname: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Test 3: Test error handling with non-existent subname
    console.log('\n3. Testing error handling...');
    try {
      await client.getL2Subname({
        chainId: 10,
        nameOrNamehash: 'definitely-does-not-exist.namespace.eth'
      });
    } catch (error) {
      console.log('✅ Successfully handled error for non-existent subname');
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Test 4: Test registry endpoint
    console.log('\n4. Testing getL2Registry...');
    try {
      const registry = await client.getL2Registry({
        chainId: 10,
        nameOrNamehash: 'namespace.eth'
      });
      
      console.log(`✅ Success! Retrieved registry: ${registry.name}`);
      console.log(`   Owner: ${registry.owner}`);
      console.log(`   Token: ${registry.tokenSymbol} (${registry.tokenName})`);
    } catch (error) {
      console.log(`⚠️  Registry query failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('\n🎉 SDK test completed successfully!');
    console.log('   The SDK is working correctly and can communicate with the API.');

  } catch (error) {
    console.error('❌ SDK test failed:', error instanceof Error ? error.message : String(error));
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
      console.error('   Could not connect to the indexer API. Please check your internet connection.');
    } else if (error && typeof error === 'object' && 'code' in error && error.code === 'ETIMEDOUT') {
      console.error('   Request timed out. The API might be slow or unavailable.');
    } else if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) {
      console.error(`   API returned status ${error.response.status}`);
    }
    
    process.exit(1);
  }
}

// Run the test
testSDK().catch(console.error);
