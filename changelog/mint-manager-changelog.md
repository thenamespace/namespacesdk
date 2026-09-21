# Changelog


## [2.0.0] - 2026-09-21

### Added
- Added `checkName` to return whether a name is available, taken, or blocked for a given minter, with price when the name is mintable.
- Added `prepareMint` to build the mint transaction from a `checkName` result or a full name, including an optional `maxValue` cap.
- Added typed `MintManagerError` codes so callers can branch on `code` instead of parsing messages.
- Added ENSIP-15 helpers: `normalizeName`, `normalizeLabel`, and `normalizeSubname`.
- Added mint-parameter verification so a signed price that does not cover the requested name, parent, or owner is rejected.
- Exported chain helpers (`getChainId`, `getChainName`, and related utilities) from the package entrypoint.

### Changed
- Names and labels are now normalized per ENSIP-15 before hashing, API calls, or comparisons.
- `ContenthashType.Ipfs` now writes the `ipfs-ns` codec instead of `p2p`. Swarm, Arweave, and Skynet contenthashes now encode correctly.
- Unknown chain names in `records.addresses` now throw instead of being skipped.
- `isL1SubnameAvailable` and `isL2SubnameAvailable` are deprecated in favor of `checkName`.

### Fixed
- Availability checks now throw `RPC_ERROR` when the registry is unreachable instead of returning `false`.
- Unnormalizable names now throw `INVALID_NAME` instead of producing an arbitrary namehash.

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
