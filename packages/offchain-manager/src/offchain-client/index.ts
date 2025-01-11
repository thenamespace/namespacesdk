import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { SubnameDTO } from "../dto/create-subname-dto";
import {
  _addTextRecord,
  _createSubname,
  _deleteDataRecord,
  _deleteSubname,
  _deleteTextRecord,
} from "./private-actions";
import { extractParentAndLabel } from "./utils";
import { _generateApiKeyForName, SignerFunction } from "./auth-actions";
import { _getTextRecord, _getTextRecords, _isSubnameAvailable } from "./public-actions";
import { GetAvailableResponse, GetRecordResponse } from "./types";

export interface OffchainClient {
  createSubname(request: SubnameDTO): Promise<void>;
  setApiKey(ensName: string, apiKey: string): void;
  addTextRecord(subname: string, key: string, value: string): Promise<void>;
  deleteTextRecord(subname: string, key: string): Promise<void>;
  deleteDataRecord(subname: string, key: string): Promise<void>;
  deleteSubname(fullSubname: string): Promise<void>;
  generateApiKey(
    ensName: string,
    signerWallet: string,
    signerFunc: SignerFunction
  ): Promise<string>;
  getTextRecords(fullSubname: string): Promise<Record<string,string>>
  getTextRecord(fullSubname: string, key: string): Promise<GetRecordResponse>
  isSubnameAvailable(fullSubname: string): Promise<GetAvailableResponse>
}

export interface OffchainClientConfig extends AxiosRequestConfig {}

class HttpOffchainClient implements OffchainClient {
  private HTTP: AxiosInstance;
  private apiKeys: Record<string, string> = {};

  constructor(private readonly config: OffchainClientConfig) {
    const baseUri = "http://localhost:3000";
    this.HTTP = axios.create({ ...this.config, baseURL: baseUri });
  }

  public async getTextRecords(fullSubname: string): Promise<Record<string,string>> {
    return await _getTextRecords(this.HTTP, fullSubname)
  }
  
  public async getTextRecord(fullSubname: string, key: string): Promise<GetRecordResponse> {
    return await _getTextRecord(this.HTTP, fullSubname, key);
  }

  public async isSubnameAvailable(fullSubname: string): Promise<GetAvailableResponse> {
    return await _isSubnameAvailable(this.HTTP, fullSubname)
  }

  public async createSubname(request: SubnameDTO) {
    await _createSubname(
      this.HTTP,
      this.fetchApiKeyForName(request.domain, false),
      request
    );
  }

  public async deleteSubname(fullSubname: string) {
    await _deleteSubname(this.HTTP, this.fetchApiKeyForName(fullSubname), fullSubname);
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

  public async deleteTextRecord(subname: string, key: string) {
    await _deleteTextRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      key
    );
  }

  public async addDataRecord(subname: string) {}
  public async deleteDataRecord(subname: string, key: string) {
    await _deleteDataRecord(
      this.HTTP,
      this.fetchApiKeyForName(subname),
      subname,
      key
    );
  }

  public async generateApiKey(
    ensName: string,
    signerWallet: string,
    signerFunc: SignerFunction
  ): Promise<string> {
    return _generateApiKeyForName(this.HTTP, ensName, signerWallet, signerFunc);
  }

  public setApiKey(ensName: string, apiKey: string) {
    this.apiKeys[ensName] = apiKey;
  }

  private fetchApiKeyForName = (name: string, isSubname: boolean = true) => {
    let parentName = isSubname ? extractParentAndLabel(name).parent : name;
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
