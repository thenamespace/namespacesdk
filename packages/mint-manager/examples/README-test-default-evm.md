# Test Default EVM Address Minting

This test script demonstrates the complete `setDefaultEvmAddress` functionality by actually minting a subname on Base Sepolia with default EVM addresses.

## What This Test Does

1. **Generates EVM Address Records**: Creates address records for all 12 EVM-compatible chains
2. **Checks Availability**: Verifies the subname is available for minting
3. **Gets Mint Details**: Retrieves pricing and validation information
4. **Actually Mints**: Sends a real transaction to mint the subname with EVM addresses
5. **Confirms Transaction**: Waits for and verifies the transaction success

## Prerequisites

1. **Private Key**: You need a private key with Base Sepolia ETH
2. **Base Sepolia ETH**: Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
3. **Parent Domain**: `fwfwfw.eth` must be listed on Namespace platform

## Usage

### 1. Set Environment Variables

```bash
# Required - Your private key (keep this secure!)
export PRIVATE_KEY="0x1234567890abcdef..."

# Optional - Custom EVM address to set (defaults to Vitalik's address)
export EVM_ADDRESS="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

### 2. Run the Test

```bash
# Run the complete test with actual minting
npm run test:default-evm
```

## Expected Output

```
🧪 Testing setDefaultEvmAddress functionality with actual minting
================================================================
📋 Test Configuration:
   Parent Name: fwfwfw.eth
   Label: alice
   Full Subname: alice.fwfwfw.eth
   EVM Address: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   Testnet Mode: true
   Network: Base Sepolia (84532)

🔗 Test 1: Generating default EVM addresses...
✅ Generated 12 EVM address records:
   1. eth: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   2. default: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   3. base: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   ... (9 more chains)

🔍 Test 2: Checking subname availability...
✅ Subname availability check: Available

💰 Test 3: Getting mint details...
📊 Mint Details:
   Can Mint: true
   Estimated Price: 0 ETH
   Estimated Fee: 0 ETH

🚀 Test 6: Minting subname with default EVM addresses...
📊 Mint Details:
   Can Mint: true
   Estimated Price: 0 ETH
   Estimated Fee: 0 ETH

📋 Mint Transaction Parameters:
   Contract Address: 0x...
   Function Name: mint
   Value: 0 wei (0 ETH)
   Account: 0x...

🔐 Wallet Configuration:
   Wallet Address: 0x...
   Chain: Base Sepolia (84532)
   RPC URL: https://sepolia.base.org

⏳ Sending mint transaction...
✅ Transaction sent! Hash: 0x...

⏳ Waiting for transaction confirmation...
🎉 Transaction confirmed successfully!
   Block Number: 12345678
   Gas Used: 234567
   Transaction Hash: 0x...

✅ Successfully minted alice.fwfwfw.eth with default EVM addresses!
🌐 View on explorer: https://sepolia.basescan.org/tx/0x...

🎯 What was accomplished:
   ✅ Minted subname: alice.fwfwfw.eth
   ✅ Set EVM address for 12 chains: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   ✅ Added text records: Twitter, GitHub, URL
   ✅ Transaction confirmed on Base Sepolia
```

## What Gets Minted

### Subname

- **Full Name**: `alice.fwfwfw.eth`
- **Expiry**: 1 year
- **Network**: Base Sepolia

### Address Records (12 EVM chains)

- Ethereum, Default, Base, Optimism, Arbitrum, BSC, Polygon, Avalanche, Gnosis, zkSync, Linea, Scroll
- **All set to**: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`

### Text Records

- `com.twitter`: "@alice"
- `com.github`: "alice"
- `url`: "https://alice.dev"

## Security Notes

⚠️ **Important**:

- This test uses **Base Sepolia testnet** (not mainnet)
- Uses **testnet ETH** (no real value)
- **Never use mainnet private keys** in test scripts
- The subname will be minted on **Base Sepolia** only

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**: Get Base Sepolia ETH from the faucet
2. **"Subname not available"**: Try a different label (e.g., "bob", "charlie")
3. **"Invalid private key"**: Check your private key format (should start with 0x)
4. **"Transaction failed"**: Check network connectivity and gas settings

### Getting Base Sepolia ETH

1. Visit [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. Connect your wallet
3. Request testnet ETH
4. Wait for confirmation

### Alternative Labels

If `alice` is taken, try:

- `bob`, `charlie`, `david`, `eve`
- `test1`, `test2`, `demo1`
- `user1`, `user2`, `user3`

## Verification

After successful minting, you can verify:

1. **On Base Sepolia Explorer**: Check the transaction hash
2. **Subname Resolution**: The subname should resolve to your EVM address
3. **Text Records**: Should resolve to the set values

## Next Steps

After successful testing:

1. Use the same pattern for mainnet minting
2. Customize the EVM address for your needs
3. Add more text records as needed
4. Integrate into your application

## Support

For issues:

- Check [Base Sepolia Documentation](https://docs.base.org/network-details/base-sepolia)
- Review [Namespace Documentation](https://namespace.ninja)
- Open an issue on [GitHub](https://github.com/thenamespace/namespacesdk)
