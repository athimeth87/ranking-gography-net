-- Create the "photos" bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Set up Storage policies for "photos" bucket
-- Allow public access to view photos
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'photos' );

-- Allow authenticated users to upload photos to their own folder
create policy "Users can upload their own photos"
on storage.objects for insert
with check (
  bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own photos
create policy "Users can update their own photos"
on storage.objects for update
using (
  bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own photos
create policy "Users can delete their own photos"
on storage.objects for delete
using (
  bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]
);
