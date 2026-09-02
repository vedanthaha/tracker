-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the design_knowledge table
create table public.design_knowledge (
  id text primary key,
  type text not null, -- e.g., 'design_skill', 'component', 'design_rule', 'layout_pattern'
  title text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536), -- 1536 is standard for OpenAI text-embedding-3-small
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.design_knowledge enable row level security;

-- Design knowledge is globally readable by authenticated users (it's our app's canonical context)
create policy "Design knowledge is readable by authenticated users"
  on public.design_knowledge for select
  using (auth.role() = 'authenticated');

-- Only admins/service roles can insert/update/delete (handled via service key in backend)
-- No insert/update policies for normal users

-- Create a function for similarity search
create or replace function match_design_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  type text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    design_knowledge.id,
    design_knowledge.type,
    design_knowledge.title,
    design_knowledge.content,
    design_knowledge.metadata,
    1 - (design_knowledge.embedding <=> query_embedding) as similarity
  from design_knowledge
  where 1 - (design_knowledge.embedding <=> query_embedding) > match_threshold
  order by design_knowledge.embedding <=> query_embedding
  limit match_count;
$$;
