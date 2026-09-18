/**
 * End-to-end mint on Base Sepolia: quote, simulate, sign, broadcast, confirm.
 *
 * This is the only example that spends anything. It signs with a key you supply
 * and broadcasts a real transaction, so it defaults to Base Sepolia testnet and
 * refuses to run without an explicit PRIVATE_KEY.
 *
 * Demonstrates:
 *   - the full mint flow, in the order a production integration should use it
 *   - `simulateContract` before `writeContract`, so a doomed mint fails for free
 *   - setting ENS records in the same transaction as the mint
 *   - capping the price with `maxValue` so a moved quote cannot be charged silently
 *   - typed failures via `MintManagerError.code`, and viem's revert errors
 *
 * Run:
 *   cd packages/mint-manager
 *   cp .env.example .env          # then edit .env
 *   set -a && source .env && set +a
 *   npx ts-node ./examples/mint-and-send.ts
 *
 * Environment:
 *   PRIVATE_KEY            REQUIRED. Throwaway testnet key, 0x + 64 hex chars.
 *   PARENT_NAME            parent listing on Sepolia. REQUIRED - list one at dev.namespace.ninja
 *   LABEL                  label to mint.   Default: a timestamped label, so
 *                          repeat runs do not collide on an already-minted name.
 *   EVM_ADDRESS            written into the address records. Default: signer.
 *   OWNER                  receives the subname.            Default: signer.
 *   EXPIRY_YEARS           registration length.             Default: 1
 *   BASE_SEPOLIA_RPC_URL   RPC endpoint. Falls back to ALCHEMY_BASE_SEPOLIA_RPC,
 *                          then https://sepolia.base.org (rate limited).
 *
 * Get Base Sepolia ETH from https://www.alchemy.com/faucets/base-sepolia before
 * running. A mint costs the listing price plus gas.
 */
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { ChainName, MintManagerError, createMintClient } from "../src";
import { asAddress, asPrivateKey, explainError, optionalEnv, requireEnv } from "./shared";

