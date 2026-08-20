import { 
  validateFile, 
  validateSubname, 
  normalizeSubname,
  validateAddress,
  validateSIWEOptionsResolved,
  AVATAR_MAX_SIZE,
  HEADER_MAX_SIZE,
  ALLOWED_FORMATS
} from '../src/utils/validation';

describe('Validation Utilities', () => {
  describe('validateFile', () => {
    describe('Avatar validation', () => {
      it('should accept valid JPEG file', () => {
        const file = new File(['test content'], 'avatar.jpg', { type: 'image/jpeg' });
        expect(() => validateFile(file, 'avatar')).not.toThrow();
      });

      it('should accept valid PNG file', () => {
        const file = new File(['test content'], 'avatar.png', { type: 'image/png' });
        expect(() => validateFile(file, 'avatar')).not.toThrow();
      });

      it('should accept valid GIF file', () => {
        const file = new File(['test content'], 'avatar.gif', { type: 'image/gif' });
        expect(() => validateFile(file, 'avatar')).not.toThrow();
      });

      it('should accept valid WebP file', () => {
        const file = new File(['test content'], 'avatar.webp', { type: 'image/webp' });
        expect(() => validateFile(file, 'avatar')).not.toThrow();
      });

      it('should accept valid SVG file', () => {
        const file = new File(['test content'], 'avatar.svg', { type: 'image/svg+xml' });
        expect(() => validateFile(file, 'avatar')).not.toThrow();
      });

      it('should reject file exceeding avatar size limit', () => {
        const largeContent = 'x'.repeat(AVATAR_MAX_SIZE + 1);
        const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
        
        expect(() => validateFile(file, 'avatar')).toThrow('File too large');
      });

      it('should accept file at exactly the size limit', () => {
        const exactContent = 'x'.repeat(AVATAR_MAX_SIZE);
        const file = new File([exactContent], 'exact.jpg', { type: 'image/jpeg' });
        
        expect(() => validateFile(file, 'avatar')).not.toThrow();
      });

      it('should reject invalid file format for avatar', () => {
        const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
        
        expect(() => validateFile(file, 'avatar')).toThrow('Invalid file format');
      });

      it('should reject text file', () => {
        const file = new File(['test'], 'file.txt', { type: 'text/plain' });
        
        expect(() => validateFile(file, 'avatar')).toThrow('Invalid file format');
      });
    });

    describe('Header validation', () => {
      it('should accept valid file under header size limit', () => {
        const content = 'x'.repeat(3 * 1024 * 1024); // 3MB
        const file = new File([content], 'header.jpg', { type: 'image/jpeg' });
        
        expect(() => validateFile(file, 'header')).not.toThrow();
      });

      it('should reject file exceeding header size limit', () => {
        const largeContent = 'x'.repeat(HEADER_MAX_SIZE + 1);
        const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
        
        expect(() => validateFile(file, 'header')).toThrow('File too large');
      });

      it('should accept file at exactly the header size limit', () => {
        const exactContent = 'x'.repeat(HEADER_MAX_SIZE);
        const file = new File([exactContent], 'exact.jpg', { type: 'image/jpeg' });
        
        expect(() => validateFile(file, 'header')).not.toThrow();
      });
    });

    describe('Buffer validation', () => {
      it('should accept valid Buffer under size limit', () => {
        const buffer = Buffer.from('test content');
        expect(() => validateFile(buffer, 'avatar')).not.toThrow();
      });

      it('should reject Buffer exceeding avatar size limit', () => {
        const buffer = Buffer.alloc(AVATAR_MAX_SIZE + 1);
        expect(() => validateFile(buffer, 'avatar')).toThrow('File too large');
      });

      it('should accept Buffer at exactly the size limit', () => {
        const buffer = Buffer.alloc(AVATAR_MAX_SIZE);
        expect(() => validateFile(buffer, 'avatar')).not.toThrow();
      });
    });
  });

  describe('validateSubname', () => {
    it('should accept valid subname with .eth', () => {
      expect(() => validateSubname('vitalik.eth')).not.toThrow();
    });

    it('should accept valid nested subname', () => {
      expect(() => validateSubname('test.subdomain.eth')).not.toThrow();
    });

    it('should accept subname with hyphens', () => {
      expect(() => validateSubname('my-name.eth')).not.toThrow();
    });

    it('should accept deeply nested subname', () => {
      expect(() => validateSubname('a.b.c.d.eth')).not.toThrow();
    });

    it('should accept subname with numbers', () => {
      expect(() => validateSubname('user123.eth')).not.toThrow();
    });

    it('should accept a Unicode subname', () => {
      expect(() => validateSubname('àlias.eth')).not.toThrow();
    });

    it('should accept a nested Unicode subname', () => {
      expect(() => validateSubname('用户.parent.eth')).not.toThrow();
    });

    it('should accept a valid emoji subname', () => {
      expect(() => validateSubname('💩.eth')).not.toThrow();
    });

    it('should normalize decomposed Unicode to NFC', () => {
      expect(normalizeSubname('a\u0300lias.eth')).toBe('àlias.eth');
    });

    it('should normalize uppercase letters to lowercase', () => {
      expect(normalizeSubname('TestName.eth')).toBe('testname.eth');
    });

    it('should reject subname without domain', () => {
      expect(() => validateSubname('justname')).toThrow('Invalid ENS subname format');
    });

    it('should reject empty subname', () => {
      expect(() => validateSubname('')).toThrow('Invalid ENS subname format');
    });

    it('should reject subname with spaces', () => {
      expect(() => validateSubname('my name.eth')).toThrow('Invalid ENS subname format');
    });

    it('should reject subname with special characters', () => {
      expect(() => validateSubname('my_name.eth')).toThrow('Invalid ENS subname format');
    });

    it('should reject subname with trailing dot', () => {
      expect(() => validateSubname('name.eth.')).toThrow('Invalid ENS subname format');
    });

    it('should reject subname with leading dot', () => {
      expect(() => validateSubname('.name.eth')).toThrow('Invalid ENS subname format');
    });

    it('should reject mixed-script confusables', () => {
      expect(() => validateSubname('aа.eth')).toThrow('Invalid ENS subname format');
    });

    it('should reject a label starting with a combining mark', () => {
      expect(() => validateSubname('\u0300alias.eth')).toThrow('Invalid ENS subname format');
    });

    it('should reject null subname', () => {
      expect(() => validateSubname(null as any)).toThrow('Invalid ENS subname format');
    });

    it('should reject undefined subname', () => {
      expect(() => validateSubname(undefined as any)).toThrow('Invalid ENS subname format');
    });
  });

  describe('validateAddress', () => {
    it('should accept valid Ethereum address', () => {
      expect(() => validateAddress('0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9')).not.toThrow();
    });

    it('should accept address with lowercase letters', () => {
      expect(() => validateAddress('0x54b06711c8022faf11ec347f2bdc68a91ea03a3a')).not.toThrow();
    });

    it('should accept zero address', () => {
      expect(() => validateAddress('0x0000000000000000000000000000000000000000')).not.toThrow();
    });

    it('should reject address without 0x prefix', () => {
      expect(() => validateAddress('4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9')).toThrow('Invalid address');
    });

    it('should reject address with incorrect length', () => {
      expect(() => validateAddress('0x4f9E47C8b5EB5d0508CDAC175aa29e4b')).toThrow('Invalid address');
    });

    it('should reject address with invalid characters', () => {
      expect(() => validateAddress('0xZZZZ47C8b5EB5d0508CDAC175aa29e4b7EE529E9')).toThrow('Invalid address');
    });

    it('should reject empty address', () => {
      expect(() => validateAddress('')).toThrow('Invalid address');
    });

    it('should reject null address', () => {
      expect(() => validateAddress(null as any)).toThrow('Invalid address');
    });

    it('should reject undefined address', () => {
      expect(() => validateAddress(undefined as any)).toThrow('Invalid address');
    });

    it('should reject non-string address', () => {
      expect(() => validateAddress(123 as any)).toThrow('Invalid address');
    });
  });

  describe('validateSIWEOptionsResolved', () => {
    const validOptions = {
      address: '0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9',
      domain: 'example.com',
      uri: 'https://example.com',
      chainId: 1
    };

    it('should accept valid SIWE options', () => {
      expect(() => validateSIWEOptionsResolved(validOptions)).not.toThrow();
    });

    it('should accept options without optional uri', () => {
      const options = {
        address: validOptions.address,
        domain: validOptions.domain,
        chainId: validOptions.chainId
      };
      expect(() => validateSIWEOptionsResolved(options)).not.toThrow();
    });

    it('should accept options without optional chainId', () => {
      const options = {
        address: validOptions.address,
        domain: validOptions.domain,
        uri: validOptions.uri
      };
      expect(() => validateSIWEOptionsResolved(options)).not.toThrow();
    });

    it('should accept options with only required fields', () => {
      const options = {
        address: validOptions.address,
        domain: validOptions.domain
      };
      expect(() => validateSIWEOptionsResolved(options)).not.toThrow();
    });

    it('should accept sepolia chain ID', () => {
      const options = {
        ...validOptions,
        chainId: 11155111
      };
      expect(() => validateSIWEOptionsResolved(options)).not.toThrow();
    });

    it('should reject invalid address', () => {
      const options = {
        ...validOptions,
        address: 'invalid-address'
      };
      expect(() => validateSIWEOptionsResolved(options)).toThrow('Invalid address');
    });

    it('should reject empty domain', () => {
      const options = {
        ...validOptions,
        domain: ''
      };
      expect(() => validateSIWEOptionsResolved(options)).toThrow('Domain is required');
    });

    it('should reject whitespace-only domain', () => {
      const options = {
        ...validOptions,
        domain: '   '
      };
      expect(() => validateSIWEOptionsResolved(options)).toThrow('Domain is required');
    });

    it('should accept valid URI formats', () => {
      const options = {
        ...validOptions,
        uri: 'https://valid.example.com/path'
      };
      expect(() => validateSIWEOptionsResolved(options)).not.toThrow();
    });

    it('should reject empty URI', () => {
      const options = {
        ...validOptions,
        uri: ''
      };
      expect(() => validateSIWEOptionsResolved(options)).toThrow('URI must be a non-empty string');
    });

    it('should reject non-string domain', () => {
      const options = {
        ...validOptions,
        domain: 123 as any
      };
      expect(() => validateSIWEOptionsResolved(options)).toThrow('Domain is required');
    });

    it('should reject non-number chainId', () => {
      const options = {
        ...validOptions,
        chainId: '1' as any
      };
      expect(() => validateSIWEOptionsResolved(options)).toThrow('Chain ID must be a number');
    });

    it('should reject unsupported chainId', () => {
      const options = {
        ...validOptions,
        chainId: 5 // Goerli
      };
      expect(() => validateSIWEOptionsResolved(options)).toThrow('Chain ID must be 1 (mainnet) or 11155111 (sepolia)');
    });
  });
});
