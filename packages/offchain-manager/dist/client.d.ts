import { AxiosRequestConfig } from "axios";
import { CreateSubnameDTO } from "./dto/create-subname-dto";
export interface OffchainManagerClientConfig extends AxiosRequestConfig {
}
export declare class OffchainManagerClient {
    private readonly config;
    private HTTP;
    private apiKeys;
    constructor(config: OffchainManagerClientConfig);
    createSubname(createRequest: CreateSubnameDTO): Promise<void>;
    setApiKey(ensName: string, apiKey: string): void;
    private verifyApiKeySet;
    private getApiKey;
    private getAuthHeaders;
}
export declare function createOffchainManagerClient(config: OffchainManagerClientConfig): OffchainManagerClient;
