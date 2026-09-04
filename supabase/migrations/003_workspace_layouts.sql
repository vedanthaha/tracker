create table public.workspace_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  surface text not null,
  layout_spec jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Unique constraint so a user only has one active layout per surface
alter table public.workspace_layouts add constraint unique_user_surface unique (user_id, surface);

-- RLS
alter table public.workspace_layouts enable row level security;

create policy "Users can view their own layouts"
  on public.workspace_layouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own layouts"
  on public.workspace_layouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own layouts"
  on public.workspace_layouts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own layouts"
  on public.workspace_layouts for delete
  using (auth.uid() = user_id);

-- Optional trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.workspace_layouts
  for each row
  execute function public.handle_updated_at();
