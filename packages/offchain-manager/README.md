# Offchain Client

The Offchain Client is a TypeScript library for managing ENS subnames and related data records via an HTTP-based API. 
This library provides functions for interacting with subnames, including creation, deletion, text records, data records, and filtering operations.

## Installation

Install the library using npm:

```bash
npm install <library-name>
```

## Usage

### Create an Offchain Client

To create an Offchain Client instance, use the `createOffchainClient` function and pass an Axios configuration:

```typescript
import { createOffchainClient } from "<library-name>";

const client = createOffchainClient({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

### API Methods

#### Subname Management

- **Create Subname:**

  ```typescript
  await client.createSubname({
    domain: "example.eth",
    label: "subname",
    resolver: "0xResolverAddress",
  });
  ```

- **Delete Subname:**

  ```typescript
  await client.deleteSubname("subname.example.eth");
  ```

#### Text Records Management

- **Add Text Record:**

  ```typescript
  await client.addTextRecord("subname.example.eth", "key", "value");
  ```

- **Delete Text Record:**

  ```typescript
  await client.deleteTextRecord("subname.example.eth", "key");
  ```

- **Get Text Records:**

  ```typescript
  const records = await client.getTextRecords("subname.example.eth");
  ```

- **Get Specific Text Record:**

  ```typescript
  const record = await client.getTextRecord("subname.example.eth", "key");
  ```

#### Data Records Management

- **Add Data Record:**

  ```typescript
  await client.addDataRecord("subname.example.eth", "dataKey", { data: "value" });
  ```

- **Delete Data Record:**

  ```typescript
  await client.deleteDataRecord("subname.example.eth", "dataKey");
  ```

- **Get Data Records:**

  ```typescript
  const dataRecords = await client.getDataRecords("subname.example.eth");
  ```

- **Get Specific Data Record:**

  ```typescript
  const dataRecord = await client.getDataRecord("subname.example.eth", "dataKey");
  ```

#### Subname Filtering

- **Get Filtered Subnames:**

  ```typescript
  const subnames = await client.getFilteredSubnames({
    domain: "example.eth",
    limit: 10,
    offset: 0,
  });
  ```

#### API Key Management

- **Generate API Key:**

  ```typescript
  const apiKey = await client.generateApiKey(
    "example.eth",
    "0xYourWalletAddress",
    async (message) => {
      return await signMessage(message);
    }
  );
  ```

- **Set API Key:**

  ```typescript
  client.setApiKey("example.eth", "your-api-key");
  ```

#### Check Subname Availability

- **Is Subname Available:**

  ```typescript
  const availability = await client.isSubnameAvailable("subname.example.eth");
  ```

## Error Handling

Ensure you handle errors gracefully by wrapping API calls in `try-catch` blocks:

```typescript
try {
  const records = await client.getTextRecords("subname.example.eth");
  console.log(records);
} catch (error) {
  console.error("Failed to fetch text records:", error);
}
```

## Development

To contribute or develop locally, clone the repository and install dependencies:

```bash
git clone <repository-url>
npm install
```

Run tests to verify functionality:

```bash
npm test
```

## License

This project is licensed under the [MIT License](LICENSE).
