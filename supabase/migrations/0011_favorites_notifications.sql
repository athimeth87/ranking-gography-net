-- 0011_favorites_notifications.sql
-- 1. Allow 'favorite_received' as a valid notification type
-- 2. Insert a notification when someone favorites a photo (skip self)
-- 3. Publish public.favorites on supabase_realtime so /me/favorites can
--    react to inserts/deletes from other tabs.
-- 4. Re-sync favorites_count on photos as an idempotent safety net.

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'like_received','comment_received','comment_reply',
    'editor_pick','ambassador_pick',
    'season_winner','cashback_eligible',
    'photographer_approved','photographer_rejected',
    'customer_marked','ambassador_invited',
    'photo_reported','photo_hidden','photo_warned',
    'follow_received','favorite_received'
  ));

create or replace function public.notify_on_favorite()
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
    'favorite_received',
    new.photo_id,
    new.user_id,
    coalesce(v_actor_username, 'someone') || ' favorited your photo',
    '/photo/' || new.photo_id::text
  );

  return new;
end;
$$;

drop trigger if exists tr_notify_on_favorite on public.favorites;
create trigger tr_notify_on_favorite after insert on public.favorites
  for each row execute function public.notify_on_favorite();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'favorites'
  ) then
    execute 'alter publication supabase_realtime add table public.favorites';
  end if;
end$$;

update public.photos p set favorites_count = coalesce(
  (select count(*) from public.favorites f where f.photo_id = p.id), 0
);
