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

export interface PagedResponse<T> {
  totalItems: number;
  page: number;
  size: number;
  items: T;
}

export interface QuerySubnamesRequest {
  parentName: string;
  labelSearch?: string;
  page?: number;
  size?: number;
  metadata?: Record<string, string>;
}
