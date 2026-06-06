-- 0016_pulse_v2_ecosystem.sql
-- Pulse v2 per pulse-scoring-MASTER.md. The cron scores the whole field and writes:
--   pulse       = display score 0–100 (= percentile × 100)
--   score_v2    = ranking score (adjusted_rate × decay) — orders the field
--   percentile  = 0..1 rank within the field
--   badge       = top_field | popular | trending | hidden_gem | null  (§4)

alter table public.photos add column if not exists score_v2   numeric;
alter table public.photos add column if not exists percentile numeric(5,4);
alter table public.photos add column if not exists badge      text;

create index if not exists photos_score_v2_idx
  on public.photos(score_v2 desc)
  where is_hidden = false and status = 'published';

create index if not exists photos_percentile_idx
  on public.photos(percentile desc)
  where is_hidden = false and status = 'published';

create index if not exists photos_badge_idx
  on public.photos(badge)
  where badge is not null;

create or replace function public.apply_photo_pulse_v2(updates jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with data as (
    select (e->>'id')::uuid           as id,
           (e->>'pulse')::numeric      as pulse,
           (e->>'score_v2')::numeric   as score_v2,
           (e->>'percentile')::numeric as percentile,
           nullif(e->>'badge', '')     as badge
    from jsonb_array_elements(updates) e
  )
  update public.photos p
    set pulse       = d.pulse,
        score_v2    = d.score_v2,
        percentile  = d.percentile,
        badge       = d.badge,
        peak_pulse  = greatest(coalesce(p.peak_pulse, 0), d.pulse)
    from data d
    where p.id = d.id;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.apply_photo_pulse_v2(jsonb) from public;
grant execute on function public.apply_photo_pulse_v2(jsonb) to service_role;
