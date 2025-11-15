"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * React Query Provider Wrapper
 *
 * CONFIGURED FOR: No Caching, Manual Control
 *
 * React Query is used ONLY as a wrapper around fetch() to get:
 * - Consistent {data, isLoading, error} API
 * - Loading state management
 * - Error handling conventions
 *
 * The cache is effectively DISABLED - you manage all state yourself.
 * This prevents cache from interfering with your custom optimistic updates,
 * state management, and business logic.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚫 NO CACHING - Cache is cleared immediately after queries run
            gcTime: 0, // (formerly cacheTime in older versions)

            // 🚫 NO STALE TIME - Data is always considered stale (never cached)
            staleTime: 0,

            // 🚫 NO AUTO-RETRY - You control retry logic yourself
            retry: false,

            // 🚫 NO BACKGROUND REFETCHING - Data only fetches when YOU call it
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,

            // This makes React Query a "dumb" wrapper - it just handles
            // loading/error states and provides a consistent API.
            // YOU control all data, timing, and state management.
          },
          mutations: {
            // Mutations also won't retry automatically
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
