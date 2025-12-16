import { useItemsQuery } from "@/modules/items/hooks/query/use-items-query";
import type { Item } from "@/modules/items/types/item";

type UseItemDetailReturn = {
  item: Item | null;
  isLoadingItem: boolean;
  isFetchingItem: boolean;
  itemError: Error | null;
  refetchItem: () => void;
};

/**
 * Manager Hook - Fetch and manage a single item
 *
 * Layer: Manager Layer (wraps Query Layer)
 * Naming: use[Domain]Detail for single resource management
 * Convention: Declarative - fetches automatically when itemId changes
 *
 * Use this when you need to display/edit a single item (e.g., in a dialog or detail view)
 * Collection ID is obtained from CollectionContext.
 */
export function useItemDetail(itemId: string | null): UseItemDetailReturn {
  // Use the existing query hook with id filter - the endpoint returns a single-item array
  // Collection ID comes from CollectionContext
  const {
    itemSearchResponse,
    isLoadingItems,
    isFetchingItems,
    itemsError,
    refetchItems,
  } = useItemsQuery({ id: itemId || undefined });

  // Extract the first item from the response (or null if not found)
  const item = itemSearchResponse?.items?.[0] || null;

  return {
    // Data (null when itemId is not provided)
    item: itemId ? item : null,

    // Loading/Error states (domain-specific naming)
    isLoadingItem: isLoadingItems,
    isFetchingItem: isFetchingItems,
    itemError: itemsError,

    // Actions
    refetchItem: refetchItems,
  };
}
