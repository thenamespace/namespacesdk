![Namespace Ninja](https://i.postimg.cc/Nfcbq9jP/namespace.png)

# Namespace SDK

## Overview

Namespace SDK is a collection of tools and libraries designed to simplify ENS subname management and other namespace-related operations. This monorepo houses multiple sub-packages that provide off-chain and on-chain management capabilities.

Currently, the SDK includes:

- [`@thenamespace/offchain-manager`](https://www.npmjs.com/package/@thenamespace/offchain-manager): Manage ENS subnames off-chain with ease.
- [`@thenamespace/indexer`](https://www.npmjs.com/package/@thenamespace/indexer): A SDK Wrapper around Namespace Indexer, used to easily query data related to L2 subnames.
- [`@namespacesdk/mint-manager`](https://www.npmjs.com/package/@namespacesdk/mint-manager): Client for implementing mint functionality, supports both L1 and L2 Subnames.

## Installation

Each package in the Namespace SDK is available individually via npm. To install a specific package, use:

```sh
npm install @thenamespace/offchain-manager
```

## Packages

### [`@thenamespace/offchain-manager`](https://www.npmjs.com/package/@thenamespace/offchain-manager)

This package provides an interface for managing ENS subnames off-chain. It allows you to create, update, delete, and query subnames, as well as manage associated records like addresses and text records.

For detailed usage, refer to the [`README.md`](./packages/offchain-manager/README.md) inside the package directory.

## Contributing

We welcome contributions! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Support

For any issues or feature requests, please open an issue on [GitHub](https://github.com/your-repo/namespace-sdk/issues).

## Contributors

[![artii.eth](https://github.com/nenadmitt.png?size=50)](https://github.com/nenadmitt)
