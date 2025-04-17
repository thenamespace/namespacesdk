import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
  L2RegistryResponse,
  L2SubnameRequest,
  L2SubnameResponse,
  L2SubnamesRequest,
  L2SubnamesResponse,
} from "../dto";

export interface IndexerClient {
  getL2Subname({
    chainId,
    nameOrNamehash,
  }: L2SubnameRequest): Promise<L2SubnameResponse>;
  getL2Registry({
    chainId,
    nameOrNamehash,
  }: L2SubnameRequest): Promise<L2RegistryResponse>;
  getL2Subnames(request: L2SubnamesRequest): Promise<L2SubnamesResponse>;
}

const INDEXER_URI = "https://indexer.namespace.ninja";

export interface IndexerClientConfig extends AxiosRequestConfig {
  indexerUri?: string;
}

class HttpIndexerClient implements IndexerClient {
  private HTTP: AxiosInstance;

  constructor(private readonly config: IndexerClientConfig) {
    const uri = config.indexerUri || INDEXER_URI;
    this.HTTP = axios.create({ ...this.config, baseURL: uri });
  }

  public async getL2Subname({
    chainId,
    nameOrNamehash,
  }: L2SubnameRequest): Promise<L2SubnameResponse> {
    return this.HTTP.get<L2SubnameResponse>(
      `/api/v1/l2-subnames/chainId/${chainId}/namehash/${nameOrNamehash}`
    ).then((res) => res.data);
  }

  public async getL2Registry({
    chainId,
    nameOrNamehash,
  }: L2SubnameRequest): Promise<L2RegistryResponse> {
    return this.HTTP.get<L2RegistryResponse>(
      `/api/v1/l2-subnames/chainId/${chainId}/namehash/${nameOrNamehash}`
    ).then((res) => res.data);
  }

  public async getL2Subnames(
    request: L2SubnamesRequest
  ): Promise<L2SubnamesResponse> {

    
    if (request.parent && !request.parent.startsWith("0x")) {

    }

    return this.HTTP.get<L2SubnamesResponse>(`/api/v1/l2-subnames/all`, {
      params: request,
    }).then((res) => res.data);
  }
}

export const createIndexerClient = (
  config?: IndexerClientConfig
): IndexerClient => {
  return new HttpIndexerClient(config || {});
};