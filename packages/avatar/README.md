<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-light.png">
  <img alt="Namespace" src="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-dark.png" width="320">
</picture>

# Namespace SDK - ENS Images

[![npm version](https://img.shields.io/npm/v/@thenamespace/avatar.svg)](https://www.npmjs.com/package/@thenamespace/avatar)

## Overview

The `@thenamespace/avatar` provides an easy-to-use client for managing ENS avatar and header images with SIWE authentication. With this SDK, developers can upload, update, and delete avatar and header images for ENS subnames.

## Features

- 🔐 **SIWE Authentication** - Secure Sign-In with Ethereum
- 🌐 **Direct Wallet Integration** - Pass Viem, Ethers, or any wallet client directly - no adapters needed!
- 📱 **Framework Agnostic** - Use with any frontend framework
- 🎯 **TypeScript First** - Full type safety
- ⚡ **Pre-registration Support** - Upload before ENS registration
- 📊 **Progress Tracking** - Real-time upload progress
- 🛡️ **File Validation** - Size limits and format validation

## Getting Started

### Installation

```sh
npm install @thenamespace/avatar
```

### Import the SDK

```typescript
import { createAvatarClient } from "@thenamespace/avatar";
```

### Initialize the Client

```typescript
// 1) Initialize with domain (required)
const client = createAvatarClient({
  domain: "myapp.com", // Your website domain
});

// 2) Configure network
const client = createAvatarClient({
  domain: "myapp.com",
  network: "sepolia", // or "mainnet"
});

// 3) Initialize with provider (automatic signing)
const client = createAvatarClient({
  domain: "myapp.com",
  network: "mainnet",
  provider: walletProvider,
});
```

## Usage

### Automatic Flow (with Provider)

**✨ NEW: Just pass your wallet client directly - no adapters needed!**

#### With Viem

```typescript
import { createAvatarClient } from "@thenamespace/avatar";
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";

const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

// Just pass the viem wallet client directly - no adapter needed!
const client = createAvatarClient({
  domain: "myapp.com",
  network: "mainnet",
  provider: walletClient, // Pass viem wallet client directly
});

// Upload avatar - SDK handles everything
const result = await client.uploadAvatar({
  subname: "myavatar.offchainsub.eth",
  file: avatarFile,
  onProgress: (progress) => console.log(`Upload: ${progress}%`),
});

console.log("Avatar uploaded:", result.url);
```

#### With Ethers.js

```typescript
import { createAvatarClient } from "@thenamespace/avatar";
import { JsonRpcProvider, Wallet } from "ethers";

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(privateKey, provider);

// Just pass the ethers wallet directly - no adapter needed!
const client = createAvatarClient({
  domain: "myapp.com",
  network: "mainnet",
  provider: wallet, // Pass ethers wallet directly
});

// Upload works the same way
const result = await client.uploadAvatar({
  subname: "myavatar.offchainsub.eth",
  file: avatarFile,
});
```

#### With Wagmi (React)

```typescript
import { createAvatarClient } from "@thenamespace/avatar";
import { useWalletClient } from "wagmi";

function MyComponent() {
  const { data: walletClient } = useWalletClient();

  const client = createAvatarClient({
    domain: "myapp.com",
    network: "mainnet",
    provider: walletClient, // Pass wagmi's wallet client directly
  });

  // Use the client...
}
```

#### Custom Provider (Advanced)

If you need to create a custom adapter:

```typescript
const customProvider = {
  getAddress: () => "0x...",
  signMessage: (msg) => signatureFunction(msg),
  getChainId: () => 1,
};

const client = createAvatarClient({
  domain: "myapp.com",
  provider: customProvider,
});
```

### Manual Flow (without Provider)

```typescript
import { createAvatarClient } from "@thenamespace/avatar";

// Initialize without provider
const client = createAvatarClient({
  domain: "myapp.com", // Your website domain
  network: "mainnet",
});

// Get SIWE message (domain automatically used from initialization)
const siweResult = await client.getSIWEMessageForAvatar({
  address: "0x...",
});

// Sign message yourself
const signature = await wallet.signMessage(siweResult.message);

// Upload with signature
const result = await client.uploadAvatarWithSignature({
  subname: "myavatar.offchainsub.eth",
  file: avatarFile,
  message: siweResult.message,
  signature,
  address: "0x...",
});
```

## API Reference

### AvatarClient

#### Constructor

```typescript
createAvatarClient(config?: AvatarSDKConfig): AvatarClient
```

#### Methods

##### Automatic Flow (requires provider)

- `uploadAvatar(options: UploadOptions): Promise<UploadResult>`
- `uploadHeader(options: UploadOptions): Promise<UploadResult>`
- `deleteAvatar(options: DeleteOptions): Promise<DeleteResult>`
- `deleteHeader(options: DeleteOptions): Promise<DeleteResult>`

##### Manual Flow

- `getSIWEMessageForAvatar(options: SIWEMessageOptions): Promise<SIWEMessageResult>`
- `getSIWEMessageForHeader(options: SIWEMessageOptions): Promise<SIWEMessageResult>`
- `uploadAvatarWithSignature(options: UploadWithSignatureOptions): Promise<UploadResult>`
- `uploadHeaderWithSignature(options: UploadWithSignatureOptions): Promise<UploadResult>`
- `deleteAvatarWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult>`
- `deleteHeaderWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult>`

### Configuration

```typescript
interface AvatarSDKConfig {
  domain: string; // Your website domain (required for SIWE authentication)
  apiUrl?: string; // API endpoint (defaults to production)
  network?: "mainnet" | "sepolia"; // Network (defaults to mainnet)
  provider?: WalletProvider; // Optional wallet provider
}
```

### File Validation

- **Avatar**: Max 2MB
- **Header**: Max 5MB
- **Formats**: JPEG, PNG, GIF, WebP

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import { AvatarSDKError, ErrorCodes } from "@thenamespace/avatar";

try {
  await client.uploadAvatar(options);
} catch (error) {
  if (error instanceof AvatarSDKError) {
    switch (error.code) {
      case ErrorCodes.FILE_TOO_LARGE:
        console.log("File is too large");
        break;
      case ErrorCodes.NOT_SUBNAME_OWNER:
        console.log("You do not own this ENS name");
        break;
      case ErrorCodes.INVALID_SIGNATURE:
        console.log("Invalid signature");
        break;
      // ... other error cases
    }
  }
}
```

## Examples

### Viem Integration

```typescript
import { createWalletClient, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { createAvatarClient } from "@thenamespace/avatar";

// Setup Viem
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account: "0x...",
  chain: mainnet,
  transport: http(),
});

// Create SDK
const client = createAvatarClient({
  domain: "myapp.com", // Your website domain
  network: "mainnet",
  provider: {
    getAddress: () => walletClient.account.address,
    signMessage: (msg) => walletClient.signMessage({ message: msg }),
    getChainId: () => walletClient.chain.id,
  },
});

// Upload avatar
const result = await client.uploadAvatar({
  subname: "myavatar.offchainsub.eth",
  file: avatarFile,
  onProgress: (progress) => console.log(`Upload: ${progress}%`),
});
```

### Ethers.js Integration

```typescript
import { BrowserProvider } from "ethers";
import { createAvatarClient } from "@thenamespace/avatar";

// Setup Ethers
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Create SDK
const client = createAvatarClient({
  domain: "myapp.com", // Your website domain
  network: "mainnet",
  provider: {
    getAddress: () => signer.getAddress(),
    signMessage: (msg) => signer.signMessage(msg),
    getChainId: async () => {
      const network = await provider.getNetwork();
      return Number(network.chainId);
    },
  },
});

// Upload header
const result = await client.uploadHeader({
  subname: "myavatar.offchainsub.eth",
  file: headerFile,
});
```

### React Integration

```typescript
import React, { useState } from "react";
import { createAvatarClient } from "@thenamespace/avatar";

export function AvatarUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      const client = createAvatarClient({
        domain: "myapp.com", // Your website domain
        network: "mainnet",
        provider: window.ethereum, // Auto-detects provider
      });

      const result = await client.uploadAvatar({
        subname: "myavatar.offchainsub.eth",
        file,
        onProgress: setProgress,
      });

      setResult(result.url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      {uploading && <div>Uploading... {progress}%</div>}
      {result && <img src={result} alt="Avatar" />}
    </div>
  );
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run test` to ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Links

- [Namespace Website](https://namespace.ninja)
- [Documentation](https://docs.namespace.ninja)
- [GitHub Repository](https://github.com/thenamespace/namespacesdk)
