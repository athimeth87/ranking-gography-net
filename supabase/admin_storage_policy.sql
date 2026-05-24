-- Allow admins to upload, update, and delete any object in the 'photos' bucket

CREATE POLICY "Admins can upload any photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can update any photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos' AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can delete any photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);
