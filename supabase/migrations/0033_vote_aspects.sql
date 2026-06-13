-- 0033: Vote Aspect — every vote must name what stands out (color / composition / light).
--
-- A vote carries up to three aspect flags. Endorsing one side weighs 1.0; endorsing
-- TWO OR MORE weighs MULTI_VOTE_WEIGHT = 1.25 (a small bonus for a photo strong on
-- several axes). It is still ONE vote — the daily budget decrements by 1, and role
-- weight / anti-collusion multiply on top. Legacy votes (pre-aspect) are flagged
-- is_legacy → weight 1.0 and excluded from the power-bar tally.
--
-- ONLY the vote weight in E changes (× vote_aspect_weight). E / baseline B / Hill
-- curve / recompute architecture from 0032 are otherwise untouched.
--
-- The power-bar tally is display-only (never feeds the score) and is exposed ONLY
-- to the photo owner or a viewer who has already voted (the "see it after you vote"
-- rule) — enforced server-side by get_photo_aspect_tally, not hidden client-side.
--
-- NOTE: apply on Supabase AFTER 0032 (supabase db push / SQL editor).

-- =====================================================================
-- 1. aspect flags on the raw vote row (real table: public.votes from 0001)
-- =====================================================================
alter table public.votes
  add column if not exists aspect_color       boolean not null default false,
  add column if not exists aspect_composition boolean not null default false,
  add column if not exists aspect_light       boolean not null default false,
  add column if not exists is_legacy          boolean not null default false;

-- pre-aspect votes become legacy (counted at weight 1.0, never in the tally)
update public.votes
   set is_legacy = true
 where aspect_color = false
   and aspect_composition = false
   and aspect_light = false
   and is_legacy = false;

-- a new vote must endorse at least one aspect (no aspect-less "plain like")
alter table public.votes
  drop constraint if exists vote_aspect_required;
alter table public.votes
  add constraint vote_aspect_required
  check (is_legacy or aspect_color or aspect_composition or aspect_light);

-- =====================================================================
-- 2. aspect weight — 1 side = 1.0 · ≥2 sides = 1.25 · legacy = 1.0
--    (TS mirror: voteAspectWeight in src/lib/pulse-engine-v4.ts — keep identical)
-- =====================================================================
create or replace function public.vote_aspect_weight(
  p_color boolean, p_comp boolean, p_light boolean, p_legacy boolean
) returns numeric language sql immutable as $$
  select case
    when p_legacy then 1.0
    when (p_color::int + p_comp::int + p_light::int) >= 2 then 1.25
    else 1.0
  end;
$$;

-- =====================================================================
-- 3. tally (display-only) + server-side exposure gate
-- =====================================================================
create or replace view public.photo_aspect_tally as
select
  photo_id,
  count(*) filter (where aspect_color)       as color_votes,
  count(*) filter (where aspect_composition) as composition_votes,
  count(*) filter (where aspect_light)       as light_votes,
  count(*) filter (where not is_legacy)      as aspect_votes_total
from public.votes
group by photo_id;

-- returns the tally ONLY to the photo owner or a viewer who has voted on it;
-- everyone else gets zero rows (the field is never sent, not merely hidden).
create or replace function public.get_photo_aspect_tally(p_id uuid)
returns table (color_votes bigint, composition_votes bigint, light_votes bigint, aspect_votes_total bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.photos where id = p_id and photographer_id = auth.uid())
     and not exists (select 1 from public.votes where photo_id = p_id and user_id = auth.uid())
  then
    return;
  end if;
  return query
    select t.color_votes, t.composition_votes, t.light_votes, t.aspect_votes_total
    from public.photo_aspect_tally t where t.photo_id = p_id;
end$$;

-- admin watchdog: share of votes that endorsed ≥2 aspects (the 1.25-bonus rate).
create or replace function public.vote_aspect_stats()
returns table (multi bigint, total bigint)
language sql security definer set search_path = public as $$
  select
    count(*) filter (where (aspect_color::int + aspect_composition::int + aspect_light::int) >= 2),
    count(*) filter (where not is_legacy)
  from public.votes;
$$;

-- =====================================================================
-- 4. the E recompute now fires on UPDATE too (toggling an aspect can change the
--    vote weight 1.0 ↔ 1.25), and multiplies the vote term by the aspect weight.
-- =====================================================================
drop trigger if exists tr_eng_votes on public.votes;
create trigger tr_eng_votes
  after insert or delete or update on public.votes
  for each row execute function public.tr_recompute_engagement();

-- per-photo (realtime) — identical to 0032 except the vote term × aspect weight
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

  select coalesce(sum(
      (case when usr.photographer_status = 'approved' then 5
            when usr.is_customer then 3 else 1 end)
    * (case when bn.n <= 20 then 1.0 else 20.0 / bn.n end)
    * (case when cp.user_a is not null then 0.3 else 1.0 end)
    * public.vote_aspect_weight(v.aspect_color, v.aspect_composition, v.aspect_light, v.is_legacy)
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

  select b_value into v_b from public.season_baseline where season_id = v_season;
  v_b := coalesce(v_b, 10);

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

-- whole pool (cron) — identical to 0032 except the vote term × aspect weight
create or replace function public.recompute_pulse_active()
returns integer language plpgsql security definer set search_path = public as $$
declare updated integer;
begin
  perform public.refresh_collusion_flags();

  insert into public.season_baseline (season_id, b_value, updated_at)
  select s.id,
         greatest(
           greatest(10, coalesce((
             select sb.b_value from public.season_baseline sb
             join public.seasons ps on ps.id = sb.season_id
             where ps.end_date < s.start_date
             order by ps.end_date desc limit 1), 0)),
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
           v.aspect_color, v.aspect_composition, v.aspect_light, v.is_legacy,
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
           * public.vote_aspect_weight(vr.aspect_color, vr.aspect_composition, vr.aspect_light, vr.is_legacy)
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
-- 5. backfill: legacy votes keep weight 1.0 → scores are unchanged.
-- =====================================================================
select public.recompute_pulse_active();
