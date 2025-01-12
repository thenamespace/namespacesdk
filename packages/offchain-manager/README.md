# @namespacesdk/offchain-manager

This library provides an `OffchainClient` for interacting with subnames, text records, data records, and API key management in an ENS-like system. It is built on top of Axios and provides a convenient API for managing off-chain data.

---

## API Key Management

To interact with the offchain system, an API key is required for each ENS name. Here's how you can generate and manage API keys:

### Generating an API Key

The `generateApiKey` method creates an API key for a given ENS name. It requires the `signerAddress` and a `SignerFunction` to generate a token. Below is the implementation of the key generation process:

```typescript
interface AuthTokenClaims {
  address: string;
  nonce: string;
  issued: number;
}

export type SignerFunction = (message: string) => Promise<string>;

export const _generateApiKeyForName = async (
  client: AxiosInstance,
  ensName: string,
  signerAddress: string,
  signerFunc: SignerFunction
): Promise<string> => {
  const token = await generateToken(client, signerAddress, signerFunc);
  const { data } = await client.post<{ apiKey: string }>(`/auth/name/${ensName}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.apiKey;
};

export const _nonce = async (client: AxiosInstance): Promise<string> => {
  return client.get<string>("/auth/nonce").then((res) => res.data);
};

const generateToken = async (
  client: AxiosInstance,
  signerWallet: string,
  signerFunc: SignerFunction
) => {
  const nonce = await _nonce(client);
  const claims: AuthTokenClaims = {
    address: signerWallet,
    issued: new Date().getTime(),
    nonce,
  };
  const claimsJSON = JSON.stringify(claims);
  const claimsB64 = btoa(claimsJSON);
  const signature = await signerFunc(claimsJSON);
  const signatureB64 = btoa(signature);

  return `${claimsB64}.${signatureB64}`;
};
```

### Using the API Key

Once the API key is generated, you can set it for an ENS name using the `setApiKey` method:

```typescript
client.setApiKey("example.eth", "your-api-key");
```

This ensures all subsequent requests for the ENS name use the provided API key.

---

## Subname Management

The library allows you to manage subnames, including creating, deleting, and querying their availability.

### Creating a Subname

The `createSubname` method allows you to create a subname with the following request object:

```typescript
export interface SubnameDTO {
  label: string;
  domain: string;
  address: `0x${string}`;
  coinType?: number;
  addresses?: Record<string, string>;
  textRecords?: Record<string, string>;
  dataRecords?: Record<string, string>;
  ttl?: number;
}
```

Example:

```typescript
await client.createSubname({
  label: "subname",
  domain: "example.eth",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  textRecords: {
    key1: "value1",
    key2: "value2",
  },
  dataRecords: {
    dataKey: "dataValue",
  },
  ttl: 3600,
});
```

---

## Methods

Below is a list of available methods in the `OffchainClient`:

### Subname Management
- `createSubname(request: SubnameDTO): Promise<void>`
- `deleteSubname(fullSubname: string): Promise<void>`
- `isSubnameAvailable(fullSubname: string): Promise<GetAvailableResponse>`

### Record Management
- `addTextRecord(subname: string, key: string, value: string): Promise<void>`
- `deleteTextRecord(subname: string, key: string): Promise<void>`
- `getTextRecords(fullSubname: string): Promise<Record<string, string>>`
- `getTextRecord(fullSubname: string, key: string): Promise<GetRecordResponse>`
- `addDataRecord(fullSubname: string, key: string, data: any): Promise<void>`
- `deleteDataRecord(fullSubname: string, key: string): Promise<void>`
- `getDataRecords(fullSubname: string): Promise<Record<string, any>>`
- `getDataRecord(fullSubname: string, key: string): Promise<GetRecordResponse>`

### API Key Management
- `generateApiKey(ensName: string, signerWallet: string, signerFunc: SignerFunction): Promise<string>`
- `setApiKey(ensName: string, apiKey: string): void`

---

## Installation

Install the library using npm or yarn:

```bash
npm install @namespacesdk/offchain-manager
```

---

## Configuration

The client can be initialized with a configuration object:

```typescript
import { createOffchainClient } from "@namespacesdk/offchain-manager";

const client = createOffchainClient({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

---

For more details, refer to the library documentation or the source code.
