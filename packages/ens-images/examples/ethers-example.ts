import { createAvatarClient } from '../src/index';

/**
 * Ethers.js integration example for the Avatar SDK
 * This example shows how to integrate the Avatar SDK with Ethers.js
 */
async function ethersIntegrationExample() {
  console.log('🔌 Ethers.js Integration Example\n');

  // Mock Ethers.js setup (in real usage, you'd use actual Ethers.js)
  const mockEthersProvider = {
    getAddress: async () => '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a',
    signMessage: async (message: string) => {
      console.log(`   🔐 Signing message with Ethers.js: ${message.substring(0, 50)}...`);
      // In real usage, this would be: await signer.signMessage(message)
      return '0x' + 'b'.repeat(130); // Mock signature
    },
    getChainId: async () => 1 // Mainnet
  };

  // Create Avatar SDK client with Ethers.js provider
  const client = createAvatarClient({
    network: 'mainnet',
    provider: mockEthersProvider
  });

  try {
    console.log('1. Automatic avatar upload with Ethers.js provider...');
    console.log('   Note: This would require an actual file');
    console.log('   const result = await client.uploadAvatar({');
    console.log('     subname: "myavatar.offchainsub.eth",');
    console.log('     file: avatarFile,');
    console.log('     onProgress: (progress) => console.log(`Upload: ${progress}%`)');
    console.log('   });');
    console.log();

    console.log('2. Automatic header upload with Ethers.js provider...');
    console.log('   const result = await client.uploadHeader({');
    console.log('     subname: "myavatar.offchainsub.eth",');
    console.log('     file: headerFile');
    console.log('   });');
    console.log();

    console.log('3. Manual flow with Ethers.js (for advanced use cases)...');
    
    // Get SIWE message
    const siweResult = await client.getSIWEMessageForHeader({
      address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
    });

    console.log('   ✅ SIWE message generated for header:');
    console.log(`   Message: ${siweResult.message.substring(0, 100)}...`);
    console.log(`   Nonce: ${siweResult.nonce}`);
    console.log();

    // Sign with Ethers.js (mock)
    const signature = await mockEthersProvider.signMessage(siweResult.message);
    console.log(`   ✅ Message signed: ${signature.substring(0, 20)}...`);
    console.log();

    console.log('4. Upload header with signature...');
    console.log('   const result = await client.uploadHeaderWithSignature({');
    console.log('     subname: "myavatar.offchainsub.eth",');
    console.log('     file: headerFile,');
    console.log('     message: siweResult.message,');
    console.log('     signature,');
    console.log('     address: "0x54b06711C8022faf11EC347F2bDc68A91eA03a3a"');
    console.log('   });');
    console.log();

  } catch (error) {
    console.error('❌ Error in Ethers.js integration:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Real Ethers.js setup example (commented out for demo)
 */
function realEthersSetupExample() {
  console.log('\n📝 Real Ethers.js Setup Example (commented out):\n');
  
  console.log(`
// Real Ethers.js setup would look like this:

import { BrowserProvider } from 'ethers';
import { createAvatarClient } from '@thenamespace/ens-images';

// Setup Ethers.js
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Create Avatar SDK with Ethers.js provider
const client = createAvatarClient({
  network: 'mainnet',
  provider: {
    getAddress: () => signer.getAddress(),
    signMessage: (msg) => signer.signMessage(msg),
    getChainId: async () => {
      const network = await provider.getNetwork();
      return Number(network.chainId);
    }
  }
});

// Upload header
const result = await client.uploadHeader({
  subname: 'myavatar.offchainsub.eth',
  file: headerFile
});

console.log('Header uploaded:', result.url);
  `);
}

/**
 * Delete operations example
 */
async function deleteOperationsExample() {
  console.log('\n🗑️ Delete Operations Example\n');

  const mockProvider = {
    getAddress: async () => '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a',
    signMessage: async (message: string) => {
      console.log(`   🔐 Signing delete message: ${message.substring(0, 50)}...`);
      return '0x' + 'c'.repeat(130);
    },
    getChainId: async () => 1
  };

  const client = createAvatarClient({
    network: 'mainnet',
    provider: mockProvider
  });

  try {
    console.log('1. Delete avatar (automatic with provider)...');
    console.log('   const result = await client.deleteAvatar({');
    console.log('     subname: "myavatar.offchainsub.eth"');
    console.log('   });');
    console.log();

    console.log('2. Delete header (automatic with provider)...');
    console.log('   const result = await client.deleteHeader({');
    console.log('     subname: "myavatar.offchainsub.eth"');
    console.log('   });');
    console.log();

    console.log('3. Manual delete with signature...');
    
    // Get SIWE message for delete
    const siweResult = await client.getSIWEMessageForAvatar({
      address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
    });

    const signature = await mockProvider.signMessage(siweResult.message);
    
    console.log('   const result = await client.deleteAvatarWithSignature({');
    console.log('     subname: "myavatar.offchainsub.eth",');
    console.log('     message: siweResult.message,');
    console.log('     signature,');
    console.log('     address: "0x54b06711C8022faf11EC347F2bDc68A91eA03a3a"');
    console.log('   });');
    console.log();

  } catch (error) {
    console.error('❌ Error in delete operations:', error instanceof Error ? error.message : String(error));
  }
}

// Run examples
async function main() {
  await ethersIntegrationExample();
  realEthersSetupExample();
  await deleteOperationsExample();
  
  console.log('\n🎉 Ethers.js integration examples completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  ethersIntegrationExample,
  realEthersSetupExample,
  deleteOperationsExample
};

