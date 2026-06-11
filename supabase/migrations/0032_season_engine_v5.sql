-- 0032: Season Engine v5 (no-decay, 4-month season).
--
-- Locked decisions (2026-06-12): no decay (every vote counts full weight all
-- season), 3-layer display score (E -> baseline B -> Hill curve), floor 25,
-- display cap 99.9 AFTER rounding (so 100.0 can never appear), daily vote budget
-- (20 full-weight votes/user/day, softer above), anti-collusion x0.3, realtime
-- per-photo score on each vote + cron baseline. Season winners are judged on raw
-- E, not the display score. See spec-season-engine-v5-handoff-2026-06-12.md.
--
-- Tunable constants (kept as literals with this list so they're easy to find):
--   FLOOR = 25 · HILL_RANGE = 74.9 · DISPLAY_CAP = 99.9
--   BASELINE_PERCENTILE = 0.60 · BASELINE_EMA = 0.10 · BASELINE_PRIOR_FLOOR = 10
--   DAILY_VOTE_BUDGET = 20 · COLLUSION_FACTOR = 0.3 · COLLUSION_THRESHOLD = 5
--   COLLUSION_WINDOW = 7 days · VELOCITY_WINDOW = 7 days
--
-- NOTE: apply on Supabase (supabase db push / SQL editor) for this to take effect.

-- =====================================================================
-- 2.1  age_weight_at -> 1.0 always (decay retired; function kept for rollback)
-- =====================================================================
create or replace function public.age_weight_at(uploaded timestamptz, voted timestamptz)
returns numeric language sql immutable as $$
  select 1.0::numeric;
$$;

-- =====================================================================
-- 2.3  per-season community baseline B (state, one row per season)
-- =====================================================================
create table if not exists public.season_baseline (
  season_id  uuid primary key references public.seasons(id) on delete cascade,
  b_value    numeric not null default 10,
  updated_at timestamptz not null default now()
);

-- seed a baseline row for every active season so the realtime path always has a B
insert into public.season_baseline (season_id, b_value)
select id, 10 from public.seasons where status = 'active'
on conflict (season_id) do nothing;

-- =====================================================================
-- 2.6  anti-collusion: cache flagged reciprocal-voting pairs (ordered a<b).
-- Only flagged pairs are stored, so "row exists" == "this pair is colluding".
-- =====================================================================
create table if not exists public.collusion_pairs (
  user_a     uuid not null,
  user_b     uuid not null,
  pair_votes integer not null default 0,
  flagged    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_a, user_b)
);

-- recompute the flagged set: a pair {x,y} is flagged when they each voted on the
-- other at least COLLUSION_THRESHOLD (5) times within the last 7 days.
create or replace function public.refresh_collusion_flags()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.collusion_pairs;
  insert into public.collusion_pairs (user_a, user_b, pair_votes, flagged, updated_at)
  select ua, ub, least(fwd, rev) as pair_votes, true, now()
  from (
    select least(d.voter, d.owner) as ua, greatest(d.voter, d.owner) as ub,
           max(case when d.voter < d.owner then d.c else 0 end) as fwd,
           max(case when d.voter > d.owner then d.c else 0 end) as rev
    from (
      select v.user_id as voter, p.photographer_id as owner, count(*) as c
      from public.votes v
      join public.photos p on p.id = v.photo_id
      where v.voted_at >= now() - interval '7 days'
        and v.user_id <> p.photographer_id
      group by v.user_id, p.photographer_id
    ) d
    group by least(d.voter, d.owner), greatest(d.voter, d.owner)
  ) paired
  where least(fwd, rev) >= 5;
end$$;

