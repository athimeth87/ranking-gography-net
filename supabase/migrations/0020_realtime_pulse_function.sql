-- 0020: live pulse recompute over the active pool (age <= 24h), ported from
-- src/lib/pulse-engine-v4.ts. Writes only rows whose score/percentile/badge change.
create or replace function public.recompute_pulse_active()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  with pool as (
    select id, engagement,
           coalesce(impressions_count, 0) as views,
           (extract(epoch from (now() - uploaded_at)) / 3600.0) as age_hours
    from public.photos
    where is_hidden = false
      and status = 'published'
      and uploaded_at >= now() - interval '24 hours'
  ),
  ranked as (
    select p.*,
           row_number() over (order by engagement asc) as rnk,
           count(*) over () as n
    from pool p
  ),
  refq as (
    select engagement as ref
    from ranked
    where rnk = least(n, greatest(1, floor(0.978 * n)::int + 1))
    limit 1
  ),
  calc as (
    select r.id, r.views, r.age_hours,
           (r.rnk::numeric / r.n) as pct,
           round(
             case when (r.rnk::numeric / r.n) <= 0.978
               then (r.rnk::numeric / r.n) * 100
               else least(
                 99.99,
                 97.8 + 2.2 * (1 - exp(-0.4 * (
                   (case when (select ref from refq) > 0
                         then r.engagement / (select ref from refq)
                         else 1 end) - 1)))
               )
             end
           , 1) as score
    from ranked r
  ),
  badged as (
    select id, score, pct, views, age_hours,
      case
        when score >= 99.5 and views >= 100 then 'legendary'
        when score >= 97.8 and views >= 100 then 'popular'
        when score >= 95  and age_hours <= 24 and views >= 50 then 'trending'
        when score >= 90  and views < 200 then 'hidden_gem'
        else null
      end as badge
    from calc
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
end;
$$;
