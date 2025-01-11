import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { CreateSubnameDTO } from "./dto/create-subname-dto";

export interface OffchainManagerClientConfig extends AxiosRequestConfig {}

export class OffchainManagerClient {
  private HTTP: AxiosInstance;
  private apiKeys: Record<string, string> = {};

  constructor(private readonly config: OffchainManagerClientConfig) {
    const baseURI = this.config.baseURL || "";
    this.HTTP = axios.create({...config, baseURL: baseURI});
  }

  public async createSubname(createRequest: CreateSubnameDTO) {
    this.verifyApiKeySet(createRequest.domain, "CREATE_SUBNAME");
    try {
        await this.HTTP.post("/v1/subname/mint", createRequest, {
            headers: this.getAuthHeaders(createRequest.domain)
        })
    } catch(err) {
        if (err instanceof AxiosError) {
            console.log(err?.response?.data, "ERR RESPONSE")
        }
    }
  }

  public async setAddressRecord() {

  }

  public async removeAddressRecord() {

  }

  public async setTextRecord() {

  }

  public async removeTextRecord() {

  }

  public async setDataRecord() {

  }

  public async removeDataRecord() {
    
  }

  public async isSubnameAvailable() {

  }

  public setApiKey(ensName: string, apiKey: string) {
    this.apiKeys[ensName] = apiKey;
  }

  private verifyApiKeySet(ensName: string, operation: string) {
    if (!this.apiKeys[ensName]) {
      throw new Error(
        `Api key required for operation ${operation} and name ${ensName}. Configure api key for offchain client.`
      );
    }
  }

  private getApiKey(ensName: string) {
    return this.apiKeys[ensName];
  }

  private getAuthHeaders(ensName: string) {
    return {
        Authorization: `Bearer ${this.getApiKey(ensName)}`
    }
  }
}

export function createOffchainManagerClient(config: OffchainManagerClientConfig): OffchainManagerClient {
  return new OffchainManagerClient(config);
}
