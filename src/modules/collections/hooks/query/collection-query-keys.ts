import type { CollectionSearchParams } from "@/modules/collections/types/collection";

/**
 * Query Key Factory for Collections
 *
 * Centralized query key management for collection-related queries.
 * Ensures consistency between queries and mutations.
 */

export const collectionQueryKeys = {
  /**
   * Base key for all collection search queries
   * Used by mutations to match all search queries
   */
  searchBase: () => ["collections", "search"] as const,

  /**
   * Full key for collection search queries with params
   * Used by useCollectionsQuery
   */
  search: (searchParams?: CollectionSearchParams) =>
    ["collections", "search", searchParams] as const,
};
