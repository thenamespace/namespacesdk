import { createIndexerClient } from '../src/index';

/**
 * Basic usage examples for the Namespace Indexer SDK
 */
async function basicUsageExamples() {
  console.log('🚀 Namespace Indexer SDK - Basic Usage Examples\n');

  // Create a client instance
  const client = createIndexerClient();

  try {
    // Example 1: Get a specific subname
    console.log('1. Getting subname information...');
    const subname = await client.getL2Subname({
      chainId: 10,
      nameOrNamehash: 'lucas.oppunk.eth'
    });

    console.log('✅ Subname found:');
    console.log(`   Name: ${subname.name}`);
    console.log(`   Owner: ${subname.owner}`);
    console.log(`   Chain ID: ${subname.chainId}`);
    console.log(`   Expiry: ${subname.expiry}`);
    console.log(`   Records:`, subname.records);
    console.log();

    // Example 2: Get registry information
    console.log('2. Getting registry information...');
    const registry = await client.getL2Registry({
      chainId: 10,
      nameOrNamehash: 'oppunk.eth'
    });

    console.log('✅ Registry found:');
    console.log(`   Name: ${registry.name}`);
    console.log(`   Owner: ${registry.owner}`);
    console.log(`   Token Symbol: ${registry.tokenSymbol}`);
    console.log(`   Token Name: ${registry.tokenName}`);
    console.log(`   Is Expirable: ${registry.is_expirable}`);
    console.log(`   Is Burnable: ${registry.is_burnable}`);
    console.log();

    // Example 3: Get paginated subnames
    console.log('3. Getting paginated subnames...');
    const subnames = await client.getL2Subnames({
      chainId: 10,
      page: 0,
      size: 5
    });

    console.log(`✅ Found ${subnames.total} subnames (showing ${subnames.items.length}):`);
    subnames.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.owner})`);
    });
    console.log();

    // Example 4: Search subnames by owner
    console.log('4. Searching subnames by owner...');
    const ownerSubnames = await client.getL2Subnames({
      owner: subname.owner, // Use the owner from the first example
      chainId: 10,
      page: 0,
      size: 10
    });

    console.log(`✅ Found ${ownerSubnames.total} subnames owned by ${subname.owner}:`);
    ownerSubnames.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}`);
    });

  } catch (error) {
    console.error('❌ Error occurred:', error instanceof Error ? error.message : String(error));
    
    // Enhanced error handling
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 404) {
      console.error('   The requested resource was not found');
    } else if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
      console.error('   Could not connect to the indexer API');
    } else if (error && typeof error === 'object' && 'code' in error && error.code === 'ETIMEDOUT') {
      console.error('   Request timed out');
    }
  }
}

/**
 * Advanced filtering examples
 */
async function advancedFilteringExamples() {
  console.log('\n🔍 Advanced Filtering Examples\n');

  const client = createIndexerClient();

  try {
    // Example 1: Filter by parent domain
    console.log('1. Filtering by parent domain...');
    const parentSubnames = await client.getL2Subnames({
      parent: 'artii.eth',
      chainId: 8453,
      page: 0,
      size: 5
    });

    console.log(`✅ Found ${parentSubnames.total} subnames under artii.eth`);
    console.log();

    // Example 2: Search by name
    console.log('2. Searching by name...');
    const searchResults = await client.getL2Subnames({
      stringSearch: 'hello',
      chainId: 8453,
      page: 0,
      size: 5
    });

    console.log(`✅ Found ${searchResults.total} subnames containing "alice" on Base`);
    console.log();

    // Example 3: Filter by testnet status
    console.log('3. Filtering by testnet status...');
    const testnetSubnames = await client.getL2Subnames({
      isTestnet: true,
      page: 0,
      size: 5
    });

    console.log(`✅ Found ${testnetSubnames.total} testnet subnames`);

  } catch (error) {
    console.error('❌ Error in advanced filtering:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Error handling examples
 */
async function errorHandlingExamples() {
  console.log('🛡️ Error Handling Examples\n');

  const client = createIndexerClient();

  // Example 1: Handle non-existent subname
  console.log('1. Handling non-existent subname...');
  try {
    await client.getL2Subname({
      chainId: 10,
      nameOrNamehash: 'nonexistent.namespace.eth'
    });
  } catch (error) {
    console.log('✅ Properly handled 404 error for non-existent subname');
  }

  // Example 2: Handle invalid chain ID
  console.log('2. Handling invalid chain ID...');
  try {
    await client.getL2Subname({
      chainId: 999 as any, // Invalid chain ID
      nameOrNamehash: 'test.namespace.eth'
    });
  } catch (error) {
    console.log('✅ Properly handled error for invalid chain ID');
  }

  // Example 3: Handle network errors
  console.log('3. Handling network errors...');
  const customClient = createIndexerClient({
    indexerUri: 'https://invalid-endpoint.namespace.ninja',
    timeout: 5000
  });

  try {
    await customClient.getL2Subname({
      chainId: 10,
      nameOrNamehash: 'test.namespace.eth'
    });
  } catch (error) {
    console.log('✅ Properly handled network error');
  }
}

// Run examples
async function main() {
  await basicUsageExamples();
  await advancedFilteringExamples();
  await errorHandlingExamples();
  
  console.log('🎉 All examples completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicUsageExamples,
  advancedFilteringExamples,
  errorHandlingExamples
};
