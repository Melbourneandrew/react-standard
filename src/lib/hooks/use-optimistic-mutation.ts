import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";

/**
 * Optimistic Mutation Hook - Generic wrapper for mutations with optimistic updates
 *
 * This hook abstracts the common pattern of:
 * 1. Canceling outgoing queries
 * 2. Snapshotting previous data
 * 3. Optimistically updating cache
 * 4. Rolling back on error
 * 5. Invalidating on success
 *
 * @example
 * ```typescript
 * const { mutateAsync } = useOptimisticMutation({
 *   mutationFn: deleteItemApi,
 *   queryKey: ["items", "search", collectionId],
 *   updateCache: (old, { itemId }) => ({
 *     ...old,
 *     items: old.items.filter(item => item.id !== itemId),
 *     total_count: old.total_count - 1
 *   })
 * });
 * ```
 */

interface UseOptimisticMutationOptions<
  TData = unknown,
  TVariables = unknown,
  TCacheData = unknown,
> extends Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "onMutate" | "onError" | "onSettled"
> {
  /**
   * Query key to invalidate and optimistically update
   */
  queryKey: readonly unknown[];

  /**
   * Function to optimistically update the cache
   * @param oldData - Current cached data
   * @param variables - Mutation variables
   * @returns Updated cache data
   */
  updateCache: (oldData: TCacheData, variables: TVariables) => TCacheData;

  /**
   * Optional custom error handler
   */
  onError?: (error: Error, variables: TVariables) => void;

  /**
   * Optional custom success handler
   */
  onSuccess?: (data: TData, variables: TVariables) => void;
}

export function useOptimisticMutation<
  TData = unknown,
  TVariables = unknown,
  TCacheData = unknown,
>({
  mutationFn,
  queryKey,
  updateCache,
  onError: customOnError,
  onSuccess: customOnSuccess,
  ...options
}: UseOptimisticMutationOptions<TData, TVariables, TCacheData>) {
  const queryClient = useQueryClient();

  // Define context type for type safety
  type MutationContext = {
    previousData: [
      queryKey: readonly unknown[],
      data: TCacheData | undefined,
    ][];
  };

  return useMutation<TData, Error, TVariables, MutationContext>({
    mutationFn,
    ...options,

    // 🚀 Optimistically update cache
    onMutate: async (variables) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueriesData<TCacheData>({ queryKey });

      // Optimistically update all matching queries
      queryClient.setQueriesData<TCacheData>({ queryKey }, (old) => {
        if (!old) return old;
        return updateCache(old, variables);
      });

      // Return snapshot for rollback
      return { previousData };
    },

    // ❌ Rollback on error
    onError: (error, variables, context) => {
      // Restore previous data
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Call custom error handler if provided
      customOnError?.(error, variables);
    },

    // ✅ Success callback
    onSuccess: (data, variables, context) => {
      customOnSuccess?.(data, variables);
    },

    // ✅ Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
