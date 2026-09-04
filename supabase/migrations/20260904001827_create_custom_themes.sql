create table public.custom_themes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    theme_json jsonb not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.custom_themes enable row level security;

-- Create policies for strict user isolation
create policy "Users can view their own custom themes"
    on public.custom_themes for select
    using ( auth.uid() = user_id );

create policy "Users can create their own custom themes"
    on public.custom_themes for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own custom themes"
    on public.custom_themes for update
    using ( auth.uid() = user_id )
    with check ( auth.uid() = user_id );

create policy "Users can delete their own custom themes"
    on public.custom_themes for delete
    using ( auth.uid() = user_id );

-- Update trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_custom_themes_updated_at
    before update on public.custom_themes
    for each row
    execute procedure public.handle_updated_at();
