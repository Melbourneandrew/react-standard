"use client";

import { CollectionsSelectionDropdown } from "@/modules/collections/components/collections-selection-dropdown";
import { Label } from "@/components/ui/label";

export function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <Label className="text-lg">CATALOGUE</Label>
        <div className="flex items-center gap-3">
          <Label className="text-sm">COLLECTIONS</Label>
          <CollectionsSelectionDropdown />
        </div>
      </div>
    </nav>
  );
}
