import { 
  createMintClient, 
  ChainName, 
  networkIdToChainName,
  chainNameToNetworkId,
  getCoinTypeForChain,
  isSupportedL2Network,
  getSupportedNetworkIds,
  getChainDisplayName,
  SUPPORTED_NETWORK_IDS
} from "../src";

/**
 * Example demonstrating proper chain usage patterns
 * This shows how to use the different chain types correctly
 */

async function demonstrateChainUsage() {
  const client = createMintClient({ isTestnet: true });
  
  console.log("🔗 Chain Usage Examples");
  console.log("====================\n");
  
  // 1. Network IDs for blockchain operations
  console.log("1. Network IDs for blockchain operations:");
  console.log("Supported network IDs:", getSupportedNetworkIds());
  console.log("Base network ID:", SUPPORTED_NETWORK_IDS.BASE);
  console.log("Optimism network ID:", SUPPORTED_NETWORK_IDS.OPTIMISM);
  
  // 2. ChainName for ENS records
  console.log("\n2. ChainName for ENS address records:");
  console.log("Base ChainName:", ChainName.Base);
  console.log("Ethereum ChainName:", ChainName.Ethereum);
  console.log("Optimism ChainName:", ChainName.Optimism);
  
  // 3. Converting between network ID and ChainName
  console.log("\n3. Converting between network ID and ChainName:");
  const baseNetworkId = SUPPORTED_NETWORK_IDS.BASE;
  const baseChainName = networkIdToChainName(baseNetworkId);
  console.log(`Network ID ${baseNetworkId} -> ChainName:`, baseChainName);
  
  const backToNetworkId = chainNameToNetworkId(baseChainName);
  console.log(`ChainName ${baseChainName} -> Network ID:`, backToNetworkId);
  
  // 4. Getting coin types for ENS records
  console.log("\n4. Coin types for ENS address records:");
  console.log("Base coin type:", getCoinTypeForChain(ChainName.Base));
  console.log("Ethereum coin type:", getCoinTypeForChain(ChainName.Ethereum));
  console.log("Bitcoin coin type:", getCoinTypeForChain(ChainName.Bitcoin));
  
  // 5. Checking network support
  console.log("\n5. Checking network support:");
  console.log("Is Base supported for L2?", isSupportedL2Network(8453));
  console.log("Is Arbitrum supported for L2?", isSupportedL2Network(42161));
  
  // 6. Human-readable names
  console.log("\n6. Human-readable chain names:");
  console.log("Base display name:", getChainDisplayName(8453));
  console.log("Ethereum display name:", getChainDisplayName(1));
  
  // 7. Practical usage: Availability checking
  console.log("\n7. Practical usage - Availability checking:");
  const subname = "alice.example.eth";
  
  try {
    // L1 availability (no chain ID needed)
    const l1Available = await client.isL1SubnameAvailable(subname);
    console.log(`L1 availability for ${subname}:`, l1Available);
    
    // L2 availability (requires network ID)
    const l2Available = await client.isL2SubnameAvailable(subname, SUPPORTED_NETWORK_IDS.BASE);
    console.log(`L2 availability for ${subname} on Base:`, l2Available);
    
  } catch (error) {
    console.error("Error checking availability:", error);
  }
  
  // 8. Practical usage: ENS records
  console.log("\n8. Practical usage - ENS records:");
  const records = {
    texts: [
      { key: "description", value: "Alice's subname" },
      { key: "com.twitter", value: "@alice" }
    ],
    addresses: [
      // Use ChainName for ENS address records
      { chain: ChainName.Ethereum, value: "0x742d35Cc6634C0532925a3b8D0C0C4C7c2C8C8C8" },
      { chain: ChainName.Base, value: "0x742d35Cc6634C0532925a3b8D0C0C4C7c2C8C8C8" },
      { chain: ChainName.Optimism, value: "0x742d35Cc6634C0532925a3b8D0C0C4C7c2C8C8C8" }
    ]
  };
  
  console.log("ENS records with proper ChainName usage:");
  console.log(JSON.stringify(records, null, 2));
  
  // 9. Best practices summary
  console.log("\n9. Best Practices Summary:");
  console.log("✅ Use numeric network IDs for blockchain operations (availability, minting)");
  console.log("✅ Use ChainName enum for ENS address records");
  console.log("✅ Use helper functions to convert between types");
  console.log("✅ Check network support before operations");
  console.log("❌ Don't mix ListingChain with ChainName");
  console.log("❌ Don't use string chain names for blockchain operations");
}

async function demonstrateErrorHandling() {
  console.log("\n🚨 Error Handling Examples");
  console.log("===========================\n");
  
  try {
    // This will throw an error for unsupported network
    const unsupportedChainName = networkIdToChainName(999999);
    console.log("This won't be reached:", unsupportedChainName);
  } catch (error) {
    console.log("✅ Caught error for unsupported network ID:", error.message);
  }
  
  try {
    // This will throw an error for unsupported ChainName
    const unsupportedNetworkId = chainNameToNetworkId(ChainName.Solana);
    console.log("This won't be reached:", unsupportedNetworkId);
  } catch (error) {
    console.log("✅ Caught error for unsupported ChainName:", error.message);
  }
}

async function main() {
  console.log("🚀 Chain Usage Demonstration");
  console.log("===========================\n");
  
  await demonstrateChainUsage();
  await demonstrateErrorHandling();
  
  console.log("\n✅ Chain usage demonstration completed!");
  console.log("\nKey takeaways:");
  console.log("- Network IDs (numbers) for blockchain operations");
  console.log("- ChainName (enum) for ENS address records");
  console.log("- Use helper functions for conversions");
  console.log("- Always check network support before operations");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

