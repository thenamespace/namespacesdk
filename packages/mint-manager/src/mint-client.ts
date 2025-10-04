import axios, { AxiosInstance } from "axios";
import { NamespaceEnv, LibEnvironment } from "./env";
import {
  MintDetailsResponse,
  MintDetailsRequest,
  MintTransactionRequest,
  MintTransactionResponse,
  NameListing,
  MintParametersResponse,
  MintParametersRequest,
} from "./types";
import {
  toHex,
  Address,
  zeroAddress,
  Hash,
  http,
  createPublicClient,
  namehash,
  ContractFunctionExecutionError,
  PublicClient
} from "viem";
import { getChain, getChainId, getChainName, ListingChain } from "./chains";
import { Abis } from "./abi";
import {
  getEnsContracts,
  getL1NamespaceContracts,
  getL2NamespaceContracts,
} from "@thenamespace/addresses";
import { convertEnsRecordsToResolverData } from "./utils";

/**
 * Main client interface for preparing mint transactions and checking
 * subname availability across L1 and supported L2 networks.
 *
 * @example
 * ```typescript
 * import { createMintClient } from '@thenamespace/mint-manager';
 *
 * // Zero-config (mainnet)
 * const client = createMintClient();
 *
 * // Testnet
 * const testnet = createMintClient({
 *   isTestnet: true,
 *   customRpcUrls: { [baseSepolia.id]: ALCHEMY_BASE_SEPOLIA_RPC }
 * });
 * ```
 */
export interface MintClient {
  /** Fetches estimated minting parameters and price quote. */
  getMintDetails(request: MintDetailsRequest): Promise<MintDetailsResponse>;
  /**
   * Returns ABI, args and value for submitting the mint transaction.
   * Includes resolver data if records are provided.
   */
  getMintTransactionParameters(
    request: MintTransactionRequest
  ): Promise<MintTransactionResponse>;
  /** Checks availability of an L1 subname using ENS Registry. */
  isL1SubnameAvailable(subname: string): Promise<boolean>;
  /** Checks availability of an L2 subname on a specific chain. */
  isL2SubnameAvailable(subname: string, chainId: number): Promise<boolean>;
}

// Listing cache time
// 15 minutes
const DEFAULT_LISTING_CACHE = 15 * 60 * 1000;
const DEFAULT_MINT_SOURCE = "namespace-sdk";

/**
 * Configuration options for {@link createMintClient}.
 */
export interface MintClientConfig {
  /** When true, uses testnet chains. */
  isTestnet?: boolean;
  /** @deprecated Environment is not required by consumers. */
  environment?: NamespaceEnv;
  /** Advanced override for List Manager API base URL. */
  listManagerUri?: string;
  /** Advanced override for Mint Manager API base URL. */
  mintManagerUri?: string;
  /** Cache TTL for listing metadata (ms). Default: 15 minutes. */
  listingCacheMilliseconds?: number;
  /** Source tag sent with minting requests. */
  mintSource?: string;
  /** Custom RPC URLs. */
  cursomRpcUrls?: Record<string, string>;
}

class MintClientImpl implements MintClient {
  private mintManagerHttp: AxiosInstance;
  private listManagerHttp: AxiosInstance;

  private cachedClients: Record<number, PublicClient> = {}
  private cachedListings: Record<
    string,
    {
      data: NameListing;
      exp: number;
    }
  > = {};

  constructor(private readonly config: MintClientConfig = {}) {
    // Derive environment internally from isTestnet.
    const derivedEnv: NamespaceEnv = this.config.isTestnet ? "staging" : "production";

    const listManagerUri = this.config.listManagerUri
      ? this.config.listManagerUri
      : LibEnvironment.listingApi[derivedEnv];
    const mintManagerUri = this.config.mintManagerUri
      ? this.config.mintManagerUri
      : LibEnvironment.mintingApi[derivedEnv];

    console.info(`Initializing mint manager sdk with mint-manager: ${mintManagerUri}, list-manager: ${listManagerUri}`)
    this.mintManagerHttp = axios.create({
      baseURL: mintManagerUri,
    });

    this.listManagerHttp = axios.create({
      baseURL: listManagerUri,
    });
  }

  public async getMintDetails(
    request: MintDetailsRequest
  ): Promise<MintDetailsResponse> {
    return this.mintManagerHttp
      .get<MintDetailsResponse>("/api/v1/minting-parameters/estimated", {
        params: request,
      })
      .then((res) => res.data);
  }

