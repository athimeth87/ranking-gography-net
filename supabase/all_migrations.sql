-- 0001_init_schema.sql
-- Tables + indexes + RLS policies for Gography Photo Awards.
-- Apply via Supabase SQL Editor or `supabase db push`.

-- =====================================================================
-- Extensions
-- =====================================================================
create extension if not exists "pgcrypto";

-- =====================================================================
-- Helper: shared updated_at trigger
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- users  (extends auth.users)
-- =====================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique not null,
  display_name text,
  bio text,
  location text,
  avatar_url text,
  cover_url text,

  is_admin boolean default false,
  is_super_admin boolean default false,
  is_customer boolean default false,
  is_ambassador boolean default false,
  photographer_status text default 'none'
    check (photographer_status in ('none','pending','approved','rejected','suspended')),

  portfolio_url text,
  photographer_applied_at timestamptz,
  photographer_approved_at timestamptz,
  photographer_approved_by uuid references public.users(id),
  photographer_reject_reason text,

  customer_marked_by uuid references public.users(id),
  customer_marked_at timestamptz,
  customer_tier text check (customer_tier in ('first-trip','returning','vip')),
  customer_note text,

  ambassador_invited_by uuid references public.users(id),
  ambassador_invited_at timestamptz,
  ambassador_bio text,

  favorites_visibility text default 'private' check (favorites_visibility in ('public','private')),

  suspended_until timestamptz,
  email_verified boolean default false,

  notif_email_like boolean default true,
  notif_email_comment boolean default true,
  notif_email_pick boolean default true,
  notif_email_weekly_digest boolean default false,
  notif_email_newsletter boolean default false,

  theme_preference text default 'system' check (theme_preference in ('light','dark','system')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen_at timestamptz
);

create unique index if not exists users_username_lower_idx on public.users(lower(username));
create index if not exists users_is_customer_idx on public.users(is_customer) where is_customer = true;
create index if not exists users_is_ambassador_idx on public.users(is_ambassador) where is_ambassador = true;
create index if not exists users_photographer_idx on public.users(photographer_status) where photographer_status = 'approved';

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- =====================================================================
-- photos
-- =====================================================================
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.users(id),

  title text not null,
  slug text not null,
  description text,
  category text not null check (category in ('landscape','portrait','bw')),
  camera text,
  lens text,
  location text,

  exif jsonb,

  storage_url text not null,
  thumbnail_url text,
  medium_url text,
  large_url text,
  file_size integer,
  width integer,
  height integer,

  pick_type text default 'none' check (pick_type in ('none','editor','ambassador','both')),
  picked_by uuid references public.users(id),
  picked_at timestamptz,

  likes_count integer default 0,
  favorites_count integer default 0,
  comments_count integer default 0,
  impressions_count integer default 0,

  is_hidden boolean default false,
  hidden_by uuid references public.users(id),
  hidden_at timestamptz,
  hidden_reason text,

  status text default 'published' check (status in ('draft','published','hidden','removed')),

  uploaded_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists photos_slug_unique on public.photos(slug);
create index if not exists photos_category_idx on public.photos(category) where is_hidden = false and status = 'published';
create index if not exists photos_photographer_idx on public.photos(photographer_id);
create index if not exists photos_uploaded_idx on public.photos(uploaded_at desc) where is_hidden = false;
create index if not exists photos_pick_type_idx on public.photos(pick_type) where pick_type <> 'none';

drop trigger if exists set_photos_updated_at on public.photos;
create trigger set_photos_updated_at before update on public.photos
  for each row execute function public.set_updated_at();

-- =====================================================================
-- votes  (likes — 1 email per photo)
-- =====================================================================
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  user_email text not null,
  photo_id uuid not null references public.photos(id) on delete cascade,
  voted_at timestamptz default now(),
  unique (user_email, photo_id)
);

