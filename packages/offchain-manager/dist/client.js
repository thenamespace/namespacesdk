"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffchainManagerClient = void 0;
exports.createOffchainManagerClient = createOffchainManagerClient;
const axios_1 = __importStar(require("axios"));
class OffchainManagerClient {
    constructor(config) {
        this.config = config;
        this.apiKeys = {};
        const baseURI = this.config.baseURL || "";
        console.log(baseURI);
        this.HTTP = axios_1.default.create({ ...config, baseURL: baseURI });
    }
    async createSubname(createRequest) {
        this.verifyApiKeySet(createRequest.domain, "CREATE_SUBNAME");
        try {
            await this.HTTP.post("/v1/subname/mint", createRequest, {
                headers: this.getAuthHeaders(createRequest.domain)
            });
        }
        catch (err) {
            if (err instanceof axios_1.AxiosError) {
                console.log(err?.response?.data, "ERR RESPONSE");
            }
        }
    }
    setApiKey(ensName, apiKey) {
        this.apiKeys[ensName] = apiKey;
    }
    verifyApiKeySet(ensName, operation) {
        if (!this.apiKeys[ensName]) {
            throw new Error(`Api key required for operation ${operation} and name ${ensName}. Configure api key for offchain client.`);
        }
    }
    getApiKey(ensName) {
        return this.apiKeys[ensName];
    }
    getAuthHeaders(ensName) {
        return {
            Authorization: `Bearer ${this.getApiKey(ensName)}`
        };
    }
}
exports.OffchainManagerClient = OffchainManagerClient;
function createOffchainManagerClient(config) {
    return new OffchainManagerClient(config);
}
