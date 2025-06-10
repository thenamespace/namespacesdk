import { ChainName } from "./constants/address-records";
import { ContenthashType } from "./constants/contenthash-record";
import { createMintClient } from "./mint-client";

export { createMintClient, MintClient, MintClientConfig } from "./mint-client";
export {
  MintDetailsRequest,
  MintDetailsResponse,
  MintTransactionResponse,
  MintTransactionRequest,
  EnsRecords,
  EnsAddressRecord,
  ContenthashRecord,
  EnsTextRecord,
} from "./types";
export { ChainName } from "./constants/address-records";
export { ContenthashType } from "./constants/contenthash-record";

const ENS_NAME = "artionbase.eth";

const test = async () => {
  const client = createMintClient({
    mintSource: "test"
  })

  const ETH_ADDRESS = "0x1D84ad46F1ec91b4Bb3208F645aD2fA7aBEc19f8";
  const BTC_ADDR = "17Yu7SPG8P78rLtvubLryknrQ9dKfyYsjY";
  const SOLANA_ADDR = "6KBGUwXtAhLoJeL3dH5xswRAdQWfA2U9FfEyr41g1UzL"
  const mintTx = await client.getMintTransactionParameters({
    label: "testing1",
    minterAddress: "0x1D84ad46F1ec91b4Bb3208F645aD2fA7aBEc19f8",
    parentName: ENS_NAME,
    expiryInYears: 1,
    owner: "0x1D84ad46F1ec91b4Bb3208F645aD2fA7aBEc19f8",
    records: {
      addresses: [
        {
          chain: ChainName.Ethereum,
          value: ETH_ADDRESS
        },
        {
          chain: ChainName.Base,
          value: ETH_ADDRESS
        },
        {
          chain: ChainName.Arbitrum,
          value: ETH_ADDRESS
        },
        {
          chain: ChainName.Bitcoin,
          value: BTC_ADDR
        },
        {
          chain: ChainName.Solana,
          value: SOLANA_ADDR
        },
        {
          chain: ChainName.Polygon,
          value: ETH_ADDRESS
        },
        {
          chain: ChainName.Avalanche,
          value: ETH_ADDRESS
        },
        {
          chain: ChainName.Bsc,
          value: ETH_ADDRESS,
        },
        {
          chain: ChainName.Linea,
          value: ETH_ADDRESS
        },
        {
          chain: ChainName.Gnosis,
          value: ETH_ADDRESS
        }
      ],
      contenthash: {
        type: ContenthashType.Ipfs,
        value: "ipfs://asdfasdfad"
      }
    }
  })
  console.log(mintTx.args)
}

test()