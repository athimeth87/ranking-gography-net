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
SELECT public.apply_photo_pulse_v2('[{"id":"69348ab3-2c38-4133-9f15-4174b3052352","pulse":61.9,"score_v2":39.75,"percentile":0.619,"badge":""},{"id":"8b566cd5-6cf9-42bb-9f0b-16ca00581aeb","pulse":52.4,"score_v2":39.75,"percentile":0.5238,"badge":""},{"id":"bff802d7-9170-4630-bcd0-0a97d249ef53","pulse":47.6,"score_v2":39.75,"percentile":0.4762,"badge":""},{"id":"debfbd7b-807d-4967-a022-6ca834c21141","pulse":19,"score_v2":39.75,"percentile":0.1905,"badge":""},{"id":"7f0cfa26-b54e-40c5-a8a9-08430c16bc01","pulse":95.2,"score_v2":39.75,"percentile":0.9524,"badge":""},{"id":"8c6aa644-c7db-4495-a318-fe7bf60d8a58","pulse":23.8,"score_v2":39.75,"percentile":0.2381,"badge":""},{"id":"acace633-47cd-4131-b4fe-c2aa99f95ff2","pulse":57.1,"score_v2":39.75,"percentile":0.5714,"badge":""},{"id":"370132f2-e760-4ffa-80f3-d2e3dec1d009","pulse":33.3,"score_v2":39.75,"percentile":0.3333,"badge":""},{"id":"6187820e-9273-489f-9228-a52514ae4ae8","pulse":28.6,"score_v2":39.75,"percentile":0.2857,"badge":""},{"id":"aab548ee-595b-4b1b-9052-168be2c2d7e5","pulse":0,"score_v2":39.75,"percentile":0,"badge":""},{"id":"61f75e96-cbdd-4fa4-b793-38e3e1015473","pulse":14.3,"score_v2":39.75,"percentile":0.1429,"badge":""},{"id":"b45707e3-5130-448f-8b8e-c82094cbb8cf","pulse":4.8,"score_v2":39.75,"percentile":0.0476,"badge":""},{"id":"e0e0fb84-b51e-4bca-a58f-3ce5c3d8907b","pulse":9.5,"score_v2":39.75,"percentile":0.0952,"badge":""},{"id":"6e4e5597-0940-4d6c-a5e5-0f3e09dae663","pulse":81,"score_v2":39.75,"percentile":0.8095,"badge":""},{"id":"489aafee-c2e2-4d12-a229-6f91fd0a9b1b","pulse":76.2,"score_v2":39.75,"percentile":0.7619,"badge":""},{"id":"2be34220-b7c5-4af3-ad12-602f162e9ead","pulse":71.4,"score_v2":39.75,"percentile":0.7143,"badge":""},{"id":"adefbcb4-c4fe-4021-89ee-efab15080128","pulse":66.7,"score_v2":39.75,"percentile":0.6667,"badge":""},{"id":"efd49b7c-ad39-41f7-978e-f1517ad5ea5f","pulse":38.1,"score_v2":39.75,"percentile":0.381,"badge":""},{"id":"41b5ca2e-a5d8-4f8a-be88-e33a1ca043be","pulse":90.5,"score_v2":39.75,"percentile":0.9048,"badge":""},{"id":"419930a7-a9c6-498d-bb22-4edbdd5ec713","pulse":100,"score_v2":132.5,"percentile":1,"badge":""},{"id":"ee6ebb21-62e0-4d1b-bb71-04e20dead0f1","pulse":85.7,"score_v2":39.75,"percentile":0.8571,"badge":""},{"id":"2195e56c-fd58-4ea6-81d8-bd2b31869e81","pulse":42.9,"score_v2":39.75,"percentile":0.4286,"badge":""}]'::jsonb);