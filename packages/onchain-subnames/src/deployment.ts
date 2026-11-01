import {
  getEnsV2Contracts,
  getNamespaceV2Contracts,
} from "@thenamespace/addresses";
import type { OnchainDeployment } from "./types.js";
import { OnchainError } from "./errors.js";

export function getOnchainDeployment(chainId: number): OnchainDeployment {
  if (chainId !== 1 && chainId !== 11155111)
    throw new OnchainError(
      "UNSUPPORTED_CHAIN",
      "Select Ethereum mainnet or Sepolia.",
      { details: { chainId } },
    );
  const testnet = chainId === 11155111;
  const namespace = getNamespaceV2Contracts(testnet);
  if (!namespace)
    throw new OnchainError(
      "UNSUPPORTED_CHAIN",
      "Namespace contracts are not configured for this chain.",
    );
  return {
    chainId,
    activationManager: namespace.activationManager,
    subnameIssuer: namespace.subnameIssuer,
    sharedResolver: namespace.sharedResolver,
    ethRegistry: getEnsV2Contracts(testnet).ethRegistry,
    whitelistFeature: namespace.features.whitelist,
    reservationFeature: namespace.features.reservation,
    managerApiUrl: testnet
      ? "https://staging.manager.namespace.ninja/api/v1"
      : "https://manager.namespace.ninja/api/v1",
    paymentTokens: namespace.paymentTokens.map((token) => ({ ...token })),
  };
}
