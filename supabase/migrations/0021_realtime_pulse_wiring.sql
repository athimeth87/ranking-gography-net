-- 0021: fire recompute on every vote/favorite/comment (statement-level, once per
-- statement), schedule a 1-min safety recompute, and widen realtime payloads.

-- statement-level recompute trigger (runs once per INSERT statement, after the
-- per-row v4 engagement triggers have updated photos.engagement)
create or replace function public.tr_recompute_pulse()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_pulse_active();
  return null;
end;
$$;

drop trigger if exists tr_recompute_pulse_votes on public.votes;
create trigger tr_recompute_pulse_votes
  after insert on public.votes
  for each statement execute function public.tr_recompute_pulse();

drop trigger if exists tr_recompute_pulse_favs on public.favorites;
create trigger tr_recompute_pulse_favs
  after insert on public.favorites
  for each statement execute function public.tr_recompute_pulse();

drop trigger if exists tr_recompute_pulse_comments on public.comments;
create trigger tr_recompute_pulse_comments
  after insert on public.comments
  for each statement execute function public.tr_recompute_pulse();

-- realtime: send full row on UPDATE so clients always get pulse/counters
alter table public.photos replica identity full;

-- 1-minute safety net: ages photos out as they cross 24h + heals missed triggers
create extension if not exists pg_cron;
select cron.unschedule('recompute-pulse-active')
  where exists (select 1 from cron.job where jobname = 'recompute-pulse-active');
select cron.schedule('recompute-pulse-active', '* * * * *',
  $$ select public.recompute_pulse_active(); $$);
