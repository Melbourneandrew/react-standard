import { useEffect } from "react";

/**
 * Standardized error handling for React Query hooks
 *
 * Automatically calls the error handler when an error occurs,
 * using either a custom handler or the default one.
 *
 * @param error - The error from React Query
 * @param customHandler - Optional custom error handler
 * @param defaultHandler - Default error handler (from useDefaultQueryErrorHandler)
 */
export function useQueryErrorEffect(
  error: Error | null,
  customHandler: ((error: Error | null) => void) | undefined,
  defaultHandler: (error: Error | null) => void,
) {
  useEffect(() => {
    const handler = customHandler || defaultHandler;
    handler(error);
  }, [error, customHandler, defaultHandler]);
}
