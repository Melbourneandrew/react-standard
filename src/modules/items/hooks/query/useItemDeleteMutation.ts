import { useMutation } from "@tanstack/react-query";
import { useItemsApi } from "@/modules/items/hooks/api/useItemsApi";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";
import type { Item } from "@/modules/items/types/item";

/**
 * Mutation Hook - Delete items
 *
 * Layer: Query Layer (wraps useMutation)
 * Naming: use[Domain][Action]Mutation for write operations
 * Convention: Imperative - only executes when called
 *
 * Used directly in components (not context) - no shared state
 * Collection ID is obtained from CollectionContext.
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

  const {
    mutateAsync: deleteItemAsync,
    isPending: isDeletingItem,
    error: itemDeleteError,
  } = useMutation({
    mutationFn: ({ itemId }: DeleteItemParams) => {
      if (!currentCollectionId) {
        throw new Error("Collection ID is required");
      }
      return deleteItemApi({
        routeParams: { collectionId: currentCollectionId, itemId },
      });
    },
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
