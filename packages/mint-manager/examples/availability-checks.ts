/**
 * Can this address mint this name, and if not, why?
 *
 * Demonstrates:
 *   - `checkName`, which answers the whole question in one call
 *   - reading a discriminated result: available / taken / blocked
 *   - why the older isL1/isL2SubnameAvailable pair cannot answer it alone
 *   - supplying your own RPC endpoint via `customRpcUrls`
 *
 * Run:
 *   cd packages/mint-manager
 *   npm run example:availability
 *
 * Environment (all optional, see .env.example):
 *   PARENT_NAME      parent listing to check under. Default: oppunk.eth
 *                    (a real, open Optimism listing on mainnet)
 *   LABEL            label to check.                Default: alice
 *   MINTER_ADDRESS   address that intends to mint.  Default: a sample address
 *   OPTIMISM_RPC_URL RPC for the L2 check. Falls back to viem's public
 *                    endpoint, which is heavily rate limited.
 */
import { optimism } from "viem/chains";
import { createMintClient } from "../src";
import { asAddress, optionalEnv, run } from "./shared";

const SAMPLE_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const PARENT_NAME = optionalEnv("PARENT_NAME", "oppunk.eth");
const LABEL = optionalEnv("LABEL", "alice");
const MINTER = asAddress(
  optionalEnv("MINTER_ADDRESS", SAMPLE_ADDRESS),
  "MINTER_ADDRESS"
);
const RPC_URL = process.env.OPTIMISM_RPC_URL;

const SUBNAME = `${LABEL}.${PARENT_NAME}`;

async function main() {
  // `customRpcUrls` is keyed by numeric chain id. Omitting a chain leaves viem
  // on that chain's public default, which is fine for a one-off check and will
  // rate-limit you the moment you loop over a list of names.
  const client = createMintClient({
    customRpcUrls: RPC_URL ? { [optimism.id]: RPC_URL } : undefined,
  });

  console.log(`Checking ${SUBNAME}`);
  console.log(RPC_URL ? "  RPC: custom endpoint" : "  RPC: public default");
  console.log("");

  // One call. Note what is NOT passed in: no chain id, and no separate
  // label/parent split. Both are derived from the listing, which is the point:
  // hardcoding a chain id is how you end up checking the wrong network.
  const check = await client.checkName(SUBNAME, { minterAddress: MINTER });

  console.log(`  name:     ${check.name}`);
  console.log(`  listing:  ${check.listingType} on chain ${check.chainId}`);
  console.log(`  status:   ${check.status}`);

  switch (check.status) {
    case "available":
      // Price fields exist only on this branch; TypeScript enforces that.
      console.log(`  price:    ${check.estimatedPriceEth} ETH`);
      console.log(`  fee:      ${check.estimatedFeeEth} ETH`);
      console.log("\nReady to mint. Pass this result straight to prepareMint:");
      console.log("  await client.prepareMint(check, { minterAddress })");
      break;

    case "taken":
      console.log(`  reasons:  ${check.reasons.join(", ") || "already registered"}`);
      console.log("\nThe name is gone. Offer the user a different label.");
      break;

    case "blocked":
      // The distinction below is the one the old API could not make: on a gated
      // listing the mint API stops at the gate and never looks at the name, so
      // a free name and a taken one return identical responses.
      console.log(`  reasons:  ${check.reasons.join(", ")}`);
      console.log(
        check.nameAvailabilityConfirmed
          ? "\nThe name itself is free. This address just is not allowed to mint it."
          : "\nMint is blocked. Name availability was not confirmed (rpc: 'never')."
      );
      break;
  }

  console.log(
    "\nThe deprecated isL1SubnameAvailable / isL2SubnameAvailable report only\n" +
      "registry ownership. They cannot tell you about allowlists, reservations\n" +
      "or expired listings, and isL2SubnameAvailable makes you supply the chain\n" +
      "id that checkName just derived for you."
  );
}

run(main);
