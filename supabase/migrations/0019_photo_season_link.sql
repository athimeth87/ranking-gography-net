-- 0019: link photos to seasons
-- Adds an explicit season_id on photos, seeds the inaugural Season 1,
-- backfills all existing photos into it, and auto-assigns new uploads
-- to the season whose date window contains their upload date.

-- 1. season_id column + index
alter table public.photos
  add column if not exists season_id uuid references public.seasons(id);

create index if not exists photos_season_idx on public.photos(season_id);

-- 2. seed the inaugural season (idempotent by name)
insert into public.seasons (name, start_date, end_date, status)
select 'Season 1', date '2026-06-01', date '2026-09-30', 'active'
where not exists (select 1 from public.seasons where name = 'Season 1');

-- 3. backfill: every existing photo belongs to Season 1 (the inaugural catalog)
update public.photos
   set season_id = (select id from public.seasons where name = 'Season 1' limit 1)
 where season_id is null;

-- 4. auto-assign season on insert, based on the upload date falling inside a season window
create or replace function public.assign_photo_season()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.season_id is null then
    select s.id into new.season_id
      from public.seasons s
     where coalesce(new.uploaded_at, now())::date between s.start_date and s.end_date
     order by (s.status = 'active') desc, s.start_date desc
     limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_photo_season_trg on public.photos;
create trigger assign_photo_season_trg
  before insert on public.photos
  for each row execute function public.assign_photo_season();
