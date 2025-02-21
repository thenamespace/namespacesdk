# @namespacesdk/indexer-manager

This library provides an `IndexerClient` for interacting with indexed data from Namespace smart contracts. It is built on top of Axios and provides a convenient API for gathering subnames data from Namespace.

---

## Methods

Below is a list of available methods in the `IndexerClient`:

- `getL2Subnames(query: GetL2SubnamesQuery): Promise<L2SubnamePagedResponse>`
- `getL2Subname(network: L2Network, namehash: string): Promise<L2SubnameResponse>`
- `getL2Stats(includeTestnet: boolean): Promise<L2SubnameStats>`
- `getL1Subnames(query: GetL1SubnamesQuery): Promise<L1SubnameResponse[]>`
- `getL1Subname(network: L1Network, namehash: string): Promise<L1SubnameResponse>`

---

## Installation

Install the library using npm or yarn:

```bash
npm install @namespacesdk/indexer-manager
```

---

## Configuration

The client can be initialized with a configuration object:

```typescript
import { createIndexerClient } from "@namespacesdk/indexer-manager";

const client = createIndexerClient({});
```

---
