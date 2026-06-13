-- Backlog security / data-integrity fixes from the branch review.
-- NOTE: apply on Supabase (supabase db push / SQL editor) for these to take effect.

-- (L6) photos_update_own had USING but no WITH CHECK, so an owner could update a
-- row AND reassign photographer_id to another account (taking pulse/likes with it).
-- Add WITH CHECK so the row must still belong to the caller after the update.
drop policy if exists photos_update_own on public.photos;
create policy photos_update_own on public.photos
  for update
  using (photographer_id = auth.uid())
  with check (photographer_id = auth.uid());

-- (L7) release_due_drops overwrote uploaded_at = now() on release, destroying the
-- real upload timestamp (and a future footgun if portfolio ever enters scoring).
-- released_at already records the release moment; stop touching uploaded_at.
create or replace function public.release_due_drops()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_drop record;
  v_username text;
  v_count integer := 0;
begin
  for v_drop in
    select d.id, d.photographer_id, d.title
    from public.drops d
    where d.status = 'scheduled' and d.scheduled_at <= now()
    for update skip locked
  loop
    update public.photos
      set status = 'published', visibility = 'portfolio', released_at = now()
      where drop_id = v_drop.id and status = 'draft';

    update public.drops
      set status = 'released', released_at = now()
      where id = v_drop.id;

    select username into v_username from public.users where id = v_drop.photographer_id;

    insert into public.notifications (user_id, type, related_user_id, body, related_url)
    select t.user_id, 'drop_released', v_drop.photographer_id,
           coalesce(v_username, 'someone') || ' ปล่อยภาพชุดใหม่แล้ว — "' || v_drop.title || '"',
           '/photographer/' || coalesce(v_username, '')
    from (
      select s.user_id from public.drop_subscriptions s where s.drop_id = v_drop.id
      union
      select f.follower_id from public.follows f where f.following_id = v_drop.photographer_id
    ) t
    where t.user_id <> v_drop.photographer_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
