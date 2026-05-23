-- =====================================================================
-- PROTOTYPE SETUP — minimal schema for the JS prototype (nextjs/)
-- Scope: auth + likes only. Photos remain mocked in lib/data.js.
-- This is SEPARATE from migrations 0001-0005 which target the
-- production TypeScript rebuild (src/).
-- =====================================================================

-- One row per (user, photo) like. photo_id is TEXT to match mock IDs
-- like 'p001', 'p010' from nextjs/lib/data.js.
create table if not exists public.prototype_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_id text not null,
  liked_at timestamptz default now(),
  primary key (user_id, photo_id)
);

create index if not exists prototype_likes_photo_idx on public.prototype_likes(photo_id);
create index if not exists prototype_likes_user_idx on public.prototype_likes(user_id);

-- RLS — anyone can see like counts, owners modify their own likes.
alter table public.prototype_likes enable row level security;

create policy prototype_likes_select_public
  on public.prototype_likes for select
  using (true);

create policy prototype_likes_insert_own
  on public.prototype_likes for insert
  with check (user_id = auth.uid());

create policy prototype_likes_delete_own
  on public.prototype_likes for delete
  using (user_id = auth.uid());

-- =====================================================================
-- Done.
-- After running this, the PhotoCard heart button will use this table
-- (with localStorage as guest fallback).
-- =====================================================================
