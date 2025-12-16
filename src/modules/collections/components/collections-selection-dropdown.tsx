"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollectionsQuery } from "../hooks/query/use-collections-query";
import { useCollectionContext } from "../contexts/collection-context";
import { Loader2 } from "lucide-react";

/**
 * Dropdown for selecting a collection
 *
 * Convention: Uses shadcn Select component for consistent styling.
 * Loads collections when opened and navigates on selection.
 */
export function CollectionsSelectionDropdown() {
  const { currentCollectionId, navigateToCollection } = useCollectionContext();
  const [isOpen, setIsOpen] = useState(false);

  // Load collections only when dropdown is open (lazy loading)
  const { data, isLoadingCollections } = useCollectionsQuery(
    {},
    {
      enabled: isOpen, // Only fetch when dropdown is open
    },
  );

  const collections = data?.collections || [];

  const handleValueChange = (collectionId: string) => {
    navigateToCollection(collectionId);
  };

  return (
    <Select
      value={currentCollectionId}
      onValueChange={handleValueChange}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className="w-[200px] cursor-pointer">
        <SelectValue placeholder="Select a collection" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {isLoadingCollections ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : collections.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No collections found
          </div>
        ) : (
          collections.map((collection) => (
            <SelectItem
              key={collection.id}
              value={collection.id}
              className="cursor-pointer data-[highlighted]:bg-gray-100"
            >
              {collection.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
