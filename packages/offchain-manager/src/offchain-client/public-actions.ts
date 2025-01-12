import { AxiosInstance } from "axios";
import { extractParentAndLabel } from "./utils";
import {
  FilterSubnamesQuery,
  GetAvailableResponse,
  GetRecordResponse,
  SubnamePagedResponse,
} from "./types";
import { SubnameDTO } from "../dto/create-subname-dto";

export const _isSubnameAvailable = async (
  client: AxiosInstance,
  fullSubname: string
): Promise<GetAvailableResponse> => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client
    .get<GetAvailableResponse>(`/v1/subname/availability/${label}/${parent}`)
    .then((res) => res.data);
};

export const _getTextRecords = async (
  client: AxiosInstance,
  fullSubname: string
): Promise<Record<string, string>> => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client
    .get<Record<string, string>>(`/v1/subname/record/${label}/${parent}`)
    .then((res) => res.data);
};

export const _getTextRecord = async (
  client: AxiosInstance,
  fullSubname: string,
  key: string
): Promise<GetRecordResponse> => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client
    .get<GetRecordResponse>(`/v1/subname/record/${label}/${parent}/${key}`)
    .then((res) => res.data);
};


export const _getDataRecord = async (
  client: AxiosInstance,
  fullSubname: string,
  key: string
): Promise<GetRecordResponse> => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client
    .get<GetRecordResponse>(`/v1/subname/data/${label}/${parent}/${key}`)
    .then((res) => res.data);
};

export const _getDataRecords = async (
  client: AxiosInstance,
  fullSubname: string
): Promise<Record<string, string>> => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client
    .get<Record<string, string>>(`/v1/subname/data/${label}/${parent}`)
    .then((res) => res.data);
};

export const _getSingleSubname = (
  client: AxiosInstance,
  fullSubname: string
): Promise<SubnameDTO> => {
  const { label, parent } = extractParentAndLabel(fullSubname);
  return client
    .get<SubnameDTO>(`/v1/subname/${label}/${parent}`)
    .then((res) => res.data);
};

export const _resolveSubnamesByAddress = async (
  client: AxiosInstance,
  address: string,
  coinType: number
) => {
  return client
    .get<SubnameDTO[]>(`/v1/subname/resolution/${address}/${coinType}`)
    .then((res) => res.data);
};

export const _getFilteredSubnames = async (
  client: AxiosInstance,
  query: FilterSubnamesQuery
): Promise<SubnamePagedResponse> => {
  const searchQuery: Record<string, string | number> = {};
  if (query.parentName) {
    searchQuery.domain = query.parentName;
  }

  if (query.page) {
    searchQuery.currentPage = query.page;
  }

  if (query.size) {
    searchQuery.pageSize = query.size;
  }

  if (query.dataRecords) {
    searchQuery.dataRecords = JSON.stringify(query.dataRecords);
  }

  if (query.searchLabel) {
    searchQuery.searchLabel = query.searchLabel;
  }

  if (query.textRecords) {
    searchQuery.textRecords = JSON.stringify(query.textRecords);
  }

  return client
    .get<SubnamePagedResponse>(`/v1/subname/search`, {
      params: query,
    })
    .then((res) => res.data);
};
