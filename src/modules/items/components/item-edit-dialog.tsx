"use client";

import { useState } from "react";
import { useItemUpdateMutation } from "@/modules/items/hooks/query/use-item-update-mutation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ItemEditDialogProps {
  item: Item | null;
  onClose: () => void;
}

/**
 * Dialog for editing an item
 *
 * Convention: Uses useMutation (via useItemUpdateMutation) for imperative updates.
 * Form state is managed locally. Parent should use key prop to reset state when item changes.
 *
 * Optimistic Updates: Changes appear in UI immediately. The mutation handles
 * cache invalidation automatically - no manual refetch callbacks needed.
 */
export function ItemEditDialog({ item, onClose }: ItemEditDialogProps) {
  const { updateItemAsync, isUpdatingItem } = useItemUpdateMutation();
  // Initialize from props - parent's key prop will reset component when item changes
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");

  const handleSave = async () => {
    if (!item) return;

    try {
      await updateItemAsync({ itemId: item.id, data: { name, description } });
      onClose();
      // ✅ No manual refetch needed - mutation handles cache invalidation
    } catch (err) {
      console.error("Failed to update:", err);
      // ❌ Error is shown via console - optimistic update was rolled back
    }
  };

  const handleUpdateError = async () => {
    if (!item) return;
    try {
      await updateItemAsync({
        itemId: "error-trigger-item-id",
        data: { name: "" },
      });
    } catch {
      // Expected - handled via default mutation error handler toast
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent>
        {item && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  disabled={isUpdatingItem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  rows={3}
                  disabled={isUpdatingItem}
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <ErrorTriggerButton
                onTrigger={handleUpdateError}
                disabled={isUpdatingItem}
              />
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUpdatingItem}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isUpdatingItem}
              >
                {isUpdatingItem ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
