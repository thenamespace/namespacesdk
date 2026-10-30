import {
  keccak256,
  toBytes,
  zeroAddress,
  zeroHash,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import { createOnchainClient, getOnchainDeployment, ONE_YEAR } from "../src";

export const payer = "0x1111111111111111111111111111111111111111" as Address;
export const recipient =
  "0x2222222222222222222222222222222222222222" as Address;
export const registry = "0x3333333333333333333333333333333333333333" as Address;
export const activationId = keccak256(toBytes("activation"));
export const deployment = getOnchainDeployment(11155111);
export const mintInput = {
  parentName: "example.eth",
  label: "alice",
  minter: payer,
  duration: ONE_YEAR,
};
export const renewalInput = {
  parentName: "example.eth",
  label: "alice",
  renewer: payer,
  duration: ONE_YEAR,
};
export const usdc = deployment.paymentTokens.find(
  (token) => token.symbol === "USDC",
)!.address;

export function fixture() {
  const state = {
    configured: true,
    active: true,
    expirable: true,
    status: 0,
    permitted: true,
    features: [] as Address[],
    liveSubregistry: registry,
    resolver: zeroAddress as Address,
    whitelistRoot: zeroHash as Hex,
    whitelistMode: 0,
    reservationRoot: zeroHash as Hex,
    owner: recipient as Address,
    expiry: 2_000_000_000n,
    price: 1_000_000_000_000n,
    payment: 1_000_000n,
    allowance: 0n,
    denied: 0,
    canMint: true,
    canRenew: true,
  };
  const readContract = jest.fn(
    async (request: {
      functionName: string;
      address: Address;
      args?: readonly unknown[];
      blockNumber?: bigint;
    }) => {
      switch (request.functionName) {
        case "activationIdOf":
          return activationId;
        case "activations":
          return [
            state.active,
            0n,
            state.expirable ? 0 : 1,
            0,
            zeroAddress,
            state.configured ? keccak256(toBytes("example")) : zeroHash,
            state.resolver,
            "0x",
            registry,
          ];
        case "featuresOf":
          return state.features;
        case "getSubregistry":
          return state.liveSubregistry;
        case "getExpiry":
          return request.address === deployment.ethRegistry
            ? 3_000_000_000n
            : state.expiry;
        case "getStatus":
          return state.status;
        case "hasRootRoles":
          return state.permitted;
        case "hasRoles":
          return state.permitted;
        case "getOwner":
          return state.owner;
        case "configs":
          return [state.whitelistMode, state.whitelistRoot];
        case "roots":
          return state.reservationRoot;
        case "quoteMint":
          return {
            canMint: state.canMint,
            price: state.price,
            denied: state.denied,
            expiration: state.expirable ? 0 : 1,
            activationId,
            subregistry: registry,
          };
        case "quoteRenewal":
          return {
            canRenew: state.canRenew,
            price: state.price,
            denied: state.denied,
            activationId,
            subregistry: registry,
          };
        case "quotePayment":
          return state.payment;
        case "allowance":
          return state.allowance;
        case "getSubnameResolver":
          return state.resolver !== zeroAddress
            ? state.resolver
            : request.args?.[1] !== zeroAddress
              ? request.args?.[1]
              : deployment.sharedResolver;
        default:
          throw new Error(`Unexpected read: ${request.functionName}`);
      }
    },
  );
  const getChainId = jest.fn(async () => 11155111);
  const fetch = jest.fn<
    ReturnType<typeof globalThis.fetch>,
    Parameters<typeof globalThis.fetch>
  >();
  const publicClient = {
    chain: { id: 11155111 },
    getChainId,
    getBlockNumber: jest.fn(async () => 123n),
    readContract,
  } as unknown as PublicClient;
  const client = createOnchainClient({
    publicClient,
    chainId: 11155111,
    fetch,
  });
  return { client, publicClient, readContract, getChainId, fetch, state };
}
