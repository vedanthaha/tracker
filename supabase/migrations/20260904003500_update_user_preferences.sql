alter table user_preferences
add column active_clock_id text not null default 'matrix',
add column active_font text not null default 'Inter';
