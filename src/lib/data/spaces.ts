import { supabase } from '@/lib/supabase';

// This is a local storage implementation for demo purposes
// In a real app, this would fetch data from a database

export interface Space {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  backdrop?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Note {
  id: string;
  space_id: string;
  title: string;
  content: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Source {
  id: string;
  space_id: string;
  name: string;
  type: "pdf" | "image" | "audio" | "youtube" | "text";
  url?: string;
  filepath?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Chunk {
  id: string;
  source_id: string;
  content: string;
  tags?: string[];
  metadata?: {
    page?: number;
    startTime?: number;
    endTime?: number;
    [key: string]: any;
  };
  created_at: Date;
  updated_at: Date;
}

// Mock data
const initialSpaces: Space[] = [
  {
    id: "space-1",
    name: "Machine Learning",
    description: "Notes and resources about machine learning algorithms and techniques",
    icon: "🧠",
    backdrop: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop",
    tags: ["AI", "ML", "Data Science"],
    created_at: new Date("2023-01-15"),
    updated_at: new Date("2023-03-20"),
  },
  {
    id: "space-2",
    name: "Web Development",
    description: "Frontend and backend web development resources",
    icon: "🌐",
    backdrop: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&auto=format&fit=crop",
    tags: ["React", "Next.js", "TypeScript"],
    created_at: new Date("2023-02-10"),
    updated_at: new Date("2023-04-05"),
  },
  {
    id: "space-3",
    name: "Book Notes",
    description: "Notes from books I've read",
    icon: "📚",
    backdrop: "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=800&auto=format&fit=crop",
    tags: ["Books", "Reading", "Notes"],
    created_at: new Date("2023-03-22"),
    updated_at: new Date("2023-05-18"),
  },
];

// Helper function to get data from localStorage or use initial data
const getLocalData = <T>(key: string, initialData: T[]): T[] => {
  if (typeof window === "undefined") return initialData;
  
  const storedData = localStorage.getItem(key);
  return storedData ? JSON.parse(storedData) : initialData;
};

// Helper function to save data to localStorage
const saveLocalData = <T>(key: string, data: T[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

// Spaces CRUD operations
export async function getSpaces(): Promise<Space[]> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching spaces:', error);
    return [];
  }
  
  return data || [];
}

export async function getSpaceById(id: string): Promise<Space | null> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching space ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function createSpace(data: Omit<Space, "id" | "created_at" | "updated_at">): Promise<Space> {
  const { data: space, error } = await supabase
    .from('spaces')
    .insert([data])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating space:', error);
    throw new Error('Failed to create space');
  }
  
  return space;
}

export async function updateSpace(id: string, data: Partial<Omit<Space, "id" | "created_at" | "updated_at">>): Promise<Space | null> {
  const { data: space, error } = await supabase
    .from('spaces')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating space ${id}:`, error);
    throw new Error('Failed to update space');
  }
  
  return space;
}

export async function deleteSpace(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting space ${id}:`, error);
    return false;
  }
  
  return true;
}

// Notes CRUD operations
export async function getNotesBySpaceId(spaceId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(`Error fetching notes for space ${spaceId}:`, error);
    return [];
  }
  
  return data || [];
}

export async function getNoteById(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching note ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function createNote(data: Omit<Note, "id" | "created_at" | "updated_at">): Promise<Note> {
  const { data: note, error } = await supabase
    .from('notes')
    .insert([data])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note');
  }
  
  return note;
}

export async function updateNote(id: string, data: Partial<Omit<Note, "id" | "created_at" | "updated_at">>): Promise<Note | null> {
  const { data: note, error } = await supabase
    .from('notes')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating note ${id}:`, error);
    throw new Error('Failed to update note');
  }
  
  return note;
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting note ${id}:`, error);
    return false;
  }
  
  return true;
}

// Sources CRUD operations
export async function getSourcesBySpaceId(spaceId: string): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(`Error fetching sources for space ${spaceId}:`, error);
    return [];
  }
  
  return data || [];
}

export async function getSourceById(id: string): Promise<Source | null> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching source ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function createSource(data: Omit<Source, "id" | "created_at" | "updated_at">): Promise<Source> {
  const { data: source, error } = await supabase
    .from('sources')
    .insert([data])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating source:', error);
    throw new Error('Failed to create source');
  }
  
  return source;
}

export async function updateSource(id: string, data: Partial<Omit<Source, "id" | "created_at" | "updated_at">>): Promise<Source | null> {
  const { data: source, error } = await supabase
    .from('sources')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating source ${id}:`, error);
    throw new Error('Failed to update source');
  }
  
  return source;
}

export async function deleteSource(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting source ${id}:`, error);
    return false;
  }
  
  return true;
}

// Chunks CRUD operations
export async function getChunksBySourceId(sourceId: string): Promise<Chunk[]> {
  const { data, error } = await supabase
    .from('chunks')
    .select('*')
    .eq('source_id', sourceId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error(`Error fetching chunks for source ${sourceId}:`, error);
    return [];
  }
  
  return data || [];
}

export async function getChunkById(id: string): Promise<Chunk | null> {
  const { data, error } = await supabase
    .from('chunks')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching chunk ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function createChunk(data: Omit<Chunk, "id" | "created_at" | "updated_at">): Promise<Chunk> {
  const { data: chunk, error } = await supabase
    .from('chunks')
    .insert([data])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating chunk:', error);
    throw new Error('Failed to create chunk');
  }
  
  return chunk;
}

export async function updateChunk(id: string, data: Partial<Omit<Chunk, "id" | "created_at" | "updated_at">>): Promise<Chunk | null> {
  const { data: chunk, error } = await supabase
    .from('chunks')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating chunk ${id}:`, error);
    throw new Error('Failed to update chunk');
  }
  
  return chunk;
}

export async function deleteChunk(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('chunks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting chunk ${id}:`, error);
    return false;
  }
  
  return true;
} 