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
  Logger,
  NameCheck,
  CheckNameOptions,
  PrepareMintOptions,
  MintingValidationErrorType,
} from "./types";
import {
  toHex,
  Address,
  zeroAddress,
  Hash,
  http,
  createPublicClient,
  namehash,
  getAddress,
  PublicClient,
} from "viem";
import { getChain, getChainId, getChainName, ListingChain } from "./chains";
import { Abis } from "./abi";
import {
  getEnsContracts,
  getL1NamespaceContracts,
  getL2NamespaceContracts,
} from "@thenamespace/addresses";
import { convertEnsRecordsToResolverData } from "./utils";
import { normalizeLabel, normalizeName, normalizeSubname } from "./validation";
import { createError, reasonFrom } from "./errors";

/**
 * Main client interface for preparing mint transactions and checking
 * subname availability across L1 and supported L2 networks.
 *
 * Every name and label passed to these methods is normalized per ENSIP-15
 * before it is hashed, sent to the API, or compared. `"Alice.example.eth"` and
 * `"alice.example.eth"` therefore resolve to the same node, and a name that
 * cannot be normalized is rejected with a {@link MintManagerError} rather than
 * silently producing the wrong namehash.
 *
 * @example
 * ```typescript
 * import { createMintClient } from '@thenamespace/mint-manager';
 *
 * // Zero-config (mainnet)
 * const client = createMintClient();
 *
 * // Testnet with a dedicated RPC
 * const testnet = createMintClient({
 *   isTestnet: true,
 *   customRpcUrls: { 84532: process.env.BASE_SEPOLIA_RPC_URL! }
 * });
 * ```
 */
export interface MintClient {
  /** Fetches estimated minting parameters and price quote. */
  getMintDetails(request: MintDetailsRequest): Promise<MintDetailsResponse>;
  /**
   * Returns ABI, args and value for submitting the mint transaction.
   * Includes resolver data if records are provided.
   *
   * The signed parameters returned by the mint API are verified against the
   * request before they are handed back, so a wrong or tampered-with response
   * cannot reach the caller's wallet as a valid-looking transaction.
   *
   * @throws {MintManagerError} `MINT_PARAMS_MISMATCH` if the API signed a
   * different name, owner or parent than the one requested.
   * @throws {MintManagerError} `PRICE_EXCEEDS_MAX` if the quoted total exceeds
   * `request.maxValue`.
   * @throws {MintManagerError} `SIGNATURE_EXPIRED` if the signature is stale.
   */
  getMintTransactionParameters(
    request: MintTransactionRequest
  ): Promise<MintTransactionResponse>;
  /**
   * Answers "can this address mint this name, and if not, why" in one call.
   *
   * Takes the whole name, works out the listing and chain itself, and returns a
   * single reconciled answer. Prefer this over the two availability methods:
   * they each answer half the question, and on a gated listing the API stops at
   * the gate without ever evaluating the name, so neither one alone can tell
   * you whether the name is free.
   *
   * @example
   * ```typescript
   * const check = await client.checkName("alice.oppunk.eth", {
   *   minterAddress: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
   * });
   *
   * switch (check.status) {
   *   case "available":
   *     await client.prepareMint(check, { minterAddress });
   *     break;
   *   case "taken":
   *     // Suggest another label.
   *     break;
   *   case "blocked":
   *     check.reasons; // e.g. ["MINTER_NOT_WHITELISTED"]
   *     break;
   * }
   * ```
   */
  checkName(name: string, options: CheckNameOptions): Promise<NameCheck>;
  /**
   * Builds the mint transaction, either from a successful {@link checkName}
   * result or from a name directly.
   *
   * Passing the check result avoids resolving the listing a second time.
   *
   * @throws {MintManagerError} `MINT_PARAMS_MISMATCH` if the signed parameters
   * do not describe the requested mint.
   */
  prepareMint(
    target: string | NameCheck,
    options: PrepareMintOptions
  ): Promise<MintTransactionResponse>;
  /**
   * Checks availability of an L1 subname using the ENS Registry.
   *
   * @deprecated Use {@link checkName}, which also reports whether the minter is
   * actually permitted to mint. This method only reports registry ownership, so
   * a `true` here can still be followed by a failed mint.
   * @throws {MintManagerError} `RPC_ERROR` if the registry cannot be reached.
   * An unreachable RPC is never reported as "taken".
   */
  isL1SubnameAvailable(subname: string): Promise<boolean>;
  /**
   * Checks availability of an L2 subname on a specific chain.
   *
   * @deprecated Use {@link checkName}. It derives the chain id from the listing
   * instead of requiring you to know it, and reports mint eligibility too.
   * @throws {MintManagerError} `RPC_ERROR` if the registry cannot be reached.
   */
  isL2SubnameAvailable(subname: string, chainId: number): Promise<boolean>;
}

