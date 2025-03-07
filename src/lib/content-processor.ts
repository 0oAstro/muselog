import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import youtubeTranscript from "youtube-transcript";
import { createClient } from "@supabase/supabase-js";

// API keys loaded from environment variables
const serverApiKey = process.env.GEMINI_API_KEY || "";
const clientApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize the Supabase client with service role key for server operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize the Gemini API instances
const serverGenAI = new GoogleGenerativeAI(serverApiKey);
const clientGenAI = new GoogleGenerativeAI(clientApiKey);
const fileManager = new GoogleAIFileManager(serverApiKey);

// Set safety settings for client-side usage
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Interface for processing result containing text chunks and a summary
 */
export interface ProcessingResult {
  text: string[];
  summary: string;
}

// For backward compatibility with existing code
export type OCRResult = ProcessingResult;

/**
 * Interface for source data to store in Supabase
 */
export interface SourceData {
  title: string;
  description?: string;
  url?: string;
  type: "pdf" | "image" | "youtube" | "audio";
  spaceId: string;
  userId: string;
}

/**
 * Interface for source processing result
 */
export interface SourceProcessingResult {
  sourceId: string;
  title: string;
  description: string;
  chunkCount: number;
  success: boolean;
  error?: string;
}

// --------------------------
// Utility Functions
// --------------------------

/**
 * Uploads a file to Gemini AI for processing
 *
 * @param filePath Path to the file on the server
 * @param mimeType MIME type of the file
 * @returns The uploaded file reference
 */
async function uploadToGemini(filePath: string, mimeType: string) {
  try {
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: path.basename(filePath),
    });

    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
  } catch (error) {
    console.error("Error uploading file to Gemini:", error);
    throw new Error("Failed to upload file to Gemini AI");
  }
}

/**
 * Waits for uploaded files to be processed and active
 *
 * @param files Array of file references to wait for
 */
async function waitForFilesActive(files: any[]) {
  console.log("Waiting for file processing...");

  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);

    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      file = await fileManager.getFile(name);
    }

    if (file.state !== "ACTIVE") {
      throw Error(
        `File ${file.name} failed to process with state: ${file.state}`
      );
    }
  }

  console.log("...all files ready");
}

/**
 * Convert a file to base64 data URL (client-side)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// --------------------------
// Server-side Processing Functions
// --------------------------

/**
 * Processes a PDF file using Gemini AI for OCR (server-side)
 *
 * @param filePath Path to the PDF file
 * @returns Processing result with text chunks and summary
 */
export async function processPDF(filePath: string): Promise<ProcessingResult> {
  // Validate input
  if (!serverApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  try {
    // Upload file to Gemini
    const files = [await uploadToGemini(filePath, "application/pdf")];

    // Wait for file processing
    await waitForFilesActive(files);

    // Initialize model with configuration
    const model = serverGenAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const generationConfig = {
      temperature: 0.3,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          text: {
            type: "array",
            items: {
              type: "string",
            },
          },
          summary: {
            type: "string",
          },
        },
        required: ["text", "summary"],
      },
    };

    // Start a chat session with the model
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: files[0].mimeType,
                fileUri: files[0].uri,
              },
            },
          ],
        },
      ],
    });

    // Send the OCR prompt
    const result = await chatSession.sendMessage(
      "OCR the following page into Markdown.\n" +
        "Mathematical symbols and expressions shall be done in latex. \n" +
        "Do not surround your output with triple backticks.\n\n" +
        "Chunk the document into sections of roughly 250 - 1000 words. Our goal is \n" +
        "to identify parts of the page with same semantic theme. These chunks will \n" +
        'be embedded and used in a RAG pipeline. "text" should have chunk wise strings rather than line wise strings.\n\n' +
        "In the end, create a summary of the document of what's discussed here."
    );

    // Parse and return results
    const response = JSON.parse(result.response.text());
    return {
      text: response.text || [],
      summary: response.summary || "",
    };
  } catch (error) {
    console.error("Error processing PDF with Gemini:", error);
    throw new Error("Failed to process PDF with Gemini AI");
  }
}

/**
 * Processes an image file using Gemini AI for OCR (server-side)
 *
 * @param filePath Path to the image file
 * @returns Processing result with text chunks and summary
 */
