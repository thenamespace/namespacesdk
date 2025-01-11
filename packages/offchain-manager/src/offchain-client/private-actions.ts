import { AxiosInstance } from "axios";
import { SubnameDTO } from "../dto/create-subname-dto";
import { extractParentAndLabel } from "./utils";

export const _createSubname = (
  client: AxiosInstance,
  apiKey: string,
  createRequest: SubnameDTO
) => {
  return client.post("/v1/subname/mint", createRequest, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _deleteSubname = (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string
) => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client.delete(`/v1/subname/${label}/${parent}`, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _addTextRecord = (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  key: string,
  value: string
) => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client.put(`/v1/subname/record/${label}/${parent}/${key}/${value}`, {}, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _deleteTextRecord = (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  key: string,
) => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client.delete(`/v1/subname/record/${label}/${parent}/${key}`, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _addDataRecords = (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  dataRecords: Record<string, string>
) => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client.put(`/v1/subname/data/${label}/${parent}`, dataRecords, {
    headers: createAuthorizationHeaders(apiKey),
  });
};

export const _deleteDataRecord = (
  client: AxiosInstance,
  apiKey: string,
  fullSubname: string,
  key: string
) => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client.put(`/v1/subname/record/${label}/${parent}/${key}`, {
    headers: createAuthorizationHeaders(apiKey),
  });
};


const createAuthorizationHeaders = (apiKey: string) => {
  return {
    Authorization: `Bearer ${apiKey}a`,
  };
};
