-- Add voyageur_only column to photos table
alter table public.photos
add column if not exists voyageur_only boolean default false;

-- Update the public select policy to hide voyageur_only photos from non-voyageurs
drop policy if exists photos_select_public on public.photos;

create policy photos_select_public on public.photos for select
using (
  is_hidden = false
  and status = 'published'
  and (
    voyageur_only = false
    or (
      voyageur_only = true 
      and exists (
        select 1 from public.users u 
        where u.id = auth.uid() 
        and (u.is_customer = true or u.photographer_status = 'approved')
      )
    )
    or photographer_id = auth.uid() -- owner can always see their own
  )
);
