import { useCallback } from "react";
import { useToast } from "./useToast";
import { ApiError } from "./useApi";

/**
 * Default error handler for React Query errors
 *
 * Returns a function that can be passed to query hooks to handle errors
 * by displaying a toast notification with the error details.
 *
 * @param title - The title to display in the error toast (e.g., "Item Query Error")
 */
export function useDefaultQueryErrorHandler(title: string = "Query Error") {
  const { showErrorToast } = useToast();

  const defaultQueryErrorHandler = useCallback(
    (error: Error | null) => {
      if (!error) return;

      const apiError = error as ApiError;

      showErrorToast({
        title: title,
        message: apiError.detail || error.message || "An error occurred",
      });
    },
    [showErrorToast, title]
  );

  return { defaultQueryErrorHandler };
}
