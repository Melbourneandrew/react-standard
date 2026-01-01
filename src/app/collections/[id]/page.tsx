"use client";

import { ItemProvider } from "@/modules/items/contexts/ItemContext";
import { ItemsList } from "@/modules/items/components/ItemsList";
import { Label } from "@/components/ui/label";
import { useCollectionContext } from "@/modules/collections/contexts/CollectionContext";

export default function CollectionItemsPage() {
  const { currentCollectionId } = useCollectionContext();

  if (!currentCollectionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Label className="text-muted-foreground text-xl">
            Collection not found
          </Label>
        </div>
      </div>
    );
  }

  return (
    <ItemProvider>
      <div className="min-h-screen">
        <header>
          <div className="container mx-auto px-6 pt-4">
            <Label className="text-2xl">Items</Label>
          </div>
        </header>
        <main className="container mx-auto p-6">
          <ItemsList />
        </main>
      </div>
    </ItemProvider>
  );
}
