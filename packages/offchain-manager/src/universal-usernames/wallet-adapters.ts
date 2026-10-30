import { NamespaceSDKError } from "../offchain-client/errors";

/**
 * The wallet that signs owner sessions and operation signatures.
 * Same shape as `@thenamespace/avatar`'s provider. You can also pass a viem
 * WalletClient or an ethers Wallet/Signer directly.
 */
export interface WalletProvider {
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
  getChainId(): Promise<number>;
  /** Switch the connected wallet to a chain, when supported. */
  switchChain?(chainId: number): Promise<void>;
}

/** A `WalletProvider`, a viem WalletClient or an ethers v5/v6 Wallet/Signer. */
export type UsernameOwnerWallet = WalletProvider | object;

function isWalletProvider(wallet: any): wallet is WalletProvider {
  return (
    typeof wallet?.getAddress === "function" &&
    typeof wallet?.signMessage === "function" &&
    typeof wallet?.getChainId === "function"
  );
}

function isViemWalletClient(wallet: any): boolean {
  return (
    wallet !== null &&
    typeof wallet === "object" &&
    "account" in wallet &&
    "chain" in wallet &&
    typeof wallet.signMessage === "function"
  );
}

function isEthersSigner(wallet: any): boolean {
  return (
    wallet !== null &&
    typeof wallet === "object" &&
    ("address" in wallet || "getAddress" in wallet) &&
    typeof wallet.signMessage === "function"
  );
}

function createViemAdapter(walletClient: any): WalletProvider {
  return {
    getAddress: async () => {
      if (walletClient.account?.address) {
        return walletClient.account.address;
      }
      throw new Error("Viem wallet client does not have an account address");
    },
    signMessage: async (message: string) => {
      if (!walletClient.account) {
        throw new Error("Viem wallet client does not have an account");
      }
      return await walletClient.signMessage({
        account: walletClient.account,
        message,
      });
    },
    getChainId: async () => {
      if (walletClient.chain?.id) {
        return walletClient.chain.id;
      }
      throw new Error(
        "Viem wallet client does not expose its connected chain ID"
      );
    },
    switchChain:
      typeof walletClient.switchChain === "function"
        ? async (chainId: number) => {
            await walletClient.switchChain({ id: chainId });
          }
        : undefined,
  };
}

function createEthersAdapter(wallet: any): WalletProvider {
  return {
    getAddress: async () => {
      // ethers v6 exposes `address`, v5 only `getAddress()`
      if (typeof wallet.address === "string") {
        return wallet.address;
      }
      if (typeof wallet.getAddress === "function") {
        return await wallet.getAddress();
      }
      throw new Error("Ethers wallet does not have an address");
    },
    signMessage: async (message: string) => await wallet.signMessage(message),
    getChainId: async () => {
      if (typeof wallet.provider?.getNetwork === "function") {
        const network = await wallet.provider.getNetwork();
        return Number(network.chainId);
      }
      throw new Error("Ethers wallet does not expose its connected chain ID");
    },
    switchChain:
      typeof wallet.provider?.send === "function"
        ? async (chainId: number) => {
            await wallet.provider.send("wallet_switchEthereumChain", [
              { chainId: `0x${chainId.toString(16)}` },
            ]);
          }
        : undefined,
  };
}

/**
 * Adapts a viem WalletClient, an ethers Wallet/Signer or a `WalletProvider` to `WalletProvider`.
 * @throws {NamespaceSDKError} When the wallet type is not recognized
 */
export function adaptWallet(wallet: UsernameOwnerWallet): WalletProvider {
  if (isWalletProvider(wallet)) {
    return wallet;
  }
  if (isViemWalletClient(wallet)) {
    return createViemAdapter(wallet);
  }
  if (isEthersSigner(wallet)) {
    return createEthersAdapter(wallet);
  }
  throw new NamespaceSDKError(
    "Unsupported wallet. Pass a viem WalletClient, an ethers Wallet/Signer, or an object implementing WalletProvider.",
    "UNSUPPORTED_WALLET"
  );
}

/**
 * Signatures are bound to the deployment chain, and smart contract wallets are verified there,
 * so the wallet must be connected to it. Switches when the wallet supports it.
 */
export async function ensureWalletChain(
  wallet: WalletProvider,
  chainId: number
): Promise<void> {
  if ((await wallet.getChainId()) === chainId) {
    return;
  }
  if (wallet.switchChain) {
    await wallet.switchChain(chainId);
    if ((await wallet.getChainId()) === chainId) {
      return;
    }
  }
  throw new NamespaceSDKError(
    `Connect the wallet to chain ${chainId} to sign Universal Usernames requests`,
    "WALLET_CHAIN_MISMATCH"
  );
}
