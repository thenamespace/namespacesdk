# Default EVM Address Minting Example

This example demonstrates how to use the `setDefaultEvmAddress` functionality to mint a subname with the same EVM address across all supported EVM chains.

## Features Demonstrated

- ✅ **Subname Availability Check**: Verifies if the subname is available for minting
- ✅ **Mint Details & Pricing**: Gets estimated costs and validation
- ✅ **Default EVM Address Generation**: Creates address records for all EVM chains
- ✅ **Complete Mint Transaction**: Executes the actual minting transaction
- ✅ **Transaction Confirmation**: Waits for and verifies transaction success

## Supported EVM Chains

The example will set the same address for these 12 EVM-compatible chains:

- Ethereum, Default, Base, Optimism, Arbitrum, BSC, Polygon, Avalanche, Gnosis, zkSync, Linea, Scroll

## Prerequisites

1. **Private Key**: You need a private key with sufficient funds for minting
2. **Parent Domain**: The parent domain must be listed on Namespace platform
3. **Funds**: Ensure your wallet has enough ETH for minting fees

## Environment Variables

Set these environment variables or modify them directly in the script:

```bash
# Required
export PRIVATE_KEY="0x..."                    # Your private key
export PARENT_NAME="fwfwfw.eth"              # Parent domain name
export LABEL="alice"                          # Subname label
export EVM_ADDRESS="0x..."                   # EVM address to set for all chains

# Optional
export IS_TESTNET="false"                    # Use testnet (true/false)
export EXPIRY_YEARS="1"                      # Subname expiry in years
```

## Usage

### 1. Basic Usage (Mainnet)

```bash
# Set environment variables
export PRIVATE_KEY="0x1234567890abcdef..."
export PARENT_NAME="fwfwfw.eth"
export LABEL="alice"
export EVM_ADDRESS="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

# Run the example
npm run example:default-evm
```

### 2. Testnet Usage

```bash
# Set environment variables for testnet
export PRIVATE_KEY="0x1234567890abcdef..."
export PARENT_NAME="fwfwfw.eth"
export LABEL="alice"
export EVM_ADDRESS="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
export IS_TESTNET="true"

# Run the example
npm run example:default-evm
```

### 3. Custom Configuration

```bash
# Custom subname and expiry
export PRIVATE_KEY="0x1234567890abcdef..."
export PARENT_NAME="mydomain.eth"
export LABEL="bob"
export EVM_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
export EXPIRY_YEARS="2"

npm run example:default-evm
```

## Example Output

```
🚀 Starting Default EVM Address Minting Example
================================================
📋 Configuration:
   Parent Name: fwfwfw.eth
   Label: alice
   Full Subname: alice.fwfwfw.eth
   EVM Address: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   Testnet Mode: false
   Expiry Years: 1

🔍 Step 1: Checking subname availability...
✅ Subname is available for minting

💰 Step 2: Getting mint details and pricing...
📊 Mint Details:
   Can Mint: true
   Estimated Price: 0.01 ETH
   Estimated Fee: 0.001 ETH
   Is Standard Fee: true

🔗 Step 3: Generating default EVM addresses...
✅ Generated 12 EVM address records:
   1. eth: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   2. default: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   3. base: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
   ... (9 more chains)

⚙️ Step 4: Getting mint transaction parameters...
📋 Mint Transaction Parameters:
   Contract Address: 0x...
   Function Name: mint
   Value: 11000000000000000 wei (0.011 ETH)
   Account: 0x...
   Args Length: 4

🔐 Step 5: Executing mint transaction...
   Wallet Address: 0x...
   Chain: Base (8453)
   Transaction Value: 11000000000000000 wei

⏳ Sending transaction...
✅ Transaction sent! Hash: 0x...

⏳ Step 6: Waiting for transaction confirmation...
🎉 Transaction confirmed successfully!
   Block Number: 12345678
   Gas Used: 234567
   Transaction Hash: 0x...

✅ Successfully minted alice.fwfwfw.eth with default EVM addresses!
🌐 View on explorer: https://basescan.org/tx/0x...
```

## What Happens

1. **Availability Check**: Verifies the subname is available for minting
2. **Pricing**: Gets estimated costs and validates the mint request
3. **EVM Address Generation**: Creates address records for all 12 EVM chains
4. **Transaction Preparation**: Prepares the mint transaction with all records
5. **Execution**: Sends the transaction to the blockchain
6. **Confirmation**: Waits for and verifies the transaction success

## Records Set

The example sets these records during minting:

### Address Records (12 EVM chains)

- Ethereum, Default, Base, Optimism, Arbitrum, BSC, Polygon, Avalanche, Gnosis, zkSync, Linea, Scroll

### Text Records

- `com.twitter`: "@alice"
- `com.github`: "alice"
- `url`: "https://alice.dev"

## Error Handling

The script includes comprehensive error handling for:

- Invalid private keys
- Insufficient funds
- Network issues
- Transaction failures
- Validation errors

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive data
3. **Test with small amounts** first
4. **Verify transaction details** before signing
5. **Use testnet** for initial testing

## Troubleshooting

### Common Issues

1. **"Subname is not available"**: The subname is already taken
2. **"Insufficient funds"**: Not enough ETH for minting fees
3. **"Invalid private key"**: Check your private key format
4. **"Transaction failed"**: Check gas limits and network status

### Debug Mode

Add `DEBUG=true` to see detailed transaction information:

```bash
export DEBUG="true"
npm run example:default-evm
```

## Support

For issues or questions:

- Check the [Namespace Documentation](https://namespace.ninja)
- Review the [SDK Documentation](../README.md)
- Open an issue on [GitHub](https://github.com/thenamespace/namespacesdk)
