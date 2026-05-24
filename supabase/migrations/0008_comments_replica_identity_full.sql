-- 0008_comments_replica_identity_full.sql
-- Make UPDATE/DELETE realtime events deliverable through RLS.
--
-- With the default replica identity (PK only), DELETE payload.old contains
-- only the primary key, so the Realtime extension cannot evaluate the
-- per-row RLS policy against the deleted row and silently drops the event
-- for subscribed clients. Setting REPLICA IDENTITY FULL writes the full
-- row to WAL on every change so DELETE events reach all eligible clients
-- and UPDATE events carry both old and new column values.
--
-- Cost: slightly larger WAL volume per row mutation on comments. Acceptable
-- given comment volume is modest and the table is not on a hot write path.

alter table public.comments replica identity full;
