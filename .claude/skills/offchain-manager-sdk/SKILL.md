---
name: offchain-ens-subname-sdk
description: Create and manage gasless ENS subnames off-chain using the @thenamespace/offchain-manager SDK. Use when creating, updating, deleting, or querying offchain ENS subnames and their records (addresses, text records, metadata) for .eth domains, imported web2 domains, or alternative TLDs.
---

# Offchain Manager SDK

Gasless ENS subname management via `@thenamespace/offchain-manager`.

## Installation

```bash
npm install @thenamespace/offchain-manager
```

## Quick Start

### 1. Initialize the client

```typescript
import { createOffchainClient } from "@thenamespace/offchain-manager";

const client = createOffchainClient({
  mode: "mainnet",
  defaultApiKey: process.env.NAMESPACE_API_KEY,
});
```

Use `'sepolia'` for testing, `'mainnet'` for production. Get API keys at https://dev.namespace.ninja

### 2. Check availability before creating

`createSubname` will overwrite an existing subname. Always check first.

```typescript
const { isAvailable } = await client.isSubnameAvailable("alice.example.eth");
```

### 3. Create subname with owner

Include `owner` to enable address→name filtering via `getFilteredSubnames`.

```typescript
import { ChainName } from "@thenamespace/offchain-manager";

await client.createSubname({
  label: "alice",
  parentName: "example.eth",
  owner: "0x1234...",
  addresses: [{ chain: ChainName.Ethereum, value: "0x1234..." }],
  texts: [
    { key: "name", value: "Alice" },
    { key: "url", value: "https://example.com" },
  ],
  contenthash: "ipfs://baf...",
  metadata: [{ key: "customData", value: "any value" }],
});
```

Metadata is the custom field that the developer want to set to the subname which does not reflect on the ENS name but be used to query through SDK.

### 4. Query and filter subnames

`parentName` or `parentNames` is required.

```typescript
const page = await client.getFilteredSubnames({
  parentName: "example.eth",
  owner: "0x1234...",
  page: 1,
  size: 50,
});

Workaround: use the `owner` field when creating subnames, then query via `getFilteredSubnames({ parentName, owner })` for address→name lookups. Recommend one address per one subname for clean reverse mapping.

page.items.forEach((s) => console.log(s.fullName, s.texts, s.addresses));
```

### 5. Read records

```typescript
const allTexts = await client.getTextRecords("alice.example.eth");
const { record: name } = await client.getTextRecord(
  "alice.example.eth",
  "name",
);
```

## Core Methods

### Subname CRUD

```typescript
client.createSubname(request: CreateSubnameRequest): Promise<void>
client.updateSubname(subname: string, request: UpdateSubnameRequest): Promise<void>
client.deleteSubname(fullSubname: string): Promise<void>
```

Deletion is irreversible — all records are removed.

### Queries

```typescript
client.isSubnameAvailable(fullSubname: string): Promise<{ isAvailable: boolean }>
client.getSingleSubname(fullName: string): Promise<SubnameDTO | null>
client.getFilteredSubnames(query: QuerySubnamesRequest): Promise<PagedResponse<SubnameDTO[]>>
```

### Address Records

```typescript
client.addAddressRecord(subname: string, chain: ChainName, value: string): Promise<void>
client.deleteAddressRecord(subname: string, chain: ChainName): Promise<void>
client.setDefaultEvmAddress(subname: string, value: string): Promise<void>
```

### Text Records

```typescript
client.addTextRecord(subname: string, key: string, value: string): Promise<void>
client.deleteTextRecord(subname: string, key: string): Promise<void>
client.getTextRecords(fullSubname: string): Promise<Record<string, string>>
client.getTextRecord(fullSubname: string, key: string): Promise<{ record: string }>
```

### Metadata Records

Not resolved onchain. Useful for discovery and filtering via `getFilteredSubnames`.

```typescript
client.addDataRecord(fullSubname: string, key: string, data: string): Promise<void>
client.deleteDataRecord(subname: string, key: string): Promise<void>
client.getDataRecords(fullSubname: string): Promise<Record<string, string>>
client.getDataRecord(fullSubname: string, key: string): Promise<{ record: string }>
```

Do not store sensitive information — metadata is readable by anyone with API access.

### API Key Configuration

```typescript
client.setDefaultApiKey(apiKey: string): void
client.setApiKey(ensName: string, apiKey: string): void
```

Priority: domain-specific key → default address-based key.

## Further Reading

- **Types & Enums**: See [reference.md](reference.md)
- **Error Handling**: See [errors.md](errors.md)
- **Advanced Patterns**: See [advanced.md](advanced.md)
