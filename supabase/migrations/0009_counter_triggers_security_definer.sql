-- 0009_counter_triggers_security_definer.sql
-- Counter trigger functions must bypass RLS on photos: the user who
-- INSERTs a vote/comment/favorite is usually NOT the photo owner, so
-- the trigger's UPDATE on photos would otherwise be silently rejected
-- by photos_update_own / photos_update_admin policies, leaving the
-- denormalized count fields stuck.
--
-- Also recomputes counts to repair the drift introduced before this fix.

create or replace function public.update_photo_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.photos set likes_count = likes_count + 1 where id = new.photo_id;
  elsif tg_op = 'DELETE' then
    update public.photos set likes_count = greatest(likes_count - 1, 0) where id = old.photo_id;
  end if;
  return null;
end;
$$;

create or replace function public.update_photo_favorites_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.photos set favorites_count = favorites_count + 1 where id = new.photo_id;
  elsif tg_op = 'DELETE' then
    update public.photos set favorites_count = greatest(favorites_count - 1, 0) where id = old.photo_id;
  end if;
  return null;
end;
$$;

create or replace function public.update_photo_comments_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.photos set comments_count = comments_count + 1 where id = new.photo_id;
  elsif tg_op = 'DELETE' then
    update public.photos set comments_count = greatest(comments_count - 1, 0) where id = old.photo_id;
  end if;
  return null;
end;
$$;

update public.photos p set
  likes_count     = coalesce((select count(*) from public.votes      v where v.photo_id = p.id), 0),
  favorites_count = coalesce((select count(*) from public.favorites  f where f.photo_id = p.id), 0),
  comments_count  = coalesce((select count(*) from public.comments   c where c.photo_id = p.id and c.is_hidden = false), 0);
