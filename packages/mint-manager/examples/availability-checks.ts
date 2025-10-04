import { createMintClient } from "../src";
import { ListingChain, getChainId } from "../src/chains";


const SUBNAME = "alice.testmint.eth";

async function main() {
  const client = createMintClient({
    isTestnet: true,
  });

  console.log("=== L1 availability ===");
  const l1 = await client.isL1SubnameAvailable(SUBNAME);
  console.log("available:", l1);

  console.log("\n=== L2 availability (Base) ===");
  const baseId = getChainId(ListingChain.BaseSepolia);
  const l2 = await client.isL2SubnameAvailable(SUBNAME, baseId);
  console.log("available:", l2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


