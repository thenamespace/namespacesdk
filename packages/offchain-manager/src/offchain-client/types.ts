/**
 * Response from checking if a subname is available for registration.
 */
export interface GetAvailableResponse {
  /** Whether the subname is available for registration */
  isAvailable: boolean;
}

/**
 * Response containing a single record value.
 */
export interface GetRecordResponse {
  /** The record value eg. thenamespaceninja for com.github */
  record: string;
}

/**
 * Query parameters for filtering subnames (legacy interface).
 * @deprecated Use QuerySubnamesRequest instead
 */
export interface FilterSubnamesQuery {
  /** Parent ENS domain to filter by */
  parentName?: string;
  /** Search term for subname labels */
  searchLabel?: string;
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  size?: number;
  /** Filter by data/metadata records */
  dataRecords?: Record<string, string>;
  /** Filter by text records */
  textRecords?: Record<string, string>;
}

/**
 * Generic paginated response wrapper.
 * 
 * @template T - The type of items in the response
 */
export interface PagedResponse<T> {
  /** Total number of items across all pages */
  totalItems: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  size: number;
  /** Array of items for the current page */
  items: T;
}

/**
 * Query parameters for searching and filtering subnames.
 * 
 * @example
 * ```typescript
 * const query: QuerySubnamesRequest = {
 *   parentName: 'example.eth',
 *   labelSearch: 'alice',
 *   page: 1,
 *   size: 50
 * };
 * ```
 */
export interface QuerySubnamesRequest {
  /** Parent ENS domain to filter by */
  parentName?: string;
  /** Search term for subname labels */
  labelSearch?: string;
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page (max 100) */
  size?: number;
  /** Filter by metadata records */
  metadata?: Record<string, string>;
  /** Array of parent names to filter by */
  parentNames?: string[];
  /** Filter by owner address */
  owner?: string;
}
