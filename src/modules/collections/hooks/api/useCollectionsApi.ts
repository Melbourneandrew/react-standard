import { useCallback } from "react";
import { useApi } from "@/lib/hooks/useApi";
import type { ApiRequestParams, NoRouteParams } from "@/lib/types/api-types";
import type {
  Collection,
  CollectionSearchParams,
  CollectionSearchResponse,
} from "@/modules/collections/types/collection";

/**
 * API Hook - Pure API access with callApi
 *
 * Naming: Hook ends with "Api", methods end with "Api"
 * Verbs: fetch (GET), create (POST), update (PATCH/PUT), delete (DELETE)
 *
 * This is the Repository layer - no state management, just API calls
 */
export function useCollectionsApi() {
  const { callApi } = useApi();

  /**
   * Search collections with pagination and filters
   * @param params - Request parameters with query params (search filters)
   */
  const searchCollectionsApi = useCallback(
    async (
      params: ApiRequestParams<NoRouteParams, CollectionSearchParams> = {
        queryParams: {},
      },
    ): Promise<CollectionSearchResponse> => {
      const { queryParams = {} } = params;
      const searchParams = new URLSearchParams();

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      return await callApi<CollectionSearchResponse>(
        "GET",
        `/api/collections${queryString ? `?${queryString}` : ""}`,
      );
    },
    [callApi],
  );

  /**
   * Fetch a single collection by ID
   * @param params - Request parameters with route params (id)
   */
  const fetchCollectionApi = useCallback(
    async (params: ApiRequestParams<{ id: string }>): Promise<Collection> => {
      const { routeParams } = params;
      const { id } = routeParams;

      return await callApi<Collection>("GET", `/api/collections/${id}`);
    },
    [callApi],
  );

  return { searchCollectionsApi, fetchCollectionApi };
}
