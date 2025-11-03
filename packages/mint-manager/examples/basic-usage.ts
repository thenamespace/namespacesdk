import { createMintClient } from "../src";

// Env-driven inputs so you can test with real values:
// PARENT_NAME=yourname.eth LABEL=sub MINTER_ADDRESS=0x... OWNER=0x... EXPIRY_YEARS=1
const PARENT_NAME = process.env.PARENT_NAME || "example.eth";
const LABEL = process.env.LABEL || "alice";
const MINTER_ADDRESS = process.env.MINTER_ADDRESS || "0x0000000000000000000000000000000000000001";
const OWNER = process.env.OWNER; // optional
const EXPIRY_YEARS = process.env.EXPIRY_YEARS ? Number(process.env.EXPIRY_YEARS) : undefined;

async function main() {
  const client = createMintClient(); // mainnet, zero-config
  

  console.log("=== getMintDetails ===");
  const details = await client.getMintDetails({
    parentName: PARENT_NAME,
    label: LABEL,
    minterAddress: MINTER_ADDRESS,
    expiryInYears: EXPIRY_YEARS,
  });
  console.dir(details, { depth: null });

  console.log("\n=== setDefaultEvmAddress ===");
  const evmAddresses = client.setDefaultEvmAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  console.log(`Generated ${evmAddresses.length} EVM address records:`, evmAddresses);

  console.log("\n=== getMintTransactionParameters ===");
  const tx = await client.getMintTransactionParameters({
    parentName: PARENT_NAME,
    label: LABEL,
    minterAddress: MINTER_ADDRESS as any,
    owner: OWNER,
    expiryInYears: EXPIRY_YEARS,
    records: {
      addresses: evmAddresses,
    },
  });
  console.dir(tx, { depth: null });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


