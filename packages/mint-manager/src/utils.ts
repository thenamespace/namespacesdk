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

const ETH_COIN = 60;

const ResolverAbi = parseAbi([
  "function setText(bytes32 node, string key, string value) public",
  "function setAddr(bytes32 node, uint256 coin, bytes value) public",
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
    records.addresses.forEach((addr) => {
      if (addr.coin === ETH_COIN) {
        resolverData.push(
          encodeFunctionData({
            abi: ResolverAbi,
            args: [subnameNode, BigInt(ETH_COIN), addr.value as Address],
            functionName: "setAddr",
          })
        );
      } else {
        const addrEncoder = getCoderByCoinType(addr.coin);
        if (addrEncoder) {
          const decodedAddr = addrEncoder.decode(addr.value);
          const hexAddr = toHex(decodedAddr);
          resolverData.push(
            encodeFunctionData({
              abi: ResolverAbi,
              args: [subnameNode, BigInt(addr.coin), hexAddr],
              functionName: "setAddr",
            })
          );
        }
      }
    });
  }

  return resolverData;
};
