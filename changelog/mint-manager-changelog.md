# Changelog


## [1.1.0] - 2025-10-06

### Changed - Simplified client creation: `createMintClient()` now derives environment internally; pass `{ isTestnet: true }` for test usage. - Updated package scope in docs to `@thenamespace/mint-manager`. - Clarified usage examples and default mainnet (zero-config) flow.  ### Fixed - Testnet behavior now consistently uses Sepolia listings and staging API endpoints when `isTestnet: true`. - Minor README formatting/typing fixes.  ### Misc - Minor documentation cleanups and example tweaks.

## [1.1.0] - 2025-10-06

### Changed

- Renamed package scope in docs from `@namespacesdk/mint-manager` to `@thenamespace/mint-manager`.
- Updated client creation: `createMintClient()` now derives environment internally. Use `{ isTestnet: true }` to target testnet; no explicit environment needed.

### Fixed

- Testnet behavior: When `isTestnet: true`, SDK now consistently uses Sepolia listings and staging API endpoints.

### Misc

- Minor documentation cleanups and examples clarified.

## [1.0.1] - 2025-09-07

Initial Release
