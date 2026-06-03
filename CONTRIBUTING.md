<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-light.png">
  <img alt="Namespace" src="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-dark.png" width="320">
</picture>

# Contributing to the Namespace SDK

Thanks for taking the time to contribute! This repository is a monorepo of TypeScript SDK packages for the Namespace ecosystem, managed with [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) and [Lerna](https://lerna.js.org/).

## Packages

| Package | Description |
| --- | --- |
| [`@thenamespace/addresses`](./packages/addresses) | Namespace & ENS contract addresses |
| [`@thenamespace/indexer`](./packages/indexer) | SDK for the Namespace Indexer API |
| [`@thenamespace/mint-manager`](./packages/mint-manager) | Minting L2 subnames |
| [`@thenamespace/offchain-manager`](./packages/offchain-manager) | Creating & managing off-chain ENS subnames |
| [`@thenamespace/avatar`](./packages/avatar) | ENS avatar & header image uploads |

## Prerequisites

- Node.js >= 16.0.0
- npm (workspaces are used for dependency management)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/thenamespace/namespacesdk.git
cd namespacesdk

# Install dependencies for every package
npm install
```

Each package is self-contained. To work on one, change into its directory and use its own scripts:

```bash
cd packages/offchain-manager
npm run build      # compile TypeScript
npm run test       # run the package's tests (where available)
```

## Development Workflow

1. **Fork** the repository and create a feature branch off `release`:
   ```bash
   git checkout -b feat/short-description
   ```
2. **Make your changes** in the relevant package under `packages/`.
3. **Build** the package(s) you touched to confirm they compile:
   ```bash
   npm run build
   ```
4. **Add or update tests** when you change behavior, and make sure they pass.
5. **Update documentation** (the package README and any related docs) when behavior changes.

## Commit Messages

Please follow [Conventional Commits](https://www.conventionalcommits.org/). Scope the change to the affected package where it helps:

```
feat(offchain-manager): add support for custom resolvers
fix(indexer): handle 404 responses gracefully
docs(addresses): document getEnsContracts
```

## Pull Requests

1. Ensure your branch is up to date with `release`.
2. Confirm the affected packages build and their tests pass.
3. Keep the PR focused — one logical change per PR.
4. Describe **what** changed and **why**, and link any related issues.
5. Open the PR against the `release` branch.

## Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/thenamespace/namespacesdk/issues) with as much detail as possible — steps to reproduce, expected vs. actual behavior, and the package + version affected.

## Questions

Join the [**Namespace Builders**](https://t.me/+OsziFgfuZz03NjEy) group chat on Telegram if you have questions, suggestions, or feedback.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
