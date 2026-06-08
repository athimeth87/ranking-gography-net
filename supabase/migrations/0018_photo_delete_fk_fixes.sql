-- 0018_photo_delete_fk_fixes.sql
-- Let a photographer delete their own photo even after it has received
-- engagement. notifications.related_photo_id had no ON DELETE rule (NO ACTION),
-- so any like/comment/favorite/reply notification referencing the photo blocked
-- the delete with a foreign-key violation. Re-point it to CASCADE so stale
-- notifications (whose /photo/<id> link would 404 anyway) are cleaned up with
-- the photo.
--
-- All other photo FKs already cascade: votes, favorites, comments,
-- editor_picks, ambassador_picks, photo_reports, photo_impressions.
-- season_winners.photo_id is intentionally left as-is so award history /
-- vouchers protect a winning photo from deletion.

alter table public.notifications
  drop constraint if exists notifications_related_photo_id_fkey;

alter table public.notifications
  add constraint notifications_related_photo_id_fkey
  foreign key (related_photo_id) references public.photos(id) on delete cascade;
