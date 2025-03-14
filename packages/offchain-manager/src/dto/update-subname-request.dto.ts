import { AddressRecord, TextRecord } from "./internal-types";

export interface UpdateSubnameRequest {
  texts?: TextRecord[];
  addresses?: AddressRecord[];
  metadata?: TextRecord[];
  contenthash?: string;
  ttl?: number;
}
