/**
 * API Request Parameter Types
 *
 * Distinguishes between route parameters (URL path segments),
 * query parameters (URL query string), and body parameters (request body).
 */

/**
 * Type aliases for readability when a parameter type is not needed
 */
export type NoRouteParams = Record<string, never>;
export type NoQueryParams = Record<string, never>;
export type NoBodyParams = Record<string, never>;

/**
 * Generic type for API request parameters
 *
 * @template TRouteParams - Parameters that go in the URL path (e.g., { id: string })
 * @template TQueryParams - Parameters that go in the query string (e.g., { page: number, limit: number })
 * @template TBodyParams - Parameters that go in the request body (e.g., { name: string, description: string })
 *
 * Fields are required when their type parameter is not Record<string, never>,
 * and optional when it is Record<string, never>.
 */
export type ApiRequestParams<
  TRouteParams extends Record<string, any> = Record<string, never>,
  TQueryParams extends Record<string, any> = Record<string, never>,
  TBodyParams extends Record<string, any> = Record<string, never>,
> =
  // If routeParams is not empty, make it required; otherwise optional
  (TRouteParams extends Record<string, never>
    ? { routeParams?: TRouteParams }
    : { routeParams: TRouteParams }) & {
    // queryParams is always optional (can be omitted even if type is provided)
    queryParams?: TQueryParams;
  } & (TBodyParams extends Record<string, never> // If bodyParams is not empty, make it required; otherwise optional
      ? { bodyParams?: TBodyParams }
      : { bodyParams: TBodyParams });
