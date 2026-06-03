<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-light.png">
  <img alt="Namespace" src="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-dark.png" width="320">
</picture>

# Namespace SDK - Addresses

[![npm version](https://img.shields.io/npm/v/@thenamespace/addresses.svg)](https://www.npmjs.com/package/@thenamespace/addresses)

## Overview

`@thenamespace/addresses` is a lightweight library containing all Namespace and ENS contract addresses across the networks they are deployed on. Use it to look up the right contract address by chain instead of hardcoding values in your app.

## Installation

```sh
npm install @thenamespace/addresses
```

## Usage

```typescript
import {
  getL1NamespaceContracts,
  getL2NamespaceContracts,
  getEnsContracts,
} from "@thenamespace/addresses";

// Namespace L1 contracts (Ethereum Mainnet / Sepolia)
const l1 = getL1NamespaceContracts(1); // mainnet
console.log(l1.mintController);

// Namespace L2 contracts (Base / Optimism and their testnets)
const l2 = getL2NamespaceContracts(8453); // Base
console.log(l2.controller);

// Core ENS contracts
const ens = getEnsContracts(1); // mainnet
console.log(ens.ensRegistry);
```

## API

### `getL1NamespaceContracts(chainId)`

Returns Namespace L1 contract addresses for the given chain (Ethereum Mainnet or Sepolia):
`mintController`, `nameWrapperProxy`, `hybridResolver`, `oldHybridResolver`, `bulkEnsRegistrar`.

### `getL2NamespaceContracts(chainId)`

Returns Namespace L2 contract addresses for the given chain (Base, Optimism and their testnets):
`controller`, `resolver`, `registryResolver`, `emitter`.

### `getEnsContracts(chainId)`

Returns the core ENS contract addresses for the given chain:
`nameWrapper`, `ensRegistry`, `publicResolver`, `ethRegistrarController`, `universalResolver`, `unwrappedRegistrarController`, `baseRegistrar`.

## License

This project is licensed under the MIT License.

## Links

- [Namespace Website](https://namespace.ninja)
- [Documentation](https://docs.namespace.ninja)
- [GitHub Repository](https://github.com/thenamespace/namespacesdk)
