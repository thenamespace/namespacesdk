import { createAvatarClient, AvatarSDKError, ErrorCodes } from '../src/index';

// Mock axios
jest.mock('axios');
const mockAxios = require('axios');

// Mock XMLHttpRequest
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

describe('AvatarClient', () => {
  let client: ReturnType<typeof createAvatarClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = createAvatarClient({
      network: 'mainnet',
      apiUrl: 'https://test-api.example.com'
    });
  });

  describe('Configuration', () => {
    it('should create client with default configuration', () => {
      const defaultClient = createAvatarClient();
      expect(defaultClient).toBeDefined();
    });

    it('should create client with custom configuration', () => {
      const customClient = createAvatarClient({
        network: 'sepolia',
        apiUrl: 'https://custom-api.example.com'
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('SIWE Message Generation', () => {
    beforeEach(() => {
      mockAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({
          data: {
            nonce: 'test-nonce-123',
            expiresAt: Date.now() + 60000
          }
        })
      });
    });

    it('should generate SIWE message for avatar', async () => {
      const result = await client.getSIWEMessageForAvatar({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      });

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('nonce', 'test-nonce-123');
      expect(result).toHaveProperty('expiresAt');
      expect(result.message).toContain('avatars.namespace.ninja wants you to sign in');
    });

    it('should generate SIWE message for header', async () => {
      const result = await client.getSIWEMessageForHeader({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      });

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('nonce', 'test-nonce-123');
      expect(result).toHaveProperty('expiresAt');
    });

    it('should handle API errors when generating SIWE message', async () => {
      mockAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: { status: 500, data: { message: 'Internal server error' } }
        })
      });

      await expect(client.getSIWEMessageForAvatar({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('API Error 500: Internal server error');
    });
  });

  describe('File Validation', () => {
    it('should validate file size for avatar', async () => {
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      await expect(client.uploadAvatarWithSignature({
        subname: 'test.eth',
        file: largeFile,
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('File too large. Max size for avatar: 2MB');
    });

    it('should validate file size for header', async () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      await expect(client.uploadHeaderWithSignature({
        subname: 'test.eth',
        file: largeFile,
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('File too large. Max size for header: 5MB');
    });

    it('should validate file format', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await expect(client.uploadAvatarWithSignature({
        subname: 'test.eth',
        file: invalidFile,
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('Invalid file format. Allowed: image/jpeg, image/jpg, image/png, image/gif, image/webp');
    });

    it('should validate subname format', async () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(client.uploadAvatarWithSignature({
        subname: 'invalid-subname',
        file: validFile,
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('Invalid ENS subname format: invalid-subname');
    });

    it('should validate address format', async () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(client.uploadAvatarWithSignature({
        subname: 'test.eth',
        file: validFile,
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: 'invalid-address'
      })).rejects.toThrow('Invalid address: must be a valid Ethereum address');
    });
  });

  describe('Provider Integration', () => {
    const mockProvider = {
      getAddress: jest.fn().mockResolvedValue('0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'),
      signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
      getChainId: jest.fn().mockResolvedValue(1)
    };

    beforeEach(() => {
      mockAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({
          data: {
            nonce: 'test-nonce-123',
            expiresAt: Date.now() + 60000
          }
        })
      });
    });

    it('should upload avatar with provider', async () => {
      const clientWithProvider = createAvatarClient({
        network: 'mainnet',
        provider: mockProvider
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock the upload response
      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        upload: { addEventListener: jest.fn() },
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(() => callback(), 0);
          }
        }),
        status: 200,
        responseText: JSON.stringify({
          url: 'https://example.com/avatar.jpg',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        })
      };
      
      (global.XMLHttpRequest as jest.Mock).mockImplementation(() => mockXHR);

      const result = await clientWithProvider.uploadAvatar({
        subname: 'test.eth',
        file
      });

      expect(result).toHaveProperty('url');
      expect(mockProvider.getAddress).toHaveBeenCalled();
      expect(mockProvider.signMessage).toHaveBeenCalled();
    });

    it('should throw error when provider is missing', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(client.uploadAvatar({
        subname: 'test.eth',
        file
      })).rejects.toThrow('Wallet provider is required for this operation');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          request: {},
          message: 'Network Error'
        })
      });

      await expect(client.getSIWEMessageForAvatar({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('Network error occurred. Please check your connection.');
    });

    it('should handle authentication errors', async () => {
      mockAxios.create.mockReturnValue({
        delete: jest.fn().mockRejectedValue({
          response: { status: 401, data: { message: 'Unauthorized' } }
        })
      });

      await expect(client.deleteAvatarWithSignature({
        subname: 'test.eth',
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('Invalid signature provided');
    });

    it('should handle ownership errors', async () => {
      mockAxios.create.mockReturnValue({
        delete: jest.fn().mockRejectedValue({
          response: { status: 403, data: { message: 'Forbidden' } }
        })
      });

      await expect(client.deleteAvatarWithSignature({
        subname: 'test.eth',
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('You do not own the ENS subname: unknown');
    });
  });

  describe('Upload with Progress', () => {
    it('should call progress callback during upload', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const progressCallback = jest.fn();

      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        upload: { 
          addEventListener: jest.fn((event, callback) => {
            if (event === 'progress') {
              // Simulate progress event
              setTimeout(() => callback({
                lengthComputable: true,
                loaded: 50,
                total: 100
              }), 0);
            }
          })
        },
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(() => callback(), 0);
          }
        }),
        status: 200,
        responseText: JSON.stringify({
          url: 'https://example.com/avatar.jpg',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        })
      };
      
      (global.XMLHttpRequest as jest.Mock).mockImplementation(() => mockXHR);

      await client.uploadAvatarWithSignature({
        subname: 'test.eth',
        file,
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a',
        onProgress: progressCallback
      });

      expect(progressCallback).toHaveBeenCalledWith(50);
    });
  });
});

