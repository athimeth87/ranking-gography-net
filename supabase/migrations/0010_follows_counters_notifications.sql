-- 0010_follows_counters_notifications.sql
-- Wire follower / following counters on users, add follow notification
-- type + trigger, and expose follows/users to Realtime.

alter table public.users
  add column if not exists followers_count integer default 0,
  add column if not exists following_count integer default 0;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (type in (
    'like_received','comment_received','comment_reply',
    'editor_pick','ambassador_pick',
    'season_winner','cashback_eligible',
    'photographer_approved','photographer_rejected',
    'customer_marked','ambassador_invited',
    'photo_reported','photo_hidden','photo_warned',
    'follow_received'
  ));

create or replace function public.update_user_follow_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.users set followers_count = followers_count + 1 where id = new.following_id;
    update public.users set following_count = following_count + 1 where id = new.follower_id;
  elsif tg_op = 'DELETE' then
    update public.users set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
    update public.users set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_follows_count on public.follows;
create trigger tr_follows_count after insert or delete on public.follows
  for each row execute function public.update_user_follow_counts();

create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_username text;
begin
  if new.follower_id = new.following_id then return new; end if;

  select username into v_actor_username from public.users where id = new.follower_id;

  insert into public.notifications (user_id, type, related_user_id, body, related_url)
  values (
    new.following_id,
    'follow_received',
    new.follower_id,
    coalesce(v_actor_username, 'someone') || ' started following you',
    '/photographer/' || coalesce(v_actor_username, '')
  );

  return new;
end;
$$;

drop trigger if exists tr_notify_on_follow on public.follows;
create trigger tr_notify_on_follow after insert on public.follows
  for each row execute function public.notify_on_follow();

alter publication supabase_realtime add table public.follows;
alter publication supabase_realtime add table public.users;

update public.users u set
  followers_count = coalesce((select count(*) from public.follows f where f.following_id = u.id), 0),
  following_count = coalesce((select count(*) from public.follows f where f.follower_id = u.id), 0);
