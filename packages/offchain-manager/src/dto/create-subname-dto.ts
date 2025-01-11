export interface SubnameDTO {
  label: string;
  domain: string;
  address: `0x${string}`;
  coinType?: number;
  addresses?: Record<string, string>;
  textRecords?: Record<string, string>;
  dataRecords?: Record<string, string>;
  ttl?: number;
}
