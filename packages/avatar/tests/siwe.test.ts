import {
  generateSIWEMessage,
  createAvatarNonceRequest,
  createHeaderNonceRequest,
  createCombinedNonceRequest,
  isNonceExpired,
  getDefaultChainId
} from '../src/auth/siwe';

describe('SIWE Authentication', () => {
  describe('generateSIWEMessage', () => {
    it('should generate valid SIWE message with all fields', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: 'example.com',
        uri: 'https://example.com',
        chainId: 1
      };
      // Use a valid SIWE nonce format (alphanumeric, at least 8 characters)
      const nonce = 'testnonce123ABC';

      const message = generateSIWEMessage(options, nonce);

      expect(message).toContain('example.com wants you to sign in');
      expect(message).toContain('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9');
      expect(message).toContain('https://example.com');
      expect(message).toContain('testnonce123ABC');
      expect(message).toContain('Sign in to Avatar Service');
    });

    it('should generate message with default URI from domain', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: 'myapp.com',
        chainId: 1
      };
      const nonce = 'nonce456DEF';

      const message = generateSIWEMessage(options, nonce);

      expect(message).toContain('https://myapp.com');
      expect(message).toContain('myapp.com wants you to sign in');
    });

    it('should generate message with default chainId', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: 'example.com',
        uri: 'https://example.com'
      };
      const nonce = 'nonce789GHI';

      const message = generateSIWEMessage(options, nonce);

      // Should default to mainnet (chainId 1)
      expect(message).toBeDefined();
      expect(message).toContain('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9');
    });

    it('should generate message for Sepolia', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: 'example.com',
        uri: 'https://example.com',
        chainId: 11155111
      };
      const nonce = 'sepolianonce123';

      const message = generateSIWEMessage(options, nonce);

      expect(message).toBeDefined();
      expect(message).toContain('sepolianonce123');
    });

    it('should include version and issuedAt', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: 'example.com'
      };
      const nonce = 'nonceversion123';

      const message = generateSIWEMessage(options, nonce);

      expect(message).toContain('Version: 1');
      expect(message).toMatch(/Issued At: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should generate different messages for different addresses', () => {
      const address1 = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
      const address2 = '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a';
      const nonce = 'samenonce123';

      const message1 = generateSIWEMessage({
        address: address1,
        domain: 'example.com'
      }, nonce);

      const message2 = generateSIWEMessage({
        address: address2,
        domain: 'example.com'
      }, nonce);

      expect(message1).not.toBe(message2);
      expect(message1).toContain(address1);
      expect(message2).toContain(address2);
    });

    it('should generate different messages for different nonces', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: 'example.com'
      };

      const message1 = generateSIWEMessage(options, 'nonce1ABC');
      const message2 = generateSIWEMessage(options, 'nonce2DEF');

      expect(message1).not.toBe(message2);
      expect(message1).toContain('nonce1ABC');
      expect(message2).toContain('nonce2DEF');
    });

    it('should throw error for invalid address', () => {
      const options = {
        address: 'invalid-address',
        domain: 'example.com'
      };
      const nonce = 'nonce';

      expect(() => generateSIWEMessage(options, nonce)).toThrow();
    });

    it('should throw error for empty domain', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: ''
      };
      const nonce = 'nonce';

      expect(() => generateSIWEMessage(options, nonce)).toThrow('Domain is required');
    });

    it('should throw error for invalid chainId', () => {
      const options = {
        address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
        domain: 'example.com',
        chainId: 999 // Unsupported chain
      };
      const nonce = 'nonce';

      expect(() => generateSIWEMessage(options, nonce)).toThrow('Chain ID must be');
    });
  });

  describe('Nonce Request Creation', () => {
    describe('createAvatarNonceRequest', () => {
      it('should create nonce request with avatar scope', () => {
        const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
        const request = createAvatarNonceRequest(address);

        expect(request).toEqual({
          address,
          scope: 'avatar'
        });
      });

      it('should preserve address exactly as provided', () => {
        const address = '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a';
        const request = createAvatarNonceRequest(address);

        expect(request.address).toBe(address);
      });
    });

    describe('createHeaderNonceRequest', () => {
      it('should create nonce request with header scope', () => {
        const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
        const request = createHeaderNonceRequest(address);

        expect(request).toEqual({
          address,
          scope: 'header'
        });
      });

      it('should have different scope than avatar', () => {
        const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
        const avatarRequest = createAvatarNonceRequest(address);
        const headerRequest = createHeaderNonceRequest(address);

        expect(headerRequest.scope).not.toBe(avatarRequest.scope);
      });
    });

    describe('createCombinedNonceRequest', () => {
      it('should create nonce request with combined scope', () => {
        const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
        const request = createCombinedNonceRequest(address);

        expect(request).toEqual({
          address,
          scope: 'avatar+header'
        });
      });

      it('should have different scope than avatar and header', () => {
        const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
        const avatarRequest = createAvatarNonceRequest(address);
        const headerRequest = createHeaderNonceRequest(address);
        const combinedRequest = createCombinedNonceRequest(address);

        expect(combinedRequest.scope).not.toBe(avatarRequest.scope);
        expect(combinedRequest.scope).not.toBe(headerRequest.scope);
        expect(combinedRequest.scope).toBe('avatar+header');
      });
    });
  });

  describe('isNonceExpired', () => {
    it('should return false for future expiration', () => {
      const futureTime = Date.now() + 60000; // 1 minute in future
      expect(isNonceExpired(futureTime)).toBe(false);
    });

    it('should return true for past expiration', () => {
      const pastTime = Date.now() - 60000; // 1 minute in past
      expect(isNonceExpired(pastTime)).toBe(true);
    });

    it('should return true for time just passed', () => {
      const justPassed = Date.now() - 1;
      expect(isNonceExpired(justPassed)).toBe(true);
    });

    it('should return false for far future expiration', () => {
      const farFuture = Date.now() + 3600000; // 1 hour in future
      expect(isNonceExpired(farFuture)).toBe(false);
    });

    it('should return true for far past expiration', () => {
      const farPast = Date.now() - 3600000; // 1 hour in past
      expect(isNonceExpired(farPast)).toBe(true);
    });

    it('should handle very large timestamps', () => {
      const veryFarFuture = Date.now() + 86400000 * 365; // 1 year in future
      expect(isNonceExpired(veryFarFuture)).toBe(false);
    });

    it('should handle zero timestamp', () => {
      expect(isNonceExpired(0)).toBe(true);
    });

    it('should handle negative timestamp', () => {
      expect(isNonceExpired(-1000)).toBe(true);
    });
  });

  describe('getDefaultChainId', () => {
    it('should return 1 for mainnet', () => {
      expect(getDefaultChainId('mainnet')).toBe(1);
    });

    it('should return 11155111 for sepolia', () => {
      expect(getDefaultChainId('sepolia')).toBe(11155111);
    });

    it('should return different chain IDs for different networks', () => {
      const mainnetId = getDefaultChainId('mainnet');
      const sepoliaId = getDefaultChainId('sepolia');

      expect(mainnetId).not.toBe(sepoliaId);
      expect(mainnetId).toBe(1);
      expect(sepoliaId).toBe(11155111);
    });
  });

  describe('Integration scenarios', () => {
    it('should create complete SIWE flow for avatar', () => {
      const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
      
      // Step 1: Create nonce request
      const nonceRequest = createAvatarNonceRequest(address);
      expect(nonceRequest.scope).toBe('avatar');

      // Step 2: Simulate nonce response
      const nonceResponse = {
        nonce: 'generatednonce123ABC',
        expiresAt: Date.now() + 60000
      };

      // Step 3: Check expiration
      expect(isNonceExpired(nonceResponse.expiresAt)).toBe(false);

      // Step 4: Generate SIWE message
      const message = generateSIWEMessage({
        address,
        domain: 'example.com',
        chainId: getDefaultChainId('mainnet')
      }, nonceResponse.nonce);

      expect(message).toContain(address);
      expect(message).toContain(nonceResponse.nonce);
    });

    it('should handle expired nonce scenario', () => {
      const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
      
      const nonceRequest = createHeaderNonceRequest(address);
      
      // Simulate expired nonce
      const expiredNonce = {
        nonce: 'oldnonce123',
        expiresAt: Date.now() - 1000
      };

      expect(isNonceExpired(expiredNonce.expiresAt)).toBe(true);
      // In real scenario, would request new nonce here
    });

    it('should support both avatar and header operations', () => {
      const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
      const nonce = 'combinednonce123';

      // Generate messages for both
      const avatarMessage = generateSIWEMessage({
        address,
        domain: 'example.com'
      }, nonce);

      const headerMessage = generateSIWEMessage({
        address,
        domain: 'example.com'
      }, nonce);

      // Both should be valid and similar (might have slightly different timestamps)
      expect(avatarMessage).toContain(nonce);
      expect(headerMessage).toContain(nonce);
      expect(avatarMessage).toContain('example.com');
      expect(headerMessage).toContain('example.com');
      
      // But requests should have different scopes
      const avatarRequest = createAvatarNonceRequest(address);
      const headerRequest = createHeaderNonceRequest(address);
      expect(avatarRequest.scope).not.toBe(headerRequest.scope);
    });

    it('should work with custom domain and URI', () => {
      const address = '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9';
      const nonce = 'customnonce123';

      const message = generateSIWEMessage({
        address,
        domain: 'myapp.io',
        uri: 'https://app.myapp.io/login',
        chainId: 1
      }, nonce);

      expect(message).toContain('myapp.io');
      expect(message).toContain('https://app.myapp.io/login');
      expect(message).toContain(nonce);
    });
  });
});

