"use client";

import { useState, useEffect } from "react";
import { useItemCreateMutation } from "@/modules/items/hooks/query/useItemCreateMutation";
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

interface ItemCreationDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog for creating a new item
 *
 * Convention: Uses useMutation (via useItemCreateMutation) for imperative creation.
 * Form state is managed locally. Resets form when dialog closes.
 *
 * Optimistic Updates: New item appears in UI immediately with temporary ID.
 * The mutation handles cache invalidation to replace it with real item from server.
 */
export function ItemCreationDialog({
  open,
  onClose,
}: ItemCreationDialogProps) {
  const { createItemAsync, isCreatingItem } = useItemCreateMutation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      await createItemAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
      // ✅ No manual refetch needed - mutation handles cache invalidation
    } catch (err) {
      console.error("Failed to create:", err);
      // ❌ Error is shown via console - optimistic item was removed
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Create Item</DialogTitle>
          <Label>Create Item</Label>
        </DialogHeader>
        <div className="p-6 pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              disabled={isCreatingItem}
              placeholder="Enter item name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-description">Description</Label>
            <Textarea
              id="create-description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              rows={3}
              disabled={isCreatingItem}
              placeholder="Enter item description (optional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreatingItem}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleCreate}
            disabled={isCreatingItem || !name.trim()}
          >
            {isCreatingItem ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
