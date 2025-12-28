import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useItemsQuery } from "@/modules/items/hooks/query/useItemsQuery";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";
import type { ItemSearchParams } from "../types/item";

/**
 * Manager Hook - Search and paginate items with URL state
 *
 * Layer: Manager Layer (wraps Query Layer + URL state management)
 * Naming: use[Domain]Search for collection search/filter management
 * Convention: Declarative - refetches automatically when URL params change
 *
 * All search and pagination state is stored in URL search params.
 * Collection ID comes from route params via CollectionContext.
 * This provides:
 * - Shareable URLs
 * - Browser back/forward navigation
 * - Bookmark-able search results
 */
export function useItemSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentCollectionId } = useCollectionContext();

  // Parse search params from URL (collection_id comes from route, not URL params)
  const urlParams: ItemSearchParams = {
    query: searchParams.get("query") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    page_size: parseInt(searchParams.get("page_size") || "5", 10),
    sort_by: (searchParams.get("sort_by") as any) || "created_at",
    sort_order: (searchParams.get("sort_order") as any) || "desc",
  };

  // Query with URL-based search params (collection ID comes from context)
  const {
    itemSearchResponse,
    isLoadingItems,
    isFetchingItems,
    itemsError,
    refetchItems,
  } = useItemsQuery(urlParams);

  // Derive state from response (using snake_case properties from Python backend)
  const items = itemSearchResponse?.items || [];
  const totalCount = itemSearchResponse?.total_count || 0;
  const currentPage = itemSearchResponse?.page || 1;
  const pageSize = itemSearchResponse?.page_size || 5;
  const totalPages = itemSearchResponse?.total_pages || 0;
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const isEmpty = totalCount === 0;

  // Helper to update URL params
  const updateUrlParams = useCallback(
    (updates: Partial<ItemSearchParams>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      // Navigate with updated params
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  // Action: Update search query
  const setQuery = useCallback(
    (query: string) => {
      updateUrlParams({ query, page: 1 }); // Reset to page 1 on new search
    },
    [updateUrlParams],
  );

  // Early return if no collection ID - prevents errors when not in a collection route
  if (!currentCollectionId) {
    return {
      items: [],
      totalCount: 0,
      isEmpty: true,
      currentPage: 1,
      pageSize: 5,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      searchParams: urlParams,
      isItemSearchLoading: false,
      isItemSearchFetching: false,
      itemSearchError: null,
      setQuery,
      setSorting: () => {},
      resetFilters: () => {},
      goToPage: () => {},
      nextPage: () => {},
      previousPage: () => {},
      setPageSize: () => {},
      refetchItemSearch: () => {},
    };
  }

  // Action: Change page
  const goToPage = useCallback(
    (page: number) => {
      updateUrlParams({ page });
    },
    [updateUrlParams],
  );

  // Action: Next page
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      updateUrlParams({ page: currentPage + 1 });
    }
  }, [hasNextPage, currentPage, updateUrlParams]);

  // Action: Previous page
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      updateUrlParams({ page: Math.max(1, currentPage - 1) });
    }
  }, [hasPreviousPage, currentPage, updateUrlParams]);

  // Action: Change page size
  const setPageSize = useCallback(
    (pageSize: number) => {
      updateUrlParams({ page_size: pageSize, page: 1 }); // Reset to page 1 on page size change
    },
    [updateUrlParams],
  );

  // Action: Change sort
  const setSorting = useCallback(
    (
      sortBy: "name" | "created_at" | "updated_at",
      sortOrder: "asc" | "desc",
    ) => {
      updateUrlParams({ sort_by: sortBy, sort_order: sortOrder });
    },
    [updateUrlParams],
  );

  // Action: Reset all filters
  const resetFilters = useCallback(() => {
    router.push(pathname); // Clear all search params
  }, [router, pathname]);

  return {
    // Data
    items,
    totalCount,
    isEmpty,

    // Pagination state
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,

    // Current filters (from URL)
    searchParams: urlParams,

    // Loading/Error states
    isItemSearchLoading: isLoadingItems,
    isItemSearchFetching: isFetchingItems,
    itemSearchError: itemsError,

    // Actions: Search
    setQuery,
    setSorting,
    resetFilters,

    // Actions: Pagination
    goToPage,
    nextPage,
    previousPage,
    setPageSize,

    // Actions: Refresh
    refetchItemSearch: refetchItems,
  };
}