export async function processImage(
  filePath: string
): Promise<ProcessingResult> {
  // Image types that are supported
  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const fileExt = path.extname(filePath).toLowerCase();
  let mimeType: string;

  // Determine MIME type from extension
  switch (fileExt) {
    case ".jpg":
    case ".jpeg":
      mimeType = "image/jpeg";
      break;
    case ".png":
      mimeType = "image/png";
      break;
    case ".webp":
      mimeType = "image/webp";
      break;
    case ".gif":
      mimeType = "image/gif";
      break;
    default:
      throw new Error(`Unsupported image format: ${fileExt}`);
  }

  // Process similar to PDF but with image-specific prompt
  try {
    const files = [await uploadToGemini(filePath, mimeType)];

    await waitForFilesActive(files);

    const model = serverGenAI.getGenerativeModel({
      model: "gemini-2.0-pro-vision-exp",
    });

    const generationConfig = {
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          text: {
            type: "array",
            items: {
              type: "string",
            },
          },
          summary: {
            type: "string",
          },
        },
        required: ["text", "summary"],
      },
    };

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: files[0].mimeType,
                fileUri: files[0].uri,
              },
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage(
      "Extract all visible text from this image into Markdown format.\n" +
        "If mathematical symbols or equations are present, use LaTeX notation.\n" +
        "Organize the content by semantic sections if multiple topics are present.\n" +
        "In the 'text' array, include the full extracted content.\n" +
        "In the 'summary' field, provide a brief overview of what's in the image."
    );

    const response = JSON.parse(result.response.text());
    return {
      text: response.text || [],
      summary: response.summary || "",
    };
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    throw new Error("Failed to process image with Gemini AI");
  }
}

/**
 * Processes a YouTube video by fetching its transcript and chunking it (server-side)
 *
 * @param videoId YouTube video ID
 * @returns Processing result with text chunks and a summary
 */
