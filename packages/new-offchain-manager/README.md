# Namespace SDK - Offchain Client

[![npm version](https://img.shields.io/npm/v/namespace-sdk.svg)](https://www.npmjs.com/package/namespace-sdk)

## Overview
The `namespace-sdk` provides an easy-to-use client for managing ENS subnames off-chain. With this SDK, developers can create, update, delete, and query subnames, as well as manage associated records like addresses, text records, and data records.

## Installation

```sh
npm install @namespace-sdk/offchain-manager
```

or using Yarn:

```sh
npm install @namespace-sdk/offchain-manager
```

## Getting Started

### Import the SDK

```typescript
import { OffchainClient } from '@namespace-sdk/offchain-manager';
```

### Initialize the Client

To use the SDK, create an instance of the `OffchainClient` and set your API key, which you can obtain from [https://dev.namespace.ninja](https://dev.namespace.ninja).

```typescript
const client = new OffchainClient();
client.setApiKey('your-ens-name.eth', 'your-api-key');
```

### Subname Management

#### Create a Subname
```typescript
import { ChainName } from "@namespacesdk/offchain-manageR"

await client.createSubname({
  parent: 'example.eth',
  label: 'sub',
  addresses: [
    {
      chain: ChainName.Ethereum
      value: "0x123..."
    }
  ],
  texts: [
    {
      key: "avatar",
      value: "https://my_avatar_url"
    }
  ]
});
```

#### Update a Subname
```typescript
await client.updateSubname('sub.example.eth', {
   addresses: [
    {
      chain: ChainName.Ethereum
      value: "0x123..."
    }
  ],
  texts: [
    {
      key: "avatar",
      value: "https://my_avatar_url"
    }
  ]
});
```

#### Delete a Subname
```typescript
await client.deleteSubname('sub.example.eth');
```

#### Check if a Subname is Available
```typescript
const response = await client.isSubnameAvailable('sub.example.eth');
console.log(response.available);
```

#### Get a Subname
```typescript
const subname = await client.getSingleSubname('sub.example.eth');
console.log(subname);
```

#### Query Subnames
```typescript
const subnames = await client.getFilteredSubnames({ parent: 'example.eth' });
console.log(subnames);
```

### Record Management

#### Add an Address Record
```typescript
import { ChainName } from "@namespacesdk/offchain-manager"

await client.addAddressRecord('sub.example.eth',  ChainName.Ethereum, '0xYourEthereumAddress');
```

#### Delete an Address Record
```typescript
await client.deleteAddressRecord('sub.example.eth',  ChainName.Base);
```

#### Add a Text Record
```typescript
await client.addTextRecord('sub.example.eth', 'twitter', '@yourhandle');
```

#### Delete a Text Record
```typescript
await client.deleteTextRecord('sub.example.eth', 'twitter');
```

#### Retrieve All Text Records
```typescript
const records = await client.getTextRecords('sub.example.eth');
console.log(records);
```

#### Retrieve a Specific Text Record
```typescript
const record = await client.getTextRecord('sub.example.eth', 'twitter');
console.log(record);
```

#### Add a Data Record
```typescript
await client.addDataRecord('sub.example.eth', 'customData', { key: 'value' });
```

#### Delete a Data Record
```typescript
await client.deleteDataRecord('sub.example.eth', 'customData');
```

#### Retrieve All Data Records
```typescript
const dataRecords = await client.getDataRecords('sub.example.eth');
console.log(dataRecords);
```

#### Retrieve a Specific Data Record
```typescript
const dataRecord = await client.getDataRecord('sub.example.eth', 'customData');
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

