import { AxiosInstance } from "axios";
import { SubnameDTO } from "../dto/subname.dto";
import {
  mapAddressesToInternal,
  mapAddrMapToAddressRecords,
  mapTextMapToTextRecords,
  subnameResponseToRequest,
} from "./utils";
import { CreateSubnameRequest } from "../dto/create-subname-request.dto";
import { CreateSubnameRequest_Internal } from "../dto/internal-types";
import { _getSingleSubname } from "./public-actions";
import { UpdateSubnameRequest } from "../dto";

const AUTH_HEADER = "x-auth-token";

export const _createSubname = (
  client: AxiosInstance,
  apiKey: string,
  createRequest: CreateSubnameRequest
) => {
  const request: CreateSubnameRequest_Internal = {
    label: createRequest.label,
    parentName: createRequest.parentName,
    addresses: mapAddressesToInternal(createRequest.addresses || []),
    contenthash: createRequest.contenthash,
    metadata: createRequest.metadata,
    texts: createRequest.texts,
    ttl: createRequest.ttl,
  };

  return client.post("/api/v1/subnames", request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _updateSubname = async (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  updateRequest: UpdateSubnameRequest
) => {
  const subname = await _getSingleSubname(client, fullSubname);

  const request: CreateSubnameRequest_Internal = {
    label: subname.label,
    parentName: subname.parentName,
    addresses: mapAddressesToInternal(updateRequest.addresses || []),
    contenthash: updateRequest.contenthash,
    metadata: updateRequest.metadata,
    texts: updateRequest.texts,
    ttl: updateRequest.ttl,
  };

  return client.post("/api/v1/subnames", request, {
    headers: createAuthorizationHeaders(apiKey),
  }).then(res => res.data);
};

export const _addAddressRecord = async (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  coin: number,
  value: string
) => {
  const subname = await _getSingleSubname(client, fullSubname);

  const addresses = subname.addresses || {};
  addresses[coin] = value;

  const _req = subnameResponseToRequest(subname);

  const request: CreateSubnameRequest_Internal = {
    ..._req,
    addresses: mapAddrMapToAddressRecords(addresses),
  };

  return client.post(`/api/v1/subnames`, request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _deleteAddressRecord = async (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  coin: number,
) => {
  const subname = await _getSingleSubname(client, fullSubname);

  const addresses = subname.addresses || {};
  delete addresses[coin]

  const _req = subnameResponseToRequest(subname);

  const request: CreateSubnameRequest_Internal = {
    ..._req,
    addresses: mapAddrMapToAddressRecords(addresses),
  };

  return client.post(`/api/v1/subnames`, request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _deleteSubname = (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string
) => {
  return client.delete(`/api/v1/subnames/${fullSubname}`, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _addTextRecord = async (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  key: string,
  value: string
) => {
  const subname = await _getSingleSubname(client, fullSubname);
  const _req = subnameResponseToRequest(subname);

  const texts = subname.texts || {};
  texts[key] = value;

  const request: CreateSubnameRequest_Internal = {
    ..._req,
    texts: mapTextMapToTextRecords(texts),
  };

  return client.post(`/api/v1/subnames`, request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _deleteTextRecord = async (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  key: string
) => {
  const subname = await _getSingleSubname(client, fullSubname);
  const texts = subname.texts || {};
  delete texts[key];

  const _req = subnameResponseToRequest(subname);
  const request: CreateSubnameRequest_Internal = {
    ..._req,
    texts: mapTextMapToTextRecords(texts),
  };

  return client.post(`/api/v1/subnames`, request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _addDataRecord = async (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  key: string,
  value: string
) => {
  const subname = await _getSingleSubname(client, fullSubname);

  const metadata = subname.metadata || {};
  metadata[key] = value;
  const _req = subnameResponseToRequest(subname);
  const request: CreateSubnameRequest_Internal = {
    ..._req,
    metadata: mapTextMapToTextRecords(metadata),
  };

  return client.post(`/api/v1/subnames`, request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _deleteDataRecord = async (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  key: string
) => {
  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);

  const updatedData = Object.entries(subname.metadata)
    .filter(([dataKey]) => dataKey !== key)
    .map(([dataKey, dataValue]) => ({ key: dataKey, value: dataValue }));

  const _req = subnameResponseToRequest(subname);
  const request: CreateSubnameRequest_Internal = {
    ..._req,
    metadata: updatedData,
  };

  return client.post(`/api/v1/subnames`, request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

const createAuthorizationHeaders = (apiKey: string) => {
  return {
    [AUTH_HEADER]: `${apiKey}`,
  };
};
