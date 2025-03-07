import { NextRequest, NextResponse } from "next/server";
import {
  ProcessingResult,
  SourceData,
  SourceProcessingResult,
} from "@/lib/content-processor";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // Store the processed content in database using Prisma
    const result = await storeProcessedContentWithPrisma(
      processingResult,
      sourceData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in store-source API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    // Important: Disconnect Prisma client to avoid connection leaks in serverless environments
    await prisma.$disconnect();
  }
}

/**
 * Store processed content using Prisma
 *
 * @param processingResult Result from content processing
 * @param sourceData Metadata about the source
 * @returns Source processing result with status
 */
async function storeProcessedContentWithPrisma(
  processingResult: ProcessingResult,
  sourceData: SourceData
): Promise<SourceProcessingResult> {
  try {
    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the source record
      const source = await tx.source.create({
        data: {
          name: sourceData.name,
          description: sourceData.description || processingResult.summary,
          url: sourceData.url,
          filepath: sourceData.filepath,
          type: sourceData.type,
          tags: sourceData.tags || [],
          metadata: sourceData.metadata || {},
          space: {
            connect: { id: sourceData.spaceId },
          },
        },
      });

      // 2. Create chunks for the source
      const chunkPromises = processingResult.text.map((content, index) => {
        return tx.chunk.create({
          data: {
            content,
            tags: [],
            metadata: { chunk_index: index },
            source: {
              connect: { id: source.id },
            },
          },
        });
      });

      const chunks = await Promise.all(chunkPromises);

      return {
        source,
        chunkCount: chunks.length,
      };
    });

    // Return success result
    return {
      sourceId: result.source.id,
      name: result.source.name,
      description: result.source.description || "",
      chunkCount: result.chunkCount,
      success: true,
    };
  } catch (error) {
    console.error("Error storing content with Prisma:", error);
    return {
      sourceId: "",
      name: sourceData.name,
      description: sourceData.description || "",
      chunkCount: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
