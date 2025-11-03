import { WalletProvider } from '../core/types';

/**
 * Detects if an object is a Viem WalletClient
 */
function isViemWalletClient(wallet: any): boolean {
  return (
    wallet &&
    typeof wallet === 'object' &&
    'account' in wallet &&
    'chain' in wallet &&
    'signMessage' in wallet &&
    typeof wallet.signMessage === 'function'
  );
}

/**
 * Detects if an object is an Ethers Wallet or Signer
 */
function isEthersWallet(wallet: any): boolean {
  return (
    wallet &&
    typeof wallet === 'object' &&
    ('address' in wallet || 'getAddress' in wallet) &&
    'signMessage' in wallet &&
    typeof wallet.signMessage === 'function'
  );
}

/**
 * Detects if an object already implements the WalletProvider interface
 */
function isWalletProvider(wallet: any): wallet is WalletProvider {
  return (
    wallet &&
    typeof wallet === 'object' &&
    'getAddress' in wallet &&
    'signMessage' in wallet &&
    'getChainId' in wallet &&
    typeof wallet.getAddress === 'function' &&
    typeof wallet.signMessage === 'function' &&
    typeof wallet.getChainId === 'function'
  );
}

/**
 * Creates a WalletProvider adapter for Viem WalletClient
 */
function createViemAdapter(walletClient: any): WalletProvider {
  return {
    getAddress: async () => {
      if (walletClient.account?.address) {
        return walletClient.account.address;
      }
      throw new Error('Viem wallet client does not have an account address');
    },
    signMessage: async (message: string) => {
      if (!walletClient.account) {
        throw new Error('Viem wallet client does not have an account');
      }
      return await walletClient.signMessage({
        account: walletClient.account,
        message
      });
    },
    getChainId: async () => {
      if (walletClient.chain?.id) {
        return walletClient.chain.id;
      }
      return 1; // Default to mainnet
    }
  };
}

/**
 * Creates a WalletProvider adapter for Ethers Wallet/Signer
 */
function createEthersAdapter(wallet: any): WalletProvider {
  return {
    getAddress: async () => {
      // Ethers v6 has address as a property, v5 has getAddress()
      if (typeof wallet.address === 'string') {
        return wallet.address;
      } else if (typeof wallet.getAddress === 'function') {
        return await wallet.getAddress();
      }
      throw new Error('Ethers wallet does not have an address');
    },
    signMessage: async (message: string) => {
      return await wallet.signMessage(message);
    },
    getChainId: async () => {
      // Try to get chain ID from provider
      if (wallet.provider && typeof wallet.provider.getNetwork === 'function') {
        const network = await wallet.provider.getNetwork();
        return Number(network.chainId);
      }
      return 1; // Default to mainnet
    }
  };
}

/**
 * Adapts any wallet (Viem, Ethers, or WalletProvider) to the WalletProvider interface
 * @param wallet - A Viem WalletClient, Ethers Wallet/Signer, or WalletProvider
 * @returns A standardized WalletProvider
 * @throws Error if the wallet type is not recognized
 */
export function adaptWallet(wallet: any): WalletProvider {
  // Check if it already implements WalletProvider
  if (isWalletProvider(wallet)) {
    return wallet;
  }

  // Check if it's a Viem WalletClient
  if (isViemWalletClient(wallet)) {
    return createViemAdapter(wallet);
  }

  // Check if it's an Ethers Wallet/Signer
  if (isEthersWallet(wallet)) {
    return createEthersAdapter(wallet);
  }

  // If we can't detect the type, throw an error
  throw new Error(
    'Unsupported wallet type. Please provide a Viem WalletClient, Ethers Wallet/Signer, or an object implementing the WalletProvider interface.'
  );
}

