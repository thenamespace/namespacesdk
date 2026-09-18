import {
  Address,
  encodeFunctionData,
  Hash,
  namehash,
  parseAbi,
  toHex,
} from "viem";
import { EnsRecords } from "./types";
import { createError, reasonFrom } from "./errors";
import { assertAddress } from "./validation";
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

/**
 * Converts ENS records to encoded resolver calldata suitable for batched mint.
 * Applies texts, addresses (multi-coin), and optional contenthash.
 */
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
        // hasOwnProperty, not truthiness: a bare `chainMetadata[key]` lookup
        // reaches inherited members, so "constructor" would pass the guard and
        // yield an undefined coin type.
        const supportedChain = Object.prototype.hasOwnProperty.call(
          chainMetadata,
          addr.chain
        )
          ? chainMetadata[addr.chain]
          : undefined;
        if (!supportedChain) {
          // Previously this logged and skipped, so a typo in a chain name meant
          // the user paid to mint and silently got no address record.
          throw createError.unsupportedChain(
            addr.chain,
            Object.keys(chainMetadata)
          );
        }
        addressCoin = supportedChain.coin;
      }

      if (addressCoin === ETH_COIN) {
        resolverData.push(
          encodeFunctionData({
            abi: ResolverAbi,
            args: [
              subnameNode,
              BigInt(ETH_COIN),
              assertAddress(addr.value, `addresses[${addr.chain}]`),
            ],
            functionName: "setAddr",
          })
        );
      } else {
        const addrEncoder = getCoderByCoinType(addressCoin);
        if (!addrEncoder) {
          throw createError.unsupportedChain(addr.chain);
        }
        {
          let decodedAddr: Uint8Array;
          try {
            decodedAddr = addrEncoder.decode(addr.value);
          } catch (err) {
            throw createError.invalidAddress(addr.value, `addresses[${addr.chain}]`);
          }
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
    let encodedValue: string;
    try {
      encodedValue = encode(
        records.contenthash.type as any,
        records.contenthash.value
      );
    } catch (err) {
      // The codec table rejects unknown identifiers and malformed values with
      // a bare library error that names neither the field nor the record.
      throw createError.invalidName(
        records.contenthash.value,
        `could not be encoded as a "${records.contenthash.type}" contenthash: ${reasonFrom(err)}`,
        err
      );
    }
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
