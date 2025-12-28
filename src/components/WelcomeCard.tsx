"use client";

import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CollectionsSelectionDropdown } from "@/modules/collections/components/CollectionsSelectionDropdown";

export function WelcomeCard() {
  return (
    <div className="px-4 pt-8">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Please select a collection from the dropdown below to view items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Collection</Label>
            <CollectionsSelectionDropdown />
          </div>
          <p className="text-muted-foreground text-sm">
            Use the collection selector above to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
