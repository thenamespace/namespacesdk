import { AddressRecord, TextRecord } from "./internal-types";

export interface CreateSubnameRequest {
  parentName: string;
  label: string;
  texts?: TextRecord[];
  addresses?: AddressRecord[];
  metadata?: TextRecord[];
  contenthash?: string;
  ttl?: number;
}
