"use client";

import { useItemDeleteMutation } from "@/modules/items/hooks/query/use-item-delete-mutation";
import { ErrorTriggerButton } from "@/components/error-trigger-button";
import type { Item } from "@/modules/items/types/item";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ItemDeleteDialogProps {
  item: Item | null;
  onClose: () => void;
}

/**
 * Dialog for confirming item deletion
 *
 * Convention: Uses useMutation (via useItemDeleteMutation) for imperative deletes.
 *
 * Optimistic Updates: Item is removed from UI immediately. The mutation handles
 * cache invalidation automatically - no manual refetch callbacks needed.
 */
export function ItemDeleteDialog({ item, onClose }: ItemDeleteDialogProps) {
  const { deleteItemAsync, isDeletingItem } = useItemDeleteMutation();

  const handleDelete = async () => {
    if (!item) return;

    try {
      await deleteItemAsync({ itemId: item.id });
      onClose();
      // ✅ No manual refetch needed - mutation handles cache invalidation
    } catch (err) {
      console.error("Failed to delete:", err);
      // ❌ Error is shown via console - optimistic update was rolled back
    }
  };

  const handleDeleteError = async () => {
    try {
      await deleteItemAsync({ itemId: "error-trigger-item-id" });
    } catch {
      // Expected - handled via default mutation error handler toast
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Item</DialogTitle>
          <Label>Delete Item</Label>
        </DialogHeader>
        {item && (
          <>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{item.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <ErrorTriggerButton
                onTrigger={handleDeleteError}
                disabled={isDeletingItem}
              />
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isDeletingItem}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeletingItem}
              >
                {isDeletingItem ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