  public async getMintTransactionParameters(
    request: MintTransactionRequest
  ): Promise<MintTransactionResponse> {
    const listing = await this.getListingForName(request.parentName);

    const paramResponse = await this.getMintParameters({
      label: request.label,
      minterAddress: request.minterAddress,
      parentName: request.parentName,
      expiryInYears: request.expiryInYears,
      isTestnet: this.config.isTestnet,
      owner: request.owner
    });

    let resolverData: Hash[] = [];
    const isL1Listing = listing.type === "L1";
    const isL2Listing = listing.type === "L2";

    let abi: any[] = [];
    let contractAddress: Address = zeroAddress;

    if (isL1Listing) {
      const { mintController } = getL1NamespaceContracts(this.config.isTestnet);
      contractAddress = mintController;
      abi = Abis.L1_MINT_CONTROLLER;
    } else if (isL2Listing) {
      const registryNetwork = listing.l2Metadata?.registryNetwork;

      if (!registryNetwork) {
        throw new Error(
          `Could not determine registry network for name: ${listing.name}`
        );
      }

      const chainId = getChainId(registryNetwork as ListingChain);
      const { controller } = getL2NamespaceContracts(chainId);
      contractAddress = controller;
      abi = Abis.L2_MINT_CONTROLLER;
    } else {
      throw new Error(`Unsupported listing type: ${listing.type}`);
    }

    if (request.records) {
      const fullSubname = `${request.label}.${request.parentName}`;
      resolverData = convertEnsRecordsToResolverData(
        fullSubname,
        request.records
      );
    }

    return {
      abi: abi,
      args: [
        paramResponse.content,
        paramResponse.signature,
        resolverData,
        toHex(this.config.mintSource || DEFAULT_MINT_SOURCE),
      ],
      functionName: "mint",
      contractAddress: contractAddress,
      account: request.minterAddress,
      value:
        BigInt(paramResponse.content.fee) + BigInt(paramResponse.content.price),
    };
  }

  public async isL1SubnameAvailable(subname: string): Promise<boolean> {
    const subnameNetwork = this.config.isTestnet
      ? ListingChain.Sepolia
      : ListingChain.Mainnet;

    const { ensRegistry } = getEnsContracts(this.config.isTestnet);
    const subnameOwner = await this.getPublicClient(
      subnameNetwork
    ).readContract({
      abi: Abis.ENS_REGISTRY,
      functionName: "owner",
      address: ensRegistry,
      args: [namehash(subname)],
    });

    return subnameOwner === zeroAddress;
  }

  public async isL2SubnameAvailable(
    subname: string,
    chainId: number
  ): Promise<boolean> {
    const subnameNetwork = getChainName(chainId);
    const { registryResolver } = getL2NamespaceContracts(chainId);

    const split = subname.split(".");

    if (split.length < 2) {
      throw Error(`Invalid subname provided: ${subname}`);
    }

    const parentName = `${split[split.length - 2]}.${split[split.length - 1]}`;
    const parentNode = namehash(parentName);
    const subnameNode = namehash(subname);

    try {
      const web3Client = this.getPublicClient(subnameNetwork);
      const ownerAddress = await web3Client.readContract({
        abi: Abis.L2_REGISTRY_RESOLVER,
        functionName: "subnodeOwner",
        address: registryResolver,
        args: [subnameNode, parentNode],
      }) as string;
      return ownerAddress.toLocaleLowerCase() === zeroAddress;
    } catch (err) {
      console.warn(
        "Error while checking l2 subname ownership, is registry present?",
        registryResolver,
        parentName,
        subname,
        `Parent Node: ${parentNode}`,
        `Subname Node: ${subnameNode}`
      );

      if (err instanceof ContractFunctionExecutionError) {
        const contractErr = err as ContractFunctionExecutionError;
        console.error(contractErr.cause)
      } else {
        console.error(err)
      }

      return false;
    }
  }

  private async getMintParameters(
    request: MintParametersRequest
  ): Promise<MintParametersResponse> {
    return this.mintManagerHttp
      .post<MintParametersResponse>(`/api/v1/minting-parameters`, request)
      .then((res) => res.data);
  }

  private async getListingForName(name: string): Promise<NameListing> {
    const listingNetwork = this.config.isTestnet
      ? ListingChain.Sepolia
      : ListingChain.Mainnet;
    const cacheKey = `${name}-${listingNetwork}`;
    const now = new Date().getTime();

    if (this.cachedListings[cacheKey]) {
      const { data, exp } = this.cachedListings[cacheKey];
      if (exp > now) {
        return data;
      }
    }

    const { data } = await this.listManagerHttp.get<NameListing>(
      `/api/v1/listing/network/${listingNetwork}/name/${name}`
    );

    const cacheTime =
      now + (this.config.listingCacheMilliseconds || DEFAULT_LISTING_CACHE);
    this.cachedListings[cacheKey] = {
      data: data,
      exp: cacheTime,
    };

    return data;
  }

  private getPublicClient(chainName: ListingChain) {
    const chain = getChain(chainName);

    if (this.cachedClients[chain.id]) {
      return this.cachedClients[chain.id];
    }

    const customTransports = this.config.cursomRpcUrls || {};
    const chainClient = createPublicClient({
      transport: http(customTransports[chain.id]),
      chain: chain,
    });

    this.cachedClients[chain.id] = chainClient;
    return chainClient;
  }
}

/**
 * Create a new MintClient instance.
 *
 * @example
 * ```typescript
 * import { createMintClient } from '@thenamespace/mint-manager';
 *
 * // Mainnet (default)
 * const mainnet = createMintClient();
 *
 * // Testnet
 * const testnet = createMintClient({
 *   isTestnet: true,
 *   customRpcUrls: { [baseSepolia.id]: 'https://base-sepolia.g.alchemy.com/v2/<api-key>>' }
 * });
 * ```
 */
export function createMintClient(config: MintClientConfig = {}): MintClient {
  return new MintClientImpl(config);
}
