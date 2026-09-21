/**
 * Quote a mint and build the transaction, without signing or broadcasting.
 *
 * This is the example to read first. It covers the two calls every integration
 * makes, and it is safe to run: it touches no private key and sends nothing.
 *
 * Demonstrates:
 *   - `checkName` for price, fee and the reasons a mint would be rejected
 *   - `prepareMint` for the exact contract call to submit
 *   - acting on the reason, since not every refusal means "try another name"
 *   - setting ENS records at mint time via the `records` field
 *   - writing one EVM address across several chains (what the removed
 *     `setDefaultEvmAddress` helper used to do, in four lines you control)
 *   - typed error handling with `MintManagerError`
 *
 * Run:
 *   cd packages/mint-manager
 *   npx ts-node ./examples/basic-usage.ts
 *
 * Environment (all optional, see .env.example):
 *   PARENT_NAME     parent listing.                  Default: oppunk.eth (a real, open mainnet listing)
 *   LABEL           label to mint.                   Default: alice
 *   MINTER_ADDRESS  address paying for the mint.     Default: a public sample address
 *   OWNER           receives the subname.            Default: the minter
 *   EVM_ADDRESS     written into the address records. Default: the minter
 *   EXPIRY_YEARS    registration length in years.    Default: 1
 *   IS_TESTNET      "true" for Sepolia/Base Sepolia. Default: false
 *                   Set PARENT_NAME to your own Sepolia listing if you enable it.
 */
import { formatEther } from "viem";
import {
  ChainName,
  ContenthashType,
  EnsAddressRecord,
  MintManagerError,
  createMintClient,
} from "../src";
import { asAddress, optionalEnv } from "./shared";

// vitalik.eth. A real, public address, used here only so the example produces a
// real quote out of the box. Quotes are per-address because a listing can
// whitelist minters or reserve labels.
const SAMPLE_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const PARENT_NAME = optionalEnv("PARENT_NAME", "oppunk.eth");
const LABEL = optionalEnv("LABEL", "alice");
const MINTER = asAddress(optionalEnv("MINTER_ADDRESS", SAMPLE_ADDRESS), "MINTER_ADDRESS");
const OWNER = asAddress(optionalEnv("OWNER", MINTER), "OWNER");
const EVM_ADDRESS = asAddress(optionalEnv("EVM_ADDRESS", MINTER), "EVM_ADDRESS");
const EXPIRY_YEARS = Number(optionalEnv("EXPIRY_YEARS", "1"));
// Defaults to mainnet because PARENT_NAME defaults to a mainnet listing. A
// testnet client against a mainnet listing 404s, which reads as a network
// fault but is really a listing that does not exist on the chosen network.
const IS_TESTNET = optionalEnv("IS_TESTNET", "false") === "true";

/**
 * Points one address at every EVM chain the caller cares about.
 *
 * ENS stores an address per coin type, so "my wallet is the same everywhere"
 * has to be written out chain by chain. Keep this list to the chains you
 * actually support: every extra record is extra calldata and extra gas at mint.
 */
function sameAddressOn(address: string, chains: ChainName[]): EnsAddressRecord[] {
  return chains.map((chain) => ({ chain, value: address }));
}

