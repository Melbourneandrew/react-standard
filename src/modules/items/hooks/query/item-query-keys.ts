import type { ItemSearchParams } from "../../types/item";

/**
 * Query Key Factory for Items
 *
 * Centralized query key management for item-related queries.
 * Ensures consistency between queries and mutations.
 */

export const itemQueryKeys = {
  /**
   * Base key for all item search queries
   * Used by mutations to match all search queries for a collection
   */
  searchBase: (collectionId: string | null | undefined) =>
    ["items", "search", collectionId] as const,

  /**
   * Full key for item search queries with params
   * Used by useItemsQuery
   */
  search: (
    collectionId: string | null | undefined,
    searchParams?: ItemSearchParams,
  ) => ["items", "search", collectionId, searchParams] as const,
};