export async function processYouTubeVideo(
  videoId: string
): Promise<ProcessingResult> {
  try {
    // Fetch transcript from YouTube
    const transcript = await youtubeTranscript.default.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      throw new Error("No transcript available for this video");
    }

    // Combine transcript entries into a single text
    const fullText = transcript
      .map((entry) => entry.text)
      .join(" ")
      .replace(/\s+/g, " ");

    if (!serverApiKey) {
      // If Gemini API key is not available, return raw transcript without processing
      return {
        text: [fullText],
        summary:
          "Transcript of YouTube video (summary not available without Gemini AI)",
      };
    }

    // Use Gemini to chunk and summarize the transcript
    const model = serverGenAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const generationConfig = {
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          text: {
            type: "array",
            items: {
              type: "string",
            },
          },
          summary: {
            type: "string",
          },
        },
        required: ["text", "summary"],
      },
    };

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `Here is a transcript from a YouTube video:\n\n${fullText}\n\n` +
                `Please process this transcript into semantic chunks of 250-1000 words each, ` +
                `where each chunk represents a coherent topic or section. ` +
                `Also create a concise summary of the video content.`,
            },
          ],
        },
      ],
      generationConfig,
    });

    const response = JSON.parse(result.response.text());
    return {
      text: response.text || [fullText],
      summary: response.summary || "YouTube video transcript (processed)",
    };
  } catch (error) {
    console.error("Error processing YouTube video:", error);
    throw new Error(
      `Failed to process YouTube video: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Processes audio file by uploading and transcribing it (server-side)
 *
 * @param filePath Path to the audio file
 * @returns Processing result with text chunks and summary
 */
export async function processAudio(
  filePath: string
): Promise<ProcessingResult> {
  // Audio types supported
  const supportedTypes = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg"];
  const fileExt = path.extname(filePath).toLowerCase();
  let mimeType: string;

  // Determine MIME type from extension
  switch (fileExt) {
    case ".mp3":
      mimeType = "audio/mp3";
      break;
    case ".wav":
      mimeType = "audio/wav";
      break;
    case ".ogg":
      mimeType = "audio/ogg";
      break;
    default:
      throw new Error(`Unsupported audio format: ${fileExt}`);
  }

  try {
    // Upload audio file to Gemini
    const files = [await uploadToGemini(filePath, mimeType)];

    await waitForFilesActive(files);

    // Initialize model
    const model = serverGenAI.getGenerativeModel({
      model: "gemini-2.0-pro-vision-exp", // Used for audio as well
    });

    const generationConfig = {
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          text: {
            type: "array",
            items: {
              type: "string",
            },
          },
          summary: {
            type: "string",
          },
        },
        required: ["text", "summary"],
      },
    };

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: files[0].mimeType,
                fileUri: files[0].uri,
              },
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage(
      "Transcribe this audio file.\n" +
        "Divide the transcription into chunks based on topic changes or natural breaks in the conversation.\n" +
        "Provide the full transcription in the 'text' array, with each element containing a logical chunk.\n" +
        "In the 'summary' field, give a brief overview of the audio content."
    );

    const response = JSON.parse(result.response.text());
    return {
      text: response.text || [],
      summary: response.summary || "",
    };
  } catch (error) {
    console.error("Error processing audio with Gemini:", error);
    throw new Error("Failed to process audio with Gemini AI");
  }
}

// --------------------------
// Client-side Processing Functions
// --------------------------

/**
 * Process an image file using Gemini's vision capabilities to extract text (client-side)
 * @param file File to process
 * @returns Array of text chunks and summary from the image
 */
export async function processImageWithGemini(
  file: File
): Promise<{ chunks: string[]; summary: string }> {
  try {
    // Convert the file to base64
    const base64Data = await fileToBase64(file);

    // Initialize the vision model
    const model = clientGenAI.getGenerativeModel({
      model: "gemini-pro-vision",
      safetySettings,
    });

    // Prepare the image for processing
    const image = {
      inlineData: {
        data: base64Data.split(",")[1], // Remove the data URL prefix
        mimeType: file.type,
      },
    };

    // Create the prompt with instructions for OCR and chunking
    const prompt = `
      Extract all text from this image using OCR.
      
      If there are any mathematical expressions or formulas, convert them to LaTeX format.
      
      Break the content into logical chunks based on semantic meaning.
      Each chunk should be between 200-600 words.
      
      Also provide a brief summary of the overall content.
      
      Return the results in the following JSON format:
      {
        "chunks": [
          "chunk 1 text...",
          "chunk 2 text...",
          ...
        ],
        "summary": "Brief summary of the content..."
      }
    `;

    // Generate content from the image
    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch =
      text.match(/```json\n([\s\S]*?)\n```/) ||
      text.match(/```\n([\s\S]*?)\n```/) ||
      text.match(/{[\s\S]*?}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      try {
        const parsed = JSON.parse(jsonStr);
        return {
          chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [text],
          summary: parsed.summary || "No summary provided",
        };
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
        return {
          chunks: [text],
          summary: "Failed to parse structured response",
        };
      }
    }

    // Fallback if JSON parsing fails
    return { chunks: [text], summary: "Unstructured content extracted" };
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    throw error;
  }
}

/**
 * Process a PDF file using Gemini to extract text and structure it (client-side)
 * @param pdfFile PDF file to process
 * @returns Processed text chunks from the PDF
 */
export async function processPdfWithGemini(
  pdfFile: File
): Promise<{ chunks: string[]; summary: string }> {
  // For client-side PDF processing
  // This could be expanded in the future for direct client-side processing

  console.warn(
    "Client-side PDF processing is limited. Consider using server-side processing for PDFs."
  );

  return {
    chunks: [
      "This is a placeholder for PDF content processing from the client side.",
      "For full PDF processing capabilities, use the server-side processPDF function.",
    ],
    summary: "PDF processing from client side (limited functionality)",
  };
}

/**
 * Process YouTube video transcription using Gemini (client-side)
 * @param transcription YouTube video transcription
 * @returns Processed text chunks from the video
 */
export async function processYouTubeTranscriptWithGemini(
  transcription: string
): Promise<{ chunks: string[]; summary: string }> {
  try {
    // Initialize the model
    const model = clientGenAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
    });

    // Create the prompt with instructions for processing transcripts
    const prompt = `
      Process the following YouTube video transcript:
      
      ${transcription.substring(0, 30000)} // Truncate if necessary
      
      Break the transcript into logical chunks based on topic changes or natural breakpoints.
      Each chunk should be between 200-600 words.
      
      Also provide a brief summary of the overall content.
      
      Return the results in the following JSON format:
      {
        "chunks": [
          "chunk 1 text...",
          "chunk 2 text...",
          ...
        ],
        "summary": "Brief summary of the video content..."
      }
    `;

    // Generate content from the transcript
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch =
      text.match(/```json\n([\s\S]*?)\n```/) ||
      text.match(/```\n([\s\S]*?)\n```/) ||
      text.match(/{[\s\S]*?}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      try {
        const parsed = JSON.parse(jsonStr);
        return {
          chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [text],
          summary: parsed.summary || "No summary provided",
        };
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
        return {
          chunks: [text],
          summary: "Failed to parse structured response",
        };
      }
    }

    // Fallback if JSON parsing fails
    return {
      chunks: [text],
      summary: "Unstructured content extracted",
    };
  } catch (error) {
    console.error("Error processing transcript with Gemini:", error);
    throw error;
  }
}

// Compatibility function - maps chunks to text array for consistent interface
export function mapToProcessingResult(result: {
  chunks: string[];
  summary: string;
}): ProcessingResult {
  return {
    text: result.chunks,
    summary: result.summary,
  };
}

/**
 * Process content and store it in Supabase
 *
 * @param filePath Path to the file to process (for PDF, image, audio)
 * @param sourceData Metadata about the source
 * @returns Processing result with source ID and status
 */
export async function processAndStoreSource(
  filePath: string | null,
  sourceData: SourceData
): Promise<SourceProcessingResult> {
  let processingResult: ProcessingResult | null = null;

  try {
    // Process the content based on its type
    switch (sourceData.type) {
      case "pdf":
        if (!filePath)
          throw new Error("File path is required for PDF processing");
        processingResult = await processPDF(filePath);
        break;
      case "image":
        if (!filePath)
          throw new Error("File path is required for image processing");
        processingResult = await processImage(filePath);
        break;
      case "youtube":
        if (!sourceData.url)
          throw new Error("URL is required for YouTube processing");
        const videoId = extractYouTubeVideoId(sourceData.url);
        if (!videoId) throw new Error("Invalid YouTube URL");
        processingResult = await processYouTubeVideo(videoId);
        break;
      case "audio":
        if (!filePath)
          throw new Error("File path is required for audio processing");
        processingResult = await processAudio(filePath);
        break;
      default:
        throw new Error(`Unsupported source type: ${sourceData.type}`);
    }

    // Store the processed content in Supabase
    return await storeProcessedContent(processingResult, sourceData);
  } catch (error) {
    console.error("Error processing and storing source:", error);
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

/**
 * Extract YouTube video ID from URL
 *
 * @param url YouTube video URL
 * @returns Video ID or null if invalid URL
 */
function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
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

/**
 * Generate embeddings for source chunks
 * This could be implemented separately using an embedding model
 *
 * @param sourceId ID of the source to generate embeddings for
 * @returns Success status
 */
export async function generateEmbeddingsForSource(
  sourceId: string
): Promise<boolean> {
  try {
    // 1. Get all chunks for the source
    const { data: chunks, error: fetchError } = await supabase
      .from("source_chunks")
      .select("id, content")
      .eq("source_id", sourceId);

    if (fetchError) throw fetchError;
    if (!chunks || chunks.length === 0) return true;

    // 2. For each chunk, generate an embedding
    // This is a placeholder - you would use an actual embedding model here
    // like OpenAI's embeddings API or a local model

    // Example with a hypothetical embedding function:
    // for (const chunk of chunks) {
    //   const embedding = await generateEmbedding(chunk.content);
    //   await supabase
    //     .from('source_chunks')
    //     .update({ embedding })
    //     .eq('id', chunk.id);
    // }

    return true;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return false;
  }
}

/**
 * Process a client uploaded file and store in Supabase
 *
 * @param file File object from client upload
 * @param sourceData Source metadata
 * @returns Source processing result
 */
export async function processClientFileAndStore(
  file: File,
  sourceData: SourceData
): Promise<SourceProcessingResult> {
  try {
    let result;

    switch (sourceData.type) {
      case "image":
        const imageResult = await processImageWithGemini(file);
        result = mapToProcessingResult(imageResult);
        break;
      case "pdf":
        const pdfResult = await processPdfWithGemini(file);
        result = mapToProcessingResult(pdfResult);
        break;
      default:
        throw new Error(
          `Client-side processing not supported for type: ${sourceData.type}`
        );
    }

    // For client-side processing, we need to call the server to store in Supabase
    // This would typically be an API endpoint that calls storeProcessedContent

    // Example API call (this would need an actual endpoint implementation)
    const response = await fetch("/api/store-source", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        processingResult: result,
        sourceData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to store source: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error processing client file:", error);
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