async function main() {
  const client = createMintClient({ isTestnet: IS_TESTNET });
  const subname = `${LABEL}.${PARENT_NAME}`;

  console.log(`Subname: ${subname}`);
  console.log(`Minter:  ${MINTER}`);
  console.log(`Owner:   ${OWNER}`);
  console.log(`Network: ${IS_TESTNET ? "testnet" : "mainnet"}\n`);

  // Step 1: check. A read against the Namespace API plus, when the API's answer
  // is inconclusive, the registry. Cheap enough to call on every keystroke.
  //
  // Pass the whole name. The SDK normalizes it, splits label from parent, and
  // derives the chain from the listing, so none of that is your problem.
  console.log("--- checkName ---");
  const check = await client.checkName(`${LABEL}.${PARENT_NAME}`, {
    minterAddress: MINTER,
    expiryInYears: EXPIRY_YEARS,
  });

  console.log(`  status:         ${check.status}`);
  console.log(`  listing:        ${check.listingType} on chain ${check.chainId}`);

  if (check.status !== "available") {
    // `reasons` is a closed set of codes, so map them to copy your users
    // understand. What matters is that the advice differs: a taken or reserved
    // label means try another, while an allowlist or token gate means every
    // other label fails identically and the name field is the wrong thing to
    // put a cursor back into.
    console.log("\n  This subname cannot be minted:");
    for (const reason of check.reasons) {
      console.log(`    - ${reason}`);
    }

    if (check.status === "taken" || check.reasons.includes("SUBNAME_RESERVED")) {
      console.log("\n  The name is unavailable. Try a different LABEL.");
    } else if (check.reasons.includes("LISTING_EXPIRED")) {
      console.log("\n  The minting window has closed. No LABEL will work here.");
    } else {
      console.log(
        "\n  The restriction is on the minting address, not the name.\n" +
          "  Use a wallet that satisfies the parent's requirements."
      );
    }
    return;
  }

  // Price fields exist only on an "available" result, so TypeScript has already
  // proved they are here.
  console.log(`  price:          ${check.estimatedPriceEth} ETH`);
  console.log(`  fee:            ${check.estimatedFeeEth} ETH`);
  console.log(`  fee is fixed:   ${check.isStandardFee}`);

  // Step 2: build the transaction. Records are applied in the same transaction
  // as the mint, so the name is never briefly live with an empty profile.
  // Passing the check result reuses the listing it already resolved.
  console.log("\n--- prepareMint ---");
  const tx = await client.prepareMint(check, {
    minterAddress: MINTER,
    owner: OWNER,
    expiryInYears: EXPIRY_YEARS,
    records: {
      texts: [
        { key: "description", value: "Namespace SDK example subname" },
        { key: "url", value: "https://namespace.ninja" },
        { key: "com.twitter", value: "namespace_eth" },
      ],
      // `chain` takes a ChainName for ENS coin types. Numeric *chain ids* are a
      // different thing entirely, and checkName already reported one in
      // check.chainId. Passing a raw number here is read as an ENS coin type.
      addresses: sameAddressOn(EVM_ADDRESS, [
        ChainName.Ethereum,
        ChainName.Base,
        ChainName.Optimism,
      ]),
      contenthash: {
        type: ContenthashType.Ipfs,
        value: "bafybeicnesqbuvzjxhkylkzwaqxi5jvbvzf7z4rjnkvjnvbsrqxlgnzpqu",
      },
    },
  });

  console.log(`  contract:  ${tx.contractAddress}`);
  console.log(`  function:  ${tx.functionName}`);
  console.log(`  account:   ${tx.account}`);
  // `value` is already wei as a bigint. Format it for display; do not run it
  // through parseEther, which would multiply it by 10^18 a second time.
  console.log(`  value:     ${tx.value} wei (${formatEther(tx.value)} ETH)`);
  console.log(`  args:      ${tx.args.length} (the last one is the encoded record calldata)`);

  console.log(
    "\nHand this object straight to viem's writeContract. See mint-and-send.ts\n" +
      "for a complete signed mint on Base Sepolia."
  );
}

// Branch on `err.code`, never on message text: codes are stable across minor
// versions, messages are not. Anything that is not a MintManagerError came from
// the network stack or from your own code, so rethrow it rather than swallowing it.
main().catch((err) => {
  if (err instanceof MintManagerError) {
    switch (err.code) {
      case "LISTING_NOT_FOUND":
        console.error(`\nNo Namespace listing for "${PARENT_NAME}".`);
        console.error("List the parent at https://namespace.ninja first, or set PARENT_NAME.");
        break;
      case "INVALID_LABEL":
      case "INVALID_NAME":
        console.error(`\n${err.message}`);
        break;
      default:
        console.error(`\n[${err.code}] ${err.message}`);
    }
    process.exit(1);
  }
  throw err;
});

