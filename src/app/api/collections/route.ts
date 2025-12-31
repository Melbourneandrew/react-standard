import { MOCK_COLLECTIONS } from "@/app/api/mock-data";
import type {
  CollectionSearchParams,
  CollectionSearchResponse,
} from "@/modules/collections/types/collection";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/collections
 * Search and retrieve collections
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const params: CollectionSearchParams = {
      query: searchParams.get("query") || undefined,
      sort_by: (searchParams.get("sort_by") as "name" | "created_at") || "name",
      sort_order: (searchParams.get("sort_order") as "asc" | "desc") || "asc",
    };

    // Start with all collections
    let collections = [...MOCK_COLLECTIONS];

    // Filter by search query
    if (params.query) {
      const query = params.query.toLowerCase();
      collections = collections.filter(
        (collection) =>
          collection.name.toLowerCase().includes(query) ||
          collection.description?.toLowerCase().includes(query),
      );
    }

    // Sort collections
    collections.sort((a, b) => {
      const sortBy = params.sort_by || "name";
      const sortOrder = params.sort_order || "asc";

      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "created_at") {
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    const response: CollectionSearchResponse = {
      collections,
      total_count: collections.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 },
    );
  }
}
