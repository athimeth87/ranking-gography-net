-- 0026_drop_system.sql
-- Drop system ("ปล่อยของ"): photographers schedule a timed release of private
-- photos. A pg_cron job (every 5 min) publishes due drops and notifies
-- subscribers + followers. The blurred preview lives on the drop row itself
-- because RLS hides draft photo rows from the public entirely.

-- =====================================================================
-- drops
-- =====================================================================
create table if not exists public.drops (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.users(id),

  title text not null,
  series_label text,
  description text,
  preview_url text,

  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','released','cancelled')),
  released_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists drops_due_idx on public.drops (scheduled_at) where status = 'scheduled';
create index if not exists drops_photographer_idx on public.drops (photographer_id);

-- =====================================================================
-- drop_subscriptions  ("แจ้งเตือนเมื่อปล่อย")
-- =====================================================================
create table if not exists public.drop_subscriptions (
  drop_id uuid not null references public.drops(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (drop_id, user_id)
);

-- =====================================================================
-- photos: link to drop + release timestamp
-- =====================================================================
alter table public.photos
  add column if not exists drop_id uuid references public.drops(id) on delete set null,
  add column if not exists released_at timestamptz;

create index if not exists photos_drop_idx on public.photos (drop_id) where drop_id is not null;

-- =====================================================================
-- notifications: new type
-- =====================================================================
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'like_received','comment_received','comment_reply',
    'editor_pick','ambassador_pick',
    'season_winner','cashback_eligible',
    'photographer_approved','photographer_rejected',
    'customer_marked','ambassador_invited',
    'photo_reported','photo_hidden','photo_warned',
    'follow_received','favorite_received',
    'drop_released'
  ));

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.drops enable row level security;
alter table public.drop_subscriptions enable row level security;

drop policy if exists drops_select_public on public.drops;
create policy drops_select_public on public.drops for select using (true);

drop policy if exists drops_insert_own on public.drops;
create policy drops_insert_own on public.drops for insert
  with check (photographer_id = auth.uid());

drop policy if exists drops_update_own on public.drops;
create policy drops_update_own on public.drops for update
  using (photographer_id = auth.uid());

drop policy if exists drops_delete_own on public.drops;
create policy drops_delete_own on public.drops for delete
  using (photographer_id = auth.uid());

drop policy if exists drop_subs_select_own on public.drop_subscriptions;
create policy drop_subs_select_own on public.drop_subscriptions for select
  using (user_id = auth.uid());

drop policy if exists drop_subs_insert_own on public.drop_subscriptions;
create policy drop_subs_insert_own on public.drop_subscriptions for insert
  with check (user_id = auth.uid());

drop policy if exists drop_subs_delete_own on public.drop_subscriptions;
create policy drop_subs_delete_own on public.drop_subscriptions for delete
  using (user_id = auth.uid());

-- =====================================================================
-- release function — publishes due drops + notifies subscribers/followers
-- =====================================================================
create or replace function public.release_due_drops()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_drop record;
  v_username text;
  v_count integer := 0;
begin
  for v_drop in
    select d.id, d.photographer_id, d.title
    from public.drops d
    where d.status = 'scheduled' and d.scheduled_at <= now()
    for update skip locked
  loop
    -- uploaded_at = now() so released photos start their pulse window fresh
    update public.photos
      set status = 'published', released_at = now(), uploaded_at = now()
      where drop_id = v_drop.id and status = 'draft';

    update public.drops
      set status = 'released', released_at = now()
      where id = v_drop.id;

    select username into v_username from public.users where id = v_drop.photographer_id;

    insert into public.notifications (user_id, type, related_user_id, body, related_url)
    select t.user_id, 'drop_released', v_drop.photographer_id,
           coalesce(v_username, 'someone') || ' ปล่อยภาพชุดใหม่แล้ว — "' || v_drop.title || '"',
           '/photographer/' || coalesce(v_username, '')
    from (
      select s.user_id from public.drop_subscriptions s where s.drop_id = v_drop.id
      union
      select f.follower_id from public.follows f where f.following_id = v_drop.photographer_id
    ) t
    where t.user_id <> v_drop.photographer_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- =====================================================================
-- pg_cron: check for due drops every 5 minutes
-- =====================================================================
create extension if not exists pg_cron;
select cron.unschedule('release-due-drops')
  where exists (select 1 from cron.job where jobname = 'release-due-drops');
select cron.schedule('release-due-drops', '*/5 * * * *',
  $$ select public.release_due_drops(); $$);
