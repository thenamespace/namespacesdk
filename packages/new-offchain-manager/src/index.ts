import { ChainName, CreateSubnameRequest } from "./dto";
import { createOffchainClient } from "./offchain-client";

export {
  createOffchainClient,
  OffchainClient,
  OffchainClientConfig,
} from "./offchain-client";

export {
  GetAvailableResponse,
  GetRecordResponse,
  FilterSubnamesQuery,
  PagedResponse,
  QuerySubnamesRequest,
} from "./offchain-client/types";

export {
  SubnameDTO,
  CreateSubnameRequest,
  UpdateSubnameRequest,
  ChainName,
} from "./dto";
export { AddressRecord, TextRecord } from "./dto/internal-types";