<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-light.png">
  <img alt="Namespace" src="https://raw.githubusercontent.com/thenamespace/namespacesdk/release/assets/namespace-logo-dark.png" width="320">
</picture>

# Namespace SDK - Mint Manager

[![npm version](https://img.shields.io/npm/v/@thenamespace/mint-manager.svg)](https://www.npmjs.com/package/@thenamespace/mint-manager)

`@thenamespace/mint-manager` prepares ENS subname mint transactions for names listed on Namespace. It builds the contract call (ABI, args, value) and you submit it with whatever wallet library you already use. It never holds a private key and never sends a transaction.

Subnames can be minted on Ethereum Mainnet (L1) or on Base and Optimism (L2). The SDK figures out which path a parent name uses and returns the right contract call for it.

## Installation

```sh
npm install @thenamespace/mint-manager viem
```

`viem` is a peer dependency. Installing it yourself keeps a single copy in your tree, which matters because the SDK type-checks errors returned by viem.

## Quick start

```typescript
import { createMintClient } from "@thenamespace/mint-manager";

const client = createMintClient();

const check = await client.checkName("alice.oppunk.eth", {
  minterAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
});

if (check.status === "available") {
  const tx = await client.prepareMint(check, { minterAddress });
  await walletClient.writeContract(tx);
}
```

Pass the whole name. The SDK normalizes it, splits it, resolves the listing, and works out the chain itself.

For testnet, pass `isTestnet: true`. That switches both the listing source (Sepolia) and the API environment (staging) together, so a quote can never come from a different network than the transaction that follows it.

```typescript
const testnet = createMintClient({ isTestnet: true });
```

## Check once, then mint

`checkName` answers the question you actually have in a single call: can this address mint this name, and if not, why.

```typescript
const check = await client.checkName("alice.oppunk.eth", { minterAddress });

switch (check.status) {
  case "available":
    check.estimatedPriceEth; // only exists on this branch
    await client.prepareMint(check, { minterAddress, records });
    break;

  case "taken":
    // The name is registered. Offer a different label.
    break;

  case "blocked":
    // The name is free, but this minter cannot mint it.
    check.reasons; // ["MINTER_NOT_WHITELISTED"]
    break;
}
```

The result is a discriminated union, so TypeScript will not let you read a price off a result that has none.

### Why this exists

The older availability methods each answer half the question. `isL2SubnameAvailable` reports registry ownership but knows nothing about allowlists, reservations or expired listings. `getMintDetails` knows about those, but its validation stops at the first failure. On a gated listing it never evaluates the name at all, so a free name and a taken name produce byte-identical responses:

```text
gated listing, free name   ->  canMint:false, ["MINTER_NOT_WHITELISTED"]
gated listing, taken name  ->  canMint:false, ["MINTER_NOT_WHITELISTED"]
```

That is the loop worth avoiding: you check, you attempt, you are rejected for an unrelated reason, and you still do not know whether the name was free. `checkName` consults the registry exactly when the API's answer leaves that unresolved, so you get a complete answer without paying for a lookup you do not need.

| Situation | Requests | Result |
| --- | --- | --- |
| Name mintable | listing + API | `available` |
| Name taken, open listing | listing + API | `taken` |
| Gated listing | listing + API + registry | `blocked` or `taken` |

Override the policy with `rpc: "always"` to reconcile against the registry on every call, or `rpc: "never"` to stay off-chain. With `"never"`, a `blocked` result carries `nameAvailabilityConfirmed: false` rather than implying the name is free.

## Why a mint gets refused

`reasons` is where the useful detail lives, and the entries are not interchangeable. Two things decide how your UI should react: whether the obstacle is the **name** or the **minter**, and whether **trying a different label would help**. Confusing the two is how an app tells someone to pick a new name when the real problem was their wallet.

| Reason | Obstacle | Another label helps? | What to tell the user |
| --- | --- | --- | --- |
| `SUBNAME_TAKEN` | name | yes | The name is registered and gone for everyone. Offer alternatives. |
| `SUBNAME_RESERVED` | name | yes | The parent owner is holding this label back. It is *not* registered, so the registry will report it free. Offer alternatives. |
| `MINTER_NOT_WHITELISTED` | minter | no | This address is not on the parent's allowlist. Switch wallets or request access. |
| `MINTER_NOT_TOKEN_OWNER` | minter | no | The parent is token-gated and this address holds no qualifying token. Unlike an allowlist, the user can usually go and acquire one. |
| `VERIFIED_MINTER_ADDRESS_REQUIRED` | minter | no | The wallet is recognised but has not completed verification. Send them through the parent's verification flow. |
| `LISTING_EXPIRED` | listing | no | The minting window has closed. No label under this parent is mintable until the owner relists. |

Validation stops at the first failure, so `reasons` is not exhaustive. Clearing one can reveal another. Re-run `checkName` after the user acts rather than assuming the remaining reasons are unchanged.

`SUBNAME_RESERVED` is the one worth reading twice. A reserved name is held back, not minted, so the registry reports it as free. That is why `checkName` consults the registry before deciding between `taken` and `blocked` instead of assuming "reserved" means "gone".

When `prepareMint` refuses a name, the error carries the advice that matches the reason:

```typescript
// blocked by an allowlist
"The restriction is on the minting address, not the name, so every other
 label will fail the same way. Use an address that satisfies the parent's
 requirements rather than prompting for a different name."

// listing expired
"The listing's minting window has closed, so no label under this parent is
 mintable until the owner relists it. Changing the label will not help."
```

## Names are normalized for you

Every name and label you pass in is normalized per [ENSIP-15](https://docs.ens.domains/ensip/15) before it is hashed, sent to the API, or compared.

This matters more than it sounds. `namehash()` on its own normalizes nothing, so without this step `"Alice.eth"` and `"alice.eth"` hash to different nodes, and an availability check can report a registered name as free.

```typescript
// All of these refer to the same name, and all are accepted:
await client.isL1SubnameAvailable("Alice.namespace.eth");
await client.isL1SubnameAvailable("alice.namespace.eth");

// Rejected before any network call, with an explanation:
await client.isL1SubnameAvailable("аlice.namespace.eth");
// MintManagerError [INVALID_NAME]: illegal mixture: Cyrillic + Latin
```

If you store or compare names yourself, use the same helpers the SDK uses so your keys agree with its:

```typescript
import { normalizeName, normalizeLabel } from "@thenamespace/mint-manager";

normalizeName("Alice.ETH"); // "alice.eth"
normalizeLabel("Alice"); // "alice"
normalizeLabel("alice.eth"); // throws INVALID_LABEL, a label has no dots
```

## Building a mint transaction

```typescript
import { parseEther } from "viem";

// From a check result. The listing is already resolved, so nothing is refetched.
const tx = await client.prepareMint(check, {
  minterAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  expiryInYears: 1,
  // Refuse to build the transaction if the signed price exceeds what you quoted.
  maxValue: parseEther("0.01"),
});

// Or straight from a name, if you already know it is mintable.
const tx2 = await client.prepareMint("alice.oppunk.eth", { minterAddress });

// Submit with viem, ethers, or wagmi.
const hash = await walletClient.writeContract(tx);
```

The returned object contains `abi`, `args`, `functionName`, `contractAddress`, `account` and `value`.

### About `maxValue`

The mint API returns a signed price that the contract will honour. The SDK checks that the signature covers the name, parent and owner you asked for, and rejects the response otherwise. `maxValue` closes the remaining gap: it caps what you are willing to pay, so a price that moves between your quote and your signature fails loudly instead of being charged.

Set it whenever you have shown a price to a user.

## Setting records at mint time

Records are applied in the same transaction as the mint, so a name arrives configured rather than empty.

```typescript
import { ContenthashType, ChainName } from "@thenamespace/mint-manager";

const tx = await client.prepareMint("alice.oppunk.eth", {
  minterAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  records: {
    texts: [
      { key: "avatar", value: "https://example.com/avatar.png" },
      { key: "com.twitter", value: "@example" },
    ],
    addresses: [
      { chain: ChainName.Ethereum, value: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
      { chain: ChainName.Base, value: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
    ],
    contenthash: {
      type: ContenthashType.Ipfs,
      value: "bafybeicnesqbuvzjxhkylkzwaqxi5jvbvzf7z4rjnkvjnvbsrqxlgnzpqu",
    },
  },
});
```

`texts`, `addresses` and `contenthash` are each optional. An unknown chain name or a malformed address throws rather than being skipped, so you cannot pay for a mint and silently receive a name with no records on it.

## Registry-only availability

`isL1SubnameAvailable` and `isL2SubnameAvailable` are deprecated in favour of `checkName`, but still work. Reach for them only when you want raw registry ownership with no minter in hand.

```typescript
const free = await client.isL1SubnameAvailable("alice.namespace.eth");
const freeOnBase = await client.isL2SubnameAvailable("alice.namespace.eth", 8453);
```

Both throw `RPC_ERROR` if the registry cannot be reached. A failed lookup is not an answer about the name, and treating it as one would tell a user a name is taken when it is available.

Because these methods hit an RPC endpoint, supply your own for anything user-facing. The default is a shared public endpoint and is rate limited.

```typescript
const client = createMintClient({
  customRpcUrls: {
    1: process.env.MAINNET_RPC_URL!,
    8453: process.env.BASE_RPC_URL!,
  },
});
```

## Error handling

Every failure the SDK raises is a `MintManagerError` with a stable `code`. Branch on the code; the message is written for a human reading a log and may change.

```typescript
import { MintManagerError } from "@thenamespace/mint-manager";

try {
  const tx = await client.getMintTransactionParameters({ ... });
} catch (err) {
  if (!(err instanceof MintManagerError)) throw err;

  switch (err.code) {
    case "INVALID_LABEL":
      // The user typed something that is not a valid ENS label.
      break;
    case "PRICE_EXCEEDS_MAX":
      // The price moved past your cap. Re-quote and confirm with the user.
      break;
    case "RPC_ERROR":
      // Infrastructure, not the name. Retry is reasonable.
      break;
    default:
      console.error(err.code, err.message);
  }
}
```

Codes: `INVALID_NAME`, `INVALID_LABEL`, `INVALID_ADDRESS`, `UNSUPPORTED_CHAIN`, `UNSUPPORTED_LISTING`, `NAME_NOT_AVAILABLE`, `LISTING_NOT_FOUND`, `RPC_ERROR`, `API_ERROR`, `MINT_PARAMS_MISMATCH`, `PRICE_EXCEEDS_MAX`, `SIGNATURE_EXPIRED`, `CONFIG_ERROR`.

Errors also carry `details` (the offending values) and sometimes `docsUrl`.

### `RPC_ERROR` is not an answer about the name

A failed registry lookup means the name's status is **unknown**, not unavailable. Showing "name taken" on the strength of an RPC failure tells users a name is gone when it is free, and they walk away.

```typescript
try {
  const check = await client.checkName(name, { minterAddress });
} catch (err) {
  if (err instanceof MintManagerError && err.code === "RPC_ERROR") {
    // Surface as a temporary lookup failure with a retry, never as a result.
    showRetryableError("Could not reach the registry. Try again.");
  }
}
```

The usual cause is rate limiting on the shared public endpoint. Pass your own, keyed by numeric chain id. `checkName` reports the chain in its result and the error reports it in `details.chainId`, so you know which one to supply.

## Configuration

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `isTestnet` | `boolean` | `false` | Sepolia listings and staging APIs. |
| `customRpcUrls` | `Record<number, string>` | `{}` | Keyed by chain id. Strongly recommended. |
| `mintSource` | `string` | `"namespace-sdk"` | Attribution tag sent with mints. |
| `listingCacheMilliseconds` | `number` | `900000` | Listing metadata TTL. |
| `timeoutMilliseconds` | `number` | `30000` | HTTP timeout. |
| `logger` | `Logger` | silent | Supply one to see diagnostics. |
| `listManagerUri` / `mintManagerUri` | `string` | none | Advanced overrides. Must be https. |

The SDK logs nothing unless you pass a `logger`.

## Upgrading from 1.1.x

The public API is unchanged and existing code keeps working. Four behaviours changed, all of them cases where the previous result was wrong:

- **Availability checks throw instead of returning `false` on RPC failure.** Previously an outage was indistinguishable from a taken name. If you call these without a `try`/`catch`, add one.
- **Names are normalized before hashing.** A name that could not be normalized used to produce an arbitrary namehash; it now throws `INVALID_NAME`.
- **`ContenthashType.Ipfs` now writes the `ipfs-ns` codec.** It previously wrote `p2p` (`0xa503`), which ENS clients do not read as IPFS. `Swarm`, `Arweave` and `Skynet` previously threw `multicodec not recognized` and now work. Use the enum members, not the raw strings.
- **Unknown chain names in `records.addresses` throw** rather than being skipped silently.

`cursomRpcUrls` is still honoured as a deprecated alias of `customRpcUrls`.

`isL1SubnameAvailable` and `isL2SubnameAvailable` are deprecated in favour of `checkName` but continue to work unchanged.

### ENS v2

[ENS v2](https://docs.ens.domains/ensv2/migration) moves name ownership into per-name subregistries, so a v1 registry `owner()` lookup will report a migrated name as unowned. The contracts are not final and nothing is deployed to mainnet yet, but this is why `checkName` treats the Namespace API as the primary source of truth and the registry as corroboration. The API can follow the migration without an SDK release. Normalization is unaffected, since ENSIP-15 does not change in v2.

## Examples

Runnable examples live in [`examples/`](./examples). Copy `.env.example` to `.env` first.

```sh
npm run example:testnet       # quote a subname on testnet
npm run example:availability   # L1 and L2 availability
```

## License

MIT