create index if not exists votes_photo_idx on public.votes(photo_id);
create index if not exists votes_user_idx on public.votes(user_id);
create index if not exists votes_user_email_idx on public.votes(user_email);
create index if not exists votes_voted_at_idx on public.votes(voted_at desc);

-- =====================================================================
-- favorites
-- =====================================================================
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  photo_id uuid not null references public.photos(id) on delete cascade,
  favorited_at timestamptz default now(),
  unique (user_id, photo_id)
);

create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists favorites_photo_idx on public.favorites(photo_id);
create index if not exists favorites_at_idx on public.favorites(favorited_at desc);

-- =====================================================================
-- ambassador_picks  (one row per ambassador per photo)
-- =====================================================================
create table if not exists public.ambassador_picks (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid not null references public.users(id),
  photo_id uuid not null references public.photos(id) on delete cascade,
  picked_at timestamptz default now(),
  reason text,
  unique (ambassador_id, photo_id)
);

create index if not exists ambassador_picks_ambassador_idx on public.ambassador_picks(ambassador_id);
create index if not exists ambassador_picks_photo_idx on public.ambassador_picks(photo_id);

-- =====================================================================
-- editor_picks  (one editor pick per photo)
-- =====================================================================
create table if not exists public.editor_picks (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.users(id),
  photo_id uuid not null references public.photos(id) on delete cascade,
  picked_at timestamptz default now(),
  unique (photo_id)
);

create index if not exists editor_picks_photo_idx on public.editor_picks(photo_id);

-- =====================================================================
-- comments
-- =====================================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references public.users(id),
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  is_hidden boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists comments_photo_idx on public.comments(photo_id) where is_hidden = false;
create index if not exists comments_user_idx on public.comments(user_id);
create index if not exists comments_parent_idx on public.comments(parent_id);

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- =====================================================================
-- photo_reports  (moderation)
-- =====================================================================
create table if not exists public.photo_reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  reporter_id uuid not null references public.users(id),
  reason text not null check (reason in ('inappropriate','copyright','spam','other')),
  detail text,
  reported_at timestamptz default now(),
  resolved boolean default false,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  resolution text check (resolution in ('keep','hide','remove','warn','suspend'))
);

create index if not exists photo_reports_photo_idx on public.photo_reports(photo_id);
create index if not exists photo_reports_pending_idx on public.photo_reports(resolved) where resolved = false;

-- =====================================================================
-- galleries + gallery_photos
-- =====================================================================
create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  name text not null,
  description text,
  cover_photo_id uuid references public.photos(id),
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gallery_photos (
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  position integer,
  added_at timestamptz default now(),
  primary key (gallery_id, photo_id)
);

create index if not exists galleries_user_idx on public.galleries(user_id);
create index if not exists gallery_photos_gallery_idx on public.gallery_photos(gallery_id, position);

drop trigger if exists set_galleries_updated_at on public.galleries;
create trigger set_galleries_updated_at before update on public.galleries
  for each row execute function public.set_updated_at();

-- =====================================================================
-- seasons + season_winners
-- =====================================================================
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text default 'upcoming' check (status in ('upcoming','active','voting-closed','awarded','archived')),
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create index if not exists seasons_status_idx on public.seasons(status);
create index if not exists seasons_dates_idx on public.seasons(start_date, end_date);

create table if not exists public.season_winners (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id),
  category text not null check (category in ('landscape','portrait','bw')),
  photo_id uuid not null references public.photos(id),
  winner_user_id uuid not null references public.users(id),

  voucher_amount integer default 50000,
  voucher_code text unique not null,
  voucher_expiry date not null,
  voucher_redeemed boolean default false,
  voucher_redeemed_at timestamptz,
  voucher_redeemed_by uuid references public.users(id),
  voucher_booking_ref text,

  awarded_at timestamptz default now(),
  awarded_by uuid references public.users(id),
  public_announcement text,

  unique (season_id, category)
);

