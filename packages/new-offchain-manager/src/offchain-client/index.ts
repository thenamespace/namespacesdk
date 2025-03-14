import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { SubnameDTO } from "../dto/subname.dto";
import {
  _addDataRecord,
  _addTextRecord,
  _createSubname,
  _deleteDataRecord,
  _deleteSubname,
  _deleteTextRecord,
} from "./private-actions";
import {
  _getDataRecord,
  _getDataRecords,
  _getFilteredSubnames,
  _getTextRecord,
  _getTextRecords,
  _isSubnameAvailable,
} from "./public-actions";
import {
  GetAvailableResponse,
  GetRecordResponse,
  PagedResponse,
  QuerySubnamesRequest,
} from "./types";
import { CreateSubnameRequest } from "../dto/create-subname-request.dto";

export interface OffchainClient {
  setApiKey(ensName: string, apiKey: string): void;
  createSubname(request: CreateSubnameRequest): Promise<void>;
  deleteSubname(fullSubname: string): Promise<void>;
  isSubnameAvailable(fullSubname: string): Promise<GetAvailableResponse>;
  getFilteredSubnames(
    query: QuerySubnamesRequest
  ): Promise<PagedResponse<SubnameDTO[]>>;

  addTextRecord(subname: string, key: string, value: string): Promise<void>;
  deleteTextRecord(subname: string, key: string): Promise<void>;
  getTextRecords(fullSubname: string): Promise<Record<string, string>>;
  getTextRecord(fullSubname: string, key: string): Promise<GetRecordResponse>;
  addDataRecord(fullSubname: string, key: string, data: any): Promise<void>;
  deleteDataRecord(subname: string, key: string): Promise<void>;
  getDataRecords(fullSubname: string): Promise<Record<string, any>>;
  getDataRecord(fullSubname: string, key: string): Promise<GetRecordResponse>;
}

type Mode = "mainnet" | "sepolia"
const backendUris: Record<Mode, string> = {
  mainnet: "https://offchain-manager.namespace.ninja",
  sepolia: "https://staging.offchain-manager.namespace.ninja",
}

export interface OffchainClientConfig extends AxiosRequestConfig {
  mode?: Mode
  backendUri?: string
}

class HttpOffchainClient implements OffchainClient {
  private HTTP: AxiosInstance;
  private apiKeys: Record<string, string> = {};

  constructor(private readonly config: OffchainClientConfig) {
    const mode = config.mode || "mainnet";
    const uri = config.backendUri || backendUris[mode];
    this.HTTP = axios.create({ ...this.config, baseURL: uri });
  }

  public async getTextRecords(
    fullSubname: string
  ): Promise<Record<string, string>> {
    return await _getTextRecords(this.HTTP, fullSubname);
  }

  public async getTextRecord(
    fullSubname: string,
    key: string
  ): Promise<GetRecordResponse> {
    return await _getTextRecord(this.HTTP, fullSubname, key);
  }

  public async getDataRecords(
    fullSubname: string
  ): Promise<Record<string, string>> {
    return await _getDataRecords(this.HTTP, fullSubname);
  }

  public async getDataRecord(
    fullSubname: string,
    key: string
  ): Promise<GetRecordResponse> {
    return await _getDataRecord(this.HTTP, fullSubname, key);
  }

  public async isSubnameAvailable(
    fullSubname: string
  ): Promise<GetAvailableResponse> {
    return await _isSubnameAvailable(this.HTTP, fullSubname);
  }

  public async createSubname(request: CreateSubnameRequest) {
    await _createSubname(
      this.HTTP,
      this.fetchApiKeyForName(`${request.label}.${request.parentName}`, false),
      request
    );
  }

  public async deleteSubname(fullSubname: string) {
    await _deleteSubname(
      this.HTTP,
      this.fetchApiKeyForName(fullSubname),
      fullSubname
    );
  }

  public async addTextRecord(subname: string, key: string, value: string) {
    await _addTextRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      key,
      value
    );
  }

  public async deleteTextRecord(fullSubname: string, key: string) {
    await _deleteTextRecord(
      this.HTTP,
      this.fetchApiKeyForName(fullSubname),
      fullSubname,
      key
    );
  }

  public async addDataRecord(subname: string, key: string, value: string) {
    await _addDataRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      key,
      value
    );
  }

  public async deleteDataRecord(fullSubname: string, key: string) {
    await _deleteDataRecord(
      this.HTTP,
      this.fetchApiKeyForName(fullSubname),
      fullSubname,
      key
    );
  }

  public async getFilteredSubnames(
    query: QuerySubnamesRequest
  ): Promise<PagedResponse<SubnameDTO[]>> {
    return _getFilteredSubnames(this.HTTP, query);
  }

  public setApiKey(ensName: string, apiKey: string) {
    this.apiKeys[ensName] = apiKey;
  }

  private fetchApiKeyForName = (name: string, isSubname: boolean = true) => {

    const extractParent = () => {
      const split = name.split(".");
      const splitLen = split.length;
      if (splitLen < 2) {
        throw Error(`Invalid ENS name: ${name}`)
      }

      if (splitLen === 2) {
        return name;
      }

      return split[splitLen - 2] + "." + split[splitLen - 1]
    }

    let parentName = isSubname ? extractParent() : name;
    if (!this.apiKeys[parentName]) {
      throw new Error(`Api key is not present for name: ${parentName}`);
    }
    return this.apiKeys[parentName];
  };
}

export const createOffchainClient = (
  config: OffchainClientConfig
): OffchainClient => {
  return new HttpOffchainClient(config);
};
