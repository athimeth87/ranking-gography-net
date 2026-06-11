-- (Feature) Cover reposition — let users set the focal point of their cover banner
-- without re-cropping or re-uploading. Stored as a CSS object-position string,
-- e.g. '50% 30%'. NULL/empty falls back to centre ('50% 50%') at render time.
-- Updating it relies on the existing users self-update RLS policy (same one that
-- already allows changing cover_url), so no new policy is needed.
-- NOTE: apply on Supabase (supabase db push / SQL editor) for this to take effect.

alter table public.users
  add column if not exists cover_position text;
