# Changelog

All notable changes to the `@thenamespace/offchain-manager` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).






## [1.0.12] - 2026-03-04

Fixed the issue with authentication when custom token is provided

## [1.0.11] - 2026-01-20

Add support for custom headers with api requests toward offchain-manager service

## [1.0.10] - 2025-12-02

### Changed 
- **Monad Mainnet Support**: Updated Monad coin type from `10143` (testnet) to `143` (mainnet) for production network compatibility

## [1.0.9] - 2025-10-28

###Added:    
- **New Blockchain Support**: Added support for Push Testnet (Chain ID: 42101)

## [1.0.8] - 2025-10-20

## [1.0.8]
- 2025-10-21 

### Added 
- **`setDefaultEvmAddress` method**: Set a default EVM address for all EVM-compatible chains with a single call
- **EVM chain metadata**: Added `evm` flag to chain metadata for EVM compatibility identification 

### Enhanced 
- **Developer Experience**: Updated README and examples with `setDefaultEvmAddress` usage
- **Multi-chain Support**: Method supports 17 EVM chains (Ethereum, Arbitrum, Optimism, Base, Polygon, BSC, Avalanche, Gnosis, zkSync, Linea, Scroll, Unichain, Berachain, WorldChain, Zora, Celo, Monad)

## [1.0.7] - 2025-10-16

### Added

- **Default EVM chain**: Supported default chain introduced in ENSIP 19 with chainId = 0

## [1.0.6] - 2025-10-16

### Added

- **New Blockchain Support**: Added support for Monad

## [1.0.5] - 2025-08-21

### Added

- Optional API key configuration during client initialization (`defaultApiKey`, `domainApiKeys`)
- Support for no-parameter client creation (defaults to mainnet)

### Enhanced

- Improved developer experience with inline API key setup
- Updated documentation and examples

## [1.0.4] - 2025-08-20

### Fixed

- **Coin Type Corrections**:
- Fixed Sui coin type from `101` to `784` (correct SLIP-44 identifier)
- Fixed Starknet coin type from `234567891` to `9004` (correct SLIP-44 identifier)
- Updated test script to include Sui address validation testing

### Testing

- **Enhanced Test Coverage**:
- Added Sui address record testing in manual test suite
- Improved validation for blockchain-specific coin types

## [1.0.3] - 2025-08-19

### Added

- **New Blockchain Support**: Added support for 7 new blockchain networks:
  - Unichain
  - Berachain
  - WorldChain
  - Zora
  - Celo
  - Aptos
  - Algorand

### Enhanced

- **Improved Address Validation**:
  - Enhanced Starknet address validation to support variable-length hex addresses (1-64 characters)
  - Improved Bitcoin address validation to support Legacy (P2PKH), Script (P2SH), Bech32 (P2WPKH/P2WSH), and Taproot (P2TR) formats
  - Updated Cosmos address validation to use proper bech32 format with 'cosmos1' prefix
  - Enhanced NEAR address validation to support both implicit accounts (64 hex chars) and named accounts (.near)
  - Improved Sui address validation to support variable-length hex addresses (1-64 characters)
  - Added Aptos address validation with variable-length hex support
  - Added Algorand address validation using Base32 format (58 characters)

### Testing

- **Comprehensive Test Coverage**:
  - Added validation tests for all new blockchain chains
  - Enhanced Bitcoin address validation tests with multiple format support
  - Added Starknet address validation tests for both full and shortened addresses
  - Added Cosmos, NEAR, Sui, Aptos, and Algorand address validation tests
  - Added EVM-compatible chain address validation tests

## [1.0.2] - 2025-08-05

### Documentation

- **Enhanced README.md**:
  - Added Supported Chains section with quick reference to available blockchain networks
  - Added Error Handling section with try-catch examples and specific error classes

## [1.0.0] - 2025-08-05

### Changed

- **BREAKING**: Package name changed from `@namespacesdk/offchain-manager` to `@thenamespace/offchain-manager`
- Enhanced package description for better discoverability
- Updated repository information and added homepage
- Added comprehensive keywords (ens, ethereum, subnames, domains, web3, sdk, etc.)
- Added engines specification requiring Node.js >=16.0.0
- Added publishConfig for public access

### Documentation

- **Enhanced README.md**:
  - Added comprehensive API key types documentation (Address-based vs Domain-based)
  - Updated all code examples with new package name
  - Improved environment setup instructions
  - Added mixed usage examples for API keys
  - Updated Namespace Dev Portal section with API key type explanations
- **Improved TESTING.md**:
  - Updated title and package references
  - Fixed environment configuration examples
  - Updated CI/CD workflow examples
  - Improved code formatting and consistency

### Package Improvements

- Repository field with proper GitHub organization link
- Homepage field pointing to namespace.ninja
- Bugs field for issue tracking
- PublishConfig for NPM organization publishing
- Enhanced metadata for better package discovery

### Fixed

- All import statements updated to use new package name
- Documentation consistency across all files
- Package.json validation and best practices compliance
