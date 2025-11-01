import { createAvatarClient } from '../src/index';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Simple usage examples for the Avatar SDK
 */
async function simpleUsageExamples() {
  console.log('🚀 Avatar SDK - Simple Usage Examples\n');

  // Create a client instance (without provider - manual flow)
  const client = createAvatarClient({
    // network: 'mainnet',
    domain: "happysingh.com"
  });

  try {
    // Example 1: Get SIWE message for avatar upload
    console.log('1. Getting SIWE message for avatar upload...');
    const siweResult = await client.getSIWEMessageForAvatar({
      address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
      // domain is automatically used from initialization
    });

    console.log('✅ SIWE message generated:');
    console.log(`   Message: ${siweResult.message}`);

    try {
      // Load the actual Goku image
      const imagePath = join(__dirname, 'goku.jpeg');
      const imageBuffer = readFileSync(imagePath);
      

      const gokuFile = new File([imageBuffer], 'goku.jpeg', { type: 'image/jpeg' });
      
      console.log(`   ✅ Image loaded: ${gokuFile.name} (${gokuFile.size} bytes)`);
      
      // Create real wallet client with your private key
      console.log('   Setting up wallet client with private key...');
      const privateKey = '0xd4e66100d9372d1369dc91c44c007df237d0bbb4a24782bda93d1201ff341276' as `0x${string}`;
      const account = privateKeyToAccount(privateKey);
      
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http('https://eth-mainnet.g.alchemy.com/v2/pA1pwxPFLf_i6YgvfylQLmL9dmhQsUUp') // Using demo endpoint
      });
      
      const walletClient = createWalletClient({
        account,
        chain: mainnet,
        transport: http('https://eth-mainnet.g.alchemy.com/v2/pA1pwxPFLf_i6YgvfylQLmL9dmhQsUUp')
      });
      
      console.log(`   ✅ Wallet connected: ${account.address}`);
      
      // Sign the SIWE message with real wallet
      console.log('   Signing SIWE message with real wallet...');
      const signature = await walletClient.signMessage({ 
        message: siweResult.message 
      });
      
      console.log(`   ✅ Message signed: ${signature.substring(0, 20)}...`);
      
      console.log(`   Subname: grgr.happygame.eth`);
      console.log(`   File size: ${gokuFile.size} bytes`);
      console.log(`   Signature: ${signature.substring(0, 20)}...`);
      console.log(`   Address: 0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9`);
      
      const result = await client.uploadAvatarWithSignature({
        subname: "grgr.happygame.eth",
        file: gokuFile,
        message: siweResult.message,
        signature,
        address: "0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9"
      });
      
      console.log('   ✅ Upload successful!');
      console.log(`   URL: ${result.url}`);
      console.log(`   File Size: ${result.fileSize} bytes`);
      console.log(`   Uploaded At: ${result.uploadedAt}`);
      console.log(`   Is Update: ${result.isUpdate}`);
      if (result.pending) {
        console.log(`   Status: Pending (${result.message})`);
      }
      
    } catch (uploadError) {
      console.log('   ❌ Upload failed:');
      console.log(`   Error: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
      console.log('   This might be due to network issues or API endpoint availability');
    }
    console.log();

  } catch (error) {
    console.error('❌ Error occurred:', error instanceof Error ? error.message : String(error));
    
    // Enhanced error handling
    if (error && typeof error === 'object' && 'code' in error) {
      console.error(`   Error code: ${(error as any).code}`);
    }
  }
}

/**
 * Provider-based usage examples
 */
async function providerUsageExamples() {
  console.log('\n🔌 Provider-based Usage Examples\n');

  // Real provider using your private key
  console.log('   Setting up real wallet provider...');
  const privateKey = '0xd4e66100d9372d1369dc91c44c007df237d0bbb4a24782bda93d1201ff341276' as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('https://eth-mainnet.g.alchemy.com/v2/pA1pwxPFLf_i6YgvfylQLmL9dmhQsUUp')
  });
  
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('https://eth-mainnet.g.alchemy.com/v2/pA1pwxPFLf_i6YgvfylQLmL9dmhQsUUp')
  });
  
  const realProvider = {
    getAddress: async () => account.address,
    signMessage: async (message: string) => {
      console.log(`   Signing message: ${message}`);
      return await walletClient.signMessage({ message });
    },
    getChainId: async () => walletClient.chain.id
  };

  // Create client with provider (automatic flow)
  const client = createAvatarClient({
    network: 'mainnet',
    domain: "happysingh.com",
    provider: realProvider
  });

  try {
    console.log('1. Automatic avatar upload (with provider)...');
    console.log('   Loading Goku image for automatic upload...');
    
    try {
      // Load the actual Goku image
      const imagePath = join(__dirname, 'goku.jpeg');
      const imageBuffer = readFileSync(imagePath);
      const gokuFile = new File([imageBuffer], 'goku.jpeg', { type: 'image/jpeg' });
      
      console.log(`   ✅ Image loaded: ${gokuFile.name} (${gokuFile.size} bytes)`);
      console.log('   Uploading with provider (automatic signing)...');
      console.log(`   Subname: grgr.happygame.eth`);
      console.log(`   File size: ${gokuFile.size} bytes`);
      
      const result = await client.uploadAvatar({
        subname: "grgr.happygame.eth",
        file: gokuFile,
        onProgress: (progress) => console.log(`   Upload progress: ${progress.toFixed(1)}%`)
      });
      
      console.log('   ✅ Upload successful:');
      console.log(`   URL: ${result.url}`);
      console.log(`   File Size: ${result.fileSize} bytes`);
      console.log(`   Uploaded At: ${result.uploadedAt}`);
      
    } catch (uploadError) {
      console.log('   ❌ Upload failed:');
      console.log(`   Error: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
      console.log('   This might be due to network issues or API endpoint availability');
    }
    console.log();

    console.log('2. Automatic header upload (with provider)...');
    console.log('   Using same Goku image as header...');
    
    try {
      const imagePath = join(__dirname, 'goku.jpeg');
      const imageBuffer = readFileSync(imagePath);
      const gokuFile = new File([imageBuffer], 'goku.jpeg', { type: 'image/jpeg' });
      
      console.log(`   Subname: grgr.happygame.eth`);
      console.log(`   File size: ${gokuFile.size} bytes`);
      console.log('   Uploading header with provider...');
      
      const result = await client.uploadHeader({
        subname: "grgr.happygame.eth",
        file: gokuFile
      });
      
      console.log('   ✅ Header upload successful:');
      console.log(`   URL: ${result.url}`);
      console.log(`   File Size: ${result.fileSize} bytes`);
      
    } catch (uploadError) {
      console.log('   ❌ Header upload failed:');
      console.log(`   Error: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Error in provider examples:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Error handling examples
 */
async function errorHandlingExamples() {
  console.log('\n🛡️ Error Handling Examples\n');

  const client = createAvatarClient({
    domain: "happysingh.com"
  });

  // Example 1: Handle invalid address
  console.log('1. Handling invalid address...');
  try {
    await client.getSIWEMessageForAvatar({
      address: 'invalid-address'
    });
  } catch (error) {
    console.log('✅ Properly handled invalid address error');
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Example 2: Handle invalid subname
  console.log('\n2. Handling invalid subname...');
  try {
    // This would fail validation before making API call
    console.log('   Note: Validation would catch invalid subname format');
  } catch (error) {
    console.log('✅ Properly handled invalid subname error');
  }

  // Example 3: Handle network errors
  console.log('\n3. Handling network errors...');
  const customClient = createAvatarClient({
    apiUrl: 'https://invalid-endpoint.namespace.ninja',
    network: 'mainnet',
    domain: "happysingh.com"
  });

  try {
    await customClient.getSIWEMessageForAvatar({
      address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
    });
  } catch (error) {
    console.log('✅ Properly handled network error');
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run examples
async function main() {
  await simpleUsageExamples();
  await providerUsageExamples();
  await errorHandlingExamples();
  
  console.log('\n🎉 All examples completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  simpleUsageExamples,
  providerUsageExamples,
  errorHandlingExamples
};

