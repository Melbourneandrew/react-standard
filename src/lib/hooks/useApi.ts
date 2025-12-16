/**
 * Base API Hook - HTTP Client
 * Provides callApi function for making HTTP requests
 *
 * In a real app, this would handle authentication, tokens, etc.
 * For this example, it's a simple fetch wrapper
 */

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * FastAPI Error Response Format
 */
interface FastApiErrorResponse {
  detail: string;
}

/**
 * API Error class with FastAPI-compatible detail field
 * Extends Error with status code and detail message
 */
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export function useApi() {
  const callApi = async <T = any>(
    method: HttpMethod,
    url: string,
    data?: any,
  ): Promise<T> => {
    try {
      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };

      if (data && method !== "GET") {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        // Try to parse FastAPI error response
        let detail: string;
        try {
          const errorBody: FastApiErrorResponse = await response.json();
          detail = errorBody.detail;
        } catch (parseError) {
          // If response body isn't JSON or doesn't have detail field
          detail = response.statusText || "Unknown error";
        }

        throw new ApiError(response.status, detail);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  return { callApi };
}
