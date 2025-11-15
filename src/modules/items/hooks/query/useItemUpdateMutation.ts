import { useMutation } from "@tanstack/react-query";
import { useItemsApi } from "@/modules/items/hooks/api/useItemsApi";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";
import type { Item } from "@/modules/items/types/item";

/**
 * Mutation Hook - Update items
 *
 * Layer: Query Layer (wraps useMutation)
 * Naming: use[Domain][Action]Mutation for write operations
 * Convention: Imperative - only executes when called
 *
 * Used directly in components (not context) - no shared state
 * Collection ID is obtained from CollectionContext.
 */

/**
 * Parameters for updating an existing item
 */
type UpdateItemParams = {
  itemId: string;
  data: Partial<Item>;
};

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

  const {
    mutateAsync: updateItemAsync,
    isPending: isUpdatingItem,
    error: itemUpdateError,
  } = useMutation({
    mutationFn: ({ itemId, data }: UpdateItemParams) => {
      if (!currentCollectionId) {
        throw new Error("Collection ID is required");
      }
      return updateItemApi({
        routeParams: { collectionId: currentCollectionId, itemId },
        bodyParams: data,
      });
    },
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
