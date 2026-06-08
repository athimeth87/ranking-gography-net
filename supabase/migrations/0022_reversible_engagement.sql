-- 0022: make engagement reversible — recompute from the actual votes/favorites/
-- comments on every insert/delete (and comment hide/unhide), using each
-- interaction's real timestamp for the v4 age weight. Replaces the additive-only
-- v4 triggers so un-liking/un-favoriting lowers the score.

-- age weight (v4 §3) evaluated at an arbitrary "as of" time, not now()
create or replace function public.age_weight_at(uploaded timestamptz, voted timestamptz)
returns numeric language sql immutable as $$
  select case
    when (extract(epoch from (voted - uploaded)) / 3600.0) <= 24 then 1.0
    when (extract(epoch from (voted - uploaded)) / 3600.0) <= 30
      then 1.0 - 0.9 * (((extract(epoch from (voted - uploaded)) / 3600.0) - 24) / 6.0)
    else 0.1
  end;
$$;

-- recompute one photo's engagement from scratch (role × type × age-at-vote)
create or replace function public.recompute_photo_engagement(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare up timestamptz; e numeric := 0;
begin
  select uploaded_at into up from public.photos where id = p_id;
  if up is null then return; end if;

  select coalesce(sum(
    (case when usr.photographer_status = 'approved' then 5
          when usr.is_customer then 3 else 1 end)
    * public.age_weight_at(up, v.voted_at)), 0)
  into e
  from public.votes v left join public.users usr on usr.id = v.user_id
  where v.photo_id = p_id;

  e := e + (select coalesce(sum(
    (case when usr.photographer_status = 'approved' then 10
          when usr.is_customer then 6 else 2 end)
    * public.age_weight_at(up, f.favorited_at)), 0)
    from public.favorites f left join public.users usr on usr.id = f.user_id
    where f.photo_id = p_id);

  e := e + (select coalesce(sum(
    (case when usr.photographer_status = 'approved' then 20
          when usr.is_customer then 12 else 4 end)
    * public.age_weight_at(up, c.created_at)), 0)
    from public.comments c left join public.users usr on usr.id = c.user_id
    where c.photo_id = p_id and c.is_hidden = false);

  update public.photos set engagement = e
   where id = p_id and engagement is distinct from e;
end$$;

-- per-row trigger: recompute the affected photo's engagement on any change
create or replace function public.tr_recompute_engagement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_photo_engagement(coalesce(NEW.photo_id, OLD.photo_id));
  return null;
end$$;

-- retire the additive-only v4 triggers
drop trigger if exists tr_v4_like_trigger on public.votes;
drop trigger if exists tr_v4_fav_trigger on public.favorites;
drop trigger if exists tr_v4_comment_trigger on public.comments;

-- engagement recompute on insert/delete (and comment hide via update)
drop trigger if exists tr_eng_votes on public.votes;
create trigger tr_eng_votes after insert or delete on public.votes
  for each row execute function public.tr_recompute_engagement();

drop trigger if exists tr_eng_favs on public.favorites;
create trigger tr_eng_favs after insert or delete on public.favorites
  for each row execute function public.tr_recompute_engagement();

drop trigger if exists tr_eng_comments on public.comments;
create trigger tr_eng_comments after insert or delete or update on public.comments
  for each row execute function public.tr_recompute_engagement();

-- pulse recompute must also fire on delete/update, not just insert
drop trigger if exists tr_recompute_pulse_votes on public.votes;
create trigger tr_recompute_pulse_votes after insert or delete on public.votes
  for each statement execute function public.tr_recompute_pulse();

drop trigger if exists tr_recompute_pulse_favs on public.favorites;
create trigger tr_recompute_pulse_favs after insert or delete on public.favorites
  for each statement execute function public.tr_recompute_pulse();

drop trigger if exists tr_recompute_pulse_comments on public.comments;
create trigger tr_recompute_pulse_comments after insert or delete or update on public.comments
  for each statement execute function public.tr_recompute_pulse();

-- backfill: fix any stale engagement (e.g. leftover from removed votes), then re-rank
select public.recompute_photo_engagement(id) from public.photos;
select public.recompute_pulse_active();