create index if not exists season_winners_season_idx on public.season_winners(season_id);
create index if not exists season_winners_user_idx on public.season_winners(winner_user_id);

-- =====================================================================
-- cashback
-- =====================================================================
create table if not exists public.cashback_eligibility (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  category text check (category in ('landscape','portrait','bw')),
  rank_position integer not null,
  percentage integer not null,
  eligible_from date not null,
  eligible_until date,
  computed_at timestamptz default now(),
  is_active boolean default true
);

create index if not exists cashback_user_active_idx on public.cashback_eligibility(user_id) where is_active = true;

create table if not exists public.cashback_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  eligibility_id uuid references public.cashback_eligibility(id),
  booking_ref text not null,
  amount_thb integer not null,
  percentage_used integer not null,
  redeemed_at timestamptz default now(),
  redeemed_by uuid not null references public.users(id),
  notes text
);

create index if not exists cashback_redemptions_user_idx on public.cashback_redemptions(user_id);
create index if not exists cashback_redemptions_year_idx on public.cashback_redemptions(redeemed_at);

-- =====================================================================
-- notifications + follows + admin_audit_logs + email_log
-- =====================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type text not null check (type in (
    'like_received','comment_received','comment_reply',
    'editor_pick','ambassador_pick',
    'season_winner','cashback_eligible',
    'photographer_approved','photographer_rejected',
    'customer_marked','ambassador_invited',
    'photo_reported','photo_hidden','photo_warned'
  )),
  related_photo_id uuid references public.photos(id),
  related_user_id uuid references public.users(id),
  related_url text,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_unread_idx on public.notifications(user_id) where is_read = false;
create index if not exists notifications_created_idx on public.notifications(created_at desc);

create table if not exists public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  followed_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  detail jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists audit_logs_admin_idx on public.admin_audit_logs(admin_id);
create index if not exists audit_logs_target_idx on public.admin_audit_logs(target_type, target_id);
create index if not exists audit_logs_created_idx on public.admin_audit_logs(created_at desc);

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  to_email text not null,
  template text not null,
  subject text,
  body_html text,
  sent_at timestamptz default now(),
  status text default 'queued' check (status in ('queued','sent','failed','bounced')),
  provider_id text,
  error_message text
);

create index if not exists email_log_user_idx on public.email_log(user_id);
create index if not exists email_log_status_idx on public.email_log(status);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.users enable row level security;
alter table public.photos enable row level security;
alter table public.votes enable row level security;
alter table public.favorites enable row level security;
alter table public.ambassador_picks enable row level security;
alter table public.editor_picks enable row level security;
alter table public.comments enable row level security;
alter table public.photo_reports enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.seasons enable row level security;
alter table public.season_winners enable row level security;
alter table public.cashback_eligibility enable row level security;
alter table public.cashback_redemptions enable row level security;
alter table public.notifications enable row level security;
alter table public.follows enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.email_log enable row level security;

-- users
drop policy if exists users_select_public on public.users;
create policy users_select_public on public.users for select using (true);
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update
  using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists users_delete_super_admin on public.users;
create policy users_delete_super_admin on public.users for delete
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_super_admin = true));

-- photos
drop policy if exists photos_select_public on public.photos;
create policy photos_select_public on public.photos for select
  using (is_hidden = false and status = 'published');
drop policy if exists photos_select_own on public.photos;
create policy photos_select_own on public.photos for select
  using (photographer_id = auth.uid());
drop policy if exists photos_select_admin on public.photos;
create policy photos_select_admin on public.photos for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
drop policy if exists photos_insert_photographer on public.photos;
create policy photos_insert_photographer on public.photos for insert
  with check (
    photographer_id = auth.uid()
    and exists (select 1 from public.users u where u.id = auth.uid() and u.photographer_status = 'approved')
  );
