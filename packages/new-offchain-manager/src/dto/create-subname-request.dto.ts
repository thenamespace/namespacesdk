export interface CreateSubnameRequest {
  parentName: string;
  label: string;
  texts?: KeyValueRequest[];
  addresses?: AddressRecordRequest[];
  metadata?: KeyValueRequest[];
  contenthash?: string;
  ownership?: string;
  ttl?: number;
}

export interface KeyValueRequest {
  key: string;
  value: string;
}

export interface AddressRecordRequest {
  coin: string;
  value: string;
}
