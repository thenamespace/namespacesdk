import { adaptWallet } from '../src/utils/wallet-adapters';
import { WalletProvider } from '../src/core/types';

describe('Wallet Adapters', () => {
  describe('WalletProvider (already compliant)', () => {
    it('should return WalletProvider as-is if already compliant', async () => {
      const mockProvider: WalletProvider = {
        getAddress: jest.fn().mockResolvedValue('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'),
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
        getChainId: jest.fn().mockResolvedValue(1)
      };

      const adapted = adaptWallet(mockProvider);
      
      expect(adapted).toBe(mockProvider);
      
      const address = await adapted.getAddress();
      expect(address).toBe('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9');
      expect(mockProvider.getAddress).toHaveBeenCalled();
    });

    it('should call all WalletProvider methods correctly', async () => {
      const mockProvider: WalletProvider = {
        getAddress: jest.fn().mockResolvedValue('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'),
        signMessage: jest.fn().mockResolvedValue('0xsignature'),
        getChainId: jest.fn().mockResolvedValue(1)
      };

      const adapted = adaptWallet(mockProvider);
      
      await adapted.getAddress();
      await adapted.signMessage('test message');
      await adapted.getChainId();
      
      expect(mockProvider.getAddress).toHaveBeenCalled();
      expect(mockProvider.signMessage).toHaveBeenCalledWith('test message');
      expect(mockProvider.getChainId).toHaveBeenCalled();
    });
  });

  describe('Viem WalletClient adapter', () => {
    it('should adapt Viem WalletClient correctly', async () => {
      const mockViemWallet = {
        account: {
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
        },
        chain: {
          id: 1
        },
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130))
      };

      const adapted = adaptWallet(mockViemWallet);
      
      expect(adapted).toBeDefined();
      expect(adapted.getAddress).toBeDefined();
      expect(adapted.signMessage).toBeDefined();
      expect(adapted.getChainId).toBeDefined();
    });

    it('should get address from Viem account', async () => {
      const mockViemWallet = {
        account: {
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
        },
        chain: { id: 1 },
        signMessage: jest.fn()
      };

      const adapted = adaptWallet(mockViemWallet);
      const address = await adapted.getAddress();
      
      expect(address).toBe('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9');
    });

    it('should sign message with Viem wallet', async () => {
      const mockSignature = '0x' + 'a'.repeat(130);
      const mockViemWallet = {
        account: {
          address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'
        },
        chain: { id: 1 },
        signMessage: jest.fn().mockResolvedValue(mockSignature)
      };

      const adapted = adaptWallet(mockViemWallet);
      const signature = await adapted.signMessage('test message');
      
      expect(signature).toBe(mockSignature);
      expect(mockViemWallet.signMessage).toHaveBeenCalledWith({
        account: mockViemWallet.account,
        message: 'test message'
      });
    });

    it('should get chain ID from Viem chain', async () => {
      const mockViemWallet = {
        account: { address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9' },
        chain: { id: 11155111 }, // Sepolia
        signMessage: jest.fn()
      };

      const adapted = adaptWallet(mockViemWallet);
      const chainId = await adapted.getChainId();
      
      expect(chainId).toBe(11155111);
    });

    it('should reject when a Viem wallet does not expose its chain', async () => {
      const mockViemWallet = {
        account: { address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9' },
        chain: {}, // No id
        signMessage: jest.fn()
      };

      const adapted = adaptWallet(mockViemWallet);
      await expect(adapted.getChainId()).rejects.toThrow(
        'does not expose its connected chain ID'
      );
    });

    it('should throw error if Viem wallet has no account', async () => {
      const mockViemWallet = {
        account: null,
        chain: { id: 1 },
        signMessage: jest.fn()
      };

      const adapted = adaptWallet(mockViemWallet);
      
      await expect(adapted.getAddress()).rejects.toThrow('does not have an account address');
    });

    it('should throw error when signing without account', async () => {
      const mockViemWallet = {
        account: null,
        chain: { id: 1 },
        signMessage: jest.fn()
      };

      const adapted = adaptWallet(mockViemWallet);
      
      await expect(adapted.signMessage('test')).rejects.toThrow('does not have an account');
    });
  });

  describe('Ethers Wallet adapter', () => {
    it('should adapt Ethers v6 Wallet correctly', async () => {
      const mockEthersWallet = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 1n })
        }
      };

      const adapted = adaptWallet(mockEthersWallet);
      
      expect(adapted).toBeDefined();
      expect(adapted.getAddress).toBeDefined();
      expect(adapted.signMessage).toBeDefined();
      expect(adapted.getChainId).toBeDefined();
    });

    it('should adapt Ethers v5 Wallet correctly', async () => {
      const mockEthersWallet = {
        getAddress: jest.fn().mockResolvedValue('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'),
        signMessage: jest.fn().mockResolvedValue('0x' + 'a'.repeat(130)),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 1 })
        }
      };

      const adapted = adaptWallet(mockEthersWallet);
      
      expect(adapted).toBeDefined();
    });

    it('should get address from Ethers v6 wallet (property)', async () => {
      const mockEthersWallet = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        signMessage: jest.fn(),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 1n })
        }
      };

      const adapted = adaptWallet(mockEthersWallet);
      const address = await adapted.getAddress();
      
      expect(address).toBe('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9');
    });

    it('should get address from Ethers v5 wallet (method)', async () => {
      const mockEthersWallet = {
        getAddress: jest.fn().mockResolvedValue('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'),
        signMessage: jest.fn(),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 1 })
        }
      };

      const adapted = adaptWallet(mockEthersWallet);
      const address = await adapted.getAddress();
      
      expect(address).toBe('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9');
      expect(mockEthersWallet.getAddress).toHaveBeenCalled();
    });

    it('should sign message with Ethers wallet', async () => {
      const mockSignature = '0x' + 'b'.repeat(130);
      const mockEthersWallet = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        signMessage: jest.fn().mockResolvedValue(mockSignature),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 1n })
        }
      };

      const adapted = adaptWallet(mockEthersWallet);
      const signature = await adapted.signMessage('test message');
      
      expect(signature).toBe(mockSignature);
      expect(mockEthersWallet.signMessage).toHaveBeenCalledWith('test message');
    });

    it('should get chain ID from Ethers provider', async () => {
      const mockEthersWallet = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        signMessage: jest.fn(),
        provider: {
          getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n })
        }
      };

      const adapted = adaptWallet(mockEthersWallet);
      const chainId = await adapted.getChainId();
      
      expect(chainId).toBe(11155111);
    });

    it('should reject when an Ethers wallet does not expose its chain', async () => {
      const mockEthersWallet = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        signMessage: jest.fn()
      };

      const adapted = adaptWallet(mockEthersWallet);
      await expect(adapted.getChainId()).rejects.toThrow(
        'does not expose its connected chain ID'
      );
    });

    it('should throw error if Ethers wallet has no address', () => {
      const mockEthersWallet = {
        signMessage: jest.fn()
      };

      // Should throw error during adaptation since it's missing address
      expect(() => adaptWallet(mockEthersWallet)).toThrow('Unsupported wallet type');
    });
  });

  describe('Error cases', () => {
    it('should throw error for unsupported wallet type', () => {
      const invalidWallet = {
        someMethod: jest.fn()
      };

      expect(() => adaptWallet(invalidWallet)).toThrow('Unsupported wallet type');
    });

    it('should throw error for null wallet', () => {
      expect(() => adaptWallet(null)).toThrow('Unsupported wallet type');
    });

    it('should throw error for undefined wallet', () => {
      expect(() => adaptWallet(undefined)).toThrow('Unsupported wallet type');
    });

    it('should throw error for primitive types', () => {
      expect(() => adaptWallet(123)).toThrow('Unsupported wallet type');
      expect(() => adaptWallet('wallet')).toThrow('Unsupported wallet type');
      expect(() => adaptWallet(true)).toThrow('Unsupported wallet type');
    });

    it('should throw error for empty object', () => {
      expect(() => adaptWallet({})).toThrow('Unsupported wallet type');
    });

    it('should throw error for object with partial interface', () => {
      const partialWallet = {
        getAddress: jest.fn(),
        // Missing signMessage and getChainId
      };

      expect(() => adaptWallet(partialWallet)).toThrow('Unsupported wallet type');
    });
  });

  describe('Integration scenarios', () => {
    it('should work with multiple wallet types in sequence', async () => {
      // Test WalletProvider
      const provider: WalletProvider = {
        getAddress: jest.fn().mockResolvedValue('0xADDRESS1'),
        signMessage: jest.fn().mockResolvedValue('0xSIG1'),
        getChainId: jest.fn().mockResolvedValue(1)
      };
      const adapted1 = adaptWallet(provider);
      expect(await adapted1.getAddress()).toBe('0xADDRESS1');

      // Test Viem
      const viemWallet = {
        account: { address: '0xADDRESS2' },
        chain: { id: 1 },
        signMessage: jest.fn().mockResolvedValue('0xSIG2')
      };
      const adapted2 = adaptWallet(viemWallet);
      expect(await adapted2.getAddress()).toBe('0xADDRESS2');

      // Test Ethers
      const ethersWallet = {
        address: '0xADDRESS3',
        signMessage: jest.fn().mockResolvedValue('0xSIG3'),
        provider: { getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }) }
      };
      const adapted3 = adaptWallet(ethersWallet);
      expect(await adapted3.getAddress()).toBe('0xADDRESS3');
    });

    it('should handle concurrent operations on adapted wallet', async () => {
      const mockProvider: WalletProvider = {
        getAddress: jest.fn().mockResolvedValue('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9'),
        signMessage: jest.fn().mockResolvedValue('0xsignature'),
        getChainId: jest.fn().mockResolvedValue(1)
      };

      const adapted = adaptWallet(mockProvider);
      
      // Call all methods concurrently
      const [address, signature, chainId] = await Promise.all([
        adapted.getAddress(),
        adapted.signMessage('test'),
        adapted.getChainId()
      ]);

      expect(address).toBe('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9');
      expect(signature).toBe('0xsignature');
      expect(chainId).toBe(1);
    });
  });
});
