Implement or reimplement features using the hook categories below.

- **API hooks**
  - Location `modules/*/hooks/api/<domain>`
  - Name `use<Domain>Api`; methods `<verb><Domain>Api`
  - Pure wrappers around `useApi().callApi` with typed params/responses (`api-types.ts`)
  - No React Query, no shared state, just HTTP helpers

- **Query hooks**
  - Location `modules/*/hooks/query/<domain>`
  - Names `use<Domain>sQuery`/`use<Domain>Query`/`use<Domain><Action>Mutation`
  - Must import `<domain>-query-keys` for every query/mutation key
  - Query hooks wrap `useQuery`, and manage loading/error aliases
  - Query error handling: always run `useQueryErrorEffect(error, errorHandler, useDefaultQueryErrorHandler(...))` so every query reuses the default toast handler while still supporting custom overrides
  - Mutations wrap `useOptimisticMutation`, provide `updateCache`, and invalidate via shared keys
  - Mutation error handling: every mutation (optimistic or not) must call `useDefaultQueryErrorHandler` and pass the returned handler to `onError` so write failures surface consistent toasts
  - Return typed data plus `isLoading*`, `isFetching*`, error aliases, and `refetch`/`mutateAsync` with domain names
  - If specifically requested Mutations should use optimistic updates via `useOptimisticMutation`, with `updateCache` + `searchBase` keys for instant UI feedback and automatic rollback.

- **Query keys**
  - Every domain owns `<domain>-query-keys.ts` inside `modules/<domain>/hooks/query/`
  - Functions return `as const` tuples so React Query treats them as readonly keys
  - Queries use the full key factory (`itemQueryKeys.search(collectionId, params)`), while mutations use the base factory (`itemQueryKeys.searchBase(collectionId)`) to hit all related queries via partial matching

- **Manager hooks**
  - Location `modules/*/hooks`
  - Compose query hooks + router/search params + derived helpers
  - Own business logic state (URL params, pagination, etc.)
  - When that state must be shared across components, place the manager hook inside a context provider and expose it via `use<Domain>Context`

Use the following code examples as references. Please DO NOT leave comments that are this verbose in the code you write. Only leave comments when it is absolutely necessary for clarity.

useItemsApi.ts (be sure to implement using the [api-types.ts](frontend/src/types/api-types.ts))

```typescript
/**
 * API Hook - Pure API access with callApi
 *
 * Naming: Hook ends with "Api", methods end with "Api"
 * Verbs: fetch (GET), create (POST), update (PATCH/PUT), delete (DELETE)
 *
 * This is the Repository layer - no state management, just API calls
 *
 * Updated to use nested collection routes: /api/collections/[id]/items
 */
export function useItemsApi() {
  const { callApi } = useApi();

  /**
   * Search items with pagination and filters for a specific collection
   * @param params - Request parameters with route params (collectionId) and query params (search filters)
   */
  const searchItemsApi = useCallback(
    async (
      params: ApiRequestParams<{ collectionId: string }, ItemSearchParams>,
    ): Promise<ItemSearchResponse> => {
      const { routeParams, queryParams = {} } = params;
      const { collectionId } = routeParams;

      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      return await callApi<ItemSearchResponse>(
        "GET",
        `/api/collections/${collectionId}/items${
          queryString ? `?${queryString}` : ""
        }`,
      );
    },
    [callApi],
  );

  /**
   * Fetch a single item by ID
   * @param params - Request parameters with route params (collectionId, itemId)
   */
  const fetchItemApi = useCallback(
    async (
      params: ApiRequestParams<{ collectionId: string; itemId: string }>,
    ): Promise<Item> => {
      const { routeParams } = params;
      const { collectionId, itemId } = routeParams;

      return await callApi<Item>(
        "GET",
        `/api/collections/${collectionId}/items/${itemId}`,
      );
    },
    [callApi],
  );

  /**
   * Update an item
   * @param params - Request parameters with route params (collectionId, itemId) and body params (update data)
   */
  const updateItemApi = useCallback(
    async (
      params: ApiRequestParams<
        { collectionId: string; itemId: string },
        NoQueryParams,
        Partial<Item>
      >,
    ): Promise<Item> => {
      const { routeParams, bodyParams } = params;
      const { collectionId, itemId } = routeParams;

      return await callApi<Item>(
        "PATCH",
        `/api/collections/${collectionId}/items/${itemId}`,
        bodyParams,
      );
    },
    [callApi],
  );

  /**
   * Create a new item
   * @param params - Request parameters with route params (collectionId) and body params (item data)
   */
  const createItemApi = useCallback(
    async (
      params: ApiRequestParams<
        { collectionId: string },
        NoQueryParams,
        { name: string; description?: string }
      >,
    ): Promise<Item> => {
      const { routeParams, bodyParams } = params;
      const { collectionId } = routeParams;

      return await callApi<Item>(
        "POST",
        `/api/collections/${collectionId}/items`,
        bodyParams,
      );
    },
    [callApi],
  );

  /**
   * Delete an item
   * @param params - Request parameters with route params (collectionId, itemId)
   */
  const deleteItemApi = useCallback(
    async (
      params: ApiRequestParams<{ collectionId: string; itemId: string }>,
    ): Promise<Item> => {
      const { routeParams } = params;
      const { collectionId, itemId } = routeParams;

      return await callApi<Item>(
        "DELETE",
        `/api/collections/${collectionId}/items/${itemId}`,
      );
    },
    [callApi],
  );

  return {
    searchItemsApi,
    fetchItemApi,
    createItemApi,
    updateItemApi,
    deleteItemApi,
  };
}
```

item-query-keys.ts

```typescript
import type { ItemSearchParams } from "../../types/item";

export const itemQueryKeys = {
  searchBase: (collectionId: string | null | undefined) =>
    ["items", "search", collectionId] as const,
  search: (
    collectionId: string | null | undefined,
    params?: ItemSearchParams,
  ) => ["items", "search", collectionId, params] as const,
};
```

useItemsQuery.ts

```typescript
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
  errorHandler?: (error: Error | null) => void,
): UseItemsQueryReturn {
  const { currentCollectionId } = useCollectionContext();
  const { searchItemsApi } = useItemsApi();
  const { defaultQueryErrorHandler } =
    useDefaultQueryErrorHandler("Items Query Error");

  // Declarative query: Runs automatically when params change
  const { data, isLoading, isFetching, error, refetch } =
    useQuery<ItemSearchResponse>({
      queryKey: itemQueryKeys.search(currentCollectionId, searchParams),
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
```

useItemsCreateMutation.ts (this is also considered a "query" hook)

```typescript
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

type UseItemCreateMutationReturn = {
  // Action (imperative mutation, call with async/await)
  createItemAsync: (params: {
    name: string;
    description?: string;
  }) => Promise<Item>;

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
```
