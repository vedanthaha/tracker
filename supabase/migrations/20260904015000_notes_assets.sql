-- 1. Create table note_assets
CREATE TABLE IF NOT EXISTS note_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT NOT NULL,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_note_assets_note_id ON note_assets(note_id);
CREATE INDEX IF NOT EXISTS idx_note_assets_user_id ON note_assets(user_id);

-- RLS
ALTER TABLE note_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own note assets"
    ON note_assets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note assets"
    ON note_assets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own note assets"
    ON note_assets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note assets"
    ON note_assets FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Create Supabase Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-assets', 'note-assets', false) 
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- We scope access based on the folder path which is defined as: {user_id}/{note_id}/{asset_id}.ext
CREATE POLICY "Users can view their own note assets in storage"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'note-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can insert their own note assets in storage"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'note-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own note assets in storage"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'note-assets' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'note-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own note assets in storage"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'note-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
