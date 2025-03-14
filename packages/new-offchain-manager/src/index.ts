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

const testFn = async () => {

  const client = createOffchainClient({
    mode: "mainnet"
  })

  const apiKey = "ns-a463e5cf-dc46-4cb8-aa35-800c0d3e685d"
  const name = "basedsubs.eth";

  client.setApiKey(name, apiKey);

  const resp = await client.createSubname({
    label: "testing12312312321",
    parentName: name,
  })

  const created = await client.isSubnameAvailable(`testing.${name}`)

  const subnames = await client.getFilteredSubnames({
    parentName: name,
  })

  console.log(created, "CREATED")
  console.log(subnames)
}

testFn();