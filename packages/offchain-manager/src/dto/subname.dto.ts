export interface SubnameDTO {
  id: string;
  fullName: string;
  parentName: string;
  label: string;
  texts: Record<string, string>;
  addresses: Record<string, string>;
  metadata: Record<string, string>;
  contenthash?: string;
  namehash: string;
  owner?: string
  ttl?: number
  createdAt?: string
  updatedAt?: string
}