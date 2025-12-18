import { NextRequest, NextResponse } from "next/server";
import {
  findMockItem,
  updateMockItem,
  deleteMockItem,
} from "@/app/api/mock-items-store";

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

/**
 * GET /api/collections/[id]/items/[itemId]
 * Fetch a single item by ID within a collection
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: collectionId, itemId } = await context.params;
    const item = findMockItem(itemId, collectionId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/collections/[id]/items/[itemId]
 * Update an item within a collection
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: collectionId, itemId } = await context.params;
    const data = await request.json();

    const updatedItem = updateMockItem(itemId, collectionId, data);

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collections/[id]/items/[itemId]
 * Delete an item within a collection
 * Returns the deleted item for consistency with update operations
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: collectionId, itemId } = await context.params;
    const deletedItem = deleteMockItem(itemId, collectionId);

    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(deletedItem);
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
