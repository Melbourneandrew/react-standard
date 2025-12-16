"use client";

import { useItemDetail } from "@/modules/items/hooks/use-item-detail";
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

interface ItemViewDialogProps {
  itemId: string | null;
  onClose: () => void;
}

/**
 * Dialog for viewing item details
 *
 * Convention: Uses useItemDetail for declarative data loading.
 * The dialog automatically fetches data when itemId changes.
 * Collection ID is obtained from CollectionContext.
 */
export function ItemViewDialog({ itemId, onClose }: ItemViewDialogProps) {
  const { item, isLoadingItem, itemError } = useItemDetail(itemId);

  return (
    <Dialog open={!!itemId} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLoadingItem
              ? "Loading..."
              : itemError
                ? "Error"
                : item?.name || "Item Details"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingItem && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {itemError && (
          <div className="text-center text-sm text-destructive py-8">
            {itemError.message}
          </div>
        )}

        {item && (
          <>
            <div className="p-6 pt-0 space-y-4">
              {item.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-2">{item.description}</p>
                </div>
              )}
              <div>
                <Label>Created</Label>
                <p className="mt-2">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label>Last Updated</Label>
                <p className="mt-2">
                  {new Date(item.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
