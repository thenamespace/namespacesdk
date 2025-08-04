![Namespace Ninja](https://i.postimg.cc/Nfcbq9jP/namespace.png)

# Namespace SDK - Offchain Client

[![npm version](https://img.shields.io/npm/v/@thenamespace/offchain-manager.svg)](https://www.npmjs.com/package/@thenamespace/offchain-manager)

## Overview

The `namespace-sdk` provides an easy-to-use client for managing ENS subnames off-chain. With this SDK, developers can create, update, delete, and query subnames, as well as manage associated records like addresses, text records, and data records.

## Namespace Dev Portal

_If you've already done this, feel free to skip this step._

To issue subnames, make them resolvable, and get an API key, you need to go to our [Dev Portal](https://dev.namespace.ninja).

1. **Subnames** section allows you to create, edit, or update subnames and all of their records (text, addresses, content hash)
2. **Resolution** section is there for you to update the Resolver contract to Namespace Hybrid resolver so the subnames issued are resolvable in all ENS-supported apps.
3. **API Keys** section allows you to create and manage API keys:
   - **Address-Based API Keys**: Work with all ENS domains registered to your address
   - **Domain-Based API Keys**: Work with specific ENS domains only

## Installation

```sh
npm install @thenamespace/offchain-manager
```

or using Yarn:

```sh
npm install @thenamespace/offchain-manager
```

## Getting Started

### Environment Setup

The SDK reads configuration from environment variables. You can set these directly or use a `.env` file with a library like `dotenv`.

**API Key Types:**

The Namespace SDK supports two types of API keys:

1. **Address-Based API Keys** - Work with all ENS domains registered to your address
2. **Domain-Based API Keys** - Work with a specific ENS domain only

Both can be obtained from [dev.namespace.ninja](https://dev.namespace.ninja).

**Environment Variables:**

- `NAMESPACE_API_KEY` - Your Namespace API key (address-based or domain-based)

**Setting Environment Variables:**

#### Using dotenv (recommended for development)

```bash
npm install dotenv
```

Create a `.env` file in your project root:

```env
NAMESPACE_API_KEY=ns-your-api-key-here
```

Then load it in your application:

```typescript
import * as dotenv from "dotenv";
dotenv.config();

import { createOffchainClient } from "@thenamespace/offchain-manager";

const client = createOffchainClient({ mode: "sepolia" });

// Option 1: Use address-based API key (works with all your domains)
client.setDefaultApiKey(process.env.NAMESPACE_API_KEY!);

// Option 2: Use domain-based API key (works with specific domain)
client.setApiKey("your-ens-name.eth", process.env.NAMESPACE_API_KEY!);
```

### Import the SDK

```typescript
import { createOffchainClient } from "@thenamespace/offchain-manager";
```

### Initialize the Client

To use the SDK, create an instance using the `createOffchainClient` factory function and set your API key, which you can obtain from [https://dev.namespace.ninja](https://dev.namespace.ninja).

```typescript
const client = createOffchainClient({ mode: "sepolia" });

// Choose one of the following approaches:

// Approach 1: Address-based API key (recommended for most use cases)
// Works with all ENS domains registered to your address
client.setDefaultApiKey("your-address-based-api-key");

// Approach 2: Domain-based API key
// Works with a specific ENS domain only
client.setApiKey("your-ens-name.eth", "your-domain-based-api-key");
```

### API Key Types Explained

#### Address-Based API Keys

- **Use case**: You want to manage subnames for multiple ENS domains that you own
- **Setup**: Use `client.setDefaultApiKey("your-address-based-key")`
- **Benefits**:
  - One key works for all domains registered to your address
  - Simplified key management
  - Recommended for most applications

#### Domain-Based API Keys

- **Use case**: You want to manage subnames for one specific ENS domain
- **Setup**: Use `client.setApiKey("your-domain.eth", "your-domain-based-key")`
- **Benefits**:
  - More granular access control
  - Useful for multi-tenant applications
  - Can mix different keys for different domains

#### Mixed Usage

You can combine both approaches. Domain-specific keys take precedence over the default key:

```typescript
// Set a default key for most domains
client.setDefaultApiKey("your-address-based-key");

// Override with specific key for one domain
client.setApiKey("special-domain.eth", "special-domain-key");

// Now:
// - Operations on "special-domain.eth" will use "special-domain-key"
// - Operations on other domains will use "your-address-based-key"
```

### Subname Management

#### Create a Subname

```typescript
import { ChainName } from "@thenamespace/offchain-manager";

await client.createSubname({
  parentName: "example.eth",
  label: "sub",
  addresses: [
    {
      chain: ChainName.Ethereum,
      value: "0x123...",
    },
  ],
  texts: [
    {
      key: "avatar",
      value: "https://my_avatar_url",
    },
  ],
});
```

#### Update a Subname

```typescript
await client.updateSubname("sub.example.eth", {
  addresses: [
    {
      chain: ChainName.Ethereum,
      value: "0x123...",
    },
  ],
  texts: [
    {
      key: "avatar",
      value: "https://my_avatar_url",
    },
  ],
});
```

#### Delete a Subname

```typescript
await client.deleteSubname("sub.example.eth");
```

#### Check if a Subname is Available

```typescript
const response = await client.isSubnameAvailable("sub.example.eth");
console.log(response.available);
```

#### Get a Subname

```typescript
const subname = await client.getSingleSubname("sub.example.eth");
console.log(subname);
```

#### Query Subnames

```typescript
const subnames = await client.getFilteredSubnames({
  parentName: "example.eth",
});
console.log(subnames);
```

### Record Management

#### Add an Address Record

```typescript
import { ChainName } from "@thenamespace/offchain-manager";

await client.addAddressRecord(
  "sub.example.eth",
  ChainName.Ethereum,
  "0xYourEthereumAddress"
);
```

#### Delete an Address Record

```typescript
await client.deleteAddressRecord("sub.example.eth", ChainName.Base);
```

#### Add a Text Record

```typescript
await client.addTextRecord("sub.example.eth", "twitter", "@yourhandle");
```

#### Delete a Text Record

```typescript
await client.deleteTextRecord("sub.example.eth", "twitter");
```

#### Retrieve All Text Records

```typescript
const records = await client.getTextRecords("sub.example.eth");
console.log(records);
```

#### Retrieve a Specific Text Record

```typescript
const record = await client.getTextRecord("sub.example.eth", "twitter");
console.log(record);
```

#### Add a Data Record

```typescript
await client.addDataRecord("sub.example.eth", "customData", { key: "value" });
```

#### Delete a Data Record

```typescript
await client.deleteDataRecord("sub.example.eth", "customData");
```

#### Retrieve All Data Records

```typescript
const dataRecords = await client.getDataRecords("sub.example.eth");
console.log(dataRecords);
```

#### Retrieve a Specific Data Record

```typescript
const dataRecord = await client.getDataRecord("sub.example.eth", "customData");
console.log(dataRecord);
```

## API Reference

### `setApiKey(ensName: string, apiKey: string): void`

Sets the API key for authentication.

### `createSubname(request: CreateSubnameRequest): Promise<void>`

Creates a new subname under a parent domain.

### `updateSubname(subname: string, request: UpdateSubnameRequest): Promise<void>`

Updates an existing subname.

### `deleteSubname(fullSubname: string): Promise<void>`

Deletes a subname.

### `isSubnameAvailable(fullSubname: string): Promise<GetAvailableResponse>`

Checks if a subname is available.

### `getSingleSubname(fullName: string): Promise<SubnameDTO | null>`

Retrieves details of a subname.

### `getFilteredSubnames(query: QuerySubnamesRequest): Promise<PagedResponse<SubnameDTO[]>>`

Fetches subnames based on query parameters.

### `addAddressRecord(subname: string, chain: ChainName, value: string): Promise<void>`

Adds an address record to a subname.

### `deleteAddressRecord(subname: string, chain: ChainName): Promise<void>`

Deletes an address record.

### `addTextRecord(subname: string, key: string, value: string): Promise<void>`

Adds a text record to a subname.

### `deleteTextRecord(subname: string, key: string): Promise<void>`

Deletes a text record.

### `getTextRecords(fullSubname: string): Promise<Record<string, string>>`

Retrieves all text records for a subname.

### `getTextRecord(fullSubname: string, key: string): Promise<GetRecordResponse>`

Retrieves a specific text record.

### `addDataRecord(fullSubname: string, key: string, data: any): Promise<void>`

Adds a data record to a subname.

### `deleteDataRecord(subname: string, key: string): Promise<void>`

Deletes a data record.

### `getDataRecords(fullSubname: string): Promise<Record<string, any>>`

Retrieves all data records for a subname.

### `getDataRecord(fullSubname: string, key: string): Promise<GetRecordResponse>`

Retrieves a specific data record.

## License

This project is licensed under the [MIT License](LICENSE).

## Support

For any issues or feature requests, please open an issue on [GitHub](https://github.com/your-repo/namespace-sdk/issues).

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting a pull request.

## Questions? Join our Builders Group chat

Consider joining the [Namespace Builders](https://t.me/+OsziFgfuZz03NjEy) group chat on Telegram if you have any questions, suggestions, feedback, or anything you want to talk about.
