"use client";

import { useItemDeleteMutation } from "@/modules/items/hooks/query/useItemDeleteMutation";
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
  onSuccess?: () => void;
}

/**
 * Dialog for confirming item deletion
 *
 * Convention: Uses useMutation (via useItemDeleteMutation) for imperative deletes.
 */
export function ItemDeleteDialog({
  item,
  onClose,
  onSuccess,
}: ItemDeleteDialogProps) {
  const { deleteItemAsync, isDeletingItem } = useItemDeleteMutation();

  const handleDelete = async () => {
    if (!item) return;

    try {
      await deleteItemAsync({
        itemId: item.id,
      });
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error("Failed to delete:", err);
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
            <DialogFooter>
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
