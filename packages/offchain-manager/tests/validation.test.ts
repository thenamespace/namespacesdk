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
            // Legacy P2PKH addresses
            const validBtcLegacy = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
            expect(() => validateAddress(validBtcLegacy, ChainName.Bitcoin)).not.toThrow();
            
            // P2SH addresses
            const validBtcP2SH = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
            expect(() => validateAddress(validBtcP2SH, ChainName.Bitcoin)).not.toThrow();
            
            // Bech32 addresses
            const validBtcBech32 = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            expect(() => validateAddress(validBtcBech32, ChainName.Bitcoin)).not.toThrow();
        });

        it('should validate Starknet addresses', () => {
            // Full 64-character address
            const validStarknetFull = '0x1234567890123456789012345678901234567890123456789012345678901234';
            expect(() => validateAddress(validStarknetFull, ChainName.Starknet)).not.toThrow();
            
            // Shortened address (leading zeros omitted)
            const validStarknetShort = '0x123456789012345678901234567890123456789012345678901234567890123';
            expect(() => validateAddress(validStarknetShort, ChainName.Starknet)).not.toThrow();
        });

        it('should validate Cosmos addresses', () => {
            const validCosmosAddress = 'cosmos1edr3tkta8y3pqz9py3dpwhmhsvuzr3dqnl2wdm';
            expect(() => validateAddress(validCosmosAddress, ChainName.Cosmos)).not.toThrow();
        });

        it('should validate NEAR addresses', () => {
            // Named account
            const validNearNamed = 'alice.near';
            expect(() => validateAddress(validNearNamed, ChainName.Near)).not.toThrow();
            
            // Implicit account (64 hex characters)
            const validNearImplicit = '1234567890123456789012345678901234567890123456789012345678901234';
            expect(() => validateAddress(validNearImplicit, ChainName.Near)).not.toThrow();
        });

        it('should validate Sui addresses', () => {
            // Full 64-character address
            const validSuiFull = '0x556a3c6c150709c0a8486e3eb002ea8118ba79bdf349e710dc3bb85901f797c3';
            expect(() => validateAddress(validSuiFull, ChainName.Sui)).not.toThrow();
            
            // Shortened address (leading zeros omitted)
            const validSuiShort = '0x123456789012345678901234567890123456789012345678901234567890123';
            expect(() => validateAddress(validSuiShort, ChainName.Sui)).not.toThrow();
        });

        it('should validate Aptos addresses', () => {
            // Full 64-character address
            const validAptosFull = '0x1234567890123456789012345678901234567890123456789012345678901234';
            expect(() => validateAddress(validAptosFull, ChainName.Aptos)).not.toThrow();
            
            // Shortened address (leading zeros omitted)
            const validAptosShort = '0x123456789012345678901234567890123456789012345678901234567890123';
            expect(() => validateAddress(validAptosShort, ChainName.Aptos)).not.toThrow();
        });

        it('should validate Algorand addresses', () => {
            const validAlgorandAddress = 'L4BTUQ5FVCKHSQYYXOG2HPH3EKK4VXZSXK7FQBDWPRR3YJ5RQ6DVSBARDQ';
            expect(() => validateAddress(validAlgorandAddress, ChainName.Algorand)).not.toThrow();
        });

        it('should validate Polkadot addresses', () => {
            // SS58 prefix 0 — Polkadot addresses are 47-48 chars and start with "1"
            // (computed via @polkadot/util-crypto encodeAddress(pubkey, 0))
            const validDot1 = '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';
            const validDot2 = '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3';
            expect(() => validateAddress(validDot1, ChainName.Polkadot)).not.toThrow();
            expect(() => validateAddress(validDot2, ChainName.Polkadot)).not.toThrow();
        });

        it('should reject invalid Polkadot addresses', () => {
            // Vara address (wrong leading "kG")
            expect(() => validateAddress('kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW', ChainName.Polkadot)).toThrow(ValidationError);
            // Too short
            expect(() => validateAddress('1FRM', ChainName.Polkadot)).toThrow(ValidationError);
            // EVM-style address rejected
            expect(() => validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ChainName.Polkadot)).toThrow(ValidationError);
        });

        it('should validate Vara Network addresses', () => {
            // SS58 prefix 137 — Vara addresses always start with "kG" and are 49 chars long
            // (computed via @polkadot/util-crypto encodeAddress(pubkey, 137))
            const validVaraAddress = 'kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW';
            expect(() => validateAddress(validVaraAddress, ChainName.Vara)).not.toThrow();
            const anotherValidVara = 'kGfXzQ99jakxFMQEox9iQYQ6zfMkwScJTScuPLSovqxjPbkXW';
            expect(() => validateAddress(anotherValidVara, ChainName.Vara)).not.toThrow();
        });

        it('should reject invalid Vara Network addresses', () => {
            // Polkadot address (SS58 prefix 0, leading "1")
            expect(() => validateAddress('15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5', ChainName.Vara)).toThrow(ValidationError);
            // Too short
            expect(() => validateAddress('kGfo5pfYwgDbm3yKBV4', ChainName.Vara)).toThrow(ValidationError);
            // EVM-style address rejected
            expect(() => validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ChainName.Vara)).toThrow(ValidationError);
        });

        it('should validate EVM-compatible chain addresses', () => {
            const validEVMAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
            
            // Test all EVM-compatible chains
            expect(() => validateAddress(validEVMAddress, ChainName.Unichain)).not.toThrow();
            expect(() => validateAddress(validEVMAddress, ChainName.Berachain)).not.toThrow();
            expect(() => validateAddress(validEVMAddress, ChainName.WorldChain)).not.toThrow();
            expect(() => validateAddress(validEVMAddress, ChainName.Zora)).not.toThrow();
            expect(() => validateAddress(validEVMAddress, ChainName.Celo)).not.toThrow();
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