-- 0013_goscore_v2.sql
-- =====================================================================
-- GoScore v2 — Incremental Migration (REVIEW ONLY — do NOT auto-run)
-- =====================================================================
-- Source spec:  docs/specs/goscore-v2/goscore-v2-design-doc.md (rev 2)
-- Decisions:    docs/specs/goscore-v2/decisions-locked-2026-05-26.md (D1–D11)
-- Schema baseline: migrations 0001–0012 (unmodified, no DROP/RENAME)
--
-- SAFETY CONTRACT (do not violate without founder approval):
--   1. Uses CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS
--   2. NO DROP TABLE, NO DROP COLUMN, NO RENAME of existing columns
--   3. NO UPDATE on existing rows (no data modification beyond default fills)
--   4. Marked as REVIEW ONLY — do not include in supabase auto-apply pipeline
--      until founder + dev have signed off on naming/policy decisions below
--   5. Naming kept aligned with existing schema; GoScore v2 spec field names
--      (user_id / followed_id / curator_id / likes / start_at) are documented
--      as aliases in the comments — app code maps in src/lib/data accessors
--
-- WHAT THIS MIGRATION ADDS (summary at bottom of file too):
--   - 2 new ENUMs (user_role, photo_tier) — pick_type stays as CHECK constraint
--   - 8 new columns on users (role, voter_reputation, account_status, etc.)
--   - 11 new columns on photos (season_id, current_goscore, peak_goscore,
--     tier, metadata_complete, needs_recompute, curation_bonus, etc.)
--   - 6 new columns on votes (weight, weight_components, is_reciprocal,
--     is_follower, voter_ip_hash, voter_subnet_hash)
--   - 2 new columns on seasons (photos_per_user_limit, is_active)
--   - 1 new column on editor_picks (notes)
--   - 5 new tables (weekly_top3, rank_master_status, rm_achievements,
--     abuse_flags, role_audit_log)
--   - 1 updated trigger function (extend recompute_pick_type to set
--     curation_bonus per D9)
-- =====================================================================

begin;

-- =====================================================================
-- 1. ENUMs (user_role + photo_tier)
--
-- Note: pick_type stays as CHECK constraint on photos.pick_type — already
-- created in 0001 and managed by recompute_pick_type() trigger from 0002.
-- =====================================================================
do $$ begin
  create type public.user_role as enum ('user', 'rank_master', 'voyageur', 'ambassador');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.photo_tier as enum ('pending', 'fresh', 'popular');
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- 2. users — add scoring/role columns
--
-- Existing schema (0001) already has: is_customer, is_ambassador, is_admin,
-- photographer_status, followers_count (from 0010), following_count.
--
-- GoScore v2 adds: role enum (denormalized for fast voter-weight lookup),
-- voter_reputation, account_status, handle (= username alias).
-- =====================================================================
alter table public.users
  add column if not exists role public.user_role not null default 'user',
  add column if not exists voter_reputation float default 1.0
    check (voter_reputation between 0.3 and 2.0),
  add column if not exists account_status text default 'active'
    check (account_status in ('active','suspended','banned'));

-- TODO(founder): confirm denormalization strategy for `role`.
--   Option A: keep role in sync via trigger from is_customer / is_ambassador /
--             rank_master_status.is_active (recommended — single source of truth)
--   Option B: derive role on read (view), keep column out
-- Until decided, app code MUST treat is_customer / is_ambassador booleans
-- as the source of truth and only read `role` for voter-weight lookup
-- after the sync trigger is added.

create index if not exists users_role_idx
  on public.users(role) where role <> 'user';

-- =====================================================================
-- 3. seasons — add quota + active flag
--
-- Existing 0001 schema has: start_date, end_date, status enum-check.
-- GoScore v2 expects start_at / end_at (TIMESTAMPTZ) — app code reads
-- start_date/end_date as date and converts. NO RENAME here.
-- =====================================================================
alter table public.seasons
  add column if not exists photos_per_user_limit integer not null default 12,
  add column if not exists is_active boolean not null default false;

