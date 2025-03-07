// Import base types from Prisma client once
import type {
  Space as PrismaSpace,
  Source as PrismaSource,
  Note as PrismaNote,
  User as PrismaUser,
  Chat as PrismaChat,
  ChatMessage as PrismaChatMessage,
  Chunk as PrismaChunk,
  Citation as PrismaCitation,
} from "@prisma/client";

// Re-export base types for use when relationships aren't needed
export type {
  Space as BaseSpace,
  Source as BaseSource,
  Note as BaseNote,
  User as BaseUser,
  Chat as BaseChat,
  ChatMessage as BaseChatMessage,
  Chunk as BaseChunk,
  Citation as BaseCitation,
} from "@prisma/client";

// Extended types with relationships - these match the schema structure

export interface User extends PrismaUser {
  spaces?: Space[];
  sources?: Source[];
  notes?: Note[];
  chunks?: Chunk[];
}

export interface Space extends PrismaSpace {
  user?: User;
  sources?: Source[];
  notes?: Note[];
  chats?: Chat[];
}

export interface Source extends PrismaSource {
  space?: Space;
  user?: User;
  chunks?: Chunk[];
}

export interface Note extends PrismaNote {
  space?: Space;
  user?: User;
}

export interface Chunk extends PrismaChunk {
  source?: Source;
  user?: User;
  citations?: Citation[];
}

export interface Chat extends PrismaChat {
  space?: Space;
  messages?: ChatMessage[];
}

export interface ChatMessage extends PrismaChatMessage {
  chat?: Chat;
  citations?: Citation[];
}

export interface Citation extends PrismaCitation {
  chunk?: Chunk;
  message?: ChatMessage;
}

// Type for embedding vectors - ensures proper typing for pgvector compatibility
export type EmbeddingVector = number[];

// Types for more specialized metadata
export interface SourceMetadata {
  title?: string;
  author?: string;
  publishedDate?: string;
  numPages?: number;
  duration?: number;
  thumbnail?: string;
  [key: string]: any;
}

export interface ChunkMetadata {
  page?: number;
  startTime?: number;
  endTime?: number;
  position?: number;
  section?: string;
  [key: string]: any;
}

// Exported types for API requests/responses
export type CreateSpaceInput = Omit<
  Space,
  "id" | "createdAt" | "updatedAt" | "userId"
>;
export type UpdateSpaceInput = Partial<
  Omit<Space, "id" | "createdAt" | "updatedAt" | "userId">
>;

export type CreateSourceInput = Omit<
  Source,
  "id" | "createdAt" | "updatedAt" | "userId"
>;
export type UpdateSourceInput = Partial<
  Omit<Source, "id" | "createdAt" | "updatedAt" | "userId">
>;

export type CreateNoteInput = Omit<
  Note,
  "id" | "createdAt" | "updatedAt" | "userId"
>;
export type UpdateNoteInput = Partial<
  Omit<Note, "id" | "createdAt" | "updatedAt" | "userId">
>;
