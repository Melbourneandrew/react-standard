/**
 * Collections Query Hook
 *
 * Layer: Query Layer (wraps useQuery)
 * Naming: use[Domain]sQuery (plural) because it fetches multiple collections
 * Convention: Declarative - refetches automatically when params change
 *
 * This is a simple wrapper around the search API - manager hooks decide
 * what params to pass and how to transform the response.
 */

import { useQuery } from "@tanstack/react-query";
import { useCollectionsApi } from "../api/useCollectionsApi";
import { useDefaultQueryErrorHandler } from "@/lib/hooks/useDefaultQueryErrorHandler";
import { useQueryErrorEffect } from "@/lib/hooks/useQueryErrorEffect";
import type {
  CollectionSearchParams,
  CollectionSearchResponse,
} from "@/modules/collections/types/collection";

/**
 * Return type for useCollectionsQuery
 *
 * Options for type safety:
 * 1. Simple approach (current): Allow data to be undefined, consumer checks
 * 2. Discriminated union: Different return shapes based on state
 * 3. Guard clauses: Early returns that narrow types explicitly
 *
 * We use approach #1 (simple) - it's most compatible with React Query's API
 * and consumers typically check loading/error states anyway.
 */
type UseCollectionsQueryReturn = {
  // Data (undefined until first successful fetch)
  data: CollectionSearchResponse | undefined;

  // Loading states (domain-specific naming)
  isLoadingCollections: boolean; // First fetch only, no cached data
  isFetchingCollections: boolean; // Any fetch, including background refetches

  // Error state (domain-specific naming)
  collectionsError: Error | null;

  // Actions
  refetchCollections: () => void;
};

export function useCollectionsQuery(
  searchParams: CollectionSearchParams = {},
  options?: { enabled?: boolean; errorHandler?: (error: Error | null) => void }
): UseCollectionsQueryReturn {
  const { searchCollectionsApi } = useCollectionsApi();
  const { defaultQueryErrorHandler } = useDefaultQueryErrorHandler(
    "Collections Query Error"
  );

  // Declarative query: Runs automatically when params change
  const { data, isLoading, isFetching, error, refetch } =
    useQuery<CollectionSearchResponse>({
      queryKey: ["collections", "search", searchParams],
      queryFn: () => searchCollectionsApi({ queryParams: searchParams }),
      enabled: options?.enabled !== false, // Default to true, but allow disabling
    });

  // Handle errors using the provided handler or default
  useQueryErrorEffect(error, options?.errorHandler, defaultQueryErrorHandler);

  return {
    // Data
    data,

    // Loading states (domain-specific naming)
    isLoadingCollections: isLoading,
    isFetchingCollections: isFetching,

    // Error state (domain-specific naming)
    collectionsError: error,

    // Actions
    refetchCollections: refetch,
  };
}
