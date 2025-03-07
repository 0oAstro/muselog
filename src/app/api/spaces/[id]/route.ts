import { NextResponse } from "next/server";
import { getSpaceById } from "@/lib/data/spaces";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const space = await getSpaceById(params.id);
    
    if (!space) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(space);
  } catch (error) {
    console.error(`Error fetching space ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch space" },
      { status: 500 }
    );
  }
} 