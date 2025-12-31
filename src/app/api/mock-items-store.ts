/**
 * Shared Mock Items Store
 *
 * Provides a shared mutable array of items that persists across API route handlers.
 * In a real application, this would be replaced with a database.
 */

import { MOCK_ITEMS } from "@/app/api/mock-data";
import type { Item } from "@/modules/items/types/item";

// Create a mutable copy that can be shared across route handlers.
// Using const because the array is only mutated (push, splice, index assignment),
// never reassigned. const prevents reassignment, not mutation.
const mockItems: Item[] = [...MOCK_ITEMS];

/**
 * Get all mock items
 */
export function getMockItems(): Item[] {
  return mockItems;
}

/**
 * Add a new item to the store
 */
export function addMockItem(item: Item): void {
  mockItems.push(item);
}

/**
 * Update an item in the store
 */
export function updateMockItem(
  itemId: string,
  collectionId: string,
  updates: Partial<Item>,
): Item | null {
  const itemIndex = mockItems.findIndex(
    (item) => item.id === itemId && item.collection_id === collectionId,
  );

  if (itemIndex === -1) {
    return null;
  }

  mockItems[itemIndex] = {
    ...mockItems[itemIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  return mockItems[itemIndex];
}

/**
 * Delete an item from the store
 */
export function deleteMockItem(
  itemId: string,
  collectionId: string,
): Item | null {
  const itemIndex = mockItems.findIndex(
    (item) => item.id === itemId && item.collection_id === collectionId,
  );

  if (itemIndex === -1) {
    return null;
  }

  const deletedItem = mockItems[itemIndex];
  mockItems.splice(itemIndex, 1);
  return deletedItem;
}

/**
 * Find an item by ID and collection ID
 */
export function findMockItem(
  itemId: string,
  collectionId: string,
): Item | undefined {
  return mockItems.find(
    (item) => item.id === itemId && item.collection_id === collectionId,
  );
}
