import { validateEnsName, validateSubname, validateAddress, validateApiKey } from '../src/offchain-client/validation';
import { ChainName } from '../src/dto';
import { ValidationError } from '../src/offchain-client/errors';

describe('Validation Functions', () => {
    describe('validateEnsName', () => {
        it('should validate correct ENS names', () => {
            expect(() => validateEnsName('example.eth')).not.toThrow();
            expect(() => validateEnsName('my-domain.eth')).not.toThrow();
            expect(() => validateEnsName('sub.example.eth')).not.toThrow();
            expect(() => validateEnsName('example-.eth')).not.toThrow(); // Hyphens are valid
            expect(() => validateEnsName('test123.eth')).not.toThrow(); // Numbers are valid
            expect(() => validateEnsName('🚀.eth')).not.toThrow(); // Emojis are valid
            expect(() => validateEnsName('test_underscore.eth')).not.toThrow(); // Underscores are valid
            expect(() => validateEnsName('café.eth')).not.toThrow(); // Accented characters are valid
        });

        it('should reject invalid ENS names', () => {
            expect(() => validateEnsName('')).toThrow(ValidationError);
            expect(() => validateEnsName('example')).toThrow(ValidationError);
            expect(() => validateEnsName('invalid..domain')).toThrow(ValidationError);
            expect(() => validateEnsName('a'.repeat(64) + '.eth')).toThrow(ValidationError);
            expect(() => validateEnsName('.example.eth')).toThrow(ValidationError); // Starts with dot
            expect(() => validateEnsName('example.eth.')).toThrow(ValidationError); // Ends with dot
            expect(() => validateEnsName('Example.eth')).toThrow(ValidationError); // Uppercase not allowed
            expect(() => validateEnsName('test\uFE00.eth')).toThrow(ValidationError); // Variation selector
            expect(() => validateEnsName('test\u200B.eth')).toThrow(ValidationError); // Zero-width space
        });
    });

    describe('validateSubname', () => {
        it('should validate correct subnames', () => {
            expect(() => validateSubname('app.example.eth')).not.toThrow();
            expect(() => validateSubname('user.my-domain.eth')).not.toThrow();
        });

        it('should reject invalid subnames', () => {
            expect(() => validateSubname('')).toThrow(ValidationError);
            expect(() => validateSubname('example.eth')).toThrow(ValidationError);
            expect(() => validateSubname('.example.eth')).toThrow(ValidationError);
            expect(() => validateSubname('invalid..subname')).toThrow(ValidationError);
        });
    });

    describe('validateAddress', () => {
        it('should validate Ethereum addresses', () => {
            const validAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
            expect(() => validateAddress(validAddress, ChainName.Ethereum)).not.toThrow();
            expect(() => validateAddress(validAddress, ChainName.Base)).not.toThrow();
        });

        it('should reject invalid Ethereum addresses', () => {
            expect(() => validateAddress('0x123', ChainName.Ethereum)).toThrow(ValidationError);
            expect(() => validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ChainName.Solana)).toThrow(ValidationError);
        });

        it('should validate Solana addresses', () => {
            const validSolanaAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
            expect(() => validateAddress(validSolanaAddress, ChainName.Solana)).not.toThrow();
        });

        it('should validate Bitcoin addresses', () => {
            const validBtcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
            expect(() => validateAddress(validBtcAddress, ChainName.Bitcoin)).not.toThrow();
        });
    });

    describe('validateApiKey', () => {
        it('should validate valid API keys', () => {
            expect(() => validateApiKey('valid-api-key-123')).not.toThrow();
            expect(() => validateApiKey('a'.repeat(20))).not.toThrow();
        });

        it('should reject invalid API keys', () => {
            expect(() => validateApiKey('')).toThrow(ValidationError);
            expect(() => validateApiKey('short')).toThrow(ValidationError);
            expect(() => validateApiKey('a'.repeat(5))).toThrow(ValidationError);
        });
    });
}); 