const PRIVATE_KEY = asPrivateKey(
  requireEnv("PRIVATE_KEY", "the throwaway testnet key that signs and pays for the mint")
);
const PARENT_NAME = requireEnv(
  "PARENT_NAME",
  "a parent name you have listed on Sepolia at dev.namespace.ninja.\n  There is no shared testnet listing to fall back on, so this example\n  cannot guess one for you"
);
const LABEL = optionalEnv("LABEL", `example-${Date.now().toString(36)}`);
const EXPIRY_YEARS = Number(optionalEnv("EXPIRY_YEARS", "1"));
const RPC_URL =
  process.env.BASE_SEPOLIA_RPC_URL ||
  process.env.ALCHEMY_BASE_SEPOLIA_RPC ||
  "https://sepolia.base.org";

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const subname = `${LABEL}.${PARENT_NAME}`;

  // Default both to the signer so a minimal .env still produces a sensible mint.
  const owner = asAddress(optionalEnv("OWNER", account.address), "OWNER");
  const evmAddress = asAddress(optionalEnv("EVM_ADDRESS", account.address), "EVM_ADDRESS");

  // One RPC URL, shared by the SDK's own reads and by our wallet/public clients,
  // so an availability check and the transaction that follows it cannot disagree
  // about chain state because they hit different providers.
  const mintClient = createMintClient({
    isTestnet: true,
    customRpcUrls: { [baseSepolia.id]: RPC_URL },
  });

  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(RPC_URL) });

  console.log(`Minting ${subname} on ${baseSepolia.name}`);
  console.log(`  signer: ${account.address}`);
  console.log(`  owner:  ${owner}\n`);

  // Fail early on an empty wallet rather than after three network round trips.
  const balance = await publicClient.getBalance({ address: account.address });
  if (balance === 0n) {
    console.error(
      `${account.address} holds no Base Sepolia ETH.\n` +
        "  Fund it at https://www.alchemy.com/faucets/base-sepolia and try again."
    );
    process.exit(1);
  }
  console.log(`Balance: ${formatEther(balance)} ETH\n`);

  // Step 1: check. One call covers whether the name is free AND whether this
  // address may mint it. The older pattern was to call isL2SubnameAvailable and
  // then getMintDetails, which asks two services the same question, makes you
  // supply a chain id, and still cannot tell a free-but-gated name apart from a
  // taken one.
  const check = await mintClient.checkName(subname, {
    minterAddress: account.address,
    expiryInYears: EXPIRY_YEARS,
  });

  if (check.status !== "available") {
    console.error(`Cannot mint ${subname}: ${check.status}`);
    for (const reason of check.reasons) {
      console.error(`  - ${reason}`);
    }
    // The advice differs by reason. A taken or reserved label means try another
    // one; an allowlist or token gate means every other label fails the same
    // way, so sending the user back to the name field wastes their time.
    console.error(
      check.status === "taken" || check.reasons.includes("SUBNAME_RESERVED")
        ? "\n  Set LABEL to something else."
        : check.reasons.includes("LISTING_EXPIRED")
        ? "\n  The listing's minting window has closed. No label will work."
        : "\n  The restriction is on this address, not the name. Use a wallet\n" +
          "  that satisfies the parent's requirements."
    );
    process.exit(1);
  }

  console.log(
    `Step 1/4  available on chain ${check.chainId}: ` +
      `${check.estimatedPriceEth} ETH + ${check.estimatedFeeEth} ETH fee`
  );

  // Step 2: build the call. `records` are encoded into resolver calldata and
  // applied atomically with the mint, so the name is never live without them.
  //
  // `maxValue` caps what the signed quote is allowed to charge. Set it to the
  // number you showed the user: without it, a price that moves between the quote
  // and the signature is simply charged, and the first they hear of it is the
  // wallet confirmation. The call throws PRICE_EXCEEDS_MAX instead.
  const quotedWei = parseEther(
    (check.estimatedPriceEth + check.estimatedFeeEth).toFixed(18)
  );

  const tx = await mintClient.prepareMint(check, {
    minterAddress: account.address,
    owner,
    expiryInYears: EXPIRY_YEARS,
    maxValue: quotedWei,
    records: {
      texts: [
        { key: "description", value: "Minted with the Namespace mint-manager SDK" },
        { key: "url", value: "https://namespace.ninja" },
      ],
      addresses: [
        { chain: ChainName.Ethereum, value: evmAddress },
        { chain: ChainName.Base, value: evmAddress },
      ],
    },
  });

  // `tx.value` is wei, already a bigint. Pass it through untouched.
  console.log(`Step 2/4  transaction built, value ${formatEther(tx.value)} ETH`);

  if (balance < tx.value) {
    console.error(
      `Balance ${formatEther(balance)} ETH is below the mint value ${formatEther(tx.value)} ETH ` +
        "(before gas). Fund the account and try again."
    );
    process.exit(1);
  }

  // Step 3: simulate. This runs the call against current state on the node and
  // surfaces a revert reason without spending gas. Skipping it is how users end
  // up paying for failed mints when a signature expires or a price moves.
  const { request } = await publicClient.simulateContract({
    address: tx.contractAddress,
    abi: tx.abi,
    functionName: tx.functionName,
    args: tx.args,
    value: tx.value,
    account,
  });
  console.log("Step 3/4  simulation passed");

  // Step 4: broadcast, then wait. `simulateContract` returns a prepared request,
  // so writeContract sends exactly what was simulated.
  const hash = await walletClient.writeContract(request);
  console.log(`Step 4/4  sent ${hash}, waiting for confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const explorer = baseSepolia.blockExplorers?.default.url;

  if (receipt.status !== "success") {
    console.error(`Transaction reverted on chain: ${explorer}/tx/${hash}`);
    process.exit(1);
  }

  console.log(`\nMinted ${subname}`);
  console.log(`  block:    ${receipt.blockNumber}`);
  console.log(`  gas used: ${receipt.gasUsed}`);
  console.log(`  explorer: ${explorer}/tx/${hash}`);
}

main().catch((err) => {
  if (err instanceof MintManagerError) {
    // Codes are stable; match on them rather than on message text.
    if (err.code === "RPC_ERROR") {
      console.error("\nThe RPC endpoint failed. This is not an answer about the");
      console.error("subname. Retry, or set BASE_SEPOLIA_RPC_URL to a provider endpoint.");
    } else if (err.code === "PRICE_EXCEEDS_MAX") {
      console.error("\nThe signed quote came back higher than the price we quoted.");
      console.error("Re-quote with checkName and confirm the new price with the user.");
    } else if (err.code === "SIGNATURE_EXPIRED") {
      console.error("\nThe mint authorization expired between quoting and sending.");
      console.error("Call prepareMint again to get a fresh signature.");
    }
    explainError(err);
    process.exit(1);
  }

  // viem wraps reverts with the decoded reason and the exact call that failed.
  explainError(err);
  process.exit(1);
});
