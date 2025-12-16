import { useItemsApi } from "@/modules/items/hooks/api/useItemsApi";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";
import { useOptimisticMutation } from "@/lib/hooks/useOptimisticMutation";
import { useDefaultQueryErrorHandler } from "@/lib/hooks/useDefaultQueryErrorHandler";
import { itemQueryKeys } from "./item-query-keys";
import type { Item, ItemSearchResponse } from "@/modules/items/types/item";

/**
 * Mutation Hook - Create items
 *
 * Layer: Query Layer (wraps useOptimisticMutation)
 * Naming: use[Domain][Action]Mutation for write operations
 * Convention: Imperative - only executes when called
 *
 * Used directly in components (not context) - no shared state
 * Collection ID is obtained from CollectionContext.
 *
 * Features:
 * - Optimistic Updates: New item appears in UI immediately with temporary ID
 * - Automatic Rollback: Removes optimistic item on error
 * - Cache Invalidation: Refetches to get real item with server-generated ID
 *
 * Note: Creates use optimistic updates with temp IDs. The final refetch
 * replaces the temp item with the real one from the server.
 */

/**
 * Parameters for creating a new item
 */
type CreateItemParams = { name: string; description?: string };

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
  const { defaultQueryErrorHandler } = useDefaultQueryErrorHandler(
    "Item Mutation Error",
  );

  const {
    mutateAsync: createItemAsync,
    isPending: isCreatingItem,
    error: itemCreateError,
  } = useOptimisticMutation<Item, CreateItemParams, ItemSearchResponse>({
    mutationFn: ({ name, description }) => {
      if (!currentCollectionId) {
        throw new Error("Collection ID is required");
      }
      return createItemApi({
        routeParams: { collectionId: currentCollectionId },
        bodyParams: { name, description },
      });
    },
    queryKey: itemQueryKeys.searchBase(currentCollectionId),
    updateCache: (oldData, { name, description }) => {
      // Create optimistic item with temporary ID
      const now = new Date().toISOString();
      const optimisticItem: Item = {
        id: `temp-${Date.now()}`,
        name,
        description: description || "",
        collection_id: currentCollectionId!,
        created_at: now,
        updated_at: now,
      };

      return {
        ...oldData,
        items: [optimisticItem, ...oldData.items],
        total_count: oldData.total_count + 1,
      };
    },
    onError: (error) => defaultQueryErrorHandler(error),
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
