# Onchain Subnames SDK

`@thenamespace/onchain-subnames` prepares ENSv2 subname registrations and renewals
on Ethereum mainnet and Sepolia. It reads contracts, retrieves and verifies
Merkle proofs, quotes prices, and returns ordered transaction calls. Your
application controls wallet prompts and submission.

## Install

```sh
npm install @thenamespace/onchain-subnames viem
```

Requires Node.js 18+ or a browser with `fetch` and `AbortSignal.timeout`.
Viem is a peer dependency. ESM and CommonJS imports are supported.

## Prepare a registration

```ts
import {
  createOnchainClient,
  SECONDS_PER_YEAR,
} from "@thenamespace/onchain-subnames";
import { createPublicClient, http, zeroAddress, type Address } from "viem";
import { sepolia } from "viem/chains";

export async function prepareSubname(rpcUrl: string, account: Address) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const client = createOnchainClient({ publicClient, chainId: sepolia.id });
  const input = {
    parentName: "example.eth",
    label: "alice",
    account,
    durationSeconds: SECONDS_PER_YEAR,
  };
  const quote = await client.getRegistrationQuote(input);
  if (quote.status !== "ready") {
    throw new Error(quote.reason?.message ?? "Connect an account to continue.");
  }
  const operation = await client.prepareRegistration({
    ...input,
    paymentToken: zeroAddress,
    maxPriceUsd: quote.price,
  });
  const cost = await client.estimateTransactionCost(operation);
  return { operation, cost };
}
```

The parent must already be configured for Onchain Subnames. Replace `example.eth`
and the RPC URL with your integration's values. This release supports one label
under a second-level `.eth` parent. Names are ENS-normalized.

`account` is the transaction sender, payer, and account checked for eligibility.
Set `recipient` during registration preparation to give the subname to another
address. It defaults to `account`. Anyone may pay for renewal; it does not change
ownership.

## API

| Method                                                    | Result                                            |
| --------------------------------------------------------- | ------------------------------------------------- |
| `getParentState(parentName)`                              | Advanced configuration and registry state         |
| `getRegistrationResolver(parentName, requestedResolver?)` | Effective resolver                                |
| `getRegistrationQuote(input)`                             | Registration outcome and USD price                |
| `getRenewalQuote(input)`                                  | Renewal outcome, USD price and expiry information |
| `getPaymentQuote({ price, paymentToken })`                | Exact token amount and denomination               |
| `prepareRegistration(input)`                              | Refreshed registration quote and ordered calls    |
| `prepareRenewal(input)`                                   | Refreshed renewal quote and ordered calls         |
| `estimateTransactionCost({ account, calls, payment })`    | Network fee and balance shortfalls                |

`getOnchainDeployment(chainId)` is also available without constructing a client.

## Quotes

`getRegistrationQuote` and `getRenewalQuote` return one of three outcomes:

| Status             | Meaning                                                                         | Price                                |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------ |
| `ready`            | Checks passed for the supplied account at the observed block                    | Confirmed USD amount                 |
| `blocked`          | A known rule prevents the operation; inspect `reason.code` and `reason.message` | `null` when no price was established |
| `account_required` | An account is needed to finish checking                                         | Account-independent price, or `null` |

Omit `account` while the wallet is disconnected. Do not pass the zero address.
Known label-price, label-class, deadline and reservation policies can be quoted
without an account. Token-gate policies are also account-independent during
renewal. Whitelist and unknown policies leave disconnected pricing `null`.
A disconnected quote never has `ready` status.

A price is `{ currency: "USD", amount: bigint, decimals: 12 }`. Zero means free;
`null` means the SDK did not establish a price. Keep calculations in integer base
units and format them in the application.

Both quotes include the normalized `name`, `parentName`, `label`, `account`,
`chainId`, `durationSeconds`, `blockNumber`, `expirationType`, and
`parentExpiresAtSeconds`. Expiration type is `expiring`, `permanent`, or `null`
when unknown. Expiry timestamps use Unix seconds. A missing or permanent parent
expiry is `null`. `SECONDS_PER_YEAR` is exactly 365 days.

Renewal also returns `owner`, `expiresAtSeconds`, and `newExpiresAtSeconds`.
Unavailable values are `null`; permanent registrations do not expose a maximum
integer as a timestamp. An existing registration keeps its own expiration type
even if the parent's current policy changes. A parent policy that prevents
renewing an older expiring registration returns `RENEWAL_DISABLED` and preserves
its finite expiry. The projected expiry is not an execution guarantee.

