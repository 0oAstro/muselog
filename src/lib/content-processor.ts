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
import { PrismaClient } from "@prisma/client";

// API keys loaded from environment variables
const serverApiKey = process.env.GEMINI_API_KEY || "";
const clientApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Initialize the Prisma client
const prisma = new PrismaClient();

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
 * Interface for source data to store using Prisma
 */
export interface SourceData {
  name: string;
  description?: string;
  url?: string;
  filepath?: string;
  type: "pdf" | "image" | "youtube" | "audio" | "text";
  tags?: string[];
  spaceId: string;
  userId?: string; // Optional as Space relation already has userId
  metadata?: Record<string, any>;
}

/**
 * Interface for source processing result
 */
export interface SourceProcessingResult {
  sourceId: string;
  name: string;
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
      generationConfig,
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
      ]
    });

    const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  const { GoogleAIFileManager } = require("@google/generative-ai/server");
  
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const fileManager = new GoogleAIFileManager(apiKey);
  
  /**
   * Uploads the given file to Gemini.
   *
   * See https://ai.google.dev/gemini-api/docs/prompting_with_media
   */
  async function uploadToGemini(path, mimeType) {
    const uploadResult = await fileManager.uploadFile(path, {
      mimeType,
      displayName: path,
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
  }
  
  /**
   * Waits for the given files to be active.
   *
   * Some files uploaded to the Gemini API need to be processed before they can
   * be used as prompt inputs. The status can be seen by querying the file's
   * "state" field.
   *
   * This implementation uses a simple blocking polling loop. Production code
   * should probably employ a more sophisticated approach.
   */
  async function waitForFilesActive(files) {
    console.log("Waiting for file processing...");
    for (const name of files.map((file) => file.name)) {
      let file = await fileManager.getFile(name);
      while (file.state === "PROCESSING") {
        process.stdout.write(".")
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        file = await fileManager.getFile(name)
      }
      if (file.state !== "ACTIVE") {
        throw Error(`File ${file.name} failed to process`);
      }
    }
    console.log("...all files ready\n");
  }
  
  const model = genAI.getGenerativeModel({
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
            type: "string"
          }
        },
        summary: {
          type: "string"
        }
      },
      required: [
        "text",
        "summary"
      ]
    },
  };
  
  async function run() {
    // TODO Make these files available on the local file system
    // You may need to update the file paths
    const files = [
      await uploadToGemini("2402-PYL101_Lecture-4_Agnihotri.pdf", "application/pdf"),
    ];
  
    // Some files have a processing delay. Wait for them to be ready.
    await waitForFilesActive(files);
  
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
  
    const result = await chatSession.sendMessage("OCR the following page into Markdown.\\nMathematical symbols and expressions shall be done in latex. \\nDo not sorround your output with triple backticks.\\n\\nChunk the document into sections of roughly 250 - 1000 words. Our goal is \\nto identify parts of the page with same semantic theme. These chunks will \\nbe embedded and used in a RAG pipeline.  \\\"text\\\" should have chunk wise strings rather than line wise strings.\\n\\nIn the end, create a summary of the document of what's discussed here.");
    console.log(result.response.text());
  }
  
  run();

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
      text.match(/```\n([\\s\S]*?)\n```/) ||
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
 * Process content and store it in database using Prisma
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
      case "text":
        // Handle plain text source
        processingResult = {
          text: sourceData.description
            ? [sourceData.description]
            : ["Text content not provided"],
          summary: sourceData.description?.substring(0, 200) || "Text source",
        };
        break;
      default:
        throw new Error(`Unsupported source type: ${sourceData.type}`);
    }

    // Store the processed content using Prisma
    return await storeProcessedContentWithPrisma(processingResult, sourceData);
  } catch (error) {
    console.error("Error processing and storing source:", error);
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

/**
 * Generate embeddings for source chunks using Prisma
 *
 * @param sourceId ID of the source to generate embeddings for
 * @returns Success status
 */
export async function generateEmbeddingsForSource(
  sourceId: string
): Promise<boolean> {
  try {
    // 1. Get all chunks for the source
    const chunks = await prisma.chunk.findMany({
      where: { sourceId: sourceId },
      select: { id: true, content: true },
    });

    if (chunks.length === 0) return true;

    // 2. For each chunk, generate an embedding and update it
    // This is a placeholder - you would use an actual embedding model here
    // like OpenAI's embeddings API or a local model

    // Example with a hypothetical embedding function:
    // for (const chunk of chunks) {
    //   const embedding = await generateEmbedding(chunk.content);
    //
    //   // Convert embedding to Buffer for storage in Prisma's Bytes type
    //   const embeddingBuffer = Buffer.from(
    //     new Float32Array(embedding).buffer
    //   );
    //
    //   await prisma.chunk.update({
    //     where: { id: chunk.id },
    //     data: {
    //       embedding: embeddingBuffer,
    //       vectorId: `vec_${chunk.id}` // If using external vector DB
    //     }
    //   });
    // }

    return true;
  } catch (error) {
    console.error("Error generating embeddings with Prisma:", error);
    return false;
  }
}

/**
 * Process a client uploaded file and store using Prisma
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

    // For client-side processing, call the API endpoint that uses Prisma
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
      name: sourceData.name,
      description: sourceData.description || "",
      chunkCount: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create citations for chunks that match a query
 *
 * @param query Search query
 * @param messageId ID of the message to associate citations with
 * @param spaceId Limit search to a specific space
 * @returns Array of created citations
 */
export async function createCitationsForQuery(
  query: string,
  messageId: string,
  spaceId: string
): Promise<any[]> {
  try {
    // This is a placeholder for a more sophisticated search mechanism
    // In a real implementation, you would:
    // 1. Generate an embedding for the query
    // 2. Perform vector search for similar chunks
    // 3. Create citations for the most relevant chunks

    // Example implementation using naive text search:
    const chunks = await prisma.chunk.findMany({
      where: {
        content: {
          search: query.split(" ").join(" & "), // Basic text search
        },
        source: {
          spaceId: spaceId,
        },
      },
      take: 3, // Limit to top 3 results
      include: {
        source: true,
      },
    });

    // Create citations for each matching chunk
    const citations = await Promise.all(
      chunks.map(async (chunk, index) => {
        // Calculate a basic relevance score (better in real vector search)
        const relevanceScore = 1.0 - index * 0.2; // Simple scoring: 1.0, 0.8, 0.6...

        return prisma.citation.create({
          data: {
            relevanceScore,
            chunk: { connect: { id: chunk.id } },
            message: { connect: { id: messageId } },
          },
        });
      })
    );

    return citations;
  } catch (error) {
    console.error("Error creating citations:", error);
    return [];
  }
}