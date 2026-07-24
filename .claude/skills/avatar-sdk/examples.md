# Avatar SDK Examples

Complete working examples for `@thenamespace/avatar`.

## Example 1: Basic Avatar Upload (Viem)

```typescript
import { createAvatarClient } from '@thenamespace/avatar';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';

async function uploadAvatar() {
  // Setup wallet
  // Load secrets from your environment or secret manager; never hard-code them.
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
  });

  // Initialize client
  const client = createAvatarClient({
    network: 'mainnet',
    domain: 'myapp.com',
    provider: walletClient
  });

  // Read file (Node.js)
  const fileBuffer = fs.readFileSync('./avatar.png');

  // Upload with progress tracking
  const result = await client.uploadAvatar({
    subname: 'alice.namespace.eth',
    file: fileBuffer,
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress.toFixed(1)}%`);
    }
  });

  console.log('✓ Avatar uploaded!');
  console.log(`  URL: ${result.url}`);
  console.log(`  Size: ${result.fileSize} bytes`);
  console.log(`  Uploaded at: ${result.uploadedAt}`);
}

uploadAvatar();
```

## Example 2: Browser File Upload

```typescript
import { createAvatarClient } from '@thenamespace/avatar';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';

async function browserUpload(file: File) {
  // Use browser wallet (MetaMask, etc.)
  const walletClient = createWalletClient({
    chain: mainnet,
    transport: custom(window.ethereum)
  });

  const [address] = await walletClient.getAddresses();

  const client = createAvatarClient({
    network: 'mainnet',
    domain: window.location.hostname,
    provider: walletClient
  });

  // Validate file before upload (avatar max is 2MB; header max is 5MB)
  const AVATAR_MAX = 2 * 1024 * 1024;
  if (file.size > AVATAR_MAX) {
    throw new Error(`File too large (max ${AVATAR_MAX / (1024 * 1024)}MB)`);
  }

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Upload
  const result = await client.uploadAvatar({
    subname: 'myname.namespace.eth',
    file: file,
    onProgress: (progress) => {
      document.getElementById('progress')!.textContent = `${progress.toFixed(0)}%`;
    }
  });

  return result.url;
}

// Usage with file input
document.getElementById('fileInput')?.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const url = await browserUpload(file);
    console.log('Uploaded:', url);
  }
});
```

## Example 3: Upload Header Image

```typescript
import { createAvatarClient } from '@thenamespace/avatar';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

async function uploadHeader() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
  });

  const client = createAvatarClient({
    network: 'mainnet',
    domain: 'myapp.com',
    provider: walletClient
  });

  // Upload header (typically larger/wider image)
  const result = await client.uploadHeader({
    subname: 'alice.namespace.eth',
    file: headerBuffer,
    onProgress: (p) => console.log(`Header upload: ${p}%`)
  });

  console.log('Header URL:', result.url);
}
```

## Example 4: Manual SIWE Flow (Server-Side)

For server-side applications or when you need custom signing:

```typescript
import { createAvatarClient } from '@thenamespace/avatar';
import { Wallet } from 'ethers';

async function manualSIWEFlow() {
  // Client without provider (manual mode)
  const client = createAvatarClient({
    network: 'sepolia',
    domain: 'api.myapp.com'
  });

  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  const address = await wallet.getAddress();

  // Step 1: Get SIWE message
  console.log('Getting SIWE message...');
  const siweResult = await client.getSIWEMessageForAvatar({
    address: address,
    // chainId omitted: resolves from configured Sepolia network (11155111)
  });

  // Never log the SIWE message or signature.
  console.log('SIWE message prepared');
  console.log('Expires:', new Date(siweResult.expiresAt).toISOString());

  // Step 2: Sign the message
  console.log('Signing message...');
  const signature = await wallet.signMessage(siweResult.message);

  // Step 3: Upload with signature
  console.log('Uploading avatar...');
  const result = await client.uploadAvatarWithSignature({
    subname: 'test.namespace.eth',
    file: avatarBuffer,
    message: siweResult.message,
    signature: signature,
    address: address,
    onProgress: (p) => console.log(`${p}%`)
  });

  console.log('✓ Uploaded:', result.url);
}
```

## Example 5: Delete Avatar and Header

```typescript
import { createAvatarClient } from '@thenamespace/avatar';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

async function deleteImages() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
  });

  const client = createAvatarClient({
    network: 'mainnet',
    domain: 'myapp.com',
    provider: walletClient
  });

  const subname = 'alice.namespace.eth';

  // Delete avatar
  const avatarResult = await client.deleteAvatar({ subname });
  console.log(`Avatar deleted at: ${avatarResult.deletedAt}`);

  // Delete header
  const headerResult = await client.deleteHeader({ subname });
  console.log(`Header deleted at: ${headerResult.deletedAt}`);
}
```

## Example 6: Error Handling

```typescript
import { createAvatarClient, AvatarSDKError, ErrorCodes } from '@thenamespace/avatar';

