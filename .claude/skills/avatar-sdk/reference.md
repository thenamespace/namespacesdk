# Avatar SDK API Reference (v2)

Type definitions and exports for `@thenamespace/avatar`.

## Exports

```typescript
import {
  // Main factory + client
  createAvatarClient,
  AvatarClient,

  // Config + wallet types
  AvatarSDKConfig,
  WalletProvider,

  // Upload / delete types
  UploadOptions,
  UploadResult,
  AvatarUploadResult,
  HeaderUploadResult,
  DeleteOptions,
  DeleteResult,

  // SIWE types
  SIWEMessageOptions,
  SIWEMessageResult,
  UploadWithSignatureOptions,
  DeleteWithSignatureOptions,
  NonceRequest,
  NonceResponse,

  // Error handling
  AvatarSDKError,
  ErrorCodes,
  createError,

  // Validation utilities
  validateFile,
  validateSubname,
  validateAddress,
  validateSIWEOptionsResolved,
  AVATAR_MAX_SIZE,
  HEADER_MAX_SIZE,
  ALLOWED_FORMATS,

  // SIWE utilities
  generateSIWEMessage,
  createAvatarNonceRequest,
  createHeaderNonceRequest,
  createCombinedNonceRequest,
  isNonceExpired,
  getDefaultChainId,

  // Wallet adapter (advanced)
  adaptWallet,
} from '@thenamespace/avatar';
```

## AvatarSDKConfig

```typescript
interface AvatarSDKConfig {
  /** API URL for the avatar service (defaults to production) */
  apiUrl?: string;
  /** Network: 'mainnet' (default) or 'sepolia' */
  network?: 'mainnet' | 'sepolia';
  /** Your app domain — required for SIWE authentication */
  domain: string;
  /** Wallet provider: Viem WalletClient, Ethers Wallet/Signer, or WalletProvider */
  provider?: WalletProvider | any;
}
```

## WalletProvider

```typescript
interface WalletProvider {
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
  getChainId(): Promise<number>;
  /** Optional — if present, the SDK will try to switch the wallet to the
   *  configured network before raising PROVIDER_CHAIN_MISMATCH. */
  switchChain?(chainId: number): Promise<void>;
}
```

## AvatarClient

```typescript
interface AvatarClient {
  // Automatic flow (requires provider)
  uploadAvatar(options: UploadOptions): Promise<AvatarUploadResult>;
  uploadHeader(options: UploadOptions): Promise<HeaderUploadResult>;
  deleteAvatar(options: DeleteOptions): Promise<DeleteResult>;
  deleteHeader(options: DeleteOptions): Promise<DeleteResult>;

  // Manual flow (custom / server-side signing)
  getSIWEMessageForAvatar(options: SIWEMessageOptions): Promise<SIWEMessageResult>;
  getSIWEMessageForHeader(options: SIWEMessageOptions): Promise<SIWEMessageResult>;
  uploadAvatarWithSignature(options: UploadWithSignatureOptions): Promise<AvatarUploadResult>;
  uploadHeaderWithSignature(options: UploadWithSignatureOptions): Promise<HeaderUploadResult>;
  deleteAvatarWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult>;
  deleteHeaderWithSignature(options: DeleteWithSignatureOptions): Promise<DeleteResult>;
}
```

## Upload types

### UploadOptions

```typescript
interface UploadOptions {
  /** ENS subname (e.g. 'alice.namespace.eth') */
  subname: string;
  /** Browser File or Node.js Buffer */
  file: File | Buffer;
  /** Upload progress callback (0–100) */
  onProgress?: (progress: number) => void;
}
```

### UploadResult

```typescript
interface UploadResult {
  /** Stable SDK alias — normalized from avatarUrl / headerUrl */
  url: string;
  /** Avatar URL returned by the Metadata Service (avatar uploads) */
  avatarUrl?: string;
  /** Compact header URL returned by the Metadata Service (header uploads) */
  headerUrl?: string;
  /** Subname echoed back by the service */
  subname?: string;
  /** Network echoed back by the service */
  network?: 'mainnet' | 'sepolia';
  /** Upload timestamp (ISO 8601) */
  uploadedAt: string;
  /** File size in bytes */
  fileSize: number;
  /** Whether this updated an existing image */
  isUpdate: boolean;
  /** Whether the upload is pending (unregistered names) */
  pending?: boolean;
  /** Optional server message */
  message?: string;
}

interface AvatarUploadResult extends UploadResult {
  avatarUrl: string; // canonical public avatar URL
}

interface HeaderUploadResult extends UploadResult {
  headerUrl: string; // canonical public header URL
}
```

