import { AxiosInstance } from "axios";
import { extractParentAndLabel } from "./utils";
import { GetAvailableResponse, GetRecordResponse } from "./types";

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
