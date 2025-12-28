"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * React Query Provider Wrapper
 *
 * CONFIGURED FOR: Optimistic Updates with Controlled Caching
 *
 * React Query provides:
 * - Consistent {data, isLoading, error} API
 * - Loading state management
 * - Optimistic updates with automatic rollback
 * - Cache invalidation on mutations
 *
 * Caching is ENABLED to support optimistic updates, but background
 * refetching is DISABLED so you maintain control over when data is fetched.
 * Mutations handle cache invalidation explicitly via onSettled/onSuccess.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ CACHING ENABLED - Required for optimistic updates
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

            // ✅ SHORT STALE TIME - Data considered fresh for 30 seconds
            staleTime: 30 * 1000, // 30 seconds

            // 🚫 NO AUTO-RETRY - You control retry logic yourself
            retry: false,

            // 🚫 NO BACKGROUND REFETCHING - Data only fetches when YOU call it
            // Mutations explicitly invalidate queries when needed
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,

            // This configuration gives you:
            // - Optimistic updates that can be rolled back
            // - Cache that persists during mutations
            // - Manual control via invalidateQueries()
            // - No surprise background refetches
          },
          mutations: {
            // Mutations won't retry automatically
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
