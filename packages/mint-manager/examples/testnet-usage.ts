/**
 * Smallest useful testnet run: point the SDK at staging and get a real quote.
 *
 * Use this to confirm your setup works before debugging anything else. It makes
 * one API call and one chain read, needs no private key, and spends nothing.
 *
 * Demonstrates:
 *   - `isTestnet: true`, which switches both the Namespace APIs and the chains
 *     to their test equivalents (staging APIs, Sepolia and Base Sepolia)
 *   - supplying your own RPC endpoint with `customRpcUrls`
 *
 * Run:
 *   cd packages/mint-manager
 *   npm run example:testnet
 *
 * Environment (all optional, see .env.example):
 *   PARENT_NAME            parent listing on Sepolia. REQUIRED - list one at dev.namespace.ninja
 *   LABEL                  label to quote.            Default: alice
 *   MINTER_ADDRESS         address the quote is for.  Default: a public sample address
 *   BASE_SEPOLIA_RPC_URL   RPC for the availability read. Falls back to
 *                          ALCHEMY_BASE_SEPOLIA_RPC, then the public endpoint.
 */
import { baseSepolia } from "viem/chains";
import { createMintClient } from "../src";
import { asAddress, optionalEnv, requireEnv, run } from "./shared";

// vitalik.eth, a real public address, so the example returns a real quote
// without asking the reader for a wallet first.
const SAMPLE_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const PARENT_NAME = requireEnv(
  "PARENT_NAME",
  "a parent name you have listed on Sepolia at dev.namespace.ninja.\n  There is no shared testnet listing to fall back on, so this example\n  cannot guess one for you"
);
const LABEL = optionalEnv("LABEL", "alice");
const MINTER = asAddress(optionalEnv("MINTER_ADDRESS", SAMPLE_ADDRESS), "MINTER_ADDRESS");
const RPC_URL =
  process.env.BASE_SEPOLIA_RPC_URL || process.env.ALCHEMY_BASE_SEPOLIA_RPC;

async function main() {
  // Testnet and mainnet listings are separate namespaces: a parent listed on
  // mainnet will not be found by a client built with isTestnet: true, and the
  // error you get back is LISTING_NOT_FOUND rather than anything about networks.
  const client = createMintClient({
    isTestnet: true,
    customRpcUrls: RPC_URL ? { [baseSepolia.id]: RPC_URL } : undefined,
  });

  const subname = `${LABEL}.${PARENT_NAME}`;

  // One call replaces the old pair of isL2SubnameAvailable + getMintDetails.
  // Note that no chain id is passed: it comes from the listing.
  const check = await client.checkName(subname, { minterAddress: MINTER });

  console.log(`${subname} on chain ${check.chainId}: ${check.status}`);

  if (check.status === "available") {
    console.log(`  price:  ${check.estimatedPriceEth} ETH`);
    console.log(`  fee:    ${check.estimatedFeeEth} ETH`);
    return;
  }

  console.log(`  blocked by: ${check.reasons.join(", ") || "unavailable"}`);

  if (check.status === "blocked" && check.nameAvailabilityConfirmed) {
    // Worth saying out loud: the name is free, the wallet is the problem.
    console.log("  the name itself is free, this address just cannot mint it");
  }
}

// `run` reports MintManagerError codes and details, then exits non-zero.
run(main);
