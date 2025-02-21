import { SubnameDTO } from "../dto/create-subname-dto";

export interface GetAvailableResponse {
  isAvailable: boolean;
}

export interface GetRecordResponse {
  record: string;
}

export interface FilterSubnamesQuery {
  parentName?: string;
  searchLabel?: string;
  page?: number;
  size?: number;
  dataRecords?: Record<string, string>;
  textRecords?: Record<string, string>;
}

export interface SubnamePagedResponse {
  items: SubnameDTO;
  totalItems: number;
}
