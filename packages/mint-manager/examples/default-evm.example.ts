import { createMintClient } from "../src";
import { createWalletClient, http, parseEther } from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Configuration - Set these environment variables or modify directly
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const PARENT_NAME = process.env.PARENT_NAME || "fwfwfw.eth";
const LABEL = process.env.LABEL || "alice";
const EVM_ADDRESS = process.env.EVM_ADDRESS || "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const IS_TESTNET = process.env.IS_TESTNET === "true" || false;
const EXPIRY_YEARS = process.env.EXPIRY_YEARS ? Number(process.env.EXPIRY_YEARS) : 1;

async function main() {
  console.log("🚀 Starting Default EVM Address Minting Example");
  console.log("================================================");
  
  // Initialize mint client
  const mintClient = createMintClient({
    isTestnet: IS_TESTNET,
  });

  console.log(`📋 Configuration:`);
  console.log(`   Parent Name: ${PARENT_NAME}`);
  console.log(`   Label: ${LABEL}`);
  console.log(`   Full Subname: ${LABEL}.${PARENT_NAME}`);
  console.log(`   EVM Address: ${EVM_ADDRESS}`);
  console.log(`   Testnet Mode: ${IS_TESTNET}`);
  console.log(`   Expiry Years: ${EXPIRY_YEARS}`);
  console.log("");

  try {
    // Step 1: Check if subname is available
    console.log("🔍 Step 1: Checking subname availability...");
    const isAvailable = IS_TESTNET 
      ? await mintClient.isL2SubnameAvailable(`${LABEL}.${PARENT_NAME}`, baseSepolia.id)
      : await mintClient.isL1SubnameAvailable(`${LABEL}.${PARENT_NAME}`);
    
    if (!isAvailable) {
      console.log("❌ Subname is not available for minting");
      return;
    }
    console.log("✅ Subname is available for minting");
    console.log("");

    // Step 2: Get mint details and pricing
    console.log("💰 Step 2: Getting mint details and pricing...");
    const mintDetails = await mintClient.getMintDetails({
      parentName: PARENT_NAME,
      label: LABEL,
      minterAddress: EVM_ADDRESS,
      expiryInYears: EXPIRY_YEARS,
      isTestnet: IS_TESTNET,
    });

    console.log("📊 Mint Details:");
    console.log(`   Can Mint: ${mintDetails.canMint}`);
    console.log(`   Estimated Price: ${mintDetails.estimatedPriceEth} ETH`);
    console.log(`   Estimated Fee: ${mintDetails.estimatedFeeEth} ETH`);
    console.log(`   Is Standard Fee: ${mintDetails.isStandardFee}`);
    
    if (!mintDetails.canMint) {
      console.log("❌ Cannot mint subname. Validation errors:");
      mintDetails.validationErrors.forEach(error => console.log(`   - ${error}`));
      return;
    }
    console.log("");

    // Step 3: Generate default EVM addresses
    console.log("🔗 Step 3: Generating default EVM addresses...");
    const evmAddresses = mintClient.setDefaultEvmAddress(EVM_ADDRESS);
    
    console.log(`✅ Generated ${evmAddresses.length} EVM address records:`);
    evmAddresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr.chain}: ${addr.value}`);
    });
    console.log("");

    // Step 4: Get mint transaction parameters with EVM addresses
    console.log("⚙️ Step 4: Getting mint transaction parameters...");
    const mintParams = await mintClient.getMintTransactionParameters({
      parentName: PARENT_NAME,
      label: LABEL,
      minterAddress: EVM_ADDRESS as any,
      expiryInYears: EXPIRY_YEARS,
      records: {
        addresses: evmAddresses,
        texts: [
          { key: "com.twitter", value: "@alice" },
          { key: "com.github", value: "alice" },
          { key: "url", value: "https://alice.dev" },
        ],
      },
    });

    console.log("📋 Mint Transaction Parameters:");
    console.log(`   Contract Address: ${mintParams.contractAddress}`);
    console.log(`   Function Name: ${mintParams.functionName}`);
    console.log(`   Value: ${mintParams.value} wei (${parseEther(mintParams.value.toString())} ETH)`);
    console.log(`   Account: ${mintParams.account}`);
    console.log(`   Args Length: ${mintParams.args.length}`);
    console.log("");

    // Step 5: Execute the mint transaction
    console.log("🔐 Step 5: Executing mint transaction...");
    
    // Create wallet client
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    const chain = IS_TESTNET ? baseSepolia : base;
    
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    });

    console.log(`   Wallet Address: ${account.address}`);
    console.log(`   Chain: ${chain.name} (${chain.id})`);
    console.log(`   Transaction Value: ${mintParams.value} wei`);
    console.log("");

    // Execute the transaction
    console.log("⏳ Sending transaction...");
    const hash = await walletClient.writeContract({
      address: mintParams.contractAddress,
      abi: mintParams.abi,
      functionName: mintParams.functionName,
      args: mintParams.args,
      value: mintParams.value,
      account: account.address,
    });

    console.log(`✅ Transaction sent! Hash: ${hash}`);
    console.log("");

    // Step 6: Wait for transaction confirmation
    console.log("⏳ Step 6: Waiting for transaction confirmation...");
    const receipt = await walletClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === "success") {
      console.log("🎉 Transaction confirmed successfully!");
      console.log(`   Block Number: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed}`);
      console.log(`   Transaction Hash: ${receipt.transactionHash}`);
      console.log("");
      console.log(`✅ Successfully minted ${LABEL}.${PARENT_NAME} with default EVM addresses!`);
      console.log(`🌐 View on explorer: ${chain.blockExplorers?.default?.url}/tx/${hash}`);
    } else {
      console.log("❌ Transaction failed");
    }

  } catch (error) {
    console.error("❌ Error during minting process:");
    console.error(error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the example
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