-- TODO(dev): currently seasons.status text already has 'active' value.
--   Sync rule: is_active = (status = 'active'). Decide whether to add trigger
--   or backfill manually when a season opens.

create unique index if not exists seasons_is_active_unique
  on public.seasons(is_active) where is_active = true;

-- =====================================================================
-- 4. photos — add scoring columns
--
-- Existing (0001): pick_type, picked_by, picked_at, likes_count, etc.
-- GoScore v2 expects: user_id (= photographer_id alias), url (= storage_url
-- alias), tags TEXT[], current/peak goscore, tier, metadata_complete, etc.
--
-- We DO NOT rename photographer_id or storage_url — app code maps via
-- accessor layer (src/lib/data/).
-- =====================================================================
alter table public.photos
  add column if not exists season_id uuid references public.seasons(id),
  add column if not exists tags text[],
  add column if not exists current_goscore float not null default 0,
  add column if not exists peak_goscore float not null default 0,
  add column if not exists peak_at timestamptz,
  add column if not exists tier public.photo_tier not null default 'pending',
  add column if not exists metadata_complete boolean not null default false,
  add column if not exists needs_recompute boolean not null default false,
  add column if not exists curation_bonus float not null default 0,
  add column if not exists flagged_for_review boolean not null default false,
  add column if not exists flag_reason text;

-- TODO(dev): `tags` is nullable here for backward-compat with existing rows.
-- Spec §4.1 says CHECK (array_length(tags, 1) >= 3) — add this CHECK only
-- AFTER backfilling tags on existing photos. Do NOT add now or insert will
-- fail on legacy rows.

create index if not exists photos_tier_score_idx
  on public.photos(tier, current_goscore desc) where tier <> 'pending';
create index if not exists photos_needs_recompute_idx
  on public.photos(needs_recompute) where needs_recompute = true;
create index if not exists photos_season_idx
  on public.photos(season_id);

-- =====================================================================
-- 5. votes — add weighted-scoring columns
--
-- Note: GoScore v2 spec calls this `likes` — repo uses `votes`.
-- We extend `votes` rather than create a parallel `likes` table to avoid
-- duplicate data + duplicate triggers (0006 notify_on_vote already wired).
--
-- Existing columns: id, user_id, user_email, photo_id, voted_at, unique(email, photo)
-- =====================================================================
alter table public.votes
  add column if not exists weight float not null default 1.0,
  add column if not exists weight_components jsonb not null default '{}'::jsonb,
  add column if not exists is_reciprocal boolean not null default false,
  add column if not exists is_follower boolean not null default false,
  add column if not exists voter_ip_hash text,
  add column if not exists voter_subnet_hash text;

create index if not exists votes_subnet_voted_idx
  on public.votes(voter_subnet_hash, voted_at desc)
  where voter_subnet_hash is not null;

-- TODO(dev): self-vote prevention.
--   Spec §4.2.1 requires app-layer check voter_id != photo.user_id.
--   Existing UNIQUE(user_email, photo_id) does NOT prevent self-vote.
--   Decide: (a) enforce in app layer (insert_like()), or
--           (b) add a trigger that raises on insert if user_id = photographer_id.
-- Recommended: (a) — keeps DB simple, matches design doc §4.2.1.

-- =====================================================================
-- 6. editor_picks / ambassador_picks — add notes (curator_id is an alias
--    of existing editor_id / ambassador_id; no rename)
-- =====================================================================
alter table public.editor_picks
  add column if not exists notes text;

-- ambassador_picks already has `reason text` from 0001 — spec calls it `notes`,
-- app code can alias. No new column needed.

