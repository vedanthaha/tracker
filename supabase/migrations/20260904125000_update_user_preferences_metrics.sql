alter table user_preferences
add column metric_preferences jsonb default '{}'::jsonb;
