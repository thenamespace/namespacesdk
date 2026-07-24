---
name: avatar-sdk
description: Upload, update, and delete ENS avatar and header images with SIWE v4 authentication using the @thenamespace/avatar SDK. Use whenever working with ENS profile images, avatar/header uploads or deletes, SIWE (Sign In With Ethereum) signing flows, Viem/Ethers/wagmi wallet integration for image management, or the Namespace Metadata Service profile media routes — even if the user just says "upload a profile pic" or "set an ENS avatar".
---

# Namespace Avatar SDK (v2)

This skill helps you work with the `@thenamespace/avatar` SDK to manage ENS
avatar and header images. v2 adds **SIWE v4** (smart-contract wallet support),
a **compact header route**, **automatic network/chain enforcement**, and a
**normalized upload result** with a stable `url` field.

## What the SDK does

- **Upload / delete avatar and header images** for ENS subnames
- **SIWE v4 authentication** — works for EOAs *and* deployed smart-contract
  wallets. The SDK does **not** do client-side ERC-6492 handling; it passes the
  signature straight through to the Metadata Service, which verifies it.
- **Direct wallet integration** — pass a Viem `WalletClient`, Ethers
  `Wallet`/`Signer`, or any `WalletProvider` directly. No adapters to write.
- **Automatic + manual flows** — provider signs for you, or you sign yourself.
- **Network enforcement** — before any automatic op it checks the wallet's chain
  matches the configured network and switches it if the wallet supports that.
- **Progress tracking** and **file validation** (size + format).

## Installation

```bash
npm install @thenamespace/avatar
# peer: viem or ethers (only if you use one as your provider)
```

## Quick start (automatic flow)

```typescript
import { createAvatarClient } from '@thenamespace/avatar';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const walletClient = createWalletClient({
  // Load secrets from your environment or secret manager; never hard-code them.
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
  chain: mainnet,
  transport: http(),
});

const client = createAvatarClient({
  network: 'mainnet',        // 'mainnet' (default) | 'sepolia'
  domain: 'yourapp.com',     // required for SIWE
  provider: walletClient,    // viem / ethers / WalletProvider — passed directly
});

const result = await client.uploadAvatar({
  subname: 'alice.namespace.eth',
  file: avatarFile,          // File (browser) or Buffer (Node)
  onProgress: (p) => console.log(`Upload: ${p.toFixed(0)}%`),
});

console.log(result.url);     // stable public URL
```

The automatic flow uses the `domain` from initialization — you don't pass it
per-call. Before signing, the SDK compares `provider.getChainId()` with the
configured network (mainnet = `1`, sepolia = `11155111`) and calls
`provider.switchChain()` if available; if the wallet can't be switched it throws
`PROVIDER_CHAIN_MISMATCH` *before* requesting a nonce or signing.

## Core API

### Upload avatar / header

```typescript
const avatar = await client.uploadAvatar({ subname, file, onProgress });
const header = await client.uploadHeader({ subname, file, onProgress });

// avatar: AvatarUploadResult  ->  { url, avatarUrl, ... }
// header: HeaderUploadResult  ->  { url, headerUrl, ... }
```

`uploadAvatar` returns `AvatarUploadResult` (with `avatarUrl`); `uploadHeader`
returns `HeaderUploadResult` (with `headerUrl`). `url` is a stable alias the SDK
normalizes to whichever of those the Metadata Service returned. The SDK validates
that the returned URL is well-formed `http(s)`; if the service omits it or
returns garbage it throws `API_ERROR` with status `502`.

### Delete avatar / header

```typescript
await client.deleteAvatar({ subname });
await client.deleteHeader({ subname });
// -> { message, deletedAt }
```

## Manual flow (custom signing / server-side)

For server-side usage or when you control signing yourself:

```typescript
const client = createAvatarClient({ network: 'mainnet', domain: 'yourapp.com' });

// 1. Get the SIWE message (nonce fetched from the service for you)
const siwe = await client.getSIWEMessageForAvatar({
  address: '0x1234...',
  // domain: optional, defaults to the configured domain
  // chainId: optional, defaults to the network's chain id
});
// -> { message, nonce, expiresAt }

// 2. Sign it yourself
const signature = await wallet.signMessage(siwe.message);

// 3. Submit with the pre-signed message
const result = await client.uploadAvatarWithSignature({
  subname: 'alice.namespace.eth',
  file: avatarFile,
  message: siwe.message,
  signature,
  address: '0x1234...',
});
```

