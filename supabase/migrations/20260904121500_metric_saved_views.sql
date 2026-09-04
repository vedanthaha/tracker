CREATE TABLE IF NOT EXISTS public.metric_saved_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.metric_saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own metric saved views"
    ON public.metric_saved_views
    FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS metric_saved_views_user_id_idx ON public.metric_saved_views(user_id);
