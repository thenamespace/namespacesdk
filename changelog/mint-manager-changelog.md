# Changelog

## [1.1.1] - 2025-10-28

### Added

- Default EVM chain configuration for address records: `ChainName.Default` with coin type `2147483648` (no conversion), using Ethereum-style validation.

### Fixed

- Corrected Scroll coin type from `34352` to `534352`.

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