// Listing cache time
// 15 minutes
const DEFAULT_LISTING_CACHE = 15 * 60 * 1000;
const DEFAULT_MINT_SOURCE = "namespace-sdk";
const DEFAULT_TIMEOUT_MS = 30_000;
// Bounds the listing cache so a long-lived process iterating over attacker
// supplied names cannot grow it without limit.
const MAX_CACHED_LISTINGS = 500;

// The only validation error that proves the name is registered. Every other
// reason is a restriction on the caller or on this particular name, and the API
// stops at the first failure, so the name itself may never have been
// evaluated. SUBNAME_RESERVED deliberately is not here: a reserved name is held
// back for someone else, not registered, and the registry is what settles it.
const NAME_REGISTERED_REASONS: MintingValidationErrorType[] = ["SUBNAME_TAKEN"];

/** No-op logger. An SDK should not write to a consumer's stdout uninvited. */
const SILENT_LOGGER: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/**
 * Configuration options for {@link createMintClient}.
 */
export interface MintClientConfig {
  /** When true, uses testnet chains. */
  isTestnet?: boolean;
  /** @deprecated Environment is derived from `isTestnet`; this is ignored. */
  environment?: NamespaceEnv;
  /** Advanced override for List Manager API base URL. Must be https. */
  listManagerUri?: string;
  /** Advanced override for Mint Manager API base URL. Must be https. */
  mintManagerUri?: string;
  /** Cache TTL for listing metadata (ms). Default: 15 minutes. */
  listingCacheMilliseconds?: number;
  /** Source tag sent with minting requests. */
  mintSource?: string;
  /** Custom RPC URLs, keyed by numeric chain id. */
  customRpcUrls?: Record<string | number, string>;
  /**
   * @deprecated Misspelling of {@link MintClientConfig.customRpcUrls}. Still
   * honoured so existing integrations keep working; prefer `customRpcUrls`.
   */
  cursomRpcUrls?: Record<string | number, string>;
  /** Request timeout in milliseconds. Default: 30s. */
  timeoutMilliseconds?: number;
  /** Receives diagnostics. Defaults to silent; the SDK never logs on its own. */
  logger?: Logger;
}

/** Rejects non-https overrides so the trust boundary cannot be downgraded. */
const assertSecureUri = (uri: string, field: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch (err) {
    throw createError.configError(
      `"${field}" is not a valid URL: ${reasonFrom(err)}`,
      { field, value: uri }
    );
  }

  const isLoopback =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "[::1]";

  if (parsed.protocol !== "https:" && !isLoopback) {
    throw createError.configError(
      `"${field}" must use https. Plain http exposes signed mint parameters ` +
        `to anyone on the network path, who could then substitute their own ` +
        `price and payment receiver. Only loopback addresses may use http.`,
      { field, value: uri }
    );
  }

  return uri;
};

/** The mint API returns wei as decimal strings; anything else is a bug. */
const parseWei = (value: unknown, field: string): bigint => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw createError.apiError(
      undefined,
      "/api/v1/minting-parameters",
      `expected "${field}" to be a decimal wei string, received ${JSON.stringify(
        value
      )}`
    );
  }
  return BigInt(value);
};

class MintClientImpl implements MintClient {
  private mintManagerHttp: AxiosInstance;
  private listManagerHttp: AxiosInstance;
  private readonly logger: Logger;
  private readonly rpcUrls: Record<string | number, string>;

  private cachedClients: Record<number, PublicClient> = {};
  private cachedListings: Record<
    string,
    {
      data: NameListing;
      exp: number;
    }
  > = {};

