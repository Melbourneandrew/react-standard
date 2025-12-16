"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCollectionsQuery } from "../hooks/query/use-collections-query";
import type { Collection } from "../types/collection";

/**
 * Collection Context
 *
 * Purpose: Provides the current collection state from URL route params
 * and methods to navigate between collections.
 *
 * Pattern: Reads collection ID from URL params (/collections/[id]/...)
 * and fetches the collection data to provide it throughout the component tree.
 */

interface CollectionContextType {
  // Current collection ID from URL (undefined if not in a collection route)
  currentCollectionId: string | undefined;

  // Current collection data (undefined if not loaded or not in a collection route)
  currentCollection: Collection | undefined;

  // Loading state for current collection
  isLoadingCollection: boolean;

  // Navigate to a collection's items page
  navigateToCollection: (collectionId: string) => void;

  // Check if we're currently viewing a collection (derived from currentCollectionId)
  isInCollectionRoute: boolean;
}

const CollectionContext = createContext<CollectionContextType | undefined>(
  undefined,
);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();

  // Extract collection ID from route params
  // Route structure: /collections/[id]/...
  const currentCollectionId = useMemo(() => {
    if (params?.id && typeof params.id === "string") {
      return params.id;
    }
    return undefined;
  }, [params?.id]);

  // Fetch collections using the existing query hook
  const { data: collectionsData, isLoadingCollections } = useCollectionsQuery();

  // Extract the current collection from the collections query results
  const currentCollection = useMemo<Collection | undefined>(() => {
    if (!currentCollectionId || !collectionsData) {
      return undefined;
    }
    return collectionsData.collections.find(
      (c) => c.id === currentCollectionId,
    );
  }, [currentCollectionId, collectionsData]);

  const isLoadingCollection = isLoadingCollections;

  // Derive isInCollectionRoute from currentCollectionId (simpler and more reliable)
  const isInCollectionRoute = !!currentCollectionId;

  // Navigate to a collection's items page
  const navigateToCollection = (collectionId: string) => {
    router.push(`/collections/${collectionId}`);
  };

  const value: CollectionContextType = {
    currentCollectionId,
    currentCollection,
    isLoadingCollection,
    navigateToCollection,
    isInCollectionRoute,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollectionContext() {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error(
      "useCollectionContext must be used within CollectionProvider",
    );
  }
  return context;
}
