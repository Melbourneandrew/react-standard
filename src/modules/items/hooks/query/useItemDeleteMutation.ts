import { useItemsApi } from "@/modules/items/hooks/api/useItemsApi";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";
import { useOptimisticMutation } from "@/lib/hooks/useOptimisticMutation";
import { useDefaultQueryErrorHandler } from "@/lib/hooks/useDefaultQueryErrorHandler";
import { itemQueryKeys } from "./item-query-keys";
import type { Item, ItemSearchResponse } from "@/modules/items/types/item";

/**
 * Mutation Hook - Delete items
 *
 * Layer: Query Layer (wraps useOptimisticMutation)
 * Naming: use[Domain][Action]Mutation for write operations
 * Convention: Imperative - only executes when called
 *
 * Used directly in components (not context) - no shared state
 * Collection ID is obtained from CollectionContext.
 *
 * Features:
 * - Optimistic Updates: Item removed from UI immediately
 * - Automatic Rollback: Restores previous state on error
 * - Cache Invalidation: Refetches to ensure consistency after success
 */

/**
 * Parameters for deleting an item
 */
type DeleteItemParams = {
  itemId: string;
};

type UseItemDeleteMutationReturn = {
  // Action (imperative mutation, call with async/await)
  // Returns the deleted item for consistency with update operations
  deleteItemAsync: (params: DeleteItemParams) => Promise<Item>;

  // Loading state (domain-specific naming)
  isDeletingItem: boolean;

  // Error state (domain-specific naming)
  itemDeleteError: Error | null;
};

export function useItemDeleteMutation(): UseItemDeleteMutationReturn {
  const { currentCollectionId } = useCollectionContext();
  const { deleteItemApi } = useItemsApi();
  const { defaultQueryErrorHandler } = useDefaultQueryErrorHandler(
    "Item Mutation Error"
  );

  const {
    mutateAsync: deleteItemAsync,
    isPending: isDeletingItem,
    error: itemDeleteError,
  } = useOptimisticMutation<Item, DeleteItemParams, ItemSearchResponse>({
    mutationFn: ({ itemId }) => {
      if (!currentCollectionId) {
        throw new Error("Collection ID is required");
      }
      return deleteItemApi({
        routeParams: { collectionId: currentCollectionId, itemId },
      });
    },
    queryKey: itemQueryKeys.searchBase(currentCollectionId),
    updateCache: (oldData, { itemId }) => ({
      ...oldData,
      items: oldData.items.filter((item) => item.id !== itemId),
      total_count: Math.max(0, oldData.total_count - 1),
    }),
    onError: (error) => defaultQueryErrorHandler(error),
  });

  return {
    // Action (imperative mutation, call with async/await)
    deleteItemAsync,

    // Loading state (domain-specific naming)
    isDeletingItem,

    // Error state (domain-specific naming)
    itemDeleteError,
  };
}
