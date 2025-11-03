import { createAvatarClient } from '../src/index';
import { createWalletClient, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Viem integration example for the Avatar SDK
 * This example shows how to integrate the Avatar SDK with Viem
 */
async function viemIntegrationExample() {
  console.log('🔌 Viem Integration Example\n');

  // Real Viem setup with private key
  console.log('Setting up Viem wallet client...');
  const privateKey = '0xd4e66100d9372d1369dc91c44c007df237d0bbb4a24782bda93d1201ff341276' as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http()
  });
  
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
  });
  
  console.log(`✅ Wallet connected: ${account.address}\n`);

  // Create Avatar SDK client - just pass the viem wallet client directly!
  // No need to create an adapter object anymore
  const client = createAvatarClient({
    network: 'mainnet',
    domain: "happysingh.com",
    provider: walletClient  // Pass viem wallet client directly
  });

  try {
    // Load the Goku image
    console.log('Loading image file...');
    const imagePath = join(__dirname, 'goku.jpeg');
    const imageBuffer = readFileSync(imagePath);
    const gokuFile = new File([new Uint8Array(imageBuffer)], 'goku.jpeg', { type: 'image/jpeg' });
    console.log(`✅ Image loaded: ${gokuFile.name} (${gokuFile.size} bytes)\n`);

    console.log('1. Automatic avatar upload with Viem provider...');
    console.log(`   Subname: grgr.happygame.eth`);
    console.log(`   File size: ${gokuFile.size} bytes`);
    
    try {
      const result = await client.uploadAvatar({
        subname: "grgr.happygame.eth",
        file: gokuFile,
        onProgress: (progress) => console.log(`   Upload progress: ${progress.toFixed(1)}%`)
      });
      
      console.log('   ✅ Upload successful:');
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
    }
    console.log();

    console.log('2. Automatic header upload with Viem provider...');
    console.log(`   Subname: grgr.happygame.eth`);
    console.log(`   File size: ${gokuFile.size} bytes`);
    
    try {
      const headerResult = await client.uploadHeader({
        subname: "grgr.happygame.eth",
        file: gokuFile
      });
      
      console.log('   ✅ Header upload successful:');
      console.log(`   URL: ${headerResult.url}`);
      console.log(`   File Size: ${headerResult.fileSize} bytes`);
    } catch (uploadError) {
      console.log('   ❌ Header upload failed:');
      console.log(`   Error: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
    console.log();

    console.log('3. Manual flow with Viem (for advanced use cases)...');
    
    // Get SIWE message
    const siweResult = await client.getSIWEMessageForAvatar({
      address: account.address
    });

    console.log('   ✅ SIWE message generated:');
    console.log(`   Message: ${siweResult.message.substring(0, 100)}...`);
    console.log(`   Nonce: ${siweResult.nonce}`);
    console.log();

    // Sign with Viem
    console.log('   Signing SIWE message...');
    const signature = await walletClient.signMessage({ 
      account,
      message: siweResult.message 
    });
    console.log(`   ✅ Message signed: ${signature.substring(0, 20)}...`);
    console.log();

    console.log('4. Upload with signature...');
    console.log(`   Subname: grgr.happygame.eth`);
    console.log(`   File size: ${gokuFile.size} bytes`);
    
    try {
      const result = await client.uploadAvatarWithSignature({
        subname: "grgr.happygame.eth",
        file: gokuFile,
        message: siweResult.message,
        signature,
        address: account.address
      });
      
      console.log('   ✅ Upload with signature successful:');
      console.log(`   URL: ${result.url}`);
      console.log(`   File Size: ${result.fileSize} bytes`);
    } catch (uploadError) {
      console.log('   ❌ Upload with signature failed:');
      console.log(`   Error: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Error in Viem integration:', error instanceof Error ? error.message : String(error));
  }
}

// Run examples
async function main() {
  await viemIntegrationExample();
  
  console.log('\n🎉 Viem integration examples completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  viemIntegrationExample
};