drop policy if exists photos_update_own on public.photos;
create policy photos_update_own on public.photos for update using (photographer_id = auth.uid());
drop policy if exists photos_update_admin on public.photos;
create policy photos_update_admin on public.photos for update
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
drop policy if exists photos_delete_own on public.photos;
create policy photos_delete_own on public.photos for delete using (photographer_id = auth.uid());
drop policy if exists photos_delete_admin on public.photos;
create policy photos_delete_admin on public.photos for delete
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- votes
drop policy if exists votes_select_public on public.votes;
create policy votes_select_public on public.votes for select using (true);
drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own on public.votes for insert
  with check (user_id = auth.uid() and user_email = (auth.jwt() ->> 'email'));
drop policy if exists votes_delete_own on public.votes;
create policy votes_delete_own on public.votes for delete using (user_id = auth.uid());

-- favorites
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites for select using (user_id = auth.uid());
drop policy if exists favorites_select_public_when_owner_allows on public.favorites;
create policy favorites_select_public_when_owner_allows on public.favorites for select
  using (exists (select 1 from public.users u where u.id = favorites.user_id and u.favorites_visibility = 'public'));
drop policy if exists favorites_modify_own on public.favorites;
create policy favorites_modify_own on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ambassador_picks
drop policy if exists ambassador_picks_select_public on public.ambassador_picks;
create policy ambassador_picks_select_public on public.ambassador_picks for select using (true);
drop policy if exists ambassador_picks_modify_own on public.ambassador_picks;
create policy ambassador_picks_modify_own on public.ambassador_picks for all
  using (ambassador_id = auth.uid()
         and exists (select 1 from public.users u where u.id = auth.uid() and u.is_ambassador = true))
  with check (ambassador_id = auth.uid()
              and exists (select 1 from public.users u where u.id = auth.uid() and u.is_ambassador = true));