There are `avatar` and `header` variants of each manual method:
`getSIWEMessageForHeader`, `uploadHeaderWithSignature`,
`deleteAvatarWithSignature`, `deleteHeaderWithSignature`. The SIWE statement is
`'Authorize a metadata update'`; nonce scope is `avatar` or `header`.

## Wallet support

Pass any of these directly as `provider` — the SDK detects and adapts them:

- **Viem** `WalletClient` (reads `account.address`, `chain.id`, `signMessage`, and `switchChain` if present)
- **Ethers** `Wallet` / `Signer` (v5 or v6 — `address` property or `getAddress()`)
- **wagmi** `walletClient` from `useWalletClient()`
- **A custom `WalletProvider`** object:

```typescript
const provider = {
  getAddress: async () => '0x...',
  signMessage: async (msg: string) => '0xsignature...',
  getChainId: async () => 1,
  switchChain: async (chainId: number) => { /* optional */ },
};
```

`switchChain` is optional. If omitted and the wallet is on the wrong network,
the SDK throws `PROVIDER_CHAIN_MISMATCH` instead of switching.

## Configuration

```typescript
interface AvatarSDKConfig {
  domain: string;                 // required — your app domain, used in SIWE
  network?: 'mainnet' | 'sepolia';// default 'mainnet'
  apiUrl?: string;                // default https://metadata.namespace.ninja
  provider?: WalletProvider | any;// viem / ethers / WalletProvider
}
```

Chain IDs: mainnet → `1`, sepolia → `11155111`. An explicit `chainId` passed to
a manual message method must match the configured network or the Metadata
Service rejects the mutation.

## File constraints

| Type   | Max size | Formats |
|--------|----------|---------|
| Avatar | 2 MB     | JPEG, PNG, GIF, WebP, SVG |
| Header | 5 MB     | JPEG, PNG, GIF, WebP, SVG |

```typescript
import { AVATAR_MAX_SIZE, HEADER_MAX_SIZE, ALLOWED_FORMATS } from '@thenamespace/avatar';
// ALLOWED_FORMATS = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml']
```

For `Buffer` inputs the SDK can only check size (no MIME type available), so
format validation applies to browser `File` objects.

## Metadata Service routes

| Mutation | Route |
|----------|-------|
| Avatar upload/delete | `/profile/{network}/{subname}/avatar` |
| Header upload/delete | `/profile/{network}/{subname}/h` |

Header mutations use the **compact `/h` route**, but the multipart field name,
SIWE nonce scope, and SIWE verification action remain `header`. Uploads send
`siweMessage`, `siweSignature`, `address` plus the media file; deletes send the
same three fields as JSON.

## Error handling

```typescript
import { AvatarSDKError, ErrorCodes } from '@thenamespace/avatar';

try {
  await client.uploadAvatar({ subname, file });
} catch (error) {
  if (error instanceof AvatarSDKError) {
    switch (error.code) {
      case ErrorCodes.PROVIDER_CHAIN_MISMATCH:
        // wallet on wrong network and can't be switched
      case ErrorCodes.INVALID_SIGNATURE:
      case ErrorCodes.NOT_SUBNAME_OWNER:
      case ErrorCodes.EXPIRED_NONCE:
      case ErrorCodes.FILE_TOO_LARGE:
      case ErrorCodes.INVALID_FILE_FORMAT:
      case ErrorCodes.MISSING_PROVIDER:
      case ErrorCodes.UPLOAD_FAILED:
      case ErrorCodes.DELETE_FAILED:
      case ErrorCodes.NETWORK_ERROR:
      case ErrorCodes.API_ERROR:
        // error.status, error.serviceCode, error.details carry the service envelope
    }
  }
}
```

Service failures are normalized to `AvatarSDKError` with code `API_ERROR`; the
HTTP `status`, service `serviceCode`, and structured `details` are preserved on
the error. Axios errors are sanitized so SIWE signatures in request bodies are
not leaked through `originalError`.

For the full type list and every export, see [reference.md](reference.md). For
complete working examples (Viem, Ethers, React, manual flow, testnet), see
[examples.md](examples.md).
