"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CollectionsSelectionDropdown } from "@/modules/collections/components/CollectionsSelectionDropdown";

export function WelcomeCard() {
  return (
    <div className="pt-8 px-4">
      <Card className="w-full max-w-md mx-auto">
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
          <p className="text-sm text-muted-foreground">
            Use the collection selector above to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
