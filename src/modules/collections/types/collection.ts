/**
 * Collection Type Definitions
 * Represents collection data models
 */

export interface Collection {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionSearchParams {
  query?: string;
  sort_by?: "name" | "created_at";
  sort_order?: "asc" | "desc";
}

export interface CollectionSearchResponse {
  collections: Collection[];
  total_count: number;
}
