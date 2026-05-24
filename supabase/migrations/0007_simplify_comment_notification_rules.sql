-- 0007_simplify_comment_notification_rules.sql
-- Each comment INSERT now produces exactly one notification (or zero):
--   • top-level comment  → photo owner (skip if owner is the commenter)
--   • reply              → parent comment author (skip if author is the replier)
-- Previously a reply also notified the photo owner; that was over-noisy.

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_actor_username text;
  v_parent_author uuid;
begin
  select username into v_actor_username from public.users where id = new.user_id;

  if new.parent_id is null then
    -- Top-level comment → notify photo owner (skip self)
    select photographer_id into v_owner from public.photos where id = new.photo_id;
    if v_owner is not null and v_owner <> new.user_id then
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
  else
    -- Reply → notify parent comment author only (skip self)
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

  return new;
end;
$$;
