import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ProcessingResult,
  SourceData,
  SourceProcessingResult,
} from "@/lib/content-processor";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    // Extract request body
    const body = await request.json();
    const { processingResult, sourceData } = body;

    // Validate the input
    if (!processingResult || !sourceData) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    // Store the processed content in Supabase
    const result = await storeProcessedContent(processingResult, sourceData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in store-source API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Store processed content in Supabase
 *
 * @param processingResult Result from content processing
 * @param sourceData Metadata about the source
 * @returns Source processing result with status
 */
async function storeProcessedContent(
  processingResult: ProcessingResult,
  sourceData: SourceData
): Promise<SourceProcessingResult> {
  try {
    // 1. Insert the source record
    const { data: sourceRecord, error: sourceError } = await supabase
      .from("sources")
      .insert({
        title: sourceData.title,
        description: sourceData.description || processingResult.summary,
        url: sourceData.url || null,
        type: sourceData.type,
        space_id: sourceData.spaceId,
        user_id: sourceData.userId,
      })
      .select("id")
      .single();

    if (sourceError) throw sourceError;
    if (!sourceRecord) throw new Error("Failed to create source record");

    const sourceId = sourceRecord.id;

    // 2. Insert source chunks
    const chunkInserts = processingResult.text.map((chunk, index) => ({
      source_id: sourceId,
      content: chunk,
      chunk_index: index,
      // No embedding yet, could be added in a separate process
    }));

    const { error: chunksError } = await supabase
      .from("source_chunks")
      .insert(chunkInserts);

    if (chunksError) throw chunksError;

    // Return success result
    return {
      sourceId,
      title: sourceData.title,
      description: sourceData.description || processingResult.summary,
      chunkCount: processingResult.text.length,
      success: true,
    };
  } catch (error) {
    console.error("Error storing content in Supabase:", error);
    return {
      sourceId: "",
      title: sourceData.title,
      description: sourceData.description || "",
      chunkCount: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
