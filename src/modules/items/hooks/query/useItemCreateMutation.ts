import { useMutation } from "@tanstack/react-query";
import { useItemsApi } from "@/modules/items/hooks/api/useItemsApi";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";
import type { Item } from "@/modules/items/types/item";

/**
 * Mutation Hook - Create items
 *
 * Layer: Query Layer (wraps useMutation)
 * Naming: use[Domain][Action]Mutation for write operations
 * Convention: Imperative - only executes when called
 *
 * Used directly in components (not context) - no shared state
 * Collection ID is obtained from CollectionContext.
 */

/**
 * Parameters for creating a new item
 */
type CreateItemParams = {
  name: string;
  description?: string;
};

type UseItemCreateMutationReturn = {
  // Action (imperative mutation, call with async/await)
  createItemAsync: (params: CreateItemParams) => Promise<Item>;

  // Loading state (domain-specific naming)
  isCreatingItem: boolean;

  // Error state (domain-specific naming)
  itemCreateError: Error | null;
};

export function useItemCreateMutation(): UseItemCreateMutationReturn {
  const { currentCollectionId } = useCollectionContext();
  const { createItemApi } = useItemsApi();

  const {
    mutateAsync: createItemAsync,
    isPending: isCreatingItem,
    error: itemCreateError,
  } = useMutation({
    mutationFn: ({ name, description }: CreateItemParams) => {
      if (!currentCollectionId) {
        throw new Error("Collection ID is required");
      }
      return createItemApi({
        routeParams: { collectionId: currentCollectionId },
        bodyParams: { name, description },
      });
    },
  });

  return {
    // Action (imperative mutation, call with async/await)
    createItemAsync,

    // Loading state (domain-specific naming)
    isCreatingItem,

    // Error state (domain-specific naming)
    itemCreateError,
  };
}
