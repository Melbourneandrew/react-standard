import { useQuery } from "@tanstack/react-query";
import { useItemsApi } from "@/modules/items/hooks/api/useItemsApi";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";
import { useDefaultQueryErrorHandler } from "@/lib/hooks/useDefaultQueryErrorHandler";
import { useQueryErrorEffect } from "@/lib/hooks/useQueryErrorEffect";
import type {
  ItemSearchParams,
  ItemSearchResponse,
} from "@/modules/items/types/item";

/**
 * Query Hook - Fetch items from search endpoint
 *
 * Layer: Query Layer (wraps useQuery)
 * Naming: use[Domain]sQuery (plural) because it uses the search endpoint
 * Convention: Declarative - refetches automatically when params change
 *
 * This is a simple wrapper around the search API - manager hooks decide
 * what params to pass and how to transform the response.
 *
 * Collection ID is obtained from CollectionContext - query only runs when
 * a collection is selected (currentCollectionId is defined).
 */

/**
 * Return type for useItemsQuery
 *
 * Note: Values that come directly from the server are in snake_case (e.g., total_count, page_size).
 * This is consistent across all API response types.
 */
type UseItemsQueryReturn = {
  // Data (undefined until first successful fetch)
  // Response uses snake_case to match Python backend conventions
  itemSearchResponse: ItemSearchResponse | undefined;

  // Loading states (domain-specific naming)
  isLoadingItems: boolean; // First fetch only, no cached data
  isFetchingItems: boolean; // Any fetch, including background refetches

  // Error state (domain-specific naming)
  itemsError: Error | null;

  // Actions
  refetchItems: () => void;
};

export function useItemsQuery(
  searchParams: ItemSearchParams = {},
  errorHandler?: (error: Error | null) => void
): UseItemsQueryReturn {
  const { currentCollectionId } = useCollectionContext();
  const { searchItemsApi } = useItemsApi();
  const { defaultQueryErrorHandler } =
    useDefaultQueryErrorHandler("Items Query Error");

  // Declarative query: Runs automatically when params change
  const { data, isLoading, isFetching, error, refetch } =
    useQuery<ItemSearchResponse>({
      queryKey: ["items", "search", currentCollectionId, searchParams],
      queryFn: () => {
        if (!currentCollectionId) {
          throw new Error("Collection ID is required");
        }
        return searchItemsApi({
          routeParams: { collectionId: currentCollectionId },
          queryParams: searchParams,
        });
      },
      enabled: !!currentCollectionId, // Only run if collectionId is provided
    });

  // Handle errors using the provided handler or default
  useQueryErrorEffect(error, errorHandler, defaultQueryErrorHandler);

  return {
    // Data (response uses snake_case to match Python backend)
    itemSearchResponse: data,

    // Loading states (domain-specific naming)
    isLoadingItems: isLoading,
    isFetchingItems: isFetching,

    // Error state (domain-specific naming)
    itemsError: error,

    // Actions
    refetchItems: refetch,
  };
}