-- =====================================================================
-- 2.2 (realtime, per-photo)  recompute ONE photo's E (role x type x budget x
-- collusion, no decay) and its display score from the cached season B.
-- Called by the existing per-row engagement trigger -> realtime wiring pushes
-- the new pulse to clients instantly. percentile/badge are left to the cron.
-- =====================================================================
create or replace function public.recompute_photo_engagement(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_owner  uuid;
  v_season uuid;
  v_b      numeric;
  e        numeric := 0;
  x        double precision;
  sc       numeric;
begin
  select photographer_id, season_id into v_owner, v_season
    from public.photos where id = p_id;
  if v_owner is null then return; end if;

  -- votes: role weight x daily-budget weight x collusion factor (age weight = 1)
  select coalesce(sum(
      (case when usr.photographer_status = 'approved' then 5
            when usr.is_customer then 3 else 1 end)
    * (case when bn.n <= 20 then 1.0 else 20.0 / bn.n end)
    * (case when cp.user_a is not null then 0.3 else 1.0 end)
  ), 0)
  into e
  from public.votes v
  left join public.users usr on usr.id = v.user_id
  join lateral (
    select count(*) as n from public.votes v2
    where v2.user_id = v.user_id
      and (v2.voted_at at time zone 'Asia/Bangkok')::date
        = (v.voted_at at time zone 'Asia/Bangkok')::date
      and v2.voted_at <= v.voted_at
  ) bn on true
  left join public.collusion_pairs cp
    on cp.user_a = least(v.user_id, v_owner)
   and cp.user_b = greatest(v.user_id, v_owner)
  where v.photo_id = p_id;

  -- favorites + comments: role weight only (no budget/collusion — faithful v1 port)
  e := e + (select coalesce(sum(
      case when usr.photographer_status = 'approved' then 10
           when usr.is_customer then 6 else 2 end), 0)
    from public.favorites f left join public.users usr on usr.id = f.user_id
    where f.photo_id = p_id);

  e := e + (select coalesce(sum(
      case when usr.photographer_status = 'approved' then 20
           when usr.is_customer then 12 else 4 end), 0)
    from public.comments c left join public.users usr on usr.id = c.user_id
    where c.photo_id = p_id and c.is_hidden = false);

  -- cached B for this photo's season (prior floor 10 if no row yet)
  select b_value into v_b from public.season_baseline where season_id = v_season;
  v_b := coalesce(v_b, 10);

  -- 3-layer display score: x = E/B ; 25 + 74.9 * x/(x+1) ; round 1 ; cap 99.9
  x  := e::double precision / v_b;
  sc := least(round((25 + 74.9 * (x / (x + 1)))::numeric, 1), 99.9);

  update public.photos
     set engagement = e,
         pulse      = sc,
         peak_pulse = greatest(coalesce(peak_pulse, 0), sc)
   where id = p_id
     and (engagement is distinct from e
       or pulse      is distinct from sc
       or peak_pulse is distinct from greatest(coalesce(peak_pulse, 0), sc));
end$$;

-- =====================================================================
-- 2.2 (cron, heavy)  whole-season reconcile: refresh collusion flags, recompute
-- B per active season (p60 -> EMA clamp +/-10% -> prior floor), then rescore the
-- whole active pool set-based (E from raw, display score, percentile, velocity
-- badge). Closed seasons keep their frozen scores (only status='active' pools).
-- =====================================================================
create or replace function public.recompute_pulse_active()
returns integer language plpgsql security definer set search_path = public as $$
declare updated integer;
begin
  perform public.refresh_collusion_flags();

  -- B per active season: clamp p60 within +/-10% of the old B, then prior floor.
  insert into public.season_baseline (season_id, b_value, updated_at)
  select s.id,
         greatest(
           -- prior floor: 10, or the previous season's ending B if higher
           greatest(10, coalesce((
             select sb.b_value from public.season_baseline sb
             join public.seasons ps on ps.id = sb.season_id
             where ps.end_date < s.start_date
             order by ps.end_date desc limit 1), 0)),
           -- EMA-clamped p60 (keep old B if the pool is empty)
           case when br.b_raw is null then coalesce(old.b_value, 10)
                else least(greatest(br.b_raw, coalesce(old.b_value, 10) * 0.9),
                           coalesce(old.b_value, 10) * 1.1) end
         ),
         now()
  from public.seasons s
  left join lateral (
    select percentile_cont(0.60) within group (order by p.engagement) as b_raw
    from public.photos p
    where p.season_id = s.id and p.is_hidden = false
      and p.status = 'published' and p.visibility = 'public'
      and p.engagement > 0
  ) br on true
  left join public.season_baseline old on old.season_id = s.id
  where s.status = 'active'
  on conflict (season_id) do update
    set b_value = excluded.b_value, updated_at = excluded.updated_at;

  -- rescore the whole active pool set-based
  with pool as (
    select p.id, p.season_id, p.photographer_id as owner_id,
           coalesce(p.impressions_count, 0) as views
    from public.photos p
    where p.is_hidden = false and p.status = 'published'
      and p.visibility = 'public'
      and p.season_id in (select id from public.seasons where status = 'active')
  ),
  vote_rank as (
    select v.id, v.photo_id, v.user_id, v.voted_at,
           row_number() over (
             partition by v.user_id, (v.voted_at at time zone 'Asia/Bangkok')::date
             order by v.voted_at, v.id) as n
    from public.votes v
  ),
  vote_e as (
    select vr.photo_id,
           sum(
             (case when usr.photographer_status = 'approved' then 5
                   when usr.is_customer then 3 else 1 end)
           * (case when vr.n <= 20 then 1.0 else 20.0 / vr.n end)
           * (case when cp.user_a is not null then 0.3 else 1.0 end)
           ) as e
    from vote_rank vr
    join pool pl on pl.id = vr.photo_id
    left join public.users usr on usr.id = vr.user_id
    left join public.collusion_pairs cp
      on cp.user_a = least(vr.user_id, pl.owner_id)
     and cp.user_b = greatest(vr.user_id, pl.owner_id)
    group by vr.photo_id
  ),
  fav_e as (
    select f.photo_id,
           sum(case when usr.photographer_status = 'approved' then 10
                    when usr.is_customer then 6 else 2 end) as e
    from public.favorites f
    join pool pl on pl.id = f.photo_id
    left join public.users usr on usr.id = f.user_id
    group by f.photo_id
  ),
  com_e as (
    select c.photo_id,
           sum(case when usr.photographer_status = 'approved' then 20
                    when usr.is_customer then 12 else 4 end) as e
    from public.comments c
    join pool pl on pl.id = c.photo_id
    left join public.users usr on usr.id = c.user_id
    where c.is_hidden = false
    group by c.photo_id
  ),
  vel as (
    select vr.photo_id,
           sum((case when usr.photographer_status = 'approved' then 5
                     when usr.is_customer then 3 else 1 end)) as v
    from vote_rank vr
    join pool pl on pl.id = vr.photo_id
    left join public.users usr on usr.id = vr.user_id
    where vr.voted_at >= now() - interval '7 days'
    group by vr.photo_id
  ),
  scored as (
    select pool.id, pool.season_id, pool.views,
           coalesce(ve.e, 0) + coalesce(fe.e, 0) + coalesce(ce.e, 0) as e,
           coalesce(vl.v, 0) as velocity,
           coalesce(sb.b_value, 10) as b
    from pool
    left join vote_e ve on ve.photo_id = pool.id
    left join fav_e  fe on fe.photo_id = pool.id
    left join com_e  ce on ce.photo_id = pool.id
    left join vel    vl on vl.photo_id = pool.id
    left join public.season_baseline sb on sb.season_id = pool.season_id
  ),
  calc as (
    select id, season_id, views, e, velocity,
           least(round((25 + 74.9 * (
             (e::double precision / b) / ((e::double precision / b) + 1)))::numeric, 1), 99.9) as score
    from scored
  ),
  ranked as (
    select c.*,
           row_number() over (partition by season_id order by e asc) as rnk,
           count(*) over (partition by season_id) as n,
           percent_rank() over (partition by season_id order by velocity asc) as vel_pct
    from calc c
  ),
  badged as (
    select id, score, e, (rnk::numeric / n) as pct,
      case
        when velocity > 0 and vel_pct >= 0.95 then 'trending'
        when views > 0 and views < 200 and (rnk::numeric / n) >= 0.90 then 'hidden_gem'
        else null
      end as badge
    from ranked
  )
  update public.photos p
     set engagement = b.e,
         pulse      = b.score,
         percentile = b.pct,
         badge      = b.badge,
         peak_pulse = greatest(coalesce(p.peak_pulse, 0), b.score)
  from badged b
  where p.id = b.id
    and (p.engagement is distinct from b.e
      or p.pulse      is distinct from b.score
      or p.percentile is distinct from b.pct
      or p.badge      is distinct from b.badge
      or p.peak_pulse is distinct from greatest(coalesce(p.peak_pulse, 0), b.score));

  get diagnostics updated = row_count;
  return updated;
end$$;

-- =====================================================================
-- rewire triggers: drop the heavy per-vote whole-pool recompute. The per-row
-- engagement trigger (0022) already recomputes the voted photo + its score in
-- O(1); the whole-pool reconcile + baseline now runs on the cron only.
-- =====================================================================
drop trigger if exists tr_recompute_pulse_votes    on public.votes;
drop trigger if exists tr_recompute_pulse_favs     on public.favorites;
drop trigger if exists tr_recompute_pulse_comments on public.comments;

-- cron: heavy reconcile every 5 minutes (baseline + flags + full rescore)
create extension if not exists pg_cron;
select cron.unschedule('recompute-pulse-active')
  where exists (select 1 from cron.job where jobname = 'recompute-pulse-active');
select cron.schedule('recompute-pulse-active', '*/5 * * * *',
  $$ select public.recompute_pulse_active(); $$);

-- =====================================================================
-- 5. one-time backfill: scores that were throttled to 0.1 under the old decay
-- come back to full weight automatically (raw vote rows were never touched).
-- =====================================================================
select public.recompute_pulse_active();