Ordinary quotes contain no activation object, feature addresses, or encoded
claims. `getParentState(parentName)` provides advanced configuration and registry
state separately. Its `activationId` alone does not prove configuration exists;
check `isConfigured`. `getRegistrationResolver` reads the manager's effective
resolver precedence.

## Payment and submission

Use `client.deployment.paymentTokens` for payment selection. To price one token:

```ts
import type {
  OnchainClient,
  RegistrationQuote,
} from "@thenamespace/onchain-subnames";
import type { Address } from "viem";

export async function pricePayment(
  client: OnchainClient,
  quote: RegistrationQuote,
  paymentToken: Address,
) {
  if (quote.price === null) return null;
  return client.getPaymentQuote({ price: quote.price, paymentToken });
}
```

A payment quote contains `{ token: { address, symbol, decimals }, amount }`.
Preparation returns a `PreparedOperation` containing `chainId`, `account`, the
refreshed quote, payment including `bufferedAmount`, and ordered `calls`.
Registration also returns the effective `resolver`.

`estimateTransactionCost` simulates the calls and returns `networkFeeWei`,
`nativeBalanceShortfallWei`, and `tokenBalanceShortfall`. A token shortfall skips
simulation and leaves `networkFeeWei: null`. Other simulation failures throw an
error. The RPC must support `eth_simulateV1`.

Before submitting, check balance shortfalls, match the connected wallet to the
operation's account and chain, and show the payment and network fee. Calls
include an ERC20 approval when required. Submit atomically when supported. For
sequential submission, wait for a successful approval receipt, prepare again,
and simulate before submitting registration or renewal. Check receipt status;
a transaction hash alone is not success.

Preparation refreshes state and proofs. `maxPriceUsd` rejects a USD increase
before submission. It is not an onchain spending limit: the contracts have no
expected-price argument and terms can change before execution. Native payment
and ERC20 allowance include a 2% buffer. The contract refunds excess ETH and
transfers ERC20 at its execution-time price. Record updates remain separate calls.

## Proofs and errors

The Namespace manager stores the lists used to generate proofs. Contracts store
the roots. The SDK fetches and verifies claims for enabled features and includes
them in prepared calls. It does not upload or configure lists.

`createOnchainClient` accepts optional `managerApiUrl` and `fetch` overrides.
`managerApiUrl` retains its existing name and uses the first-party endpoint for
the selected chain by default.

Renewal omits reservation claims and gate-only whitelist claims. Free-whitelist
claims remain necessary to preserve a member's discount. Proof-service failures
throw errors; they never silently remove discounts or become eligibility refusals.

Expected refusals return a typed `reason.code` and a displayable `reason.message`.
Numeric contract denials, when present, are diagnostic `reason.details` only.
Operational failures throw `OnchainError` with a stable `code`, `message`,
`details`, and original `cause`. `toOnchainError(error)` also normalizes wallet
and provider failures at your submission boundary.

Error codes include `INVALID_INPUT`, `UNSUPPORTED_CHAIN`, `CHAIN_MISMATCH`,
`UNSUPPORTED_TOKEN`, `PROOF_UNAVAILABLE`, `INVALID_PROOF`, `REGISTRATION_BLOCKED`,
`RENEWAL_BLOCKED`, `PRICE_CHANGED`, `CONFIGURATION_CHANGED`, `RPC_ERROR`,
`CONTRACT_REVERTED`, `INSUFFICIENT_FUNDS`, `WALLET_REJECTED`, and `TRANSACTION_FAILED`.

## Development

From the namespacesdk repository:

```sh
npm install
npm run build --workspace @thenamespace/addresses
npm run build --workspace @thenamespace/onchain-subnames
npm test --workspace @thenamespace/onchain-subnames
npm run typecheck --workspace @thenamespace/onchain-subnames
```

The first release requires an available `@thenamespace/addresses` version
satisfying `^1.2.1`. Local development resolves it from this workspace. Publish
required dependency versions before releasing the SDK.

Contract ABIs come from the onchain-subnames repository. `src/abi/source.json`
records their source commit. Synchronize updated generated ABIs with:

```sh
node packages/onchain-subnames/scripts/sync-abis.mjs /path/to/onchain-subnames
```

This package replaces the unpublished `@thenamespace/onchain` draft, without
compatibility aliases. Use `getRegistrationQuote`, `prepareRegistration`,
`getRenewalQuote`, `getPaymentQuote`, and `estimateTransactionCost`; inputs use
`account` and `durationSeconds`. Consumers of that draft need to migrate.
Existing L1/L2 listings continue using `@thenamespace/mint-manager`. Installing
this package does not migrate contracts or existing registrations.
