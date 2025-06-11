import {
  Address,
  encodeFunctionData,
  Hash,
  namehash,
  parseAbi,
  toHex,
} from "viem";
import { EnsRecords } from "./types";
import { getCoderByCoinType } from "@ensdomains/address-encoder";
import { chainMetadata } from "./constants/address-records";
//@ts-ignore
// The newest version of content-hash
// throws error Error [ERR_PACKAGE_PATH_NOT_EXPORTED]:
import { encode } from "@ensdomains/content-hash";

const ETH_COIN = 60;

const ResolverAbi = parseAbi([
  "function setText(bytes32 node, string key, string value) public",
  "function setAddr(bytes32 node, uint256 coin, bytes value) public",
  "function setContenthash(bytes32 node, bytes contenthash)",
]);

export const convertEnsRecordsToResolverData = (
  fullName: string,
  records: EnsRecords
): Hash[] => {
  let resolverData: Hash[] = [];
  const subnameNode = namehash(fullName);

  if (records.texts && records.texts.length > 0) {
    records.texts.forEach((text) => {
      resolverData.push(
        encodeFunctionData({
          abi: ResolverAbi,
          args: [subnameNode, text.key, text.value],
          functionName: "setText",
        })
      );
    });
  }

  if (records.addresses && records.addresses.length > 0) {
    for (const addr of records.addresses) {
      let addressCoin = 0;
      if (typeof addr.chain === "number") {
        addressCoin = addr.chain;
      } else {
        const supportedChain = chainMetadata[addr.chain];
        if (!supportedChain) {
          console.info(`Cannot find coin for chain: ${addr.chain}`);
          continue;
        } else {
          addressCoin = supportedChain.coin;
        }
      }

      if (addressCoin === ETH_COIN) {
        resolverData.push(
          encodeFunctionData({
            abi: ResolverAbi,
            args: [subnameNode, BigInt(ETH_COIN), addr.value as Address],
            functionName: "setAddr",
          })
        );
      } else {
        const addrEncoder = getCoderByCoinType(addressCoin);
        if (addrEncoder) {
          const decodedAddr = addrEncoder.decode(addr.value);
          const hexAddr = toHex(decodedAddr);
          resolverData.push(
            encodeFunctionData({
              abi: ResolverAbi,
              args: [subnameNode, BigInt(addressCoin), hexAddr],
              functionName: "setAddr",
            })
          );
        }
      }
    }
  }

  // There is currently an issue with content-hash library
  // [ERR_PACKAGE_PATH_NOT_EXPORTED]
  if (records.contenthash) {
    const encodedValue = encode(
      records.contenthash.type as any,
      records.contenthash.value
    );
    resolverData.push(
      encodeFunctionData({
        abi: ResolverAbi,
        args: [subnameNode, `0x${encodedValue}` as Hash],
        functionName: "setContenthash",
      })
    );
  }

  return resolverData;
};
