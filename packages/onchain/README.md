# @thenamespace/onchain

Prepare ENSv2 subname registrations and renewals on Ethereum mainnet or Sepolia.
The SDK reads contract state, retrieves and verifies Merkle proofs, quotes prices,
and returns ordered transaction calls. Your application controls wallet prompts and submission.

## Install

```sh
npm install @thenamespace/onchain viem
```

Requires Node.js 18+ or a browser with `fetch` and `AbortSignal.timeout`.
Viem is a peer dependency. Both ESM and CommonJS imports are supported.

## Prepare a mint

```ts
import { createOnchainClient, ONE_YEAR } from "@thenamespace/onchain";
import { createPublicClient, http, zeroAddress, type Address } from "viem";
import { sepolia } from "viem/chains";

export async function prepareSubname(rpcUrl: string, minter: Address) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const sdk = createOnchainClient({ publicClient, chainId: sepolia.id });
  const input = {
    parentName: "example.eth",
    label: "alice",
    minter,
    duration: ONE_YEAR,
  };
  const quote = await sdk.quoteMint(input);
  if (!quote.canMint) throw new Error(quote.reason?.message);
  const prepared = await sdk.prepareMint({
    ...input,
    paymentToken: zeroAddress,
    maxPriceUsdRaw: quote.priceUsdRaw,
  });
  const fees = await sdk.estimateFees(prepared);
  return { prepared, fees };
}
```

The parent must already be activated. Replace `example.eth` and the RPC URL with
your integration's values. `minter` is the transaction sender and payer. Set
`recipient` in `prepareMint` only when the subname should belong to another wallet.

Before submitting, check both balance shortfalls returned by `estimateFees`,
verify the connected wallet matches `prepared.account` and `prepared.chainId`,
and show the payment and network fee. `estimateFees` requires an RPC supporting
`eth_simulateV1`; unsupported RPCs produce an error rather than a zero fee.

`prepared.calls` contains an ERC20 approval when required, followed by the mint.
Send the calls atomically when the wallet supports it. For sequential submission,
wait for a successful approval receipt, then call `prepareMint` again and simulate
before submitting the mint. Apply the same process to renewal. Check every
transaction receipt's status; a transaction hash alone is not success.

The SDK refreshes state and proofs during preparation. `maxPriceUsdRaw` rejects a
USD price increase before submission. It is not an onchain spending limit: the
contracts do not accept an expected-price argument, and terms can change before
execution. Native payment and ERC20 allowance include a 2% buffer. Excess paid
ETH is refunded by the contract; ERC20 transfers use the execution-time price.

## API

| Method                                                                            | Result                                                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `getActivation(parentName)`                                                       | Current configuration, active features, parent expiry and current/bound subregistries |
| `getResolver(parentName, requested?)`                                             | Effective resolver read from the manager                                              |
| `quoteMint({ parentName, label, minter, duration? })`                             | Availability, eligibility, denial reason, USD price and claims                        |
| `prepareMint({ ...input, paymentToken, recipient?, resolver?, maxPriceUsdRaw? })` | Refreshed quote, payment, effective resolver and ordered calls                        |
| `quoteRenewal({ parentName, label, renewer, duration })`                          | Renewal eligibility, expiry, owner, price and claims                                  |
| `prepareRenewal({ ...input, paymentToken, maxPriceUsdRaw? })`                     | Refreshed quote, payment and ordered calls                                            |
| `quotePayment(priceUsdRaw, tokenAddress)`                                         | Token amount in base units, validated by the issuer                                   |
| `estimateFees({ account, calls, payment })`                                       | Simulated network fee and ETH/token balance shortfalls                                |

Use `sdk.deployment.paymentTokens` for the token selector. USD prices use 12
decimals; durations and expiries use seconds. Names are ENS-normalized, and this
release supports one subname label under a second-level `.eth` parent.
Registry-reserved labels are excluded from ordinary minting. Record updates remain
separate calls, which ENS Components adds after registration.

Renewal may be paid by anyone. It requires a live expirable subname and issuer
renewal permission, including permission scoped to that subname. Renewal omits
reservation claims and gate-only whitelist claims. Free-whitelist claims remain
necessary to preserve a member's discount.

## Proofs and errors

The existing Namespace manager stores the lists used to generate proofs. The
SDK fetches proofs automatically for enabled whitelist and reservation features
and verifies supplied claims against the onchain root. Every mint with an active
reservation root needs a claim, including unreserved labels. Open activations
need no proof HTTP request. This SDK does not upload or configure lists.

`createOnchainClient` accepts optional `managerApiUrl` and `fetch` overrides for
testing or self-hosting the same manager API. It uses the first-party endpoint
for the selected chain by default.

Expected eligibility refusals return `quote.reason` with a code, message, and
contract denial number when available. Operational failures throw `OnchainError`:

- `INVALID_INPUT`, `UNSUPPORTED_CHAIN`, `CHAIN_MISMATCH`, `UNSUPPORTED_TOKEN`
- `PROOF_UNAVAILABLE`, `INVALID_PROOF`
- `MINT_BLOCKED`, `RENEWAL_BLOCKED`, `PRICE_CHANGED`, `CONFIGURATION_CHANGED`
- `RPC_ERROR`, `CONTRACT_REVERTED`, `INSUFFICIENT_FUNDS`
- `WALLET_REJECTED`, `TRANSACTION_FAILED`

Read `error.code` for application logic, `error.message` for display, and
`error.cause` for the original failure. `toOnchainError(error)` also translates
wallet/provider failures at your application's submission boundary.
Proof retrieval failures never silently remove a discount or become ineligibility.

## Migrating from mint-manager

Use this package for ENSv2 activations. Existing L1/L2 listings continue using
`@thenamespace/mint-manager`; installing this SDK does not migrate contracts or
registered subnames. The new SDK reads prices and policies from contracts and
requires no backend mint-authorization signature.

## Development

From the namespacesdk repository:

```sh
npm install
npm run build --workspace @thenamespace/addresses
npm run build --workspace @thenamespace/onchain
npm test --workspace @thenamespace/onchain
```

The first release requires a published `@thenamespace/addresses` version satisfying
`^1.2.1`. Local development resolves that package from this workspace; an isolated
registry install requires releasing the addresses dependency before this SDK.

Addresses come from `@thenamespace/addresses`. Contract ABIs come from the
onchain-subnames repository; `src/abi/source.json` records their source commit.
After updating the contract package's generated ABIs, synchronize them with:

```sh
node packages/onchain/scripts/sync-abis.mjs /path/to/onchain-subnames
```

Keep a copy of that contract checkout available for ABI updates; consumers do
not need it to install, build, or run this SDK.
