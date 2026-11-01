import type { PublicClient } from "viem";
import type { OnchainDeployment, OnchainPublicClient } from "./types.js";
export type ContractClient = Omit<OnchainPublicClient, "readContract"> &
  Pick<PublicClient, "readContract">;

export interface ReadContext {
  client: ContractClient;
  deployment: OnchainDeployment;
  fetch: typeof globalThis.fetch;
  blockNumber: bigint;
}