-- =====================================================================
-- 7. Extend pick_type recompute trigger (from 0002) to also set
--    photos.curation_bonus and photos.needs_recompute, per D9.
--
-- We don't drop the old function — we REPLACE it (safe; same signature).
-- =====================================================================
create or replace function public.recompute_pick_type(p_photo_id uuid)
returns void language plpgsql as $$
declare
  has_editor boolean;
  has_amb boolean;
  new_type text;
  new_bonus float;
begin
  select exists (select 1 from public.editor_picks      where photo_id = p_photo_id) into has_editor;
  select exists (select 1 from public.ambassador_picks  where photo_id = p_photo_id) into has_amb;

  new_type := case
    when has_editor and has_amb then 'both'
    when has_editor then 'editor'
    when has_amb then 'ambassador'
    else 'none'
  end;

  -- D9 mapping: none=0, editor=50, ambassador=50, both=100
  new_bonus := case new_type
    when 'both' then 100
    when 'editor' then 50
    when 'ambassador' then 50
    else 0
  end;

  update public.photos
     set pick_type = new_type,
         picked_at = case when new_type = 'none' then null else now() end,
         curation_bonus = new_bonus,
         needs_recompute = true                -- flag for cron/real-time rescore
   where id = p_photo_id;
end;
$$;

-- Existing triggers tr_editor_picks_pick_type / tr_ambassador_picks_pick_type
-- (created in 0002) call this function — no need to re-create them.

-- =====================================================================
-- 8. weekly_top3 — immutable snapshot for RM qualification audit
-- =====================================================================
create table if not exists public.weekly_top3 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start_date date not null,
  rank integer not null check (rank in (1, 2, 3)),
  total_peak_score float not null,
  snapshot_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create index if not exists weekly_top3_user_week_idx
  on public.weekly_top3(user_id, week_start_date desc);
create index if not exists weekly_top3_week_rank_idx
  on public.weekly_top3(week_start_date desc, rank);

-- =====================================================================
-- 9. rank_master_status — current RM tenure + original-role restore target
-- =====================================================================
create table if not exists public.rank_master_status (
  user_id uuid primary key references public.users(id) on delete cascade,
  promoted_at timestamptz not null default now(),
  qualifying_weeks date[] not null,            -- rolling last 9 weeks (3 cycles)
  active_until_season_id uuid not null references public.seasons(id),
  original_role public.user_role not null default 'user',
  extension_count integer not null default 0,
  is_active boolean not null default true,
  demoted_at timestamptz,
  demote_reason text
);

create index if not exists rank_master_status_active_idx
  on public.rank_master_status(is_active) where is_active = true;

-- =====================================================================
-- 10. rm_achievements — for Voyageur/Ambassador who qualify but keep role
-- =====================================================================
create table if not exists public.rm_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  qualified_at timestamptz not null default now(),
  qualifying_weeks date[] not null
);

create index if not exists rm_achievements_user_idx
  on public.rm_achievements(user_id, qualified_at desc);

-- =====================================================================
-- 11. abuse_flags — audit trail for velocity / reciprocal / EXIF anomalies
-- =====================================================================
create table if not exists public.abuse_flags (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('photo','user','vote')),
  entity_id uuid not null,
  flag_type text not null,                     -- 'velocity' | 'reciprocal' | 'exif_inconsistent' | ...
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution text,
  details jsonb
);

create index if not exists abuse_flags_entity_idx
  on public.abuse_flags(entity_type, entity_id);
create index if not exists abuse_flags_unresolved_idx
  on public.abuse_flags(detected_at desc) where resolved_at is null;

-- =====================================================================
-- 12. role_audit_log — all role transitions (promote/demote/sync)
-- =====================================================================
create table if not exists public.role_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  old_role public.user_role,
  new_role public.user_role not null,
  changed_by uuid references public.users(id),  -- null for system/cron actions
  changed_at timestamptz not null default now(),
  reason text
);

create index if not exists role_audit_log_user_idx
  on public.role_audit_log(user_id, changed_at desc);