async function uploadWithErrorHandling() {
  const client = createAvatarClient({
    network: 'mainnet',
    domain: 'myapp.com',
    provider: walletClient
  });

  try {
    const result = await client.uploadAvatar({
      subname: 'alice.namespace.eth',
      file: avatarFile
    });
    console.log('Success:', result.url);
  } catch (error) {
    if (error instanceof AvatarSDKError) {
      console.error(`Error [${error.code}]: ${error.message}`);

      switch (error.code) {
        case ErrorCodes.NOT_SUBNAME_OWNER:
          console.error('You must own this subname to upload images');
          break;
        case ErrorCodes.PROVIDER_CHAIN_MISMATCH:
          console.error('Wallet is on the wrong network — switch to the configured chain');
          break;
        case ErrorCodes.EXPIRED_NONCE:
          console.error('Session expired, please try again');
          break;
        case ErrorCodes.FILE_TOO_LARGE:
          console.error('Please use a smaller image (avatar ≤ 2MB, header ≤ 5MB)');
          break;
        case ErrorCodes.INVALID_FILE_FORMAT:
        case ErrorCodes.INVALID_FILE_TYPE:
          console.error('Please use JPEG, PNG, GIF, WebP, or SVG');
          break;
        case ErrorCodes.MISSING_PROVIDER:
          console.error('Wallet provider required for automatic signing');
          break;
        case ErrorCodes.API_ERROR:
          console.error(`Service error ${error.status}: ${error.message}`, error.details);
          break;
        default:
          console.error('Upload failed, please try again');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

## Example 7: Testnet (Sepolia) Upload

```typescript
import { createAvatarClient } from '@thenamespace/avatar';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

async function testnetUpload() {
  const account = privateKeyToAccount(process.env.SEPOLIA_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http()
  });

  // Use sepolia network
  const client = createAvatarClient({
    network: 'sepolia',
    domain: 'test.myapp.com',
    provider: walletClient
  });

  const result = await client.uploadAvatar({
    subname: 'test.namespace.eth',
    file: testAvatar
  });

  console.log('Testnet avatar URL:', result.url);
}
```

## Example 8: Upload Both Avatar and Header

```typescript
import { createAvatarClient } from '@thenamespace/avatar';

async function uploadProfileImages(
  avatarFile: File | Buffer,
  headerFile: File | Buffer,
  subname: string
) {
  const client = createAvatarClient({
    network: 'mainnet',
    domain: 'myapp.com',
    provider: walletClient
  });

  console.log(`Uploading profile images for ${subname}...`);

  // Upload avatar
  const avatarResult = await client.uploadAvatar({
    subname,
    file: avatarFile,
    onProgress: (p) => console.log(`Avatar: ${p.toFixed(0)}%`)
  });

  // Upload header
  const headerResult = await client.uploadHeader({
    subname,
    file: headerFile,
    onProgress: (p) => console.log(`Header: ${p.toFixed(0)}%`)
  });

  return {
    avatar: avatarResult.url,
    header: headerResult.url
  };
}
```

## Example 9: Custom Wallet Provider

```typescript
import { createAvatarClient, WalletProvider } from '@thenamespace/avatar';

// Custom provider (e.g., for hardware wallets)
const customProvider: WalletProvider = {
  getAddress: async () => {
    // Return address from your custom wallet
    return '0x1234567890123456789012345678901234567890';
  },
  signMessage: async (message: string) => {
    // Sign with your custom wallet
    const signature = await myHardwareWallet.sign(message);
    return signature;
  },
  getChainId: async () => {
    return 1; // Mainnet
  },
  // Optional: lets the SDK switch chains automatically instead of
  // throwing PROVIDER_CHAIN_MISMATCH when the wallet is on the wrong network.
  switchChain: async (chainId: number) => {
    await myHardwareWallet.switchChain(chainId);
  }
};

const client = createAvatarClient({
  network: 'mainnet',
  domain: 'myapp.com',
  provider: customProvider
});

// Use normally
const result = await client.uploadAvatar({
  subname: 'secure.namespace.eth',
  file: avatarFile
});
```

## Example 10: Smart-contract wallet + normalized result (v2)

SIWE v4 accepts signatures from deployed smart-contract wallets (Safe,
account-abstraction signers, etc.) with no extra wiring — the SDK forwards the
signature to the Metadata Service, which verifies it on-chain. Just pass the
wallet's signer as the `provider` like any other wallet.

```typescript
import { createAvatarClient, AvatarUploadResult, HeaderUploadResult } from '@thenamespace/avatar';

// `signer` here is whatever your smart-contract wallet exposes for SIWE
// signing (for example, a signer for a deployed Safe or contract wallet).
const client = createAvatarClient({
  network: 'mainnet',
  domain: 'myapp.com',
  provider: signer,
});

const avatar: AvatarUploadResult = await client.uploadAvatar({
  subname: 'alice.namespace.eth',
  file: avatarFile,
});

// v2 result: `url` is a stable alias; the canonical field is also exposed.
console.log(avatar.url);        // stable public URL
console.log(avatar.avatarUrl);  // same value, canonical avatar URL

const header: HeaderUploadResult = await client.uploadHeader({
  subname: 'alice.namespace.eth',
  file: headerFile,
});

console.log(header.url);        // stable public URL
console.log(header.headerUrl);  // canonical header URL (compact /h route)
```

Before each automatic upload/delete, the SDK checks `signer.getChainId()`
against the configured network and calls `signer.switchChain()` if available —
so smart-contract wallets on the wrong chain fail fast with
`PROVIDER_CHAIN_MISMATCH` rather than producing a signature the service will
reject.
