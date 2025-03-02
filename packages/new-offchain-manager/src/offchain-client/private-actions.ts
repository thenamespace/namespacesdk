import { AxiosInstance } from "axios";
import { SubnameDTO } from "../dto/create-subname-dto";
import { extractParentAndLabel } from "./utils";
import { CreateSubnameRequest } from "../dto/create-subname-request.dto";

export const _createSubname = (
  client: AxiosInstance,
  apiKey: string,
  createRequest: CreateSubnameRequest
) => {
  return client.post("/api/v1/subnames", createRequest, {
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
  const { label, parent } = extractParentAndLabel(fullSubname);

  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);

  const updatedTexts = Object.entries({ ...subname.texts, [key]: value }).map(
    ([textKey, textValue]) => ({ key: textKey, value: textValue })
  );

  const request: CreateSubnameRequest = {
    label,
    parentName: parent,
    texts: updatedTexts,
    addresses: Object.entries(subname.addresses).map(([coin, value]) => ({
      coin,
      value,
    })),
    metadata: Object.entries(subname.metadata).map(([key, value]) => ({
      key,
      value,
    })),
    contenthash: subname.contenthash,
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
  const { label, parent } = extractParentAndLabel(fullSubname);

  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);

  const updatedTexts = Object.entries(subname.texts)
    .filter(([textKey]) => textKey !== key)
    .map(([textKey, textValue]) => ({ key: textKey, value: textValue }));

  const request: CreateSubnameRequest = {
    label,
    parentName: parent,
    texts: updatedTexts,
    addresses: Object.entries(subname.addresses).map(([coin, value]) => ({
      coin,
      value,
    })),
    metadata: Object.entries(subname.metadata).map(([key, value]) => ({
      key,
      value,
    })),
    contenthash: subname.contenthash,
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
  const { label, parent } = extractParentAndLabel(fullSubname);

  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);

  const updatedData = Object.entries({ ...subname.metadata, [key]: value }).map(
    ([dataKey, dataValue]) => ({ key: dataKey, value: dataValue })
  );

  const request: CreateSubnameRequest = {
    label,
    parentName: parent,
    texts: Object.entries(subname.texts).map(([key, value]) => ({
      key,
      value,
    })),
    addresses: Object.entries(subname.addresses).map(([coin, value]) => ({
      coin,
      value,
    })),
    metadata: updatedData,
    contenthash: subname.contenthash,
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
  const { label, parent } = extractParentAndLabel(fullSubname);

  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);

  const updatedData = Object.entries(subname.metadata)
    .filter(([dataKey]) => dataKey !== key)
    .map(([dataKey, dataValue]) => ({ key: dataKey, value: dataValue }));

  const request: CreateSubnameRequest = {
    label,
    parentName: parent,
    texts: Object.entries(subname.texts).map(([key, value]) => ({
      key,
      value,
    })),
    addresses: Object.entries(subname.addresses).map(([coin, value]) => ({
      coin,
      value,
    })),
    metadata: updatedData,
    contenthash: subname.contenthash,
  };

  return client.post(`/api/v1/subnames`, request, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

const createAuthorizationHeaders = (apiKey: string) => {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
};
