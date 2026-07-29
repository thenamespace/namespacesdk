<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-light.png">
  <img alt="Namespace" src="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-dark.png" width="320">
</picture>

# Namespace SDK

TypeScript SDKs for building with Namespace and ENS. Mint and manage subnames,
query indexed data, resolve deployed contract addresses, and manage ENS profile
images.

## Packages

| Package | Use it to |
| --- | --- |
| [`@thenamespace/addresses`](./packages/addresses) | Look up Namespace and ENS contract addresses by chain. |
| [`@thenamespace/avatar`](./packages/avatar) | Upload and delete ENS avatar and header images using SIWE authentication. |
| [`@thenamespace/indexer`](./packages/indexer) | Query L2 subnames, registries, and metadata through the Namespace Indexer API. |
| [`@thenamespace/mint-manager`](./packages/mint-manager) | Check availability and mint ENS subnames on Mainnet and supported L2 networks. |
| [`@thenamespace/offchain-manager`](./packages/offchain-manager) | Create, update, query, and delete gasless offchain ENS subnames and records. |

Each package is published independently on npm and has its own installation,
API, and usage documentation.

## Installation

Install only the package your application needs:

```sh
npm install @thenamespace/offchain-manager
```

Replace `@thenamespace/offchain-manager` with any package listed above.

## Work on the monorepo

### Requirements

- Node.js 16 or newer
- npm

### Setup

```sh
git clone https://github.com/thenamespace/namespacesdk.git
cd namespacesdk
npm install
```

The repository uses npm workspaces and Lerna. Run package scripts from the
repository root with npm's `--workspace` option:

```sh
# Build one package
npm run build --workspace=@thenamespace/avatar

# Run the Avatar SDK unit tests
npm test --workspace=@thenamespace/avatar

# Type-check the Avatar SDK
npm run type-check --workspace=@thenamespace/avatar
```

Available scripts differ by package; check the relevant package's
`package.json` before running a command.

## Repository structure

```text
namespacesdk/
├── packages/
│   ├── addresses/          # Namespace and ENS contract addresses
│   ├── avatar/             # ENS avatar and header image management
│   ├── indexer/            # Namespace Indexer API client
│   ├── mint-manager/       # ENS subname availability and minting
│   └── offchain-manager/   # Gasless offchain subname management
├── changelog/              # Package release history and release notes
├── lerna.json
└── package.json
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the
development workflow, package-specific checks, and pull request guidelines.

## Resources

- [Namespace](https://namespace.ninja)
- [Documentation](https://docs.namespace.ninja)
- [GitHub issues](https://github.com/thenamespace/namespacesdk/issues)

## License

Licensed under the MIT License.
