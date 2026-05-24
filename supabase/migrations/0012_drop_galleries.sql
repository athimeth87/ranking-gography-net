-- 0012_drop_galleries.sql
-- The gallery feature was removed from the product. Drop the related tables;
-- RLS policies, indexes, triggers and FK refs go with them via cascade.

drop table if exists public.gallery_photos cascade;
drop table if exists public.galleries cascade;