-- editor_picks (admin only)
drop policy if exists editor_picks_select_public on public.editor_picks;
create policy editor_picks_select_public on public.editor_picks for select using (true);
drop policy if exists editor_picks_modify_admin on public.editor_picks;
create policy editor_picks_modify_admin on public.editor_picks for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- comments
drop policy if exists comments_select_public on public.comments;
create policy comments_select_public on public.comments for select using (is_hidden = false);
drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments for insert with check (user_id = auth.uid());
drop policy if exists comments_modify_own on public.comments;
create policy comments_modify_own on public.comments for update using (user_id = auth.uid());
drop policy if exists comments_delete_own_or_admin on public.comments;
create policy comments_delete_own_or_admin on public.comments for delete
  using (user_id = auth.uid()
         or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- photo_reports
drop policy if exists photo_reports_select_own_or_admin on public.photo_reports;
create policy photo_reports_select_own_or_admin on public.photo_reports for select
  using (reporter_id = auth.uid()
         or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
drop policy if exists photo_reports_insert_own on public.photo_reports;
create policy photo_reports_insert_own on public.photo_reports for insert with check (reporter_id = auth.uid());
drop policy if exists photo_reports_modify_admin on public.photo_reports;
create policy photo_reports_modify_admin on public.photo_reports for update
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- galleries
drop policy if exists galleries_select_public on public.galleries;
create policy galleries_select_public on public.galleries for select using (is_public = true);
drop policy if exists galleries_select_own on public.galleries;
create policy galleries_select_own on public.galleries for select using (user_id = auth.uid());
drop policy if exists galleries_modify_own on public.galleries;
create policy galleries_modify_own on public.galleries for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- gallery_photos
drop policy if exists gallery_photos_select_via_gallery on public.gallery_photos;
create policy gallery_photos_select_via_gallery on public.gallery_photos for select
  using (exists (select 1 from public.galleries g
                 where g.id = gallery_id
                   and (g.is_public = true or g.user_id = auth.uid())));
drop policy if exists gallery_photos_modify_owner on public.gallery_photos;
create policy gallery_photos_modify_owner on public.gallery_photos for all
  using (exists (select 1 from public.galleries g where g.id = gallery_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.galleries g where g.id = gallery_id and g.user_id = auth.uid()));

-- seasons
drop policy if exists seasons_select_public on public.seasons;
create policy seasons_select_public on public.seasons for select using (true);
drop policy if exists seasons_modify_admin on public.seasons;
create policy seasons_modify_admin on public.seasons for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- season_winners
drop policy if exists season_winners_select_public on public.season_winners;
create policy season_winners_select_public on public.season_winners for select using (true);
drop policy if exists season_winners_modify_admin on public.season_winners;
create policy season_winners_modify_admin on public.season_winners for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- cashback_*
drop policy if exists cashback_eligibility_select_own_or_admin on public.cashback_eligibility;
create policy cashback_eligibility_select_own_or_admin on public.cashback_eligibility for select
  using (user_id = auth.uid()
         or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
drop policy if exists cashback_eligibility_modify_admin on public.cashback_eligibility;
create policy cashback_eligibility_modify_admin on public.cashback_eligibility for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists cashback_redemptions_select_own_or_admin on public.cashback_redemptions;
create policy cashback_redemptions_select_own_or_admin on public.cashback_redemptions for select
  using (user_id = auth.uid()
         or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
drop policy if exists cashback_redemptions_modify_admin on public.cashback_redemptions;
create policy cashback_redemptions_modify_admin on public.cashback_redemptions for all
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- notifications (own only)
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update using (user_id = auth.uid());

-- follows
drop policy if exists follows_select_public on public.follows;
create policy follows_select_public on public.follows for select using (true);
drop policy if exists follows_modify_own on public.follows;
create policy follows_modify_own on public.follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- admin_audit_logs (admin only read)
drop policy if exists audit_logs_select_admin on public.admin_audit_logs;
create policy audit_logs_select_admin on public.admin_audit_logs for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- email_log (admin only read)
drop policy if exists email_log_select_admin on public.email_log;
create policy email_log_select_admin on public.email_log for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));
-- 0002_triggers.sql
-- Auth integration + denormalized counters + pick_type maintenance.

-- =====================================================================
-- handle_new_user — auto-create public.users row on auth signup
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  n integer := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  if length(base_username) < 3 then
    base_username := 'user_' || substr(new.id::text, 1, 4);
  end if;

  final_username := base_username;
  while exists (select 1 from public.users where lower(username) = lower(final_username)) loop
    n := n + 1;
    final_username := base_username || '_' || n::text;
  end loop;

  insert into public.users (id, email, username, display_name, avatar_url, email_verified)
  values (
    new.id,
    new.email,
    final_username,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.email_confirmed_at is not null, false)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Counter maintenance — votes / favorites / comments
-- =====================================================================
create or replace function public.update_photo_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.photos set likes_count = likes_count + 1 where id = new.photo_id;
  elsif tg_op = 'DELETE' then
    update public.photos set likes_count = greatest(likes_count - 1, 0) where id = old.photo_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_votes_count on public.votes;
create trigger tr_votes_count after insert or delete on public.votes
  for each row execute function public.update_photo_likes_count();

create or replace function public.update_photo_favorites_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.photos set favorites_count = favorites_count + 1 where id = new.photo_id;
  elsif tg_op = 'DELETE' then
    update public.photos set favorites_count = greatest(favorites_count - 1, 0) where id = old.photo_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_favorites_count on public.favorites;
create trigger tr_favorites_count after insert or delete on public.favorites
  for each row execute function public.update_photo_favorites_count();

create or replace function public.update_photo_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.photos set comments_count = comments_count + 1 where id = new.photo_id;
  elsif tg_op = 'DELETE' then
    update public.photos set comments_count = greatest(comments_count - 1, 0) where id = old.photo_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_comments_count on public.comments;
create trigger tr_comments_count after insert or delete on public.comments
  for each row execute function public.update_photo_comments_count();

-- =====================================================================
-- pick_type maintenance — recompute on editor_picks / ambassador_picks change
-- =====================================================================
create or replace function public.recompute_pick_type(p_photo_id uuid)
returns void language plpgsql as $$
declare
  has_editor boolean;
  has_amb boolean;
  new_type text;
begin
  select exists (select 1 from public.editor_picks where photo_id = p_photo_id) into has_editor;
  select exists (select 1 from public.ambassador_picks where photo_id = p_photo_id) into has_amb;

  new_type := case
    when has_editor and has_amb then 'both'
    when has_editor then 'editor'
    when has_amb then 'ambassador'
    else 'none'
  end;

  update public.photos
     set pick_type = new_type,
         picked_at = case when new_type = 'none' then null else now() end
   where id = p_photo_id;
end;
$$;

create or replace function public.tr_recompute_pick_type()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    perform public.recompute_pick_type(new.photo_id);
  elsif tg_op = 'DELETE' then
    perform public.recompute_pick_type(old.photo_id);
  end if;
  return null;
end;
$$;

drop trigger if exists tr_editor_picks_pick_type on public.editor_picks;
create trigger tr_editor_picks_pick_type after insert or delete on public.editor_picks
  for each row execute function public.tr_recompute_pick_type();

drop trigger if exists tr_ambassador_picks_pick_type on public.ambassador_picks;
create trigger tr_ambassador_picks_pick_type after insert or delete on public.ambassador_picks
  for each row execute function public.tr_recompute_pick_type();
-- 0003_materialized_views.sql
-- photo_scores (pulse) + photographer_stats. Refresh schedule set up in 0004.

drop materialized view if exists public.photo_scores;
create materialized view public.photo_scores as
select
  p.id              as photo_id,
  p.photographer_id,
  p.category,
  p.uploaded_at,
  p.pick_type,
  p.likes_count     as total_likes,

  (select count(*) from public.votes v
     where v.photo_id = p.id and v.voted_at > now() - interval '24 hours') as likes_24h,
  (select count(*) from public.votes v
     where v.photo_id = p.id and v.voted_at > now() - interval '7 days') as likes_7d,
  (select count(*) from public.votes v
     where v.photo_id = p.id and v.voted_at > now() - interval '30 days') as likes_30d,

  (
    p.likes_count * 1.0
    + (select count(*) from public.votes v
        where v.photo_id = p.id and v.voted_at > now() - interval '24 hours') * 3.0
    + case
        when p.pick_type = 'both' then 100
        when p.pick_type = 'editor' then 50
        when p.pick_type = 'ambassador' then 50
        else 0
      end
  ) / greatest(extract(epoch from (now() - p.uploaded_at)) / 3600.0, 1.0) as pulse_score,

  extract(epoch from (now() - p.uploaded_at)) / 3600.0 as hours_since_upload

from public.photos p
where p.is_hidden = false and p.status = 'published';

create unique index if not exists photo_scores_pk on public.photo_scores(photo_id);
create index if not exists photo_scores_pulse_idx on public.photo_scores(pulse_score desc);
create index if not exists photo_scores_category_pulse_idx on public.photo_scores(category, pulse_score desc);
create index if not exists photo_scores_photographer_idx on public.photo_scores(photographer_id);

drop materialized view if exists public.photographer_stats;
create materialized view public.photographer_stats as
select
  u.id as user_id,
  count(p.id)                                            as total_photos,
  coalesce(sum(p.likes_count), 0)                        as total_likes,
  coalesce(sum(p.favorites_count), 0)                    as total_favorites,
  coalesce(sum(p.impressions_count), 0)                  as total_impressions,
  coalesce(avg(ps.pulse_score), 0)                       as avg_pulse,
  coalesce(max(ps.pulse_score), 0)                       as peak_pulse,
  count(p.id) filter (where p.pick_type <> 'none')       as picks_received
from public.users u
left join public.photos p on p.photographer_id = u.id and p.is_hidden = false
left join public.photo_scores ps on ps.photo_id = p.id
where u.photographer_status = 'approved'
group by u.id;

create unique index if not exists photographer_stats_pk on public.photographer_stats(user_id);
-- 0004_functions.sql
-- Cashback eligibility recompute + materialized view refresh helpers.
-- Call from Vercel Cron Functions or pg_cron (see comments).

-- =====================================================================
-- refresh_photo_scores — call every 5 minutes
-- =====================================================================
create or replace function public.refresh_photo_scores()
returns void language plpgsql as $$
begin
  refresh materialized view concurrently public.photo_scores;
exception
  when feature_not_supported then
    -- concurrent refresh requires unique index; fall back to non-concurrent
    refresh materialized view public.photo_scores;
end;
$$;

-- =====================================================================
-- refresh_photographer_stats — call every 6 hours
-- =====================================================================
create or replace function public.refresh_photographer_stats()
returns void language plpgsql as $$
begin
  refresh materialized view concurrently public.photographer_stats;
exception
  when feature_not_supported then
    refresh materialized view public.photographer_stats;
end;
$$;

-- =====================================================================
-- compute_cashback_eligibility — call once daily (2am)
--
-- For each customer:
--   - find best rank across all 3 categories (lowest rank_position by pulse desc)
--   - tier: #1=15%, #2-5=10%, #6-10=5%, #11-50=3%, #51+=0%
--   - upsert active row; deactivate stale rows
-- =====================================================================
create or replace function public.compute_cashback_eligibility()
returns void language plpgsql as $$
declare
  today date := current_date;
begin
  -- Deactivate everything first; we will re-activate winners below.
  update public.cashback_eligibility
     set is_active = false,
         eligible_until = coalesce(eligible_until, today)
   where is_active = true;

  -- Per-category ranking by pulse_score desc
  with ranked as (
    select
      ps.photographer_id        as user_id,
      ps.category,
      row_number() over (partition by ps.category order by ps.pulse_score desc) as rank_position
    from public.photo_scores ps
    join public.users u on u.id = ps.photographer_id
    where u.is_customer = true
  ),
  best as (
    -- Best (lowest) rank per user across all 3 categories
    select distinct on (user_id)
      user_id, category, rank_position
    from ranked
    order by user_id, rank_position asc
  )
  insert into public.cashback_eligibility (user_id, category, rank_position, percentage, eligible_from, is_active)
  select
    b.user_id,
    b.category,
    b.rank_position,
    case
      when b.rank_position = 1 then 15
      when b.rank_position between 2 and 5 then 10
      when b.rank_position between 6 and 10 then 5
      when b.rank_position between 11 and 50 then 3
      else 0
    end as percentage,
    today,
    true
  from best b
  where b.rank_position <= 50;
end;
$$;

-- =====================================================================
-- pg_cron scheduling (optional — uncomment after enabling pg_cron extension)
-- =====================================================================
-- select cron.schedule('refresh-pulse',          '*/5 * * * *', $$select public.refresh_photo_scores()$$);
-- select cron.schedule('refresh-photographer',   '0 */6 * * *', $$select public.refresh_photographer_stats()$$);
-- select cron.schedule('cashback-eligibility',   '0 2 * * *',   $$select public.compute_cashback_eligibility()$$);
-- 0005_seed_data.sql
-- Initial data. Run AFTER you have signed in once via the app so auth.users has an entry.

-- =====================================================================
-- Promote founder to super_admin
-- Replace the email with your founder Google account email, then run.
-- =====================================================================
-- update public.users
--    set is_admin = true,
--        is_super_admin = true
--  where email = 'founder@gography.net';

-- =====================================================================
-- Sample current season (uncomment to use)
-- =====================================================================
-- insert into public.seasons (name, start_date, end_date, status)
-- values ('Spring 2026', '2026-01-01', '2026-04-30', 'active')
-- on conflict do nothing;
