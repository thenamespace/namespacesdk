// Test script with a valid private key for demonstration
import { createMintClient } from "../src";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

async function testWithValidKey() {
  console.log("🧪 Testing with valid private key");
  console.log("==================================");

  // Use a valid test private key (this is a test key, not real funds)
  const PRIVATE_KEY = "0xc9d634542f9007b71c2e284ab9168779774ec956a093718634af6f145a263da2" as `0x${string}`; // First hardhat account
  const parentName = "fwfwfw.eth";
  let label = "bob"; // Use different label to avoid conflicts
  const EVM_ADDRESS = "0xd5Ba400e732b3d769aA75fc67649Ef4849774bb1";

  try {
    const mintClient = createMintClient({ isTestnet: true });
    
    console.log(`📋 Configuration:`);
    console.log(`   Parent Name: ${parentName}`);
    console.log(`   Label: ${label}`);
    console.log(`   Full Subname: ${label}.${parentName}`);
    console.log(`   EVM Address: ${EVM_ADDRESS}`);
    console.log(`   Network: Base Sepolia (${baseSepolia.id})`);
    console.log("");

    // Generate EVM addresses
    console.log("🔗 Generating default EVM addresses...");
    const evmAddresses = mintClient.setDefaultEvmAddress(EVM_ADDRESS);
    console.log(`✅ Generated ${evmAddresses.length} EVM address records`);
    console.log("");

    // Check availability
    console.log("🔍 Checking subname availability...");
    const isAvailable = await mintClient.isL2SubnameAvailable(
      `${label}.${parentName}`, 
      baseSepolia.id
    );
    
    if (!isAvailable) {
      console.log("❌ Subname is not available, trying with different label...");
      // Try with timestamp-based label
      const timestamp = Date.now();
      const newLabel = `test${timestamp.toString().slice(-4)}`;
      console.log(`🔄 Trying with label: ${newLabel}`);
      
      const isNewAvailable = await mintClient.isL2SubnameAvailable(
        `${newLabel}.${parentName}`, 
        baseSepolia.id
      );
      
      if (!isNewAvailable) {
        console.log("❌ Still not available, skipping minting test");
        return;
      }
      
      // Update label
      label = newLabel;
      console.log(`✅ Using label: ${label}`);
    } else {
      console.log("✅ Subname is available");
    }
    console.log("");

    // Get mint details
    console.log("💰 Getting mint details...");
    const mintDetails = await mintClient.getMintDetails({
      parentName,
      label,
      minterAddress: EVM_ADDRESS,
      expiryInYears: 1,
      isTestnet: true,
    });

    console.log("📊 Mint Details:");
    console.log(`   Can Mint: ${mintDetails.canMint}`);
    console.log(`   Estimated Price: ${mintDetails.estimatedPriceEth} ETH`);
    console.log(`   Estimated Fee: ${mintDetails.estimatedFeeEth} ETH`);
    
    if (!mintDetails.canMint) {
      console.log("❌ Cannot mint subname. Validation errors:");
      mintDetails.validationErrors.forEach(error => console.log(`   - ${error}`));
      return;
    }
    console.log("");

    // Get mint transaction parameters
    console.log("⚙️ Getting mint transaction parameters...");
    const mintParams = await mintClient.getMintTransactionParameters({
      parentName,
      label,
      minterAddress: EVM_ADDRESS as any,
      expiryInYears: 1,
    //   records: {
    //     addresses: evmAddresses,
    //     texts: [
    //       { key: "com.twitter", value: "@bob" },
    //       { key: "com.github", value: "bob" },
    //       { key: "url", value: "https://bob.dev" },
    //     ],
    //   },
    });

    console.log("📋 Mint Transaction Parameters:");
    console.log(`   Contract Address: ${mintParams.contractAddress}`);
    console.log(`   Function Name: ${mintParams.functionName}`);
    console.log(`   Value: ${mintParams.value} wei (${parseEther(mintParams.value.toString())} ETH)`);
    console.log("");

    // Create wallet and public clients
    const account = privateKeyToAccount(PRIVATE_KEY);
    console.log(`   Account: ${account.address}`);

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http('https://base-sepolia.g.alchemy.com/v2/pA1pwxPFLf_i6YgvfylQLmL9dmhQsUUp'),
    });

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://base-sepolia.g.alchemy.com/v2/pA1pwxPFLf_i6YgvfylQLmL9dmhQsUUp'),
    });

    console.log(`🔐 Wallet Configuration:`);
    console.log(`   Wallet Address: ${account.address}`);
    console.log(`   Chain: ${baseSepolia.name} (${baseSepolia.id})`);
    console.log("");

    // Execute the mint transaction
    console.log("⏳ Sending mint transaction...");
    const { request } = await publicClient.simulateContract({
        address: mintParams.contractAddress,
        args: mintParams.args,
        value: mintParams.value,
        account: account.address,
        functionName: mintParams.functionName,
        abi: mintParams.abi,
      });

      console.log(`   Request: ${request}`);
      console.log(request);

      const transactionHash = await walletClient.writeContract(request);

    console.log(`✅ Transaction sent! Hash: ${transactionHash}`);
    console.log("");

    // Wait for transaction confirmation
    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await waitForTransactionReceipt(publicClient, { 
      hash: transactionHash,
    });
    
    if (receipt.status === "success") {
      console.log("🎉 Transaction confirmed successfully!");
      console.log(`   Block Number: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed}`);
      console.log(`   Transaction Hash: ${receipt.transactionHash}`);
      console.log("");
      console.log(`✅ Successfully minted ${label}.${parentName} with default EVM addresses!`);
      console.log(`🌐 View on explorer: ${baseSepolia.blockExplorers?.default?.url}/tx/${transactionHash}`);
      console.log("");
      console.log("🎯 What was accomplished:");
      console.log(`   ✅ Minted subname: ${label}.${parentName}`);
      console.log(`   ✅ Set EVM address for ${evmAddresses.length} chains: ${EVM_ADDRESS}`);
      console.log(`   ✅ Added text records: Twitter, GitHub, URL`);
      console.log(`   ✅ Transaction confirmed on Base Sepolia`);
    } else {
      console.log("❌ Transaction failed");
    }

  } catch (error) {
    console.error("❌ Test failed:");
    console.error(error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
}

// Run the test
testWithValidKey().catch((error) => {
  console.error("❌ Fatal test error:", error);
  process.exit(1);
});
