alter table public.users
add column if not exists social_twitter text,
add column if not exists social_instagram text,
add column if not exists social_facebook text;
