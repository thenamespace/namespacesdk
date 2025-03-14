import { AxiosInstance } from "axios";
import {
  GetAvailableResponse,
  GetRecordResponse,
  PagedResponse,
  QuerySubnamesRequest,
} from "./types";
import { SubnameDTO } from "../dto/subname.dto";

export const _isSubnameAvailable = async (
  client: AxiosInstance,
  fullSubname: string
): Promise<GetAvailableResponse> => {
  const subname = await client.get(`/api/v1/subnames/${fullSubname}`);
  if (subname) {
    return { isAvailable: false };
  }
  return { isAvailable: true };
};

export const _getTextRecords = async (
  client: AxiosInstance,
  fullSubname: string
): Promise<Record<string, string>> => {
  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);
  return subname.texts;
};

export const _getTextRecord = async (
  client: AxiosInstance,
  fullSubname: string,
  key: string
): Promise<GetRecordResponse> => {
  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);
  return { record: subname.texts[key] };
};

export const _getDataRecords = async (
  client: AxiosInstance,
  fullSubname: string
): Promise<Record<string, string>> => {
  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);
  return subname.metadata;
};

export const _getDataRecord = async (
  client: AxiosInstance,
  fullSubname: string,
  key: string
): Promise<GetRecordResponse> => {
  const subname = await client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);
  return { record: subname.metadata[key] };
};

export const _getSingleSubname = (
  client: AxiosInstance,
  fullSubname: string
): Promise<SubnameDTO> => {
  return client
    .get<SubnameDTO>(`/api/v1/subnames/${fullSubname}`)
    .then((res) => res.data);
};

export const _getFilteredSubnames = async (
  client: AxiosInstance,
  query: QuerySubnamesRequest
): Promise<PagedResponse<SubnameDTO[]>> => {
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

  if (query.labelSearch) {
    searchQuery.labelSearch = query.labelSearch;
  }

  if (query.metadata) {
    searchQuery.metadata = JSON.stringify(query.metadata);
  }

  return client
    .post<PagedResponse<SubnameDTO[]>>(`/api/v1/subnames/search`, {
      params: searchQuery,
    })
    .then((res) => res.data);
};
