-- 0028_collection.sql
-- "The Collection" — photographer page revamp:
--   photos.is_curated  = owner pins up to 12 photos to the Curated Set
--                        (the 12-photo cap is enforced at the application layer)
--   photo_provenance   = permanent badge data per photo, built ONLY from real
--                        tables: photos.pick_type (0001), photos.peak_pulse (0014),
--                        photos.badge (0016), season_winners + seasons (0001).

-- =====================================================================
-- photos.is_curated
-- =====================================================================
alter table public.photos
  add column if not exists is_curated boolean not null default false;

comment on column public.photos.is_curated is
  'Pinned to the photographer''s Curated Set (max 12, app-enforced; independent of visibility)';

create index if not exists photos_curated_idx
  on public.photos (photographer_id)
  where is_curated = true;

-- =====================================================================
-- photo_provenance view
-- security_invoker so the photos RLS policies (public/portfolio for everyone,
-- private for the owner) still apply when reading through the view.
-- =====================================================================
drop view if exists public.photo_provenance;
create view public.photo_provenance
with (security_invoker = on) as
select
  p.id                     as photo_id,
  p.photographer_id        as photographer_id,
  p.pick_type              as pick_type,
  p.peak_pulse             as peak_pulse,
  p.badge                  as badge,
  (w.photo_id is not null) as season_winner,
  s.name                   as season_name,
  w.category               as winner_category
from public.photos p
left join lateral (
  select sw.photo_id, sw.season_id, sw.category
  from public.season_winners sw
  where sw.photo_id = p.id
  order by sw.awarded_at asc
  limit 1
) w on true
left join public.seasons s on s.id = w.season_id;

comment on view public.photo_provenance is
  'Permanent provenance badges per photo: editor/ambassador pick, season win, peak pulse tier';

grant select on public.photo_provenance to anon, authenticated;
