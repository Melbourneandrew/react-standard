"use client";

import { createContext, useContext, ReactNode } from "react";
import { useItemSearch } from "../hooks/useItemSearch";
import type { Item, ItemSearchParams } from "../types/item";

/**
 * Context - Aggregates and re-exports manager hooks that have SHARED STATE
 * Purpose: Provides shared state across component tree
 *
 * Pattern: Import manager hooks → Use them → Re-export their returns
 * This allows components to access shared state without prop drilling
 *
 * ⚠️ IMPORTANT: Only include hooks that have shared state
 * - ✅ useItemSearch: Shared search/filter/pagination state (URL-based)
 * - ❌ useItemMutations: NO shared state (just mutations) - use directly in components
 */

interface ItemContextType {
  // From useItemSearch
  items: Item[];
  totalCount: number;
  isEmpty: boolean;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  searchParams: ItemSearchParams;
  isItemSearchLoading: boolean;
  isItemSearchFetching: boolean;
  itemSearchError: any;
  setQuery: (query: string) => void;
  setSorting: (
    sortBy: "name" | "created_at" | "updated_at",
    sortOrder: "asc" | "desc",
  ) => void;
  resetFilters: () => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (pageSize: number) => void;
  refetchItemSearch: () => void;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export function ItemProvider({ children }: { children: ReactNode }) {
  // Manager Hook: Fetch items with filters and pagination (SHARED STATE - URL based)
  const {
    items,
    totalCount,
    isEmpty,
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    searchParams,
    isItemSearchLoading,
    isItemSearchFetching,
    itemSearchError,
    setQuery,
    setSorting,
    resetFilters,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    refetchItemSearch,
  } = useItemSearch();

  // Aggregate everything
  const value: ItemContextType = {
    items,
    totalCount,
    isEmpty,
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    searchParams,
    isItemSearchLoading,
    isItemSearchFetching,
    itemSearchError,
    setQuery,
    setSorting,
    resetFilters,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    refetchItemSearch,
  };

  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
}

export function useItemContext() {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useItemContext must be used within ItemProvider");
  }
  return context;
}
