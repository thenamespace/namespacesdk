import { createMintClient } from "../src";
import { baseSepolia } from "viem/chains";

// Example envs:
// ALCHEMY_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/<api-key>
// PARENT_NAME=yourname.eth LABEL=sub MINTER_ADDRESS=0x...
const ALCHEMY_BASE_SEPOLIA_RPC = process.env.ALCHEMY_BASE_SEPOLIA_RPC || "";
const PARENT_NAME = process.env.PARENT_NAME || "testmint.eth";
const LABEL = process.env.LABEL || "alice";
const MINTER_ADDRESS = process.env.MINTER_ADDRESS || "0x0000000000000000000000000000000000000001";

async function main() {
  const client = createMintClient({
    isTestnet: true,
});

const canMint = await client.isL2SubnameAvailable(LABEL+"."+PARENT_NAME, baseSepolia.id);
console.log("canMint", canMint);

  const details = await client.getMintDetails({
    parentName: PARENT_NAME,
    label: LABEL,
    minterAddress: MINTER_ADDRESS,
    isTestnet: true,
  });
  console.dir(details, { depth: null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


