import { getCoinType, SubnameDTO } from "../dto";
import {
  AddressRecord,
  AddressRecord_Internal,
  CreateSubnameRequest_Internal,
  TextRecord,
} from "../dto/internal-types";


export const mapAddressesToInternal = (
  addrs: AddressRecord[]
): AddressRecord_Internal[] => {
  const _addr: AddressRecord_Internal[] = addrs.map((addr) => {
    const _internalAddr: AddressRecord_Internal = {
      coin: getCoinType(addr.chain),
      value: addr.value,
    };
    return _internalAddr;
  });
  return _addr;
};

export const mapTextMapToTextRecords = (
  txtMap: Record<string, string>
): TextRecord[] => {
  return Object.keys(txtMap).map((txtKey) => {
    return {
      key: txtKey,
      value: txtMap[txtKey],
    };
  });
};

export const mapAddrMapToAddressRecords = (
  addrMap: Record<string, string>
): AddressRecord_Internal[] => {
  return Object.keys(addrMap).map((addrKey) => {
    return {
      coin: parseInt(addrKey),
      value: addrMap[addrKey],
    };
  });
};

export const subnameResponseToRequest = (
  response: SubnameDTO
): CreateSubnameRequest_Internal => {
  const addrs: AddressRecord_Internal[] = [];
  const texts: TextRecord[] = [];

  if (response.addresses) {
    Object.keys(response.addresses).forEach((addrCoin) => {
      try {
        const coin = parseInt(addrCoin);
        const value = response.addresses[addrCoin];
        addrs.push({ coin: coin, value: value });
      } catch (err) {}
    });
  }

  if (response.texts) {
    Object.keys(response.texts).forEach((txt) => {
      texts.push({
        key: txt,
        value: response.texts[txt],
      });
    });
  }

  return {
    label: response.label,
    parentName: response.parentName,
    addresses: addrs,
    texts: texts,
    contenthash: response.contenthash,
    metadata: Object.keys(response.metadata || {}).map((data) => {
      return {
        key: data,
        value: response.metadata[data],
      };
    }),
    ttl: response.ttl,
  };
};
