/**
 * Item Type Definitions
 * Represents data models (like DTOs in backend)
 */

export interface Item {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  collection_id: string;
}

export interface ItemSearchParams {
  id?: string;
  query?: string;
  page?: number;
  page_size?: number;
  sort_by?: "name" | "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
}

export interface ItemSearchResponse {
  items: Item[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}
