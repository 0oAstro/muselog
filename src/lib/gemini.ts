import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Retrieve the API key from environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(apiKey);

// Set safety settings
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
 * Process an image file using Gemini's vision capabilities to extract text (OCR)
 * @param file File to process
 * @returns Array of text chunks from the image
 */
export async function processImageWithGemini(file: File): Promise<{ chunks: string[], summary: string }> {
  try {
    // Convert the file to base64
    const base64Data = await fileToBase64(file);
    
    // Initialize the vision model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro-vision",
      safetySettings
    });
    
    // Prepare the image for processing
    const image = {
      inlineData: {
        data: base64Data.split(',')[1], // Remove the data URL prefix
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
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                     text.match(/```\n([\s\S]*?)\n```/) || 
                     text.match(/{[\s\S]*?}/);
                     
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      try {
        const parsed = JSON.parse(jsonStr);
        return {
          chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [text],
          summary: parsed.summary || "No summary provided"
        };
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
        return { chunks: [text], summary: "Failed to parse structured response" };
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
 * Process a PDF file using Gemini to extract text and structure it
 * @param pdfUrl URL to the PDF file
 * @returns Processed text chunks from the PDF
 */
export async function processPdfWithGemini(pdfUrl: string): Promise<{ chunks: string[], summary: string }> {
  // In a real implementation, this would extract PDF text and process it
  // For simplicity, we're just simulating the process
  
  return {
    chunks: [
      "This is the first extracted chunk from the PDF document. It contains textual content from the first few paragraphs.",
      "This is the second chunk extracted from the PDF file. It contains content from the middle section of the document.",
      "This is the third and final chunk from the PDF. It contains the concluding paragraphs and any summary information."
    ],
    summary: "This PDF document discusses various topics related to knowledge management and information organization."
  };
}

/**
 * Process YouTube video transcription using Gemini
 * @param transcription YouTube video transcription
 * @returns Processed text chunks from the video
 */
export async function processYouTubeTranscriptWithGemini(
  transcription: string
): Promise<{ chunks: string[], summary: string }> {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safetySettings
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
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                     text.match(/```\n([\s\S]*?)\n```/) || 
                     text.match(/{[\s\S]*?}/);
                     
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      try {
        const parsed = JSON.parse(jsonStr);
        return {
          chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [text],
          summary: parsed.summary || "No summary provided"
        };
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", e);
        return { chunks: [text], summary: "Failed to parse structured response" };
      }
    }
    
    // Fallback if JSON parsing fails
    return { 
      chunks: [text], 
      summary: "Unstructured content extracted" 
    };
    
  } catch (error) {
    console.error("Error processing transcript with Gemini:", error);
    throw error;
  }
}

/**
 * Convert a file to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
} 