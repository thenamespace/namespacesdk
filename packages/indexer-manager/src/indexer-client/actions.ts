import { AxiosInstance } from "axios";
import {
  GetL2SubnamesQuery,
  L2Network,
  L2SubnameStats,
  L2SubnameResponse,
  L1Network,
  GetL1SubnamesQuery,
} from "./types";

export const _getL2Subnames = async (
  client: AxiosInstance,
  query: GetL2SubnamesQuery
): Promise<any> => {
  return client
    .get("/api/v1/subnames", { params: query })
    .then((res: { data: any }) => res.data);
};

export const _getL2Subname = async (
  client: AxiosInstance,
  network: L2Network,
  namehash: string
): Promise<L2SubnameResponse> => {
  return client
    .get(`/api/v1/subnames/network/${network}/namehash/${namehash}`)
    .then((res: { data: any }) => res.data);
};

export const _getL2Stats = async (
  client: AxiosInstance,
  includeTestnet: boolean
): Promise<L2SubnameStats> => {
  return client
    .get("/api/v1/subnames/stats", { params: { includeTestnet } })
    .then((res: { data: any }) => res.data);
};

export const _getL1Subnames = async (
  client: AxiosInstance,
  query: GetL1SubnamesQuery
): Promise<any> => {
  return client
    .get("/api/v1/subnamesMinted", { params: query })
    .then((res: { data: any }) => res.data);
};

export const _getL1Subname = async (
  client: AxiosInstance,
  network: L1Network,
  subnameLabel: string
): Promise<any> => {
  return client
    .get(
      `/api/v1/subnamesMinted/network/${network}/subnameLabel/${subnameLabel}`
    )
    .then((res: { data: any }) => res.data);
};
