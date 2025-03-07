import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize OpenAI embeddings model
const embeddingsModel = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
  stripNewLines: true,
});

/**
 * Generate an embedding vector for a text string
 * @param text The text to generate an embedding for
 * @returns A numeric array representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Truncate text if it's too long (OpenAI has token limits)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;
    
    // Generate embedding using LangChain's OpenAI embeddings
    const embeddings = await embeddingsModel.embedDocuments([truncatedText]);
    return embeddings[0];
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Convert a numeric embedding array to a Buffer for storage in Postgres
 * @param embedding The numeric embedding array
 * @returns A Buffer representation of the embedding
 */
export function embeddingToBuffer(embedding: number[]): Buffer {
  // Convert the embedding array to a Float32Array
  const float32Array = new Float32Array(embedding);
  
  // Convert Float32Array to Buffer
  return Buffer.from(float32Array.buffer);
}

/**
 * Convert a Buffer from Postgres back to a numeric array
 * @param buffer The Buffer representation of the embedding
 * @returns The numeric embedding array
 */
export function bufferToEmbedding(buffer: Buffer): number[] {
  // Convert Buffer to Float32Array
  const float32Array = new Float32Array(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    )
  );
  
  // Convert Float32Array to regular array
  return Array.from(float32Array);
}

/**
 * Store a summary and its embedding in Supabase
 * @param summary The text summary to store
 * @param spaceId The ID of the space the summary belongs to
 * @param sourceId The ID of the source the summary is derived from
 * @returns The stored summary object
 */
export async function storeSummaryWithEmbedding(
  summary: string,
  spaceId: string,
  sourceId: string
) {
  try {
    // Generate embedding for the summary
    const embedding = await generateEmbedding(summary);
    
    // Store the summary and its embedding in Supabase
    const { data, error } = await supabase
      .from('summaries')
      .insert({
        content: summary,
        embedding,
        space_id: spaceId,
        source_id: sourceId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error storing summary with embedding:', error);
    throw new Error('Failed to store summary with embedding');
  }
}

/**
 * Search for similar content using vector similarity
 * @param query The query text to search for
 * @param spaceId Optional space ID to limit the search to
 * @param limit Maximum number of results to return
 * @returns Array of matching documents with similarity scores
 */
export async function searchSimilarContent(
  query: string,
  spaceId?: string,
  limit: number = 5
) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Build the SQL query for vector similarity search
    let sql = `
      SELECT 
        id, 
        content, 
        metadata,
        1 - (embedding <=> $1) as similarity
      FROM chunks
      WHERE 1=1
    `;
    
    const params: any[] = [queryEmbedding];
    
    // Add space filter if provided
    if (spaceId) {
      sql += ` AND space_id = $2`;
      params.push(spaceId);
    }
    
    // Order by similarity and limit results
    sql += `
      ORDER BY similarity DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);
    
    // Execute the query
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit,
      ...(spaceId && { filter_space_id: spaceId }),
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching similar content:', error);
    throw new Error('Failed to search similar content');
  }
}
