import { AvatarSDKError, ErrorCodes, createError } from '../src/core/errors';

describe('Avatar SDK Errors', () => {
  describe('AvatarSDKError', () => {
    it('should create error with message and code', () => {
      const error = new AvatarSDKError('Test error', ErrorCodes.API_ERROR);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.API_ERROR);
      expect(error.name).toBe('AvatarSDKError');
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original error');
      const error = new AvatarSDKError('Wrapped error', ErrorCodes.NETWORK_ERROR, originalError);

      expect(error.originalError).toBe(originalError);
      expect(error.originalError?.message).toBe('Original error');
    });

    it('should be instanceof Error', () => {
      const error = new AvatarSDKError('Test', ErrorCodes.INVALID_CONFIG);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AvatarSDKError);
    });

    it('should have stack trace', () => {
      const error = new AvatarSDKError('Test', ErrorCodes.UPLOAD_FAILED);

      expect(error.stack).toBeDefined();
    });

    it('should be throwable', () => {
      expect(() => {
        throw new AvatarSDKError('Test error', ErrorCodes.INVALID_SIGNATURE);
      }).toThrow('Test error');
    });

    it('should preserve error code when thrown and caught', () => {
      try {
        throw new AvatarSDKError('Test error', ErrorCodes.EXPIRED_NONCE);
      } catch (error) {
        expect(error).toBeInstanceOf(AvatarSDKError);
        expect((error as AvatarSDKError).code).toBe(ErrorCodes.EXPIRED_NONCE);
      }
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
      expect(ErrorCodes.INVALID_FILE_FORMAT).toBe('INVALID_FILE_FORMAT');
      expect(ErrorCodes.INVALID_FILE_TYPE).toBe('INVALID_FILE_TYPE');
      expect(ErrorCodes.INVALID_SIGNATURE).toBe('INVALID_SIGNATURE');
      expect(ErrorCodes.EXPIRED_NONCE).toBe('EXPIRED_NONCE');
      expect(ErrorCodes.INVALID_NONCE).toBe('INVALID_NONCE');
      expect(ErrorCodes.AUTHENTICATION_FAILED).toBe('AUTHENTICATION_FAILED');
      expect(ErrorCodes.NOT_SUBNAME_OWNER).toBe('NOT_SUBNAME_OWNER');
      expect(ErrorCodes.INVALID_SUBNAME).toBe('INVALID_SUBNAME');
      expect(ErrorCodes.SUBNAME_NOT_FOUND).toBe('SUBNAME_NOT_FOUND');
      expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCodes.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
      expect(ErrorCodes.API_ERROR).toBe('API_ERROR');
      expect(ErrorCodes.PROVIDER_NOT_CONNECTED).toBe('PROVIDER_NOT_CONNECTED');
      expect(ErrorCodes.PROVIDER_ERROR).toBe('PROVIDER_ERROR');
      expect(ErrorCodes.INVALID_CONFIG).toBe('INVALID_CONFIG');
      expect(ErrorCodes.MISSING_PROVIDER).toBe('MISSING_PROVIDER');
      expect(ErrorCodes.UPLOAD_FAILED).toBe('UPLOAD_FAILED');
      expect(ErrorCodes.DELETE_FAILED).toBe('DELETE_FAILED');
    });

    it('should have unique error codes', () => {
      const codes = Object.values(ErrorCodes);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });
  });

  describe('createError helpers', () => {
    describe('fileTooLarge', () => {
      it('should create file too large error for avatar', () => {
        const error = createError.fileTooLarge('avatar', 2 * 1024 * 1024);

        expect(error).toBeInstanceOf(AvatarSDKError);
        expect(error.message).toContain('File too large');
        expect(error.message).toContain('avatar');
        expect(error.message).toContain('2MB');
        expect(error.code).toBe(ErrorCodes.FILE_TOO_LARGE);
      });

      it('should create file too large error for header', () => {
        const error = createError.fileTooLarge('header', 5 * 1024 * 1024);

        expect(error.message).toContain('header');
        expect(error.message).toContain('5MB');
        expect(error.code).toBe(ErrorCodes.FILE_TOO_LARGE);
      });
    });

    describe('invalidFileFormat', () => {
      it('should create invalid file format error with allowed formats', () => {
        const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];
        const error = createError.invalidFileFormat(allowedFormats);

        expect(error.message).toContain('Invalid file format');
        expect(error.message).toContain('image/jpeg');
        expect(error.message).toContain('image/png');
        expect(error.message).toContain('image/gif');
        expect(error.code).toBe(ErrorCodes.INVALID_FILE_FORMAT);
      });

      it('should format multiple allowed formats correctly', () => {
        const allowedFormats = ['image/jpeg', 'image/jpg'];
        const error = createError.invalidFileFormat(allowedFormats);

        expect(error.message).toBe('Invalid file format. Allowed: image/jpeg, image/jpg');
      });
    });

    describe('invalidSignature', () => {
      it('should create invalid signature error', () => {
        const error = createError.invalidSignature();

        expect(error.message).toBe('Invalid signature provided');
        expect(error.code).toBe(ErrorCodes.INVALID_SIGNATURE);
      });

      it('should include original error', () => {
        const originalError = new Error('Signature verification failed');
        const error = createError.invalidSignature(originalError);

        expect(error.originalError).toBe(originalError);
      });
    });

    describe('expiredNonce', () => {
      it('should create expired nonce error', () => {
        const error = createError.expiredNonce();

        expect(error.message).toContain('Nonce has expired');
        expect(error.message).toContain('request a new one');
        expect(error.code).toBe(ErrorCodes.EXPIRED_NONCE);
      });
    });

    describe('invalidConfiguration', () => {
      it('should create invalid configuration error with custom message', () => {
        const customMessage = 'Domain is required';
        const error = createError.invalidConfiguration(customMessage);

        expect(error.message).toBe(customMessage);
        expect(error.code).toBe(ErrorCodes.INVALID_CONFIG);
      });

      it('should preserve exact custom message', () => {
        const message = 'Invalid provider configuration';
        const error = createError.invalidConfiguration(message);

        expect(error.message).toBe(message);
      });
    });

    describe('notSubnameOwner', () => {
      it('should create not subname owner error', () => {
        const subname = 'test.eth';
        const error = createError.notSubnameOwner(subname);

        expect(error.message).toContain('do not own');
        expect(error.message).toContain(subname);
        expect(error.code).toBe(ErrorCodes.NOT_SUBNAME_OWNER);
      });

      it('should include subname in message', () => {
        const error = createError.notSubnameOwner('myname.eth');

        expect(error.message).toBe('You do not own the ENS subname: myname.eth');
      });
    });

    describe('invalidSubname', () => {
      it('should create invalid subname error', () => {
        const subname = 'invalid_name';
        const error = createError.invalidSubname(subname);

        expect(error.message).toContain('Invalid ENS subname format');
        expect(error.message).toContain(subname);
        expect(error.code).toBe(ErrorCodes.INVALID_SUBNAME);
      });
    });

    describe('networkError', () => {
      it('should create network error', () => {
        const error = createError.networkError();

        expect(error.message).toContain('Network error');
        expect(error.message).toContain('check your connection');
        expect(error.code).toBe(ErrorCodes.NETWORK_ERROR);
      });

      it('should include original error', () => {
        const originalError = new Error('Connection timeout');
        const error = createError.networkError(originalError);

        expect(error.originalError).toBe(originalError);
        expect(error.originalError?.message).toBe('Connection timeout');
      });
    });

    describe('apiError', () => {
      it('should create API error with status and message', () => {
        const error = createError.apiError(500, 'Internal Server Error');

        expect(error.message).toBe('API Error 500: Internal Server Error');
        expect(error.code).toBe(ErrorCodes.API_ERROR);
      });

      it('should handle different status codes', () => {
        const error400 = createError.apiError(400, 'Bad Request');
        const error401 = createError.apiError(401, 'Unauthorized');
        const error404 = createError.apiError(404, 'Not Found');

        expect(error400.message).toContain('400');
        expect(error401.message).toContain('401');
        expect(error404.message).toContain('404');
      });
    });

    describe('providerNotConnected', () => {
      it('should create provider not connected error', () => {
        const error = createError.providerNotConnected();

        expect(error.message).toBe('Wallet provider is not connected');
        expect(error.code).toBe(ErrorCodes.PROVIDER_NOT_CONNECTED);
      });
    });

    describe('missingProvider', () => {
      it('should create missing provider error', () => {
        const error = createError.missingProvider();

        expect(error.message).toContain('Wallet provider is required');
        expect(error.code).toBe(ErrorCodes.MISSING_PROVIDER);
      });
    });

    describe('uploadFailed', () => {
      it('should create upload failed error', () => {
        const error = createError.uploadFailed();

        expect(error.message).toContain('Upload failed');
        expect(error.message).toContain('try again');
        expect(error.code).toBe(ErrorCodes.UPLOAD_FAILED);
      });

      it('should include original error', () => {
        const originalError = new Error('Network timeout during upload');
        const error = createError.uploadFailed(originalError);

        expect(error.originalError).toBe(originalError);
      });
    });

    describe('deleteFailed', () => {
      it('should create delete failed error', () => {
        const error = createError.deleteFailed();

        expect(error.message).toContain('Delete failed');
        expect(error.message).toContain('try again');
        expect(error.code).toBe(ErrorCodes.DELETE_FAILED);
      });

      it('should include original error', () => {
        const originalError = new Error('Permission denied');
        const error = createError.deleteFailed(originalError);

        expect(error.originalError).toBe(originalError);
      });
    });
  });

  describe('Error handling patterns', () => {
    it('should allow checking error type with instanceof', () => {
      const error = createError.invalidSignature();

      if (error instanceof AvatarSDKError) {
        expect(error.code).toBe(ErrorCodes.INVALID_SIGNATURE);
      } else {
        fail('Should be AvatarSDKError');
      }
    });

    it('should allow switching on error codes', () => {
      const error = createError.fileTooLarge('avatar', 2 * 1024 * 1024);
      let handled = false;

      switch (error.code) {
        case ErrorCodes.FILE_TOO_LARGE:
          handled = true;
          break;
        case ErrorCodes.INVALID_FILE_FORMAT:
          fail('Wrong error code');
          break;
      }

      expect(handled).toBe(true);
    });

    it('should preserve error chain with original error', () => {
      const rootError = new Error('Root cause');
      const wrappedError = createError.uploadFailed(rootError);

      expect(wrappedError.message).toContain('Upload failed');
      expect(wrappedError.originalError).toBe(rootError);
      expect(wrappedError.originalError?.message).toBe('Root cause');
    });

    it('should be catchable in try-catch blocks', () => {
      let caught = false;

      try {
        throw createError.networkError();
      } catch (error) {
        caught = true;
        expect(error).toBeInstanceOf(AvatarSDKError);
        expect((error as AvatarSDKError).code).toBe(ErrorCodes.NETWORK_ERROR);
      }

      expect(caught).toBe(true);
    });

    it('should allow error code comparison', () => {
      const error1 = createError.invalidSignature();
      const error2 = createError.invalidSignature();

      expect(error1.code).toBe(error2.code);
    });

    it('should support pattern matching by error code', () => {
      const errors = [
        createError.fileTooLarge('avatar', 2 * 1024 * 1024),
        createError.invalidSignature(),
        createError.networkError(),
      ];

      const fileErrors = errors.filter(e => e.code === ErrorCodes.FILE_TOO_LARGE);
      const authErrors = errors.filter(e => e.code === ErrorCodes.INVALID_SIGNATURE);

      expect(fileErrors.length).toBe(1);
      expect(authErrors.length).toBe(1);
    });
  });
});

