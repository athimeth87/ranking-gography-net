-- 0013_block_self_like_favorite.sql
-- Prevent photographers from liking or favoriting their own photos.
-- Re-create the INSERT policies on votes and favorites with an extra
-- check that the actor is not the photo owner. UI also hides the buttons
-- for owners, but this is the authoritative enforcement.

drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own on public.votes for insert
  with check (
    user_id = auth.uid()
    and user_email = (auth.jwt() ->> 'email')
    and not exists (
      select 1 from public.photos p
      where p.id = votes.photo_id and p.photographer_id = auth.uid()
    )
  );

drop policy if exists favorites_modify_own on public.favorites;
create policy favorites_modify_own on public.favorites for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.photos p
      where p.id = favorites.photo_id and p.photographer_id = auth.uid()
    )
  );
