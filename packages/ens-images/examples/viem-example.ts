import { createAvatarClient } from '../src/index';

/**
 * Viem integration example for the Avatar SDK
 * This example shows how to integrate the Avatar SDK with Viem
 */
async function viemIntegrationExample() {
  console.log('🔌 Viem Integration Example\n');

  // Mock Viem setup (in real usage, you'd use actual Viem clients)
  const mockViemProvider = {
    getAddress: async () => '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a',
    signMessage: async (message: string) => {
      console.log(`   🔐 Signing message with Viem: ${message.substring(0, 50)}...`);
      // In real usage, this would be: await walletClient.signMessage({ message })
      return '0x' + 'a'.repeat(130); // Mock signature
    },
    getChainId: async () => 1 // Mainnet
  };

  // Create Avatar SDK client with Viem provider
  const client = createAvatarClient({
    network: 'mainnet',
    provider: mockViemProvider
  });

  try {
    console.log('1. Automatic avatar upload with Viem provider...');
    console.log('   Note: This would require an actual file');
    console.log('   const result = await client.uploadAvatar({');
    console.log('     subname: "myavatar.offchainsub.eth",');
    console.log('     file: avatarFile,');
    console.log('     onProgress: (progress) => console.log(`Upload: ${progress}%`)');
    console.log('   });');
    console.log();

    console.log('2. Automatic header upload with Viem provider...');
    console.log('   const result = await client.uploadHeader({');
    console.log('     subname: "myavatar.offchainsub.eth",');
    console.log('     file: headerFile');
    console.log('   });');
    console.log();

    console.log('3. Manual flow with Viem (for advanced use cases)...');
    
    // Get SIWE message
    const siweResult = await client.getSIWEMessageForAvatar({
      address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
    });

    console.log('   ✅ SIWE message generated:');
    console.log(`   Message: ${siweResult.message.substring(0, 100)}...`);
    console.log(`   Nonce: ${siweResult.nonce}`);
    console.log();

    // Sign with Viem (mock)
    const signature = await mockViemProvider.signMessage(siweResult.message);
    console.log(`   ✅ Message signed: ${signature.substring(0, 20)}...`);
    console.log();

    console.log('4. Upload with signature...');
    console.log('   const result = await client.uploadAvatarWithSignature({');
    console.log('     subname: "myavatar.offchainsub.eth",');
    console.log('     file: avatarFile,');
    console.log('     message: siweResult.message,');
    console.log('     signature,');
    console.log('     address: "0x54b06711C8022faf11EC347F2bDc68A91eA03a3a"');
    console.log('   });');
    console.log();

  } catch (error) {
    console.error('❌ Error in Viem integration:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Real Viem setup example (commented out for demo)
 */
function realViemSetupExample() {
  console.log('\n📝 Real Viem Setup Example (commented out):\n');
  
  console.log(`
// Real Viem setup would look like this:

import { createWalletClient, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { createAvatarClient } from '@thenamespace/ens-images';

// Setup Viem clients
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')
});

const walletClient = createWalletClient({
  account: '0x...', // Your account
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')
});

// Create Avatar SDK with Viem provider
const client = createAvatarClient({
  network: 'mainnet',
  provider: {
    getAddress: () => walletClient.account.address,
    signMessage: (msg) => walletClient.signMessage({ message: msg }),
    getChainId: () => walletClient.chain.id
  }
});

// Upload avatar
const result = await client.uploadAvatar({
  subname: 'myavatar.offchainsub.eth',
  file: avatarFile,
  onProgress: (progress) => console.log(\`Upload: \${progress}%\`)
});

console.log('Avatar uploaded:', result.url);
  `);
}

// Run examples
async function main() {
  await viemIntegrationExample();
  realViemSetupExample();
  
  console.log('\n🎉 Viem integration examples completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  viemIntegrationExample,
  realViemSetupExample
};

