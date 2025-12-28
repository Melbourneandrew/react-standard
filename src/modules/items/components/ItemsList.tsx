"use client";

import { useState, useEffect } from "react";
import { useItemContext } from "@/modules/items/contexts/ItemContext";
import type { Item } from "@/modules/items/types/item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ItemViewDialog } from "@/modules/items/components/ItemViewDialog";
import { ItemEditDialog } from "@/modules/items/components/ItemEditDialog";
import { ItemDeleteDialog } from "@/modules/items/components/ItemDeleteDialog";
import { ItemCreationDialog } from "@/modules/items/components/ItemCreationDialog";
import { Search, Plus, Loader2, Eye, Pencil, Trash2 } from "lucide-react";

export default function ItemsList() {
  // Context: Shared state (search, filters, pagination)
  // Note: refetchItemSearch no longer needed - mutations handle cache invalidation
  const {
    items,
    totalCount,
    isEmpty,
    isItemSearchLoading,
    itemSearchError,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    searchParams,
    setQuery,
    nextPage,
    previousPage,
  } = useItemContext();

  // Dialog state
  const [viewItemId, setViewItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Local state for search input to prevent losing focus
  const [searchInput, setSearchInput] = useState(searchParams.query || "");

  // Sync local input with URL query param (when navigating back/forward)
  useEffect(() => {
    setSearchInput(searchParams.query || "");
  }, [searchParams.query]);

  // Debounce search query - only trigger search after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if the input differs from URL to avoid infinite loops
      if (searchInput !== (searchParams.query || "")) {
        setQuery(searchInput);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchInput, searchParams.query, setQuery]);

  return (
    <>
      <div>
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {isItemSearchLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : itemSearchError ? (
            <div className="text-destructive py-12 text-center text-sm">
              {itemSearchError.message}
            </div>
          ) : isEmpty ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              No items found
            </div>
          ) : (
            <>
              <div className="text-muted-foreground mb-4 text-sm">
                {totalCount} {totalCount === 1 ? "item" : "items"}
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 text-sm font-medium">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-muted-foreground text-sm">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewItemId(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItem(item);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousPage}
                    disabled={!hasPreviousPage}
                  >
                    Previous
                  </Button>
                  <div className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={!hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs - No onSuccess callbacks needed, mutations handle cache invalidation */}
      <ItemViewDialog itemId={viewItemId} onClose={() => setViewItemId(null)} />

      <ItemEditDialog
        key={editItem?.id}
        item={editItem}
        onClose={() => setEditItem(null)}
      />

      <ItemDeleteDialog item={deleteItem} onClose={() => setDeleteItem(null)} />

      <ItemCreationDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </>
  );
}
