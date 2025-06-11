-- Create knowledge_base table for storing user documents and text content
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT, -- Path to file in Supabase Storage
  file_type TEXT NOT NULL DEFAULT 'text/plain',
  tags TEXT[] DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}', -- For size, views, category, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_metadata ON knowledge_base USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_title ON knowledge_base(title);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content ON knowledge_base USING GIN(to_tsvector('english', content));

-- Enable full-text search on title and content
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON knowledge_base 
USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_base_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Users can only access their own knowledge items
CREATE POLICY "Users can view own knowledge items" ON knowledge_base
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge items" ON knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge items" ON knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge items" ON knowledge_base
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for knowledge documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-docs', 'knowledge-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for knowledge documents
CREATE POLICY "Users can upload knowledge docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'knowledge-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own knowledge docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'knowledge-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own knowledge docs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'knowledge-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own knowledge docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'knowledge-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  ); 