The SDK validates the returned `avatarUrl`/`headerUrl` is a well-formed
`http(s)` URL. If the service omits it or returns an invalid URL, it throws
`AvatarSDKError` with code `API_ERROR` and status `502`.

## Delete types

```typescript
interface DeleteOptions {
  subname: string;
}

interface DeleteResult {
  message: string;
  deletedAt: string; // ISO 8601
}
```

## SIWE types

```typescript
interface SIWEMessageOptions {
  address: string;
  /** Optional — defaults to the configured domain */
  domain?: string;
  /** Optional — defaults to https://{domain} */
  uri?: string;
  /** Optional — defaults to the network's chain id (1 / 11155111) */
  chainId?: number;
}

interface SIWEMessageResult {
  message: string;   // the SIWE message to sign
  nonce: string;
  expiresAt: number; // Unix ms
}

interface UploadWithSignatureOptions extends UploadOptions {
  message: string;
  signature: string;
  address: string;
}

interface DeleteWithSignatureOptions extends DeleteOptions {
  message: string;
  signature: string;
  address: string;
}
```

The SIWE statement is `'Authorize a metadata update'`; the message is built with
`@signinwithethereum/siwe` v4. Signatures from EOAs *and* deployed smart-contract
wallets are accepted — the SDK does no client-side ERC-6492 handling; it forwards
the signature to the Metadata Service for verification.

## Nonce types

```typescript
interface NonceRequest {
  address: string;
  scope: 'avatar' | 'header' | 'avatar+header';
}

interface NonceResponse {
  nonce: string;
  expiresAt: number; // Unix ms
}
```

## Error codes

```typescript
const ErrorCodes = {
  // File validation
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Authentication
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED_NONCE: 'EXPIRED_NONCE',
  INVALID_NONCE: 'INVALID_NONCE',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',

  // ENS
  NOT_SUBNAME_OWNER: 'NOT_SUBNAME_OWNER',
  INVALID_SUBNAME: 'INVALID_SUBNAME',
  SUBNAME_NOT_FOUND: 'SUBNAME_NOT_FOUND',

  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  API_ERROR: 'API_ERROR',

  // Provider
  PROVIDER_NOT_CONNECTED: 'PROVIDER_NOT_CONNECTED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  PROVIDER_CHAIN_MISMATCH: 'PROVIDER_CHAIN_MISMATCH',

  // Configuration
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_PROVIDER: 'MISSING_PROVIDER',

  // Operations
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DELETE_FAILED: 'DELETE_FAILED',
} as const;
```

`AvatarSDKError` exposes `code`, `status?`, `serviceCode?`, `details?`, and
`originalError?`. Metadata Service failures are normalized to code `API_ERROR`
with the HTTP status and structured service envelope preserved on `status` /
`serviceCode` / `details`. Request-body signatures are stripped from
`originalError` so they aren't leaked.

## Constants

```typescript
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;  // 2 MB
const HEADER_MAX_SIZE = 5 * 1024 * 1024;  // 5 MB
const ALLOWED_FORMATS = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/gif', 'image/webp', 'image/svg+xml',
];
```

`getDefaultChainId('mainnet')` → `1`; `getDefaultChainId('sepolia')` → `11155111`.

## API endpoints

Base URL (both networks): `https://metadata.namespace.ninja`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/nonce` | POST | Get SIWE nonce (body: `{ address, scope }`) |
| `/profile/{network}/{subname}/avatar` | POST | Upload avatar (multipart) |
| `/profile/{network}/{subname}/avatar` | DELETE | Delete avatar (JSON) |
| `/profile/{network}/{subname}/h` | POST | Upload header (multipart, field name `header`) |
| `/profile/{network}/{subname}/h` | DELETE | Delete header (JSON) |

Header mutations use the compact `/h` route; the multipart field name, SIWE nonce
scope, and SIWE verification action remain `header`.