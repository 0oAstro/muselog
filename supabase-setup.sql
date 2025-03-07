-- Enable Supabase Auth
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION postgres;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  backdrop TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.space_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, tag_name)
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  type TEXT NOT NULL, -- 'pdf', 'image', 'youtube', 'audio'
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.source_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(1536), -- For similarity search if using embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, chunk_index)
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_chunks ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Space policies
CREATE POLICY "Users can view own spaces" ON public.spaces
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own spaces" ON public.spaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own spaces" ON public.spaces
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own spaces" ON public.spaces
  FOR DELETE USING (auth.uid() = user_id);

-- Space tags policies
CREATE POLICY "Users can view own space tags" ON public.space_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.spaces 
      WHERE spaces.id = space_tags.space_id AND spaces.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can insert own space tags" ON public.space_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.spaces 
      WHERE spaces.id = space_tags.space_id AND spaces.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can delete own space tags" ON public.space_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.spaces 
      WHERE spaces.id = space_tags.space_id AND spaces.user_id = auth.uid()
    )
  );

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Sources policies
CREATE POLICY "Users can view own sources" ON public.sources
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own sources" ON public.sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own sources" ON public.sources
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own sources" ON public.sources
  FOR DELETE USING (auth.uid() = user_id);

-- Source chunks policies
CREATE POLICY "Users can view own source chunks" ON public.source_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sources 
      WHERE sources.id = source_chunks.source_id AND sources.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can insert own source chunks" ON public.source_chunks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sources 
      WHERE sources.id = source_chunks.source_id AND sources.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can delete own source chunks" ON public.source_chunks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sources 
      WHERE sources.id = source_chunks.source_id AND sources.user_id = auth.uid()
    )
  );

-- Create function for handling new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable OAuth providers (Google & GitHub)
-- Note: This is just a reminder. You need to enable these providers in the Supabase dashboard.
-- 1. Go to Authentication > Providers
-- 2. Enable Google and GitHub
-- 3. Add the necessary credentials (Client ID and Client Secret) 