  constructor(private readonly config: MintClientConfig = {}) {
    // Derive environment internally from isTestnet.
    const derivedEnv: NamespaceEnv = this.config.isTestnet
      ? "staging"
      : "production";

    this.logger = this.config.logger || SILENT_LOGGER;
    // Accept the historical misspelling so v1.1.1 integrations keep working.
    this.rpcUrls = this.config.customRpcUrls || this.config.cursomRpcUrls || {};

    const listManagerUri = this.config.listManagerUri
      ? assertSecureUri(this.config.listManagerUri, "listManagerUri")
      : LibEnvironment.listingApi[derivedEnv];
    const mintManagerUri = this.config.mintManagerUri
      ? assertSecureUri(this.config.mintManagerUri, "mintManagerUri")
      : LibEnvironment.mintingApi[derivedEnv];

    const timeout = this.config.timeoutMilliseconds ?? DEFAULT_TIMEOUT_MS;

    this.logger.debug(
      `mint-manager: mint=${mintManagerUri} list=${listManagerUri}`
    );

    this.mintManagerHttp = axios.create({
      baseURL: mintManagerUri,
      timeout,
      maxRedirects: 0,
    });

    this.listManagerHttp = axios.create({
      baseURL: listManagerUri,
      timeout,
      maxRedirects: 0,
    });
  }

  public async getMintDetails(
    request: MintDetailsRequest
  ): Promise<MintDetailsResponse> {
    const label = normalizeLabel(request.label);
    const parentName = normalizeName(request.parentName);

    return this.mintManagerHttp
      .get<MintDetailsResponse>("/api/v1/minting-parameters/estimated", {
        params: {
          ...request,
          label,
          parentName,
          // Always the client's own setting. Previously the caller's value was
          // forwarded, so a testnet client could quote against production.
          isTestnet: this.config.isTestnet,
        },
      })
      .then((res) => res.data)
      .catch((err) => {
        throw this.asApiError(err, "/api/v1/minting-parameters/estimated");
      });
  }

  public async getMintTransactionParameters(
    request: MintTransactionRequest
  ): Promise<MintTransactionResponse> {
    const label = normalizeLabel(request.label);
    const parentName = normalizeName(request.parentName);
    const minterAddress = getAddress(request.minterAddress);
    const expectedOwner = getAddress(request.owner || request.minterAddress);

    const listing = await this.getListingForName(parentName);

    const paramResponse = await this.getMintParameters({
      label,
      minterAddress,
      parentName,
      expiryInYears: request.expiryInYears,
      isTestnet: this.config.isTestnet,
      owner: expectedOwner,
    });

    // The response carries a signature the controller will honour, so it must
    // describe the name the caller actually asked for. Without these checks a
    // compromised or intercepted API could have the user sign a mint for a
    // different name, a different owner, or an arbitrary price.
    this.assertMintParametersMatch(paramResponse, {
      label,
      parentName,
      expectedOwner,
    });

    const price = parseWei(paramResponse.content.price, "price");
    const fee = parseWei(paramResponse.content.fee, "fee");
    const value = price + fee;

    if (request.maxValue !== undefined && value > request.maxValue) {
      throw createError.priceExceedsMax(value, request.maxValue);
    }

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
        throw createError.unsupportedListing(listing.type, listing.name);
      }

