# Avatar SDK Changelog


## [2.0.0] - 2026-07-24

## Added 
- Added SIWE v4 authentication support.
- Added wallet-chain validation before automatic signing.
- Added automatic network switching when supported by the wallet provider.
- Added explicit `avatarUrl` and `headerUrl` response fields.
- Added header media operations through the `/h` endpoint.  ## Changed 
- Mainnet is now the default network; Sepolia must be explicitly configured.
- Header upload and deletion now use the compact `/h` endpoint.
- API failures now use consistent normalized SDK errors.
- The legacy `url` response field remains available for backward compatibility.  ## Fixed 
- Prevented signed SIWE request data from leaking through SDK errors or debug logs.
- Rejected malformed and unsafe media URLs.
- Corrected the SIWE chain ID used when Sepolia is configured.

## [1.0.0] - 2025-11-04

### Added - Initial Release  #### Core Features - **AvatarClient** - Main client for managing ENS avatar and header images - **SIWE Authentication** - Secure Sign-In with Ethereum integration - **Dual Workflow Support**: Automatic flow with wallet provider integration and manual flow for custom signing  #### Wallet Integration - **Direct Viem Support** - Pass WalletClient directly without adapters - **Direct Ethers Support** - Compatible with both Ethers v5 and v6 - **Wagmi Integration** - Works seamlessly with useWalletClient hook - **Custom Provider Interface** - Support for any wallet implementation  #### Image Management - **Avatar Upload** - Upload avatar images (max 2MB) - **Header Upload** - Upload header images (max 5MB) - **Avatar Deletion** - Delete existing avatar images - **Header Deletion** - Delete existing header images - **Progress Tracking** - Real-time upload progress callbacks - **Format Support** - JPEG, PNG, GIF, WebP  #### Validation & Security - **File Validation** - Automatic size and format validation - **Subname Validation** - ENS name format checking - **Address Validation** - Ethereum address validation - **Nonce Management** - Automatic nonce generation and expiration handling - **Network Support** - Mainnet and Sepolia networks  #### API Methods - Automatic flow: uploadAvatar, uploadHeader, deleteAvatar, deleteHeader - Manual flow: getSIWEMessageForAvatar, getSIWEMessageForHeader, uploadAvatarWithSignature, uploadHeaderWithSignature, deleteAvatarWithSignature, deleteHeaderWithSignature  #### Developer Experience - **TypeScript First** - Full type safety and IntelliSense support - **Framework Agnostic** - Works with any JavaScript framework - **Zero Config** - Sensible defaults for quick setup - **Comprehensive Documentation** - README, JSDoc comments, and multiple examples


All notable changes to the `@thenamespace/avatar` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
