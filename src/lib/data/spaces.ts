"use server";

import prisma from "@/lib/db";
import { generateEmbedding, embeddingToBuffer } from "@/lib/embeddings";
import type { Space, Source, Note, Chunk } from "@/lib/types";

// UUID validation function
function isValidUUID(uuid: string): boolean {
  if (uuid === "new") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Spaces CRUD operations
export async function getAllSpaces(): Promise<Space[]> {
  try {
    return await prisma.space.findMany({
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
}

export async function getSpaceById(id: string): Promise<Space | null> {
  try {
    // Handle the 'new' route separately
    if (id === "new") {
      return null;
    }

    // Validate UUID format before querying database
    if (!isValidUUID(id)) {
      throw new Error(`Invalid UUID format: ${id}`);
    }

    console.log("Fetching space:", id);

    return await prisma.space.findUnique({
      where: { id },
      include: {
        sources: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            spaceId: true,
            userId: true,
          },
        },
        notes: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching space:", error);
    return null;
  }
}

export async function getSpacesByUserId(userId: string): Promise<Space[]> {
  try {
    return await prisma.space.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
}

export async function createSpace(
  data: Omit<Space, "id" | "createdAt" | "updatedAt">
): Promise<Space> {
  try {
    return await prisma.space.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    });
  } catch (error) {
    console.error("Error creating space:", error);
    throw new Error("Failed to create space");
  }
}

export async function updateSpace(
  id: string,
  data: Partial<Omit<Space, "id" | "createdAt" | "updatedAt">>
): Promise<Space | null> {
  try {
    return await prisma.space.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating space:", error);
    return null;
  }
}

export async function deleteSpace(id: string): Promise<boolean> {
  try {
    await prisma.space.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting space:", error);
    return false;
  }
}

// Delete multiple spaces
export async function deleteSpaces(ids: string[]): Promise<{
  success: string[];
  failed: string[];
}> {
  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const id of ids) {
    try {
      const deleted = await deleteSpace(id);
      if (deleted) {
        results.success.push(id);
      } else {
        results.failed.push(id);
      }
    } catch (error) {
      console.error(`Error deleting space ${id}:`, error);
      results.failed.push(id);
    }
  }

  return results;
}

// Notes CRUD operations
export async function getNotesBySpaceId(spaceId: string): Promise<Note[]> {
  try {
    return await prisma.note.findMany({
      where: { spaceId },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

export async function getNoteById(id: string): Promise<Note | null> {
  try {
    return await prisma.note.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return null;
  }
}

export async function createNote(
  data: Omit<Note, "id" | "createdAt" | "updatedAt">
): Promise<Note> {
  try {
    return await prisma.note.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    });
  } catch (error) {
    console.error("Error creating note:", error);
    throw new Error("Failed to create note");
  }
}

export async function updateNote(
  id: string,
  data: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">>
): Promise<Note | null> {
  try {
    return await prisma.note.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return null;
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  try {
    await prisma.note.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting note:", error);
    return false;
  }
}

// Sources CRUD operations
export async function getSourcesBySpaceId(spaceId: string): Promise<Source[]> {
  try {
    return await prisma.source.findMany({
      where: { spaceId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return [];
  }
}

export async function getSourceById(id: string): Promise<Source | null> {
  try {
    return await prisma.source.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching source:", error);
    return null;
  }
}

export async function createSource(
  data: Omit<Source, "id" | "createdAt" | "updatedAt">
): Promise<Source> {
  try {
    return await prisma.source.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    });
  } catch (error) {
    console.error("Error creating source:", error);
    throw new Error("Failed to create source");
  }
}

export async function updateSource(
  id: string,
  data: Partial<Omit<Source, "id" | "createdAt" | "updatedAt">>
): Promise<Source | null> {
  try {
    return await prisma.source.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Error updating source:", error);
    return null;
  }
}

export async function deleteSource(id: string): Promise<boolean> {
  try {
    await prisma.source.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting source:", error);
    return false;
  }
}

// Chunks CRUD operations
export async function getChunksBySourceId(sourceId: string): Promise<Chunk[]> {
  try {
    return await prisma.chunk.findMany({
      where: { sourceId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching chunks:", error);
    return [];
  }
}

export async function getChunkById(id: string): Promise<Chunk | null> {
  try {
    return await prisma.chunk.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching chunk:", error);
    return null;
  }
}

export async function createChunk(
  data: Omit<Chunk, "id" | "createdAt" | "updatedAt">
): Promise<Chunk> {
  try {
    // Generate embedding for the chunk content
    const embeddingArray = await generateEmbedding(data.content);
    const embeddingBuffer = embeddingToBuffer(embeddingArray);

    // Create the chunk with embedding in the database
    return await prisma.chunk.create({
      data: {
        content: data.content,
        tags: data.tags || [],
        metadata: data.metadata || {},
        embedding: embeddingBuffer,
        sourceId: data.sourceId,
        userId: data.userId || (await getCurrentUser()).id,
      },
    });
  } catch (error) {
    console.error("Error creating chunk:", error);
    throw new Error("Failed to create chunk");
  }
}

export async function updateChunk(
  id: string,
  data: Partial<Omit<Chunk, "id" | "createdAt" | "updatedAt">>
): Promise<Chunk | null> {
  try {
    // If content is updated, regenerate the embedding
    let embeddingBuffer: Buffer | undefined;
    if (data.content) {
      const embeddingArray = await generateEmbedding(data.content);
      embeddingBuffer = embeddingToBuffer(embeddingArray);
    }

    // Update the chunk with new data and possibly new embedding
    return await prisma.chunk.update({
      where: { id },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.tags && { tags: data.tags }),
        ...(data.metadata && { metadata: data.metadata }),
        ...(embeddingBuffer && { embedding: embeddingBuffer }),
      },
    });
  } catch (error) {
    console.error("Error updating chunk:", error);
    throw new Error("Failed to update chunk");
  }
}

export async function deleteChunk(id: string): Promise<boolean> {
  try {
    await prisma.chunk.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting chunk:", error);
    return false;
  }
}

// Fix the missing getCurrentUser function that was causing an error
async function getCurrentUser() {
  // Implement your user authentication logic here
  throw new Error("getCurrentUser function not implemented");
}
