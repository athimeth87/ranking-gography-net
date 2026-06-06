-- 0014_pulse_persistence_and_impressions.sql
-- Phase 1: dedup-protected photo impressions (feeds impressions_count + exposure score).
-- Phase 2: persisted pulse + peak_pulse columns, written by the compute-pulse cron.

-- ── Phase 1: impressions ──────────────────────────────────────────────────
create table if not exists public.photo_impressions (
  photo_id   uuid not null references public.photos(id) on delete cascade,
  viewer_key text not null,
  seen_on    date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz default now(),
  primary key (photo_id, viewer_key, seen_on)
);

create index if not exists photo_impressions_photo_idx on public.photo_impressions(photo_id);

-- One impression per viewer per photo per day. Only a fresh row bumps the counter.
create or replace function public.increment_photo_impression(p_photo_id uuid, p_viewer_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_viewer_key is null or length(p_viewer_key) = 0 then
    return;
  end if;

  insert into public.photo_impressions (photo_id, viewer_key)
  values (p_photo_id, p_viewer_key)
  on conflict (photo_id, viewer_key, seen_on) do nothing;

  if found then
    update public.photos
      set impressions_count = impressions_count + 1
      where id = p_photo_id;
  end if;
end;
$$;

grant execute on function public.increment_photo_impression(uuid, text) to anon, authenticated;

-- ── Phase 2: persisted pulse ──────────────────────────────────────────────
-- pulse      = current score (decays over time)
-- peak_pulse = highest score this photo ever reached (the "Highest Pulse" stat)
alter table public.photos add column if not exists pulse      numeric(5,1);
alter table public.photos add column if not exists peak_pulse numeric(5,1);

create index if not exists photos_pulse_idx
  on public.photos(pulse desc)
  where is_hidden = false and status = 'published';

create index if not exists photos_peak_pulse_idx
  on public.photos(peak_pulse desc)
  where is_hidden = false and status = 'published';
