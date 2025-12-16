import { useItemsApi } from "@/modules/items/hooks/api/use-items-api";
import { useCollectionContext } from "@/modules/collections/contexts/collection-context";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";
import { useDefaultQueryErrorHandler } from "@/lib/hooks/use-default-query-error-handler";
import { itemQueryKeys } from "@/modules/items/hooks/query/item-query-keys";
import type { Item, ItemSearchResponse } from "@/modules/items/types/item";

/**
 * Mutation Hook - Update items
 *
 * Layer: Query Layer (wraps useOptimisticMutation)
 * Naming: use[Domain][Action]Mutation for write operations
 * Convention: Imperative - only executes when called
 *
 * Used directly in components (not context) - no shared state
 * Collection ID is obtained from CollectionContext.
 *
 * Features:
 * - Optimistic Updates: Item changes reflected in UI immediately
 * - Automatic Rollback: Restores previous state on error
 * - Cache Invalidation: Refetches to ensure consistency after success
 */

/**
 * Parameters for updating an existing item
 */
type UpdateItemParams = { itemId: string; data: Partial<Item> };

type UseItemUpdateMutationReturn = {
  // Action (imperative mutation, call with async/await)
  updateItemAsync: (params: UpdateItemParams) => Promise<Item>;

  // Loading state (domain-specific naming)
  isUpdatingItem: boolean;

  // Error state (domain-specific naming)
  itemUpdateError: Error | null;
};

export function useItemUpdateMutation(): UseItemUpdateMutationReturn {
  const { currentCollectionId } = useCollectionContext();
  const { updateItemApi } = useItemsApi();
  const { defaultQueryErrorHandler } = useDefaultQueryErrorHandler(
    "Item Mutation Error",
  );

  const {
    mutateAsync: updateItemAsync,
    isPending: isUpdatingItem,
    error: itemUpdateError,
  } = useOptimisticMutation<Item, UpdateItemParams, ItemSearchResponse>({
    mutationFn: ({ itemId, data }) => {
      if (!currentCollectionId) {
        throw new Error("Collection ID is required");
      }
      return updateItemApi({
        routeParams: { collectionId: currentCollectionId, itemId },
        bodyParams: data,
      });
    },
    queryKey: itemQueryKeys.searchBase(currentCollectionId),
    updateCache: (oldData, { itemId, data }) => ({
      ...oldData,
      items: oldData.items.map((item) =>
        item.id === itemId
          ? { ...item, ...data, updated_at: new Date().toISOString() }
          : item,
      ),
    }),
    onError: (error) => defaultQueryErrorHandler(error),
  });

  return {
    // Action (imperative mutation, call with async/await)
    updateItemAsync,

    // Loading state (domain-specific naming)
    isUpdatingItem,

    // Error state (domain-specific naming)
    itemUpdateError,
  };
}
