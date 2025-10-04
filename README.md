![Namespace Ninja](https://i.postimg.cc/Nfcbq9jP/namespace.png)

# Namespace SDK Monorepo

This monorepo contains TypeScript SDK packages for interacting with the Namespace ecosystem. It's built using [Lerna](https://lerna.js.org/) for managing multiple packages.

## 📦 Packages

This monorepo contains the following SDK packages:

### [@thenamespace/addresses](./packages/addresses)

Library containing all Namespace & ENS contract addresses.

### [@thenamespace/indexer](./packages/indexer)

TypeScript SDK for interacting with the Namespace Indexer API - query L2 subnames, registries, and metadata.

### [@thenamespace/mint-manager](./packages/mint-manager)

Library for minting L2 subnames with comprehensive validation and error handling.

### [@thenamespace/offchain-manager](./packages/offchain-manager)

TypeScript SDK for creating and managing ENS subnames off-chain with the Namespace API.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/thenamespace/namespacesdk.git
cd namespacesdk

# Install dependencies for all packages
npm install

```

## 📁 Project Structure

```
namespacesdk/
├── packages/
│   ├── addresses/          # Contract addresses library
│   ├── indexer/           # Indexer API SDK
│   ├── mint-manager/      # L2 subname minting library
│   └── offchain-manager/  # Off-chain subname management SDK
├── lerna.json            # Lerna configuration
└── package.json          # Root package.json (monorepo config)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run test` to ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Namespace Website](https://namespace.ninja)
- [Documentation](https://docs.namespace.ninja)
- [GitHub Issues](https://github.com/thenamespace/namespacesdk/issues)
