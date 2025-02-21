import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import {
  GetL1SubnamesQuery,
  GetL2SubnamesQuery,
  L1Network,
  L2Network,
  L2SubnameStats,
  L2SubnameResponse,
  L2SubnamePagedResponse,
  L1SubnameResponse,
} from "./types";
import {
  _getL1Subname,
  _getL1Subnames,
  _getL2Stats,
  _getL2Subname,
  _getL2Subnames,
} from "./actions";

export interface IndexerClient {
  getL2Subnames(query: GetL2SubnamesQuery): Promise<L2SubnamePagedResponse>;
  getL2Subname(
    network: L2Network,
    namehash: string
  ): Promise<L2SubnameResponse>;
  getL2Stats(includeTestnet: boolean): Promise<L2SubnameStats>;
  getL1Subnames(query: GetL1SubnamesQuery): Promise<L1SubnameResponse[]>;
  getL1Subname(
    network: L1Network,
    namehash: string
  ): Promise<L1SubnameResponse>;
}

export interface IndexerClientConfig extends AxiosRequestConfig {}

class HttpIndexerClient implements IndexerClient {
  private HTTP: AxiosInstance;

  constructor(private readonly config: IndexerClientConfig) {
    const baseUri = "http://localhost:3000";
    this.HTTP = axios.create({ ...this.config, baseURL: baseUri });
  }

  public async getL2Subnames(
    query: GetL2SubnamesQuery
  ): Promise<L2SubnamePagedResponse> {
    return await _getL2Subnames(this.HTTP, query);
  }

  public async getL2Subname(
    network: L2Network,
    namehash: string
  ): Promise<L2SubnameResponse> {
    return await _getL2Subname(this.HTTP, network, namehash);
  }

  public async getL2Stats(includeTestnet: boolean): Promise<L2SubnameStats> {
    return await _getL2Stats(this.HTTP, includeTestnet);
  }

  public async getL1Subnames(
    query: GetL1SubnamesQuery
  ): Promise<L1SubnameResponse[]> {
    return await _getL1Subnames(this.HTTP, query);
  }

  public async getL1Subname(
    network: L1Network,
    subnameLabel: string
  ): Promise<L1SubnameResponse> {
    return await _getL1Subname(this.HTTP, network, subnameLabel);
  }
}

export const createIndexerClient = (
  config: IndexerClientConfig
): IndexerClient => {
  return new HttpIndexerClient(config);
};
