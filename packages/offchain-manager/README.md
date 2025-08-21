![Namespace Ninja](https://i.postimg.cc/Nfcbq9jP/namespace.png)

# Namespace SDK - Offchain Manager

[![npm version](https://img.shields.io/npm/v/@thenamespace/offchain-manager.svg)](https://www.npmjs.com/package/@thenamespace/offchain-manager)

## Overview

The `@thenamespace/offchain-manager` provides an easy-to-use client for managing ENS subnames off-chain. With this SDK, developers can create, update, delete, and query subnames, as well as manage associated records like addresses, text records, and data records.

## Getting Started

### Installation

```sh
npm install @thenamespace/offchain-manager
```

### Import the SDK

```typescript
import { createOffchainClient } from "@thenamespace/offchain-manager";
```

### Initialize the Client

To use the SDK, create an instance using the `createOffchainClient` factory function and set your API key, which you can obtain from [https://dev.namespace.ninja](https://dev.namespace.ninja).

```typescript
// 1) No-arg initialization (defaults to mainnet)
const client = createOffchainClient();

// 2) Configure network and API keys inline
const client = createOffchainClient({
  mode: "sepolia", // or "mainnet"
  // Address-based API key (works with all ENS domains registered to your address)
  defaultApiKey: "your-address-based-api-key",
  // Domain-based API keys for specific ENS parent names
  domainApiKeys: {
    "your-ens-name.eth": "your-domain-based-api-key",
    // add more domains if needed
  },
});

// You can also set API Keys after initialization as well
// Approach 1: Address-based API key (recommended for most use cases)
// Works with all ENS domains registered to your address
client.setDefaultApiKey("your-address-based-api-key");

// Approach 2: Domain-based API key
// Works with a specific ENS domain only
client.setApiKey("your-ens-name.eth", "your-domain-based-api-key");
```

### Supported Chains

The SDK supports multiple blockchain networks for address records:

```typescript
import { ChainName } from "@thenamespace/offchain-manager";

// Available chains: Ethereum, Solana, Arbitrum, Optimism, Base, Polygon,
// BSC, Avalanche, Gnosis, zkSync, Cosmos, NEAR, Linea, Scroll, Bitcoin,
// Starknet, Sui
```

### Subname Management

#### Create a Subname

```typescript
import { ChainName } from "@thenamespace/offchain-manager";

// Creates a subname named sub.example.eth resolvable to "0x123.."
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

### Error Handling

The SDK provides specific error classes for different scenarios:

```typescript
import {
  SubnameAlreadyExistsError,
  AuthenticationError,
  SubnameNotFoundError
} from "@thenamespace/offchain-manager";

try {
  await client.createSubname({...});
} catch (error) {
  if (error instanceof SubnameAlreadyExistsError) {
    console.log("Subname already exists");
  } else if (error instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (error instanceof SubnameNotFoundError) {
    console.log("Subname not found");
  }
}
```

### Advanced Configuration

```typescript
const client = createOffchainClient({
  mode: "sepolia", // or "mainnet"
  backendUri: "https://custom-backend.com", // Optional custom backend
  defaultApiKey: "your-address-based-api-key", // Optional inline key
  domainApiKeys: { "example.eth": "your-domain-based-api-key" },
});
```

## Documentation

For detailed documentation, API reference, and advanced usage examples, visit our [documentation site](https://docs.namespace.ninja/dev-docs/sdk/offchain-manager).

## License

This project is licensed under the [MIT License](LICENSE).

## Support

For any issues or feature requests, please open an issue on [GitHub](https://github.com/your-repo/namespace-sdk/issues).

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting a pull request.

## Questions? Join our Builders Group chat

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/+OsziFgfuZz03NjEy)

Consider joining the [**Namespace Builders**](https://t.me/+OsziFgfuZz03NjEy) group chat on Telegram if you have any questions, suggestions, feedback, or anything you want to talk about.
