-- Drop the strict policy that requires photographer_status = 'approved'
drop policy if exists photos_insert_photographer on public.photos;
drop policy if exists photos_insert_own on public.photos;

-- Create a new policy that allows ANY authenticated user to upload their own photos
-- (The 1-photo-per-day limit is handled by the frontend logic)
create policy photos_insert_own on public.photos for insert
  with check (
    photographer_id = auth.uid()
  );
