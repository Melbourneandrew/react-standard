import { NextRequest, NextResponse } from "next/server";
import { MOCK_COLLECTIONS } from "@/app/api/mock-data";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/collections/[id]
 * Retrieve a single collection by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const collection = MOCK_COLLECTIONS.find((c) => c.id === id);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 },
    );
  }
}