      const chainId = getChainId(this.assertListingChain(registryNetwork));
      const { controller } = getL2NamespaceContracts(chainId);
      contractAddress = controller;
      abi = Abis.L2_MINT_CONTROLLER;
    } else {
      throw createError.unsupportedListing(listing.type, listing.name);
    }

    if (request.records) {
      // Derive the node from the verified label, not the raw request. The
      // contract hashes `content.label` itself, so deriving from unnormalized
      // input would point the resolver calls at a different node than the one
      // being minted.
      const fullSubname = `${paramResponse.content.label}.${parentName}`;
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
      account: minterAddress,
      value,
    };
  }

  public async checkName(
    name: string,
    options: CheckNameOptions
  ): Promise<NameCheck> {
    const normalized = normalizeSubname(name);
    const split = normalized.split(".");
    const label = split[0];
    const parentName = split.slice(1).join(".");
    const minterAddress = getAddress(options.minterAddress);
    const policy = options.rpc || "auto";

    const listing = await this.getListingForName(parentName);
    const { listingType, chainId } = this.resolveListingTarget(listing);
    const base = { name: normalized, label, parentName, listingType, chainId };

    const details = await this.getMintDetails({
      parentName,
      label,
      minterAddress,
      expiryInYears: options.expiryInYears,
    });
    const reasons = details.validationErrors || [];

    // "always" reconciles against the registry even on a clean quote, in case
    // the API's view is stale.
    if (policy === "always" && !(await this.isNameFree(normalized, base))) {
      return { ...base, status: "taken", reasons };
    }

    if (details.canMint) {
      return {
        ...base,
        status: "available",
        estimatedPriceEth: details.estimatedPriceEth,
        estimatedFeeEth: details.estimatedFeeEth,
        isStandardFee: details.isStandardFee,
      };
    }

    // The API told us the name is registered, so no registry lookup is needed.
    if (reasons.some((r) => NAME_REGISTERED_REASONS.includes(r))) {
      return { ...base, status: "taken", reasons };
    }

    // Everything left is a gate on the minter, and validation stops at the
    // first failure, so the API never evaluated the name. Only the registry
    // can separate "free but you may not mint it" from "already taken".
    if (policy === "never") {
      return {
        ...base,
        status: "blocked",
        reasons,
        nameAvailabilityConfirmed: false,
      };
    }

    if (!(await this.isNameFree(normalized, base))) {
      return { ...base, status: "taken", reasons };
    }

    return {
      ...base,
      status: "blocked",
      reasons,
      nameAvailabilityConfirmed: true,
    };
  }

  public async prepareMint(
    target: string | NameCheck,
    options: PrepareMintOptions
  ): Promise<MintTransactionResponse> {
    if (typeof target !== "string" && target.status !== "available") {
      throw createError.nameNotAvailable(
        target.name,
        target.status,
        target.reasons
      );
    }

    // The listing was resolved during checkName and is still cached, so the
    // string and check-result paths cost the same from here.
    const name = typeof target === "string" ? normalizeSubname(target) : target.name;
    const split = name.split(".");

    return this.getMintTransactionParameters({
      label: split[0],
      parentName: split.slice(1).join("."),
      minterAddress: getAddress(options.minterAddress),
      owner: options.owner,
      expiryInYears: options.expiryInYears,
      records: options.records,
      maxValue: options.maxValue,
    });
  }

  /** Registry-level availability, dispatched by listing type. */
  private async isNameFree(
    name: string,
    target: { listingType: string; chainId: number }
  ): Promise<boolean> {
    return target.listingType === "L2"
      ? this.isL2SubnameAvailable(name, target.chainId)
      : this.isL1SubnameAvailable(name);
  }

  /** Works out where a listing's names actually live. */
  private resolveListingTarget(listing: NameListing): {
    listingType: "L1" | "L2";
    chainId: number;
  } {
    if (listing.type === "L1") {
      return {
        listingType: "L1",
        chainId: getChainId(
          this.config.isTestnet ? ListingChain.Sepolia : ListingChain.Mainnet
        ),
      };
    }

    if (listing.type === "L2") {
      const registryNetwork = listing.l2Metadata?.registryNetwork;
      if (!registryNetwork) {
        throw createError.unsupportedListing(listing.type, listing.name);
      }
      return {
        listingType: "L2",
        chainId: getChainId(this.assertListingChain(registryNetwork)),
      };
    }

    throw createError.unsupportedListing(listing.type, listing.name);
  }

  public async isL1SubnameAvailable(subname: string): Promise<boolean> {
    const normalized = normalizeSubname(subname);
    const subnameNetwork = this.config.isTestnet
      ? ListingChain.Sepolia
      : ListingChain.Mainnet;

    const { ensRegistry } = getEnsContracts(this.config.isTestnet);

    try {
      const subnameOwner = await this.getPublicClient(
        subnameNetwork
      ).readContract({
        abi: Abis.ENS_REGISTRY,
        functionName: "owner",
        address: ensRegistry,
        args: [namehash(normalized)],
      });

      return subnameOwner === zeroAddress;
    } catch (err) {
      // Never collapse a transport failure into "taken", the caller cannot
      // tell the difference, and would show a false negative to a user.
      throw createError.rpcError(
        `checking L1 availability of "${normalized}"`,
        getChainId(subnameNetwork),
        err
      );
    }
  }

  public async isL2SubnameAvailable(
    subname: string,
    chainId: number
  ): Promise<boolean> {
    const normalized = normalizeSubname(subname);
    const subnameNetwork = getChainName(chainId);
    const { registryResolver } = getL2NamespaceContracts(chainId);

    const split = normalized.split(".");

    if (split.length < 2) {
      throw createError.invalidName(
        subname,
        "a subname needs at least one parent label"
      );
    }

    // The parent is everything after the first label. Taking only the last two
    // labels breaks any nested name: the parent of "a.sub.example.eth" is
    // "sub.example.eth", not "example.eth".
    const parentName = split.slice(1).join(".");
    const parentNode = namehash(parentName);
    const subnameNode = namehash(normalized);

    try {
      const web3Client = this.getPublicClient(subnameNetwork);
      const ownerAddress = (await web3Client.readContract({
        abi: Abis.L2_REGISTRY_RESOLVER,
        functionName: "subnodeOwner",
        address: registryResolver,
        args: [subnameNode, parentNode],
      })) as string;
      return ownerAddress.toLowerCase() === zeroAddress;
    } catch (err) {
      this.logger.debug(
        `L2 availability lookup failed on ${subnameNetwork} ` +
          `(registry ${registryResolver}, parent ${parentName})`
      );
      throw createError.rpcError(
        `checking L2 availability of "${normalized}"`,
        chainId,
        err
      );
    }
  }

  /** Confirms the signed parameters describe the requested mint. */
  private assertMintParametersMatch(
    response: MintParametersResponse,
    expected: { label: string; parentName: string; expectedOwner: Address }
  ): void {
    const { content } = response;

    if (content.label !== expected.label) {
      throw createError.mintParamsMismatch(
        "label",
        expected.label,
        content.label
      );
    }

    const expectedParentNode = namehash(expected.parentName);
    if (
      (content.parentNode || "").toLowerCase() !==
      expectedParentNode.toLowerCase()
    ) {
      throw createError.mintParamsMismatch(
        "parentNode",
        expectedParentNode,
        content.parentNode
      );
    }

    let signedOwner: Address;
    try {
      signedOwner = getAddress(content.owner);
    } catch {
      throw createError.mintParamsMismatch(
        "owner",
        expected.expectedOwner,
        content.owner
      );
    }

    if (signedOwner !== expected.expectedOwner) {
      throw createError.mintParamsMismatch(
        "owner",
        expected.expectedOwner,
        signedOwner
      );
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (content.signatureExpiry && content.signatureExpiry < nowSeconds) {
      throw createError.signatureExpired(content.signatureExpiry, nowSeconds);
    }
  }

  /** Validates a server-supplied chain name against the supported set. */
  private assertListingChain(value: string): ListingChain {
    const supported = Object.values(ListingChain) as string[];
    if (!supported.includes(value)) {
      throw createError.unsupportedChain(value, supported);
    }
    return value as ListingChain;
  }

  private asApiError(err: unknown, endpoint: string) {
    const status =
      typeof err === "object" && err && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
    return createError.apiError(status, endpoint, reasonFrom(err), err);
  }

  private async getMintParameters(
    request: MintParametersRequest
  ): Promise<MintParametersResponse> {
    return this.mintManagerHttp
      .post<MintParametersResponse>(`/api/v1/minting-parameters`, request)
      .then((res) => res.data)
      .catch((err) => {
        throw this.asApiError(err, "/api/v1/minting-parameters");
      });
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

    // The name decides L1-vs-L2, the contract and the chain, so it must not be
    // able to rewrite the request path it is interpolated into.
    const { data } = await this.listManagerHttp
      .get<NameListing>(
        `/api/v1/listing/network/${encodeURIComponent(
          listingNetwork
        )}/name/${encodeURIComponent(name)}`
      )
      .catch((err) => {
        throw createError.listingNotFound(name, err);
      });

    // The list-manager answers 200 with an empty body for a name it does not
    // have, so an absent listing has to be detected here rather than by status.
    if (!data || typeof data !== "object" || !(data as NameListing).type) {
      throw createError.listingNotFound(name);
    }

    const cacheTime =
      now + (this.config.listingCacheMilliseconds || DEFAULT_LISTING_CACHE);

    if (Object.keys(this.cachedListings).length >= MAX_CACHED_LISTINGS) {
      this.cachedListings = {};
    }

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

    const chainClient = createPublicClient({
      transport: http(this.rpcUrls[chain.id]),
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
 * import { createMintClient, MintManagerError } from '@thenamespace/mint-manager';
 *
 * const client = createMintClient({ isTestnet: true });
 *
 * try {
 *   const available = await client.isL1SubnameAvailable('alice.namespace.eth');
 * } catch (err) {
 *   if (err instanceof MintManagerError && err.code === 'RPC_ERROR') {
 *     // A failed lookup is reported, never disguised as "taken".
 *   }
 * }
 * ```
 */
export function createMintClient(config: MintClientConfig = {}): MintClient {
  return new MintClientImpl(config);
}
