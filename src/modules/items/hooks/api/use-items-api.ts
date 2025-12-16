import { useCallback } from "react";
import { useApi } from "@/lib/hooks/use-api";
import type {
  ApiRequestParams,
  NoQueryParams,
} from "@/lib/types/api-types";
import type {
  Item,
  ItemSearchParams,
  ItemSearchResponse,
} from "@/modules/items/types/item";

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
        `/api/collections/${collectionId}/items${queryString ? `?${queryString}` : ""}`,
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