-- =====================================================================
-- 13. RLS — placeholder, mirrors existing pattern (TODO: review policies)
--
-- Existing tables in 0001 have RLS enabled with specific policies.
-- The 5 new tables here are admin/cron-only — by default no public access.
-- TODO(dev): add explicit policies before exposing any of these to PostgREST.
-- =====================================================================
alter table public.weekly_top3        enable row level security;
alter table public.rank_master_status enable row level security;
alter table public.rm_achievements    enable row level security;
alter table public.abuse_flags        enable row level security;
alter table public.role_audit_log     enable row level security;

-- TODO(dev): write per-table policies before enabling reads from anon role.
-- Conservative default: only service_role can read/write. Public read can be
-- added selectively (e.g. weekly_top3 for leaderboard page).

commit;

-- =====================================================================
-- POST-MIGRATION CHECKLIST (manual — do not script)
-- =====================================================================
-- [ ] Backfill photos.tags for legacy rows (any row with NULL tags)
-- [ ] Backfill photos.season_id by matching uploaded_at against seasons date range
-- [ ] Backfill photos.metadata_complete based on title/category/tags/location/exif presence
-- [ ] Backfill users.role from is_customer / is_ambassador / photographer_status
-- [ ] Seed the first active season (insert seasons row with is_active = true)
-- [ ] Decide CHECK(array_length(tags,1) >= 3) — apply ONLY after backfill
-- [ ] Write RLS policies for the 5 new tables (currently RLS-enabled but no
--     policies = all access denied by default)
-- [ ] Add per-table indexes that depend on production query patterns once
--     observed (e.g. photos by (user_id, tier, current_goscore) for profile)
-- [ ] Wire booking-DB sync cron (sync_voyageur_status per D10 §4.6.1)
-- [ ] Update src/lib/pulse.ts to consume votes.weight instead of raw count

-- =====================================================================
-- SUMMARY — what 0013_goscore_v2.sql adds
-- =====================================================================
--
-- ENUM TYPES (2 new):
--   - user_role         ('user' | 'rank_master' | 'voyageur' | 'ambassador')
--   - photo_tier        ('pending' | 'fresh' | 'popular')
--
-- TABLES (5 new):
--   - weekly_top3       — immutable weekly snapshot for RM qualification
--   - rank_master_status — current RM tenure, original_role restore target
--   - rm_achievements   — non-role RM qualification record (for Voy/Amb)
--   - abuse_flags       — velocity / reciprocal / exif anomaly audit
--   - role_audit_log    — every role transition (promote / demote / sync)
--
-- COLUMNS ADDED (existing tables):
--   users   +3   role, voter_reputation, account_status
--   seasons +2   photos_per_user_limit, is_active
--   photos +11   season_id, tags, current_goscore, peak_goscore, peak_at,
--                tier, metadata_complete, needs_recompute, curation_bonus,
--                flagged_for_review, flag_reason
--   votes   +6   weight, weight_components, is_reciprocal, is_follower,
--                voter_ip_hash, voter_subnet_hash
--   editor_picks +1   notes
--
-- INDEXES (new): 10 — see body
--
-- FUNCTION REPLACED (signature-compatible):
--   recompute_pick_type(p_photo_id uuid)
--     now also sets photos.curation_bonus (per D9) and
--     photos.needs_recompute = true
--
-- TODO ITEMS LEFT FOR FOUNDER/DEV REVIEW:
--   1. users.role denormalization sync strategy (A vs B)
--   2. seasons.is_active backfill vs trigger from seasons.status
--   3. photos.tags CHECK constraint — apply only after backfill
--   4. Self-vote prevention layer (app vs DB trigger)
--   5. RLS policies on 5 new tables (currently RLS-enabled, all-denied)
--
-- DO NOT auto-run on production. This migration is review-only until the
-- TODO items above are resolved.
-- =====================================================================
