import { NextResponse } from "next/server";
import { getSpaces, createSpace } from "@/lib/data/spaces";

export async function GET() {
  try {
    const spaces = await getSpaces();
    return NextResponse.json(spaces);
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch spaces" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    
    const newSpace = await createSpace({
      name: body.name,
      description: body.description,
      icon: body.icon,
      backdrop: body.backdrop,
    });
    
    return NextResponse.json(newSpace, { status: 201 });
  } catch (error) {
    console.error("Error creating space:", error);
    return NextResponse.json(
      { error: "Failed to create space" },
      { status: 500 }
    );
  }
} 