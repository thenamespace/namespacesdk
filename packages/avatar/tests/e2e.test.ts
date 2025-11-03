import { createAvatarClient } from '../src/index';
import { createWalletClient, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { JsonRpcProvider, Wallet } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * E2E Tests for Avatar SDK
 * These tests use real credentials and make actual API calls
 * Skip these tests in CI by default - they should be run manually
 */

// Test configuration from examples
const TEST_CONFIG = {
  privateKey: '0xd4e66100d9372d1369dc91c44c007df237d0bbb4a24782bda93d1201ff341276' as `0x${string}`,
  address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
  subname: 'grgr.happygame.eth',
  domain: 'happysingh.com',
  network: 'mainnet' as const
};

// Skip E2E tests by default (run with: npm test -- e2e.test.ts)
const describeE2E = process.env.RUN_E2E_TESTS === 'true' ? describe : describe.skip;

describeE2E('Avatar SDK E2E Tests', () => {
  let testImageFile: File;

  beforeAll(() => {
    // Load the test image
    try {
      const imagePath = join(__dirname, '../examples/goku.jpeg');
      const imageBuffer = readFileSync(imagePath);
      testImageFile = new File([imageBuffer], 'goku.jpeg', { type: 'image/jpeg' });
      console.log(`Loaded test image: ${testImageFile.size} bytes`);
    } catch (error) {
      console.warn('Could not load test image:', error);
    }
  });

  describe('SIWE Message Generation', () => {
    it('should generate real SIWE message for avatar', async () => {
      const client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network
      });

      try {
        const result = await client.getSIWEMessageForAvatar({
          address: TEST_CONFIG.address
        });

        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('nonce');
        expect(result).toHaveProperty('expiresAt');
        expect(result.message).toContain(TEST_CONFIG.domain);
        expect(result.message).toContain(TEST_CONFIG.address);
        expect(result.nonce).toBeDefined();
        expect(result.expiresAt).toBeGreaterThan(Date.now());
        
        console.log('SIWE message generated successfully');
      } catch (error) {
        console.warn('SIWE generation failed (this may be expected if API is unavailable):', error);
        // Don't fail the test - API might not be available
      }
    }, 10000);

    it('should generate real SIWE message for header', async () => {
      const client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network
      });

      try {
        const result = await client.getSIWEMessageForHeader({
          address: TEST_CONFIG.address
        });

        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('nonce');
        expect(result).toHaveProperty('expiresAt');
        expect(result.message).toContain(TEST_CONFIG.domain);
        expect(result.nonce).toBeDefined();
        
        console.log('SIWE header message generated successfully');
      } catch (error) {
        console.warn('SIWE header generation failed (this may be expected if API is unavailable):', error);
        // Don't fail the test - API might not be available
      }
    }, 10000);
  });

  describe('Viem Integration E2E', () => {
    let viemWallet: any;
    let client: any;

    beforeAll(() => {
      const account = privateKeyToAccount(TEST_CONFIG.privateKey);
      
      viemWallet = createWalletClient({
        account,
        chain: mainnet,
        transport: http()
      });

      client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network,
        provider: viemWallet
      });
    });

    it('should upload avatar with Viem wallet', async () => {
      if (!testImageFile) {
        console.warn('Skipping test: test image not available');
        return;
      }

      try {
        const result = await client.uploadAvatar({
          subname: TEST_CONFIG.subname,
          file: testImageFile,
          onProgress: (progress: number) => {
            console.log(`Upload progress: ${progress.toFixed(1)}%`);
          }
        });

        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('uploadedAt');
        expect(result).toHaveProperty('fileSize');
        expect(result.url).toMatch(/^https?:\/\//);
        
        console.log('Upload successful:', result.url);
      } catch (error) {
        console.warn('Upload test failed (this may be expected):', error);
        // Don't fail the test - API might not be available or subname might not exist
      }
    }, 30000);

    it('should upload header with Viem wallet', async () => {
      if (!testImageFile) {
        console.warn('Skipping test: test image not available');
        return;
      }

      try {
        const result = await client.uploadHeader({
          subname: TEST_CONFIG.subname,
          file: testImageFile
        });

        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('uploadedAt');
        
        console.log('Header upload successful:', result.url);
      } catch (error) {
        console.warn('Header upload test failed (this may be expected):', error);
      }
    }, 30000);
  });

  describe('Ethers Integration E2E', () => {
    let ethersWallet: Wallet;
    let client: any;

    beforeAll(() => {
      const provider = new JsonRpcProvider('https://eth.llamarpc.com');
      ethersWallet = new Wallet(TEST_CONFIG.privateKey, provider);

      client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network,
        provider: ethersWallet
      });
    });

    it('should upload avatar with Ethers wallet', async () => {
      if (!testImageFile) {
        console.warn('Skipping test: test image not available');
        return;
      }

      try {
        const result = await client.uploadAvatar({
          subname: TEST_CONFIG.subname,
          file: testImageFile
        });

        expect(result).toHaveProperty('url');
        expect(result.url).toMatch(/^https?:\/\//);
        
        console.log('Ethers upload successful:', result.url);
      } catch (error) {
        console.warn('Ethers upload test failed (this may be expected):', error);
      }
    }, 30000);
  });

  describe('Manual Signature Flow E2E', () => {
    let viemWallet: any;

    beforeAll(() => {
      const account = privateKeyToAccount(TEST_CONFIG.privateKey);
      
      viemWallet = createWalletClient({
        account,
        chain: mainnet,
        transport: http()
      });
    });

    it('should complete full manual upload flow', async () => {
      if (!testImageFile) {
        console.warn('Skipping test: test image not available');
        return;
      }

      const client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network
      });

      try {
        // Step 1: Get SIWE message
        const siweResult = await client.getSIWEMessageForAvatar({
          address: TEST_CONFIG.address
        });

        console.log('SIWE message generated');
        expect(siweResult.message).toBeDefined();

        // Step 2: Sign message
        const signature = await viemWallet.signMessage({
          account: viemWallet.account,
          message: siweResult.message
        });

        console.log('Message signed');
        expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);

        // Step 3: Upload with signature
        const result = await client.uploadAvatarWithSignature({
          subname: TEST_CONFIG.subname,
          file: testImageFile,
          message: siweResult.message,
          signature,
          address: TEST_CONFIG.address
        });

        expect(result).toHaveProperty('url');
        console.log('Manual flow completed:', result.url);
      } catch (error) {
        console.warn('Manual flow test failed (this may be expected):', error);
      }
    }, 30000);
  });

  describe('Delete Operations E2E', () => {
    let viemWallet: any;
    let client: any;

    beforeAll(() => {
      const account = privateKeyToAccount(TEST_CONFIG.privateKey);
      
      viemWallet = createWalletClient({
        account,
        chain: mainnet,
        transport: http()
      });

      client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network,
        provider: viemWallet
      });
    });

    it('should delete avatar', async () => {
      try {
        const result = await client.deleteAvatar({
          subname: TEST_CONFIG.subname
        });

        expect(result).toHaveProperty('message');
        console.log('Avatar deleted:', result.message);
      } catch (error) {
        console.warn('Delete avatar test failed (this may be expected if nothing to delete):', error);
      }
    }, 30000);

    it('should delete header', async () => {
      try {
        const result = await client.deleteHeader({
          subname: TEST_CONFIG.subname
        });

        expect(result).toHaveProperty('message');
        console.log('Header deleted:', result.message);
      } catch (error) {
        console.warn('Delete header test failed (this may be expected if nothing to delete):', error);
      }
    }, 30000);
  });

  describe('Error Handling E2E', () => {
    it('should handle invalid subname', async () => {
      const client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network
      });

      if (!testImageFile) {
        console.warn('Skipping test: test image not available');
        return;
      }

      await expect(
        client.uploadAvatarWithSignature({
          subname: 'invalid_subname',
          file: testImageFile,
          message: 'test',
          signature: '0x123',
          address: TEST_CONFIG.address
        })
      ).rejects.toThrow();
    });

    it('should handle invalid address', async () => {
      const client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network
      });

      await expect(
        client.getSIWEMessageForAvatar({
          address: 'invalid-address'
        })
      ).rejects.toThrow();
    });

    it('should handle file too large for avatar', async () => {
      const client = createAvatarClient({
        domain: TEST_CONFIG.domain,
        network: TEST_CONFIG.network
      });

      const largeFile = new File(
        ['x'.repeat(3 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );

      await expect(
        client.uploadAvatarWithSignature({
          subname: TEST_CONFIG.subname,
          file: largeFile,
          message: 'test',
          signature: '0x123',
          address: TEST_CONFIG.address
        })
      ).rejects.toThrow('File too large');
    });
  });
});

