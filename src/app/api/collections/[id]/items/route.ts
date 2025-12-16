import { NextRequest, NextResponse } from "next/server";
import { getMockItems, addMockItem } from "@/app/api/mock-items-store";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/collections/[id]/items
 * Search and retrieve items for a specific collection
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id: collectionId } = await context.params;
    const searchParams = request.nextUrl.searchParams;

    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("page_size") || "20", 10);
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Filter items by collection id
    const mockItems = getMockItems();
    let filteredItems = mockItems.filter(
      (item) => item.collection_id === collectionId,
    );

    // Filter by query (search in name and description)
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description?.toLowerCase().includes(lowerQuery),
      );
    }

    // Sort items
    filteredItems.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      if (sortBy === "created_at" || sortBy === "updated_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const totalCount = filteredItems.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    return NextResponse.json({
      items: paginatedItems,
      total_count: totalCount,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/collections/[id]/items
 * Create a new item within a collection
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id: collectionId } = await context.params;
    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate a new ID (find the max ID and increment)
    const mockItems = getMockItems();
    const collectionItems = mockItems.filter(
      (item) => item.collection_id === collectionId,
    );
    const maxId = collectionItems.reduce((max, item) => {
      const itemId = parseInt(item.id, 10);
      return isNaN(itemId) ? max : Math.max(max, itemId);
    }, 0);
    const newId = (maxId + 1).toString();

    // Create the new item
    const now = new Date().toISOString();
    const newItem = {
      id: newId,
      name: data.name,
      description: data.description || undefined,
      collection_id: collectionId,
      created_at: now,
      updated_at: now,
    };

    // Add to mock items store
    addMockItem(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 },
    );
  }
}
