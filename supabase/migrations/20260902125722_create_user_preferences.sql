create extension if not exists moddatetime schema extensions;

create table user_preferences (
  user_id uuid references auth.users not null primary key,
  active_theme_id text not null default 'dailys-default',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_preferences enable row level security;

create policy "Users can view their own preferences."
  on user_preferences for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own preferences."
  on user_preferences for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own preferences."
  on user_preferences for update
  using ( auth.uid() = user_id );

create trigger handle_updated_at before update on user_preferences
  for each row execute procedure moddatetime (updated_at);
