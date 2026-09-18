# Examples

Four runnable examples for `@thenamespace/mint-manager`. Read them in this order.

| File | What it shows | Needs a key? | Spends? |
| --- | --- | --- | --- |
| `testnet-usage.ts` | Smallest possible testnet quote. Start here to confirm your setup | no | no |
| `basic-usage.ts` | Quote a mint and build the transaction, with ENS records | no | no |
| `availability-checks.ts` | L1 vs L2 availability, custom RPC endpoints | no | no |
| `mint-and-send.ts` | Full signed mint on Base Sepolia: simulate, send, confirm | **yes** | **yes** |

`shared.ts` holds the small env-reading and error-printing helpers the examples
use. It is not part of the SDK.

## Setup

```sh
cd packages/mint-manager
npm install
cp .env.example .env        # then edit .env
set -a && source .env && set +a
```

The examples read every credential from `process.env`. None of them contains a
key, an RPC URL, or a fallback to one. If a variable is missing, the example
exits and tells you which one and where the template is. Keep it that way.

> A private key was hardcoded in this folder and pushed to the repository. That
> key is permanently compromised. Do not reuse it or send it anything.

The mainnet examples default `PARENT_NAME` to `oppunk.eth`, an open listing whose
subnames live on an Optimism registry (chain 10) with a base price of 0, so they
produce a real quote before you configure anything.

The testnet examples have no such default. There is no shared Sepolia listing to
fall back on, so `PARENT_NAME` is required there. List a name of your own at
[dev.namespace.ninja](https://dev.namespace.ninja) first.

A parent that is not listed on the network you are querying fails with
`LISTING_NOT_FOUND`, which reads like a network problem but is not one.

## Running

```sh
npm run example:testnet         # testnet-usage.ts
npm run example:availability    # availability-checks.ts

npx ts-node ./examples/basic-usage.ts
npx ts-node ./examples/mint-and-send.ts
```

`mint-and-send.ts` broadcasts a real transaction on Base Sepolia and needs
`PRIVATE_KEY` plus testnet ETH from a
[faucet](https://www.alchemy.com/faucets/base-sepolia). Use a throwaway account.

## Things that trip people up

**Not every refusal means "try another name".** `checkName` returns `reasons`,
and they split into two groups. `SUBNAME_TAKEN` and `SUBNAME_RESERVED` are about
the name, so a different label helps. `MINTER_NOT_WHITELISTED`,
`MINTER_NOT_TOKEN_OWNER` and `VERIFIED_MINTER_ADDRESS_REQUIRED` are about the
address, so every other label fails the same way. `LISTING_EXPIRED` means nothing
is mintable under that parent at all. Sending someone back to the name field when
their wallet is the problem is a loop they cannot exit.

**A reserved name is not a registered one.** `SUBNAME_RESERVED` means the parent
owner is holding that label back. The registry still reports it as free, which is
why `checkName` consults the registry before deciding between `taken` and
`blocked`.

**Chain ids and `ChainName` are different types for different jobs.** A numeric
chain id (`8453`) identifies a network and goes to `customRpcUrls`. A `ChainName`
(`ChainName.Base`) identifies an ENS coin type and goes in `records.addresses`.
Passing a chain id where a `ChainName` belongs writes an address under a coin
type nobody reads. `checkName` reports the chain id it used in `check.chainId`,
so you rarely need to name one yourself.

**`tx.value` is already wei.** `prepareMint` returns a `bigint` in wei. Pass it
straight to `writeContract` and use viem's `formatEther` to display it. Running
it through `parseEther` multiplies it by 10<sup>18</sup> a second time. An
earlier version of these examples did exactly that.

## Setting records at mint time

There is no `setDefaultEvmAddress` method. Records are passed on the mint request
itself, so they land in the same transaction as the mint:

```ts
const tx = await client.prepareMint("alice.oppunk.eth", {
  minterAddress: account.address,
  records: {
    texts: [{ key: "url", value: "https://namespace.ninja" }],
    addresses: [
      { chain: ChainName.Ethereum, value: account.address },
      { chain: ChainName.Base, value: account.address },
    ],
    contenthash: { type: ContenthashType.Ipfs, value: "bafybei..." },
  },
});
```

To point one address at several chains, map over the chains you support:
`basic-usage.ts` has a four-line `sameAddressOn` helper. Write only the chains
you actually support: each record is extra calldata and extra gas.

## Error handling

Failures from the SDK are `MintManagerError` with a stable `code`. Branch on the
code, not on the message text, which changes between releases:

```ts
import { MintManagerError } from "@thenamespace/mint-manager";

try {
  await client.prepareMint(check, { minterAddress });
} catch (err) {
  if (err instanceof MintManagerError) {
    console.error(err.code, err.details, err.docsUrl);
  }
  throw err;
}
```

`RPC_ERROR` deserves its own branch. A failed registry lookup means the name's
status is unknown, not unavailable. Show it as a temporary failure with a retry.
Treating it as "taken" costs your user a mint they could have made.
