import { createAvatarClient } from '../src/index';
import { JsonRpcProvider, Wallet } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Ethers.js integration example for the Avatar SDK
 * This example shows how to integrate the Avatar SDK with Ethers.js
 */
async function ethersIntegrationExample() {
  console.log('🔌 Ethers.js Integration Example\n');

  // Real Ethers.js setup with private key
  console.log('Setting up Ethers.js wallet...');
  const privateKey = '0xd4e66100d9372d1369dc91c44c007df237d0bbb4a24782bda93d1201ff341276';
  const provider = new JsonRpcProvider('https://eth.llamarpc.com');
  const wallet = new Wallet(privateKey, provider);
  
  console.log(`✅ Wallet connected: ${wallet.address}\n`);

  // Create Avatar SDK client - just pass the ethers wallet directly!
  // No need to create an adapter object anymore
  const client = createAvatarClient({
    network: 'mainnet',
    domain: "happysingh.com",
    provider: wallet  // Pass ethers wallet directly
  });

  try {
    // Load the Goku image
    console.log('Loading image file...');
    const imagePath = join(__dirname, 'goku.jpeg');
    const imageBuffer = readFileSync(imagePath);
    const gokuFile = new File([new Uint8Array(imageBuffer)], 'goku.jpeg', { type: 'image/jpeg' });
    console.log(`✅ Image loaded: ${gokuFile.name} (${gokuFile.size} bytes)\n`);

    console.log('1. Automatic avatar upload with Ethers.js provider...');
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

    console.log('2. Automatic header upload with Ethers.js provider...');
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

    console.log('3. Manual flow with Ethers.js (for advanced use cases)...');
    
    // Get SIWE message for header
    const siweResult = await client.getSIWEMessageForHeader({
      address: wallet.address
    });

    console.log('   ✅ SIWE message generated for header:');
    console.log(`   Message: ${siweResult.message.substring(0, 100)}...`);
    console.log(`   Nonce: ${siweResult.nonce}`);
    console.log();

    // Sign with Ethers.js
    console.log('   Signing SIWE message...');
    const signature = await wallet.signMessage(siweResult.message);
    console.log(`   ✅ Message signed: ${signature.substring(0, 20)}...`);
    console.log();

    console.log('4. Upload header with signature...');
    console.log(`   Subname: grgr.happygame.eth`);
    console.log(`   File size: ${gokuFile.size} bytes`);
    
    try {
      const result = await client.uploadHeaderWithSignature({
        subname: "grgr.happygame.eth",
        file: gokuFile,
        message: siweResult.message,
        signature,
        address: wallet.address
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
    console.error('❌ Error in Ethers.js integration:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Delete operations example
 */
async function deleteOperationsExample() {
  console.log('\n🗑️ Delete Operations Example\n');

  // Real Ethers.js setup for delete operations
  console.log('Setting up Ethers.js wallet for delete operations...');
  const privateKey = '0xd4e66100d9372d1369dc91c44c007df237d0bbb4a24782bda93d1201ff341276';
  const provider = new JsonRpcProvider('https://eth.llamarpc.com');
  const wallet = new Wallet(privateKey, provider);
  
  console.log(`✅ Wallet connected: ${wallet.address}\n`);

  // Pass ethers wallet directly - no adapter needed!
  const client = createAvatarClient({
    network: 'mainnet',
    domain: "happysingh.com",
    provider: wallet  // Pass ethers wallet directly
  });

  try {
    console.log('1. Delete avatar (automatic with provider)...');
    console.log(`   Subname: grgr.happygame.eth`);
    
    try {
      const result = await client.deleteAvatar({
        subname: "grgr.happygame.eth"
      });
      
      console.log('   ✅ Delete successful:');
      console.log(`   Message: ${result.message}`);
    } catch (deleteError) {
      console.log('   ❌ Delete failed:');
      console.log(`   Error: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
    }
    console.log();

    console.log('2. Delete header (automatic with provider)...');
    console.log(`   Subname: grgr.happygame.eth`);
    
    try {
      const result = await client.deleteHeader({
        subname: "grgr.happygame.eth"
      });
      
      console.log('   ✅ Delete successful:');
      console.log(`   Message: ${result.message}`);
    } catch (deleteError) {
      console.log('   ❌ Delete failed:');
      console.log(`   Error: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
    }
    console.log();

    console.log('3. Manual delete with signature...');
    
    // Get SIWE message for delete
    const siweResult = await client.getSIWEMessageForAvatar({
      address: wallet.address
    });

    console.log('   ✅ SIWE message generated');
    console.log(`   Nonce: ${siweResult.nonce}`);
    
    const signature = await wallet.signMessage(siweResult.message);
    console.log(`   ✅ Message signed: ${signature.substring(0, 20)}...`);
    console.log();
    
    console.log(`   Subname: grgr.happygame.eth`);
    
    try {
      const result = await client.deleteAvatarWithSignature({
        subname: "grgr.happygame.eth",
        message: siweResult.message,
        signature,
        address: wallet.address
      });
      
      console.log('   ✅ Delete with signature successful:');
      console.log(`   Message: ${result.message}`);
    } catch (deleteError) {
      console.log('   ❌ Delete with signature failed:');
      console.log(`   Error: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
    }
    console.log();

  } catch (error) {
    console.error('❌ Error in delete operations:', error instanceof Error ? error.message : String(error));
  }
}

// Run examples
async function main() {
  await ethersIntegrationExample();
  await deleteOperationsExample();
  
  console.log('\n🎉 Ethers.js integration examples completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  ethersIntegrationExample,
  deleteOperationsExample
};

