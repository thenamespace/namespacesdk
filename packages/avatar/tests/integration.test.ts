import { createAvatarClient } from '../src/index';
import { WalletProvider } from '../src/core/types';

// Mock axios
jest.mock('axios');
const mockAxios = require('axios');

// Mock XMLHttpRequest for upload tests
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  upload: {
    addEventListener: jest.fn(),
  },
  addEventListener: jest.fn(),
  status: 200,
  responseText: JSON.stringify({ url: 'https://example.com/image.jpg' }),
})) as any;

describe('Avatar SDK Integration Tests', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAxiosInstance = {
      post: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    };

    mockAxios.create = jest.fn(() => mockAxiosInstance);
  });

  describe('Simple Usage Scenarios', () => {
    it('should complete basic upload workflow', async () => {
      const client = createAvatarClient({
        domain: 'example.com',
        network: 'mainnet'
      });

      // Mock nonce response
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          nonce: 'testnonce123',
          expiresAt: Date.now() + 60000
        }
      });

      // Get SIWE message
      const siweResult = await client.getSIWEMessageForAvatar({
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
      });

      expect(siweResult.message).toContain('example.com');
      expect(siweResult.nonce).toBe('testnonce123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/nonce',
        expect.objectContaining({
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
          scope: 'avatar'
        })
      );
    });

    it('should handle both avatar and header operations', async () => {
      const client = createAvatarClient({
        domain: 'myapp.com',
        network: 'mainnet'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          nonce: 'nonce123ABC',
          expiresAt: Date.now() + 60000
        }
      });

      const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';

      // Get avatar SIWE message
      const avatarResult = await client.getSIWEMessageForAvatar({ address });
      expect(avatarResult.message).toContain('myapp.com');

      // Get header SIWE message
      const headerResult = await client.getSIWEMessageForHeader({ address });
      expect(headerResult.message).toContain('myapp.com');

      // Both should have been called
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should use custom API URL when provided', async () => {
      const customApiUrl = 'https://custom-api.example.com';
      const client = createAvatarClient({
        domain: 'example.com',
        apiUrl: customApiUrl
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          nonce: 'customnonce123',
          expiresAt: Date.now() + 60000
        }
      });

      await client.getSIWEMessageForAvatar({
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
      });

      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: customApiUrl
        })
      );
    });
  });

  describe('Provider-Based Workflows', () => {
    let mockProvider: WalletProvider;

    beforeEach(() => {
      mockProvider = {
        getAddress: jest.fn().mockResolvedValue('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'),
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
        getChainId: jest.fn().mockResolvedValue(1)
      };

      // Default mock for nonce - tests can override with mockResolvedValueOnce
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          nonce: 'providernonce123',
          expiresAt: Date.now() + 60000
        }
      });
    });

    it('should automatically upload avatar with provider', async () => {
      // Mock both nonce and upload responses
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            nonce: 'uploadnonce123',
            expiresAt: Date.now() + 60000
          }
        })
        .mockResolvedValueOnce({
          data: {
            url: 'https://cdn.example.com/avatar.jpg',
            uploadedAt: new Date().toISOString(),
            fileSize: 1024,
            isUpdate: false
          }
        });

      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockProvider
      });

      const file = new File(['test content'], 'avatar.jpg', { type: 'image/jpeg' });

      const result = await client.uploadAvatar({
        subname: 'test.eth',
        file
      });

      expect(result.url).toBe('https://cdn.example.com/avatar.jpg');
      expect(mockProvider.getAddress).toHaveBeenCalled();
      expect(mockProvider.signMessage).toHaveBeenCalled();
    });

    it('should automatically upload header with provider', async () => {
      // Mock both nonce and upload responses
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            nonce: 'headernonce123',
            expiresAt: Date.now() + 60000
          }
        })
        .mockResolvedValueOnce({
          data: {
            url: 'https://cdn.example.com/header.jpg',
            uploadedAt: new Date().toISOString(),
            fileSize: 2048,
            isUpdate: false
          }
        });

      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockProvider
      });

      const file = new File(['test content'], 'header.jpg', { type: 'image/jpeg' });

      const result = await client.uploadHeader({
        subname: 'test.eth',
        file
      });

      expect(result.url).toBe('https://cdn.example.com/header.jpg');
      expect(mockProvider.getAddress).toHaveBeenCalled();
      expect(mockProvider.signMessage).toHaveBeenCalled();
    });

    it('should automatically delete avatar with provider', async () => {
      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockProvider
      });

      mockAxiosInstance.delete.mockResolvedValue({
        data: {
          message: 'Avatar deleted successfully',
          deletedAt: new Date().toISOString()
        }
      });

      const result = await client.deleteAvatar({
        subname: 'test.eth'
      });

      expect(result.message).toContain('deleted');
      expect(mockProvider.getAddress).toHaveBeenCalled();
      expect(mockProvider.signMessage).toHaveBeenCalled();
    });

    it('should automatically delete header with provider', async () => {
      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockProvider
      });

      mockAxiosInstance.delete.mockResolvedValue({
        data: {
          message: 'Header deleted successfully',
          deletedAt: new Date().toISOString()
        }
      });

      const result = await client.deleteHeader({
        subname: 'test.eth'
      });

      expect(result.message).toContain('deleted');
      expect(mockProvider.getAddress).toHaveBeenCalled();
      expect(mockProvider.signMessage).toHaveBeenCalled();
    });

    it('should accept progress callback without errors', async () => {
      // Mock both nonce and upload responses
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            nonce: 'progressnonce123',
            expiresAt: Date.now() + 60000
          }
        })
        .mockResolvedValueOnce({
          data: {
            url: 'https://cdn.example.com/avatar.jpg',
            uploadedAt: new Date().toISOString(),
            fileSize: 1024,
            isUpdate: false
          }
        });

      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockProvider
      });

      const file = new File(['test content'], 'avatar.jpg', { type: 'image/jpeg' });
      const progressCallback = jest.fn();

      const result = await client.uploadAvatar({
        subname: 'test.eth',
        file,
        onProgress: progressCallback
      });

      // Upload should succeed with progress callback
      expect(result.url).toBeDefined();
    });
  });

  describe('Manual Signature Workflows', () => {
    it('should upload with pre-signed message', async () => {
      const client = createAvatarClient({
        domain: 'example.com'
      });

      // Mock nonce response first
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          nonce: 'manualnonce123',
          expiresAt: Date.now() + 60000
        }
      });

      const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
      const siweResult = await client.getSIWEMessageForAvatar({ address });

      const file = new File(['test content'], 'avatar.jpg', { type: 'image/jpeg' });
      const signature = '0x' + 'a'.repeat(130);

      // Mock upload response
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          url: 'https://cdn.example.com/avatar.jpg',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        }
      });

      const result = await client.uploadAvatarWithSignature({
        subname: 'test.eth',
        file,
        message: siweResult.message,
        signature,
        address
      });

      expect(result.url).toBeDefined();
    });

    it('should delete with pre-signed message', async () => {
      const client = createAvatarClient({
        domain: 'example.com'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          nonce: 'deletenonce123',
          expiresAt: Date.now() + 60000
        }
      });

      const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
      const siweResult = await client.getSIWEMessageForAvatar({ address });
      const signature = '0x' + 'a'.repeat(130);

      mockAxiosInstance.delete.mockResolvedValue({
        data: {
          message: 'Deleted successfully',
          deletedAt: new Date().toISOString()
        }
      });

      const result = await client.deleteAvatarWithSignature({
        subname: 'test.eth',
        message: siweResult.message,
        signature,
        address
      });

      expect(result.message).toContain('Deleted');
    });
  });

  describe('Viem Integration Scenarios', () => {
    it('should work with Viem wallet client', async () => {
      const mockViemWallet = {
        account: {
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
        },
        chain: { id: 1 },
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130))
      };

      // Mock nonce and upload responses
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            nonce: 'viemnonce123',
            expiresAt: Date.now() + 60000
          }
        })
        .mockResolvedValueOnce({
          data: {
            url: 'https://cdn.example.com/avatar.jpg',
            uploadedAt: new Date().toISOString(),
            fileSize: 1024,
            isUpdate: false
          }
        });

      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockViemWallet
      });

      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      const result = await client.uploadAvatar({
        subname: 'test.eth',
        file
      });

      expect(result.url).toBeDefined();
      expect(mockViemWallet.signMessage).toHaveBeenCalledWith({
        account: mockViemWallet.account,
        message: expect.any(String)
      });
    });
  });

  describe('Ethers Integration Scenarios', () => {
    it('should work with Ethers v6 wallet', async () => {
      const mockEthersWallet = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 1n })
        }
      };

      // Mock nonce and upload responses
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            nonce: 'ethersnonce123',
            expiresAt: Date.now() + 60000
          }
        })
        .mockResolvedValueOnce({
          data: {
            url: 'https://cdn.example.com/avatar.jpg',
            uploadedAt: new Date().toISOString(),
            fileSize: 1024,
            isUpdate: false
          }
        });

      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockEthersWallet
      });

      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      const result = await client.uploadAvatar({
        subname: 'test.eth',
        file
      });

      expect(result.url).toBeDefined();
      expect(mockEthersWallet.signMessage).toHaveBeenCalledWith(expect.any(String));
    });

    it('should work with Ethers v5 wallet', async () => {
      const mockEthersV5Wallet = {
        getAddress: jest.fn().mockResolvedValue('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'),
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 1 })
        }
      };

      // Mock nonce and upload responses
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            nonce: 'ethersv5nonce123',
            expiresAt: Date.now() + 60000
          }
        })
        .mockResolvedValueOnce({
          data: {
            url: 'https://cdn.example.com/avatar.jpg',
            uploadedAt: new Date().toISOString(),
            fileSize: 1024,
            isUpdate: false
          }
        });

      const client = createAvatarClient({
        domain: 'example.com',
        provider: mockEthersV5Wallet
      });

      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      const result = await client.uploadAvatar({
        subname: 'test.eth',
        file
      });

      expect(result.url).toBeDefined();
      expect(mockEthersV5Wallet.getAddress).toHaveBeenCalled();
      expect(mockEthersV5Wallet.signMessage).toHaveBeenCalled();
    });
  });

  describe('Network Configuration', () => {
    it('should default to mainnet when network not specified', async () => {
      const client = createAvatarClient({
        domain: 'example.com'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          nonce: 'mainnetnonce123',
          expiresAt: Date.now() + 60000
        }
      });

      await client.getSIWEMessageForAvatar({
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
      });

      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://metadata.namespace.ninja'
        })
      );
    });

    it('should use sepolia network when specified', async () => {
      const client = createAvatarClient({
        domain: 'example.com',
        network: 'sepolia'
      });

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          nonce: 'sepolianonce123',
          expiresAt: Date.now() + 60000
        }
      });

      await client.getSIWEMessageForAvatar({
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
      });

      // Sepolia still uses same API endpoint but different network config
      expect(mockAxios.create).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle network failures gracefully', async () => {
      const client = createAvatarClient({
        domain: 'example.com'
      });

      mockAxiosInstance.post.mockRejectedValue({
        request: {},
        message: 'Network Error'
      });

      await expect(
        client.getSIWEMessageForAvatar({
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle API errors with proper messages', async () => {
      const client = createAvatarClient({
        domain: 'example.com'
      });

      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      });

      await expect(
        client.getSIWEMessageForAvatar({
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
        })
      ).rejects.toThrow(); // Just check that it throws
    });

    it('should validate inputs before making API calls', async () => {
      const client = createAvatarClient({
        domain: 'example.com'
      });

      const invalidFile = new File(['test'], 'file.txt', { type: 'text/plain' });

      await expect(
        client.uploadAvatarWithSignature({
          subname: 'test.eth',
          file: invalidFile,
          message: 'test message',
          signature: '0x' + 'a'.repeat(130),
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
        })
      ).rejects.toThrow('Invalid file format');

      // API should not have been called
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });
  });
});

