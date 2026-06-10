-- 0027_photo_visibility.sql
-- Adds an orthogonal `visibility` axis to photos, alongside the existing
-- moderation/drop-release `status` axis:
--   public    = competition entry (scores, on feed/leaderboard, eats 1/day quota)
--   portfolio = showcase only (publicly viewable on the photographer's page,
--               never scored, never on feed/leaderboard, no quota)
--   private   = drawer, owner-only

-- =====================================================================
-- enum (idempotent)
-- =====================================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'photo_visibility') then
    create type photo_visibility as enum ('public','portfolio','private');
  end if;
end $$;

-- =====================================================================
-- photos.visibility
-- =====================================================================
alter table public.photos
  add column if not exists visibility photo_visibility not null default 'public';

comment on column public.photos.visibility is
  'public=competition, portfolio=showcase only, private=drawer';

-- owner-scoped lookups (quota counts, portfolio/drawer listings)
create index if not exists photos_photographer_visibility_idx
  on public.photos (photographer_id, visibility)
  where is_hidden = false;

-- =====================================================================
-- RLS: the public can see published public + portfolio photos.
-- private photos fall through to photos_select_own / photos_select_admin,
-- which are unchanged.
-- =====================================================================
drop policy if exists photos_select_public on public.photos;
create policy photos_select_public on public.photos for select
  using (is_hidden = false and status = 'published' and visibility in ('public','portfolio'));

-- =====================================================================
-- scoring: only competition (visibility = 'public') photos enter the pool.
-- Copied from 0023_pulse_from_engagement.sql, adding the visibility filter.
-- (Per-photo engagement recompute in 0022 stays as-is: it only tallies raw
-- engagement; pulse/badge/percentile are written exclusively from this pool.)
-- =====================================================================
create or replace function public.recompute_pulse_active()
returns integer language plpgsql security definer set search_path = public as $$
declare updated integer;
begin
  with pool as (
    select id, engagement, coalesce(impressions_count, 0) as views,
           (extract(epoch from (now() - uploaded_at)) / 3600.0) as age_hours
    from public.photos
    where is_hidden = false and status = 'published'
      and visibility = 'public'
      and uploaded_at >= now() - interval '24 hours'
  ),
  scored as (
    select id, engagement, views, age_hours,
           row_number() over (order by engagement asc) as rnk,
           count(*) over () as n,
           round((99.99 * (1 - exp(-0.03 * engagement)))::numeric, 1) as score
    from pool
  ),
  badged as (
    select id, score, (rnk::numeric / n) as pct, views, age_hours,
      case
        when score >= 99.5 and views >= 100 then 'legendary'
        when score >= 97.8 and views >= 100 then 'popular'
        when score >= 95  and age_hours <= 24 and views >= 50 then 'trending'
        when score >= 90  and views < 200 then 'hidden_gem'
        else null
      end as badge
    from scored
  )
  update public.photos p
     set pulse      = b.score,
         percentile = b.pct,
         badge      = b.badge,
         peak_pulse = greatest(coalesce(p.peak_pulse, 0), b.score)
  from badged b
  where p.id = b.id
    and (p.pulse      is distinct from b.score
      or p.percentile is distinct from b.pct
      or p.badge      is distinct from b.badge
      or p.peak_pulse is distinct from greatest(coalesce(p.peak_pulse, 0), b.score));

  get diagnostics updated = row_count;
  return updated;
end$$;

-- =====================================================================
-- hall-of-fame leaderboard: competition photos only.
-- Copied from supabase/v5_hof_rpc_with_season.sql (the live signature the
-- app calls), adding the visibility filter to both photo scans.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_v5_hall_of_fame(p_season_id uuid DEFAULT NULL)
RETURNS TABLE (
    photographer_id uuid,
    username text,
    display_name text,
    avatar_url text,
    cover_url text,
    photo_count bigint,
    hof_score numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH user_photos AS (
        SELECT
            p.photographer_id,
            p.pulse,
            ROW_NUMBER() OVER (PARTITION BY p.photographer_id ORDER BY p.pulse DESC NULLS LAST) as rn
        FROM public.photos p
        WHERE p.is_hidden = false
          AND p.status = 'published'
          AND p.visibility = 'public'
          AND (p_season_id IS NULL OR p.season_id = p_season_id)
    ),
    user_stats AS (
        SELECT
            up.photographer_id,
            count(*) as total_photos
        FROM public.photos up
        WHERE up.is_hidden = false
          AND up.status = 'published'
          AND up.visibility = 'public'
          AND (p_season_id IS NULL OR up.season_id = p_season_id)
        GROUP BY up.photographer_id
    ),
    top_10 AS (
        SELECT
            up.photographer_id,
            avg(up.pulse) as raw_hof_score
        FROM user_photos up
        WHERE up.rn <= 10
        GROUP BY up.photographer_id
    )
    SELECT
        u.id as photographer_id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.cover_url,
        s.total_photos,
        round(t.raw_hof_score::numeric, 1) as hof_score
    FROM user_stats s
    JOIN top_10 t ON s.photographer_id = t.photographer_id
    JOIN public.users u ON u.id = s.photographer_id
    WHERE s.total_photos >= 22
    ORDER BY t.raw_hof_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- drops now release into the Collection (portfolio), not the competition.
-- Copied from 0026_drop_system.sql, adding visibility = 'portfolio' to the
-- photo publish step.
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
    -- released drop photos land in the photographer's Collection (portfolio):
    -- publicly viewable, never scored, no quota
    update public.photos
      set status = 'published', visibility = 'portfolio', released_at = now(), uploaded_at = now()
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
