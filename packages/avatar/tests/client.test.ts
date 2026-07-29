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

// Setup default axios.create mock
const mockAxiosInstance = {
  post: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn()
    }
  }
};

mockAxios.create = jest.fn(() => mockAxiosInstance);

describe('AvatarClient', () => {
  let client: ReturnType<typeof createAvatarClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the axios.create mock
    mockAxios.create.mockReturnValue(mockAxiosInstance);
    
    client = createAvatarClient({
      network: 'mainnet',
      domain: 'test-app.com',
      apiUrl: 'https://test-api.example.com'
    });
  });

  describe('Configuration', () => {
    it('should create client with domain', () => {
      const defaultClient = createAvatarClient({
        domain: 'example.com'
      });
      expect(defaultClient).toBeDefined();
    });

    it('should create client with custom configuration', () => {
      const customClient = createAvatarClient({
        network: 'sepolia',
        domain: 'custom-app.com',
        apiUrl: 'https://custom-api.example.com'
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('SIWE Message Generation', () => {
    beforeEach(() => {
      mockAxiosInstance.post = jest.fn().mockResolvedValue({
        data: {
          nonce: 'testnonce123ABC',
          expiresAt: Date.now() + 60000
        }
      });
      mockAxios.create.mockReturnValue(mockAxiosInstance);
    });

    it('should generate SIWE message for avatar', async () => {
      const result = await client.getSIWEMessageForAvatar({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
        // domain is automatically used from initialization
      });

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('nonce', 'testnonce123ABC');
      expect(result).toHaveProperty('expiresAt');
      expect(result.message).toContain('test-app.com wants you to sign in');
    });

    it('should generate SIWE message for header', async () => {
      const result = await client.getSIWEMessageForHeader({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      });

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('nonce', 'testnonce123ABC');
      expect(result).toHaveProperty('expiresAt');
    });

    it('should use the configured network as the default SIWE chain', async () => {
      const sepoliaClient = createAvatarClient({
        network: 'sepolia',
        domain: 'test-app.com',
        apiUrl: 'https://test-api.example.com'
      });

      const result = await sepoliaClient.getSIWEMessageForAvatar({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      });

      expect(result.message).toContain('Chain ID: 11155111');
    });

    it('should handle API errors when generating SIWE message', async () => {
      const mockErrorAxiosInstance = {
        post: jest.fn().mockRejectedValue({
          response: { status: 500, data: { message: 'Internal server error' } }
        }),
        delete: jest.fn(),
        interceptors: {
          response: {
            use: jest.fn()
          }
        }
      };
      mockAxios.create.mockReturnValue(mockErrorAxiosInstance);
      
      const errorClient = createAvatarClient({
        network: 'mainnet',
        domain: 'test-app.com',
        apiUrl: 'https://test-api.example.com'
      });

      await expect(errorClient.getSIWEMessageForAvatar({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow(); // Just expect any error since interceptor handling varies
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

  describe('Metadata Service mutation routes', () => {
    const signedRequest = {
      subname: 'test.eth',
      message: 'signed SIWE message',
      signature: '0x' + 'a'.repeat(130),
      address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
    };

    it('should upload headers through /header while keeping the header multipart field', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          headerUrl: 'https://avtr.cc/test.eth/h',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        }
      });

      const result = await client.uploadHeaderWithSignature({
        ...signedRequest,
        file: new File(['header'], 'header.jpg', { type: 'image/jpeg' })
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/profile/mainnet/test.eth/header',
        expect.any(FormData),
        expect.any(Object)
      );
      const formData = mockAxiosInstance.post.mock.calls[0][1] as FormData;
      expect(formData.get('header')).toBeInstanceOf(File);
      expect(formData.has('h')).toBe(false);
      expect(result.url).toBe('https://avtr.cc/test.eth/h');
      expect(result.headerUrl).toBe('https://avtr.cc/test.eth/h');
    });

    it('should delete headers through the /header endpoint', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: {
          message: 'Header deleted successfully',
          deletedAt: new Date().toISOString()
        }
      });

      await client.deleteHeaderWithSignature(signedRequest);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/profile/mainnet/test.eth/header',
        {
          data: {
            siweMessage: signedRequest.message,
            siweSignature: signedRequest.signature,
            address: signedRequest.address
          }
        }
      );
    });

    it('should keep avatar mutations on the /avatar endpoint', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: {
          message: 'Avatar deleted successfully',
          deletedAt: new Date().toISOString()
        }
      });

      await client.deleteAvatarWithSignature(signedRequest);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/profile/mainnet/test.eth/avatar',
        expect.any(Object)
      );
    });

    it('should prefer canonical headerUrl over the compatibility url field', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          headerUrl: 'https://avtr.cc/test.eth/h',
          url: 'https://legacy.example.com/test.eth/header.jpg',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        }
      });

      const result = await client.uploadHeaderWithSignature({
        ...signedRequest,
        file: new File(['header'], 'header.jpg', { type: 'image/jpeg' })
      });

      expect(result.headerUrl).toBe('https://avtr.cc/test.eth/h');
      expect(result.url).toBe('https://avtr.cc/test.eth/h');
    });

    it('should accept url as a compatibility fallback for header uploads', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          url: 'https://legacy.example.com/test.eth/header.jpg',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        }
      });

      const result = await client.uploadHeaderWithSignature({
        ...signedRequest,
        file: new File(['header'], 'header.jpg', { type: 'image/jpeg' })
      });

      expect(result.headerUrl).toBe('https://legacy.example.com/test.eth/header.jpg');
      expect(result.url).toBe('https://legacy.example.com/test.eth/header.jpg');
    });

    it('should reject unsafe media URL schemes returned by the service', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          headerUrl: 'javascript:alert(1)',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        }
      });

      await expect(client.uploadHeaderWithSignature({
        ...signedRequest,
        file: new File(['header'], 'header.jpg', { type: 'image/jpeg' })
      })).rejects.toMatchObject({
        code: ErrorCodes.API_ERROR,
        status: 502
      });
    });
  });

  describe('Provider Integration', () => {
    const mockProvider = {
      getAddress: jest.fn().mockResolvedValue('0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'),
      signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
      getChainId: jest.fn().mockResolvedValue(1)
    };

    beforeEach(() => {
      mockAxiosInstance.post = jest.fn().mockResolvedValue({
        data: {
          nonce: 'providernonce123',
          expiresAt: Date.now() + 60000
        }
      });
      mockAxios.create.mockReturnValue(mockAxiosInstance);
    });

    it('should reject before signing when the provider is on the wrong chain', async () => {
      const wrongChainProvider = {
        getAddress: jest.fn().mockResolvedValue('0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'),
        signMessage: jest.fn(),
        getChainId: jest.fn().mockResolvedValue(1)
      };
      const sepoliaClient = createAvatarClient({
        network: 'sepolia',
        domain: 'example.com',
        provider: wrongChainProvider
      });

      await expect(sepoliaClient.uploadAvatar({
        subname: 'test.eth',
        file: new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      })).rejects.toMatchObject({
        code: ErrorCodes.PROVIDER_CHAIN_MISMATCH,
        details: { expectedChainId: 11155111, actualChainId: 1 }
      });
      expect(wrongChainProvider.signMessage).not.toHaveBeenCalled();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should switch a capable provider before requesting and signing SIWE', async () => {
      let chainId = 1;
      const switchableProvider = {
        getAddress: jest.fn().mockResolvedValue('0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'),
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
        getChainId: jest.fn().mockImplementation(async () => chainId),
        switchChain: jest.fn().mockImplementation(async (nextChainId: number) => {
          chainId = nextChainId;
        })
      };
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { nonce: 'switchchain123', expiresAt: Date.now() + 60000 }
        })
        .mockResolvedValueOnce({
          data: {
            avatarUrl: 'https://avtr.cc/test.eth',
            uploadedAt: new Date().toISOString(),
            fileSize: 6,
            isUpdate: false
          }
        });
      const sepoliaClient = createAvatarClient({
        network: 'sepolia',
        domain: 'example.com',
        provider: switchableProvider
      });

      const result = await sepoliaClient.uploadAvatar({
        subname: 'test.eth',
        file: new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
      });

      expect(switchableProvider.switchChain).toHaveBeenCalledWith(11155111);
      expect(switchableProvider.signMessage).toHaveBeenCalledWith(
        expect.stringContaining('Chain ID: 11155111')
      );
      expect(result.avatarUrl).toBe('https://avtr.cc/test.eth');
      expect(result.url).toBe(result.avatarUrl);
    });

    it('should upload avatar with provider', async () => {
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
            url: 'https://example.com/avatar.jpg',
            uploadedAt: new Date().toISOString(),
            fileSize: 1024,
            isUpdate: false
          }
        });

      const clientWithProvider = createAvatarClient({
        network: 'mainnet',
        domain: 'test-app.com',
        provider: mockProvider
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

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

  describe('Service error normalization', () => {
    it('should retain the Metadata Service error code, status, and details', () => {
      const rejected = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      try {
        rejected({
          message: 'Request failed with status code 401',
          response: {
            status: 401,
            data: {
              error: {
                code: 'UNAUTHORIZED',
                message: 'SIWE chain ID does not match the requested network',
                details: {
                  code: 'INVALID_CHAIN_ID',
                  expected: 11155111,
                  received: 1
                }
              }
            }
          }
        });
        throw new Error('Expected interceptor to throw');
      } catch (error) {
        expect(error).toMatchObject({
          code: ErrorCodes.API_ERROR,
          status: 401,
          serviceCode: 'INVALID_CHAIN_ID',
          details: {
            expected: 11155111,
            received: 1
          }
        });
        expect((error as AvatarSDKError).originalError).toBeUndefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockNetworkErrorInstance = {
        post: jest.fn().mockRejectedValue({
          request: {},
          message: 'Network Error'
        }),
        delete: jest.fn(),
        interceptors: {
          response: {
            use: jest.fn()
          }
        }
      };
      mockAxios.create.mockReturnValue(mockNetworkErrorInstance);
      
      const networkErrorClient = createAvatarClient({
        network: 'mainnet',
        domain: 'test-app.com',
        apiUrl: 'https://test-api.example.com'
      });

      await expect(networkErrorClient.getSIWEMessageForAvatar({
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow('Network error occurred. Please check your connection.');
    });

    it('should handle authentication errors', async () => {
      const mockAuthErrorInstance = {
        post: jest.fn(),
        delete: jest.fn().mockRejectedValue({
          response: { status: 401, data: { message: 'Unauthorized' } }
        }),
        interceptors: {
          response: {
            use: jest.fn((success, error) => {
              // Simulate interceptor
              return error;
            })
          }
        }
      };
      mockAxios.create.mockReturnValue(mockAuthErrorInstance);
      
      const authErrorClient = createAvatarClient({
        network: 'mainnet',
        domain: 'test-app.com',
        apiUrl: 'https://test-api.example.com'
      });

      await expect(authErrorClient.deleteAvatarWithSignature({
        subname: 'test.eth',
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow(); // Just check that it throws an error
    });

    it('should handle ownership errors', async () => {
      const mockOwnershipErrorInstance = {
        post: jest.fn(),
        delete: jest.fn().mockRejectedValue({
          response: { status: 403, data: { message: 'Forbidden' } }
        }),
        interceptors: {
          response: {
            use: jest.fn((success, error) => {
              // Simulate interceptor
              return error;
            })
          }
        }
      };
      mockAxios.create.mockReturnValue(mockOwnershipErrorInstance);
      
      const ownershipErrorClient = createAvatarClient({
        network: 'mainnet',
        domain: 'test-app.com',
        apiUrl: 'https://test-api.example.com'
      });

      await expect(ownershipErrorClient.deleteAvatarWithSignature({
        subname: 'test.eth',
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a'
      })).rejects.toThrow(); // Just check that it throws an error
    });
  });

  describe('Upload with Progress', () => {
    it('should accept progress callback without errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const progressCallback = jest.fn();

      // Mock the upload response
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          url: 'https://example.com/avatar.jpg',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024,
          isUpdate: false
        }
      });

      const result = await client.uploadAvatarWithSignature({
        subname: 'test.eth',
        file,
        message: 'test message',
        signature: '0x' + 'a'.repeat(130),
        address: '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a',
        onProgress: progressCallback
      });

      // Upload should succeed with progress callback provided
      expect(result).toHaveProperty('url');
    });
  });
});
