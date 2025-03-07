import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import youtubeTranscript from "youtube-transcript";

// API key is loaded from environment variables
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

/**
 * Interface for OCR result containing text chunks and a summary
 */
export interface OCRResult {
  text: string[];
  summary: string;
}

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
      throw Error(`File ${file.name} failed to process with state: ${file.state}`);
    }
  }
  
  console.log("...all files ready");
}

/**
 * Processes a PDF file using Gemini AI for OCR
 * 
 * @param filePath Path to the PDF file
 * @returns OCR result with text chunks and summary
 */
export async function processPDF(filePath: string): Promise<OCRResult> {
  // Validate input
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  
  try {
    // Upload file to Gemini
    const files = [
      await uploadToGemini(filePath, "application/pdf"),
    ];
    
    // Wait for file processing
    await waitForFilesActive(files);
    
    // Initialize model with configuration
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
      "be embedded and used in a RAG pipeline. \"text\" should have chunk wise strings rather than line wise strings.\n\n" +
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
 * Processes an image file using Gemini AI for OCR
 * 
 * @param filePath Path to the image file
 * @returns OCR result with text chunks and summary
 */
export async function processImage(filePath: string): Promise<OCRResult> {
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
    const files = [
      await uploadToGemini(filePath, mimeType),
    ];
    
    await waitForFilesActive(files);
    
    const model = genAI.getGenerativeModel({
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
 * Processes a YouTube video by fetching its transcript and chunking it
 * 
 * @param videoId YouTube video ID
 * @returns OCR result with text chunks and a summary
 */
export async function processYouTubeVideo(videoId: string): Promise<OCRResult> {
  try {
    // Fetch transcript from YouTube
    const transcript = await youtubeTranscript.default.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      throw new Error("No transcript available for this video");
    }
    
    // Combine transcript entries into a single text
    const fullText = transcript
      .map(entry => entry.text)
      .join(" ")
      .replace(/\s+/g, " ");
    
    if (!apiKey) {
      // If Gemini API key is not available, return raw transcript without processing
      return {
        text: [fullText],
        summary: "Transcript of YouTube video (summary not available without Gemini AI)",
      };
    }
    
    // Use Gemini to chunk and summarize the transcript
    const model = genAI.getGenerativeModel({
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
                `Also create a concise summary of the video content.`
            }
          ]
        }
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
    throw new Error(`Failed to process YouTube video: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Processes audio file by uploading and transcribing it
 * 
 * @param filePath Path to the audio file
 * @returns OCR result with text chunks and summary
 */
export async function processAudio(filePath: string): Promise<OCRResult> {
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
    const files = [
      await uploadToGemini(filePath, mimeType),
    ];
    
    await waitForFilesActive(files);
    
    // Initialize model
    const model = genAI.getGenerativeModel({
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