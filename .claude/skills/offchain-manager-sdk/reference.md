# Offchain Manager SDK Reference

## Contents

- OffchainClientConfig
- CreateSubnameRequest
- UpdateSubnameRequest
- QuerySubnamesRequest
- SubnameDTO
- PagedResponse
- ChainName Enum
- Exported Utilities
- API Endpoints
- Common Text Record Keys

## OffchainClientConfig

```typescript
interface OffchainClientConfig {
  mode?: "mainnet" | "sepolia"; // default: 'mainnet'
  backendUri?: string; // custom API endpoint
  defaultApiKey?: string; // address-based API key
  domainApiKeys?: Record<string, string>; // domain-specific keys
  timeout?: number; // request timeout in ms
}
```

## CreateSubnameRequest

```typescript
interface CreateSubnameRequest {
  parentName: string; // parent ENS domain (e.g., "example.eth")
  label: string; // subname label, ENSIP-15 normalized, supports emojis
  owner?: string; // owner address — set for address→name lookups
  addresses?: AddressRecord[]; // [{ chain: ChainName, value: string }]
  texts?: TextRecord[]; // [{ key: string, value: string }]
  metadata?: TextRecord[]; // [{ key: string, value: string }]
  contenthash?: string; // IPFS content hash
  ttl?: number; // time-to-live in seconds
}
```

## UpdateSubnameRequest

```typescript
interface UpdateSubnameRequest {
  addresses?: AddressRecord[];
  texts?: TextRecord[];
  metadata?: TextRecord[];
  contenthash?: string;
  ttl?: number;
}
```

Does not support changing `owner`. Delete and recreate the subname to change ownership.

## QuerySubnamesRequest

```typescript
interface QuerySubnamesRequest {
  parentName?: string; // required: parentName or parentNames
  parentNames?: string[]; // filter across multiple parent domains
  labelSearch?: string; // substring match on labels
  owner?: string; // filter by owner address
  metadata?: Record<string, string>; // filter by metadata key-value pairs
  page?: number; // 1-based (default: 1)
  size?: number; // items per page (max 100)
}
```

## SubnameDTO

```typescript
interface SubnameDTO {
  id: string;
  fullName: string; // e.g., "alice.example.eth"
  parentName: string;
  label: string;
  owner?: string;
  texts: Record<string, string>;
  addresses: Record<string, string>; // keyed by SLIP-44 coin type
  metadata: Record<string, string>;
  contenthash?: string;
  namehash: string; // ENS namehash
  ttl?: number;
  createdAt?: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}
```

## PagedResponse

```typescript
interface PagedResponse<T> {
  totalItems: number;
  page: number;
  size: number;
  items: T;
}
```

## ChainName Enum

```typescript
enum ChainName {
  // EVM chains (used by setDefaultEvmAddress)
  Default = "default", // ENSIP-19 default chain
  Ethereum = "eth",
  Base = "base",
  Optimism = "op",
  Arbitrum = "arb",
  Polygon = "polygon",
  Bsc = "bsc",
  Avalanche = "avax",
  Gnosis = "gnosis",
  Zksync = "zksync",
  Linea = "linea",
  Scroll = "scroll",
  Unichain = "unichain",
  Berachain = "berachain",
  WorldChain = "world_chain",
  Zora = "zora",
  Celo = "celo",
  Monad = "monad",
  Push = "push",

  // Non-EVM chains
  Solana = "sol",
  Bitcoin = "btc",
  Cosmos = "cosmos",
  Near = "near",
  Starknet = "starknet",
  Sui = "sui",
  Aptos = "aptos",
  Algorand = "algorand",
}
```

## Exported Utilities

```typescript
import {
  getCoinType, // getCoinType(ChainName.Ethereum) → 60
  validateEnsName, // throws ValidationError if invalid ENS name
  validateSubname, // throws ValidationError if invalid subname format
  validateAddress, // validates address format for a given chain
  validateApiKey, // basic API key format validation
  ChainMetadata, // type: { chain?, label, coin, evm? }
  AddressRecord, // type: { chain: ChainName, value: string }
  TextRecord, // type: { key: string, value: string }
} from "@thenamespace/offchain-manager";
```

## API Endpoints

| Network | Base URL                                           |
| ------- | -------------------------------------------------- |
| Mainnet | `https://offchain-manager.namespace.ninja`         |
| Sepolia | `https://staging.offchain-manager.namespace.ninja` |

## Common Text Record Keys for Profile

| Key           | Description          |
| ------------- | -------------------- |
| `avatar`      | Profile picture URL  |
| `description` | Profile description  |
| `url`         | Website URL          |
| `com.twitter` | Twitter/X handle     |
| `com.github`  | GitHub username      |
| `com.discord` | Discord handle       |
| `email`       | Email address        |
| `location`    | Physical location    |
| `notice`      | Public notice        |
| `keywords`    | Comma-separated tags |
