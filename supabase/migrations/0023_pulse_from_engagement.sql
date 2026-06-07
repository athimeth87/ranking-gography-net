-- 0023: Pulse now reflects a photo's OWN engagement (not percentile rank), so
-- adding/removing a like moves the number directly. Saturating curve:
--   pulse = 99.99 * (1 - exp(-K * engagement)),  K = 0.03  (0 engagement -> 0)
-- Leaderboards still sort correctly because pulse is monotonic in engagement.
-- percentile (rank/N) is still recorded for reference.

create or replace function public.recompute_pulse_active()
returns integer language plpgsql security definer set search_path = public as $$
declare updated integer;
begin
  with pool as (
    select id, engagement, coalesce(impressions_count, 0) as views,
           (extract(epoch from (now() - uploaded_at)) / 3600.0) as age_hours
    from public.photos
    where is_hidden = false and status = 'published'
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

-- one-time backfill: put the WHOLE catalog on the engagement curve and reset
-- stale percentile-era peaks to the new-model value (peak grows correctly after).
update public.photos
   set pulse = round((99.99 * (1 - exp(-0.03 * engagement)))::numeric, 1),
       peak_pulse = round((99.99 * (1 - exp(-0.03 * engagement)))::numeric, 1)
 where is_hidden = false and status = 'published';

select public.recompute_pulse_active();
