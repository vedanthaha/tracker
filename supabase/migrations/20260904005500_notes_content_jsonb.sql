-- Drop the existing text default first so Postgres can safely cast the column
ALTER TABLE public.notes ALTER COLUMN content DROP DEFAULT;

-- Alter notes content column to jsonb safely
ALTER TABLE public.notes
ALTER COLUMN content TYPE jsonb
USING CASE 
    WHEN content = '' THEN '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
    WHEN content LIKE '{%' THEN content::jsonb
    ELSE jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
            jsonb_build_object(
                'type', 'paragraph',
                'content', jsonb_build_array(
                    jsonb_build_object('type', 'text', 'text', content)
                )
            )
        )
    )
END;

-- Set the new jsonb default
ALTER TABLE public.notes ALTER COLUMN content SET DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb;
