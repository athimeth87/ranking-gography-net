-- 0006_likes_comments_notifications.sql
-- Drop the prototype table, add notification triggers, enable Realtime.

-- =====================================================================
-- Drop prototype_likes (replaced by canonical votes table)
-- =====================================================================
drop table if exists public.prototype_likes;

-- =====================================================================
-- notify_on_vote: on votes INSERT, create like_received notification
-- (skip if liker is the photo owner)
-- =====================================================================
create or replace function public.notify_on_vote()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_actor_username text;
begin
  select photographer_id into v_owner from public.photos where id = new.photo_id;

  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;

  select username into v_actor_username from public.users where id = new.user_id;

  insert into public.notifications (user_id, type, related_photo_id, related_user_id, body, related_url)
  values (
    v_owner,
    'like_received',
    new.photo_id,
    new.user_id,
    coalesce(v_actor_username, 'someone') || ' liked your photo',
    '/photo/' || new.photo_id::text
  );

  return new;
end;
$$;

drop trigger if exists tr_notify_on_vote on public.votes;
create trigger tr_notify_on_vote after insert on public.votes
  for each row execute function public.notify_on_vote();

-- =====================================================================
-- notify_on_comment: on comments INSERT, notify photo owner + parent
-- comment author (dedup'd if owner == parent author)
-- =====================================================================
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_actor_username text;
  v_parent_author uuid;
begin
  select photographer_id into v_owner from public.photos where id = new.photo_id;
  select username into v_actor_username from public.users where id = new.user_id;

  -- Reply: notify parent comment author (if not self)
  if new.parent_id is not null then
    select user_id into v_parent_author from public.comments where id = new.parent_id;
    if v_parent_author is not null and v_parent_author <> new.user_id then
      insert into public.notifications (user_id, type, related_photo_id, related_user_id, body, related_url)
      values (
        v_parent_author,
        'comment_reply',
        new.photo_id,
        new.user_id,
        coalesce(v_actor_username, 'someone') || ' replied to your comment',
        '/photo/' || new.photo_id::text
      );
    end if;
  end if;

  -- Notify photo owner (skip self, skip if already notified as parent author)
  if v_owner is not null
     and v_owner <> new.user_id
     and (new.parent_id is null or v_parent_author is null or v_owner <> v_parent_author) then
    insert into public.notifications (user_id, type, related_photo_id, related_user_id, body, related_url)
    values (
      v_owner,
      'comment_received',
      new.photo_id,
      new.user_id,
      coalesce(v_actor_username, 'someone') || ' commented on your photo',
      '/photo/' || new.photo_id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists tr_notify_on_comment on public.comments;
create trigger tr_notify_on_comment after insert on public.comments
  for each row execute function public.notify_on_comment();

-- =====================================================================
-- Realtime publication: add notifications, comments, photos
-- (votes not needed by client — likes_count lives on photos row)
-- =====================================================================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.photos;
