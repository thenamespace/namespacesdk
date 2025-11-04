# Avatar SDK Changelog

## [1.0.0] - 2025-11-04

### Added - Initial Release  #### Core Features - **AvatarClient** - Main client for managing ENS avatar and header images - **SIWE Authentication** - Secure Sign-In with Ethereum integration - **Dual Workflow Support**: Automatic flow with wallet provider integration and manual flow for custom signing  #### Wallet Integration - **Direct Viem Support** - Pass WalletClient directly without adapters - **Direct Ethers Support** - Compatible with both Ethers v5 and v6 - **Wagmi Integration** - Works seamlessly with useWalletClient hook - **Custom Provider Interface** - Support for any wallet implementation  #### Image Management - **Avatar Upload** - Upload avatar images (max 2MB) - **Header Upload** - Upload header images (max 5MB) - **Avatar Deletion** - Delete existing avatar images - **Header Deletion** - Delete existing header images - **Progress Tracking** - Real-time upload progress callbacks - **Format Support** - JPEG, PNG, GIF, WebP  #### Validation & Security - **File Validation** - Automatic size and format validation - **Subname Validation** - ENS name format checking - **Address Validation** - Ethereum address validation - **Nonce Management** - Automatic nonce generation and expiration handling - **Network Support** - Mainnet and Sepolia networks  #### API Methods - Automatic flow: uploadAvatar, uploadHeader, deleteAvatar, deleteHeader - Manual flow: getSIWEMessageForAvatar, getSIWEMessageForHeader, uploadAvatarWithSignature, uploadHeaderWithSignature, deleteAvatarWithSignature, deleteHeaderWithSignature  #### Developer Experience - **TypeScript First** - Full type safety and IntelliSense support - **Framework Agnostic** - Works with any JavaScript framework - **Zero Config** - Sensible defaults for quick setup - **Comprehensive Documentation** - README, JSDoc comments, and multiple examples


All notable changes to the `@thenamespace/avatar` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
