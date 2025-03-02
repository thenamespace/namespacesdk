export interface CreateApiKeyRequest {
  ensName: string;
  validUntil?: number;
  keyName: string;
}
