# Realtime Pulse — Design Spec

**Date:** 2026-06-07
**Status:** Implemented
**Author:** Claude (with parin.tnk)

> **Update 2026-06-08 — Pulse model changed.** During testing the percentile
> ranking proved counter-intuitive in small pools (a 0-like photo still showed
> ~50, and un-liking didn't move the number). Per the owner's decision, the live
> Pulse is now an **absolute function of the photo's own engagement**:
> `pulse = round(99.99 * (1 - exp(-0.03 * engagement)), 1)` (0 engagement → 0;
> monotonic, so leaderboards still sort correctly). Engagement is also now
> **reversible** — recomputed from the actual votes/favorites/comments on every
> insert/delete (migration 0022), so un-liking lowers the score. The
> engagement-curve recompute lives in migration 0023. The percentile/compression
> details below describe the original v4 model and are superseded for the live
> `pulse` value (percentile is still stored for reference).

## Goal

Make Pulse scoring **compute and display in realtime**: when a photo receives a
like / favorite / comment, its Pulse score, percentile, badge, and ranking update
**live on every open screen with no page refresh**. All score computation lives in
Supabase (Postgres + Realtime); the daily Vercel cron is retired.

This replaces the current model where raw engagement updates instantly but the
displayed score/percentile/badge only refresh once per day via
`/api/cron/compute-pulse`.

## Scope

In scope — live numbers on:
- Photo detail page (`/photo/[id]`)
- Photo grids / rankings (Explore, Hall of Fame)
- Homepage hero / banner
- Photographer's own `/me` page

Out of scope:
- Changing the v4 scoring **formula** (matrix, age weights, compression, badges
  stay exactly as in `src/lib/pulse-engine-v4.ts`)
- Photographer-level Hall of Fame aggregate (v5) realtime — unchanged for now
- Realtime for comments threads, follows, notifications (already have their own
  realtime where needed)

## Scoring model (confirmed, unchanged from v4)

Daily 24h competition, then freeze:

| Photo age | Behaviour |
|---|---|
| 0–24h (**active**) | votes count full weight; photo is ranked against the other active photos; `pulse` moves up/down |
| 24–30h (**grace**) | late votes still add engagement at decaying weight (1.0→0.1) |
| > 30h (**locked**) | `pulse` frozen at last value |

Two distinct numbers, both already columns on `photos`:
- `pulse` — current heat; freezes after the active window.
- `peak_pulse` — best `pulse` ever reached; permanent (`greatest(peak, new)`).
- Raw counters (`likes_count`, `favorites_count`, `comments_count`) accumulate
  forever and are independent of the freeze.

**Ranking pool decision:** the percentile ranking pool is photos with
`uploaded_at >= now() - interval '24 hours'` (active only), matching
`assignScores(activePool)` in the v4 engine. Photos older than 24h keep their last
`pulse` (frozen) and are never re-ranked. Grace-window (24–30h) votes still
accumulate `engagement` via the existing v4 triggers but do not re-enter the
ranking pool — their `pulse` stays frozen. This is an accepted simplification.

## Architecture (Approach A+)

```
like / favorite / comment INSERT
   │
   ├─ existing v4 trigger:  photos.engagement += value         (instant, per-photo)
   └─ NEW: call recompute_pulse_active()                       (instant, active pool)
            │ rank active pool → percentile → compression → badge
            │ UPDATE only photos whose pulse/percentile/badge actually changed
            ▼
   Supabase Realtime (publication already includes `photos`)
            │ broadcasts changed photo rows
            ▼
   Browser: useRealtimePulse() hook patches local state → numbers move live
```

Plus a **pg_cron job every 1 minute** calling the same
`recompute_pulse_active()` to (a) age photos out as they cross the 24h boundary
(time-driven, not vote-driven) and (b) self-heal if a trigger ever missed.

### Why this shape
- Recompute is bounded to the **active pool** (today's uploads, small set), so
  per-vote cost is O(K log K) with K = active photos — cheap and scale-safe.
- Clients subscribe to a single table (`photos`) — uniform, simple client code.
- Writing only changed rows minimizes Realtime message volume.

## Database layer (migration `0020_realtime_pulse.sql`)

1. **`recompute_pulse_active()`** — `language plpgsql security definer`,
   `set search_path = public`. Ports the v4 engine to SQL:
   - pool = published, non-hidden photos with `uploaded_at >= now() - interval '24 hours'`
   - rank ascending by `engagement`; `percentile = rank / N`
   - `score = percentile * 100` when `percentile <= 0.978`; otherwise
     `least(99.99, 97.8 + 2.2*(1 - exp(-0.4*(engagement/ref - 1))))` where `ref`
     is the engagement at the 97.8th percentile (nearest-rank)
   - `badge`: legendary (`score>=99.5 & views>=100`), popular (`score>=97.8 &
     views>=100`), trending (`score>=95 & active & views>=50`), hidden_gem
     (`score>=90 & views<200`), else null — `views = impressions_count`
   - `UPDATE public.photos SET pulse, percentile, badge,
     peak_pulse = greatest(coalesce(peak_pulse,0), score)` for pool rows,
     **only where any of pulse/percentile/badge is distinct from the new value**
   - round score to 1 decimal (matches `round1`)

2. **Triggers** — `after insert` on `votes`, `favorites`, `comments`, each calling
   `recompute_pulse_active()`. The existing v4 engagement triggers
   (`tr_v4_like` etc.) stay; the new recompute runs after them. (Implementation
   may fold the recompute call into the existing trigger functions to guarantee
   ordering — decided at plan time.)

3. **pg_cron** — `create extension if not exists pg_cron;` then
   `cron.schedule('recompute-pulse-active', '* * * * *', $$ select public.recompute_pulse_active(); $$);`

4. **Realtime** — `alter table public.photos replica identity full;`
   (`photos` is already in the `supabase_realtime` publication — verified.)

5. Keep `apply_photo_pulse_v4` RPC for now (harmless); it is no longer the live
   path.

## Client layer

- **`src/hooks/useRealtimePulse.ts`** — given a list of photo ids (or "subscribe
  all visible"), opens one Supabase Realtime channel on `postgres_changes`
  (`event: UPDATE`, `table: photos`), and returns a map
  `id → { pulse, peakPulse, percentile, badge, likes, favorites, comments }`.
  Cleans up on unmount.
- Components merge the live values over their server-rendered initial props
  (initial paint stays SSR/instant; realtime only patches deltas):
  - `PhotoCard` / `PhotoGrid` — patch numbers; grids re-sort when `pulse` changes
    so photos visibly climb.
  - `/photo/[id]` detail — patch the single row.
  - Homepage hero/banner and `/me` cards — patch numbers.
- One channel per page (not per card) to stay within Realtime connection limits.

## Rollout & safety

- **Retire the Vercel daily cron**: remove the `crons` entry for
  `/api/cron/compute-pulse` from `vercel.json` (and optionally keep the route as a
  manual backstop, gated by `CRON_SECRET`). pg_cron + triggers are the source of
  truth — running both would double-compute.
- **Single source of formula truth risk:** the formula now exists in both
  `pulse-engine-v4.ts` (TS, used by tests) and SQL. Mitigation: keep the vitest
  suite (`src/lib/__tests__/pulse-v4.test.ts`) as the spec, and add a parity check
  that runs the SQL function over `supabase/seed_v4_bots_test.sql` data and
  compares to the TS output within rounding tolerance.
- **Realtime quota** (Supabase plan limits on concurrent connections & monthly
  messages) is the main scaling watch-item. Mitigated by changed-rows-only writes
  and active-pool scoping. If volume grows, switch from per-row `postgres_changes`
  to a single debounced broadcast channel — noted, not built now.

## Testing

1. **SQL parity test** — seed bots, run `recompute_pulse_active()`, compare
   `pulse/percentile/badge` to the TS engine output (tolerance ±0.1).
2. **Lifecycle test** — photo at 23h still ranks; at 25h its pulse is frozen;
   `peak_pulse` preserved.
3. **Changed-rows test** — a vote that doesn't change any ranking writes 0 rows.
4. **Manual realtime test** — two browser windows; like in window A; window B's
   number and grid order update within a few seconds without refresh.
5. Existing `npm run typecheck / lint / test / build` stay green.

## Open items resolved
- Realtime "meaning": live on-screen numbers, no refresh. ✓
- Pages: detail, grids/rankings, homepage, /me. ✓
- Pool: active ≤24h, freeze after. ✓ (user confirmed v4 daily-competition model)
- Recompute trigger strategy: on-vote (instant) + pg_cron 1-min (aging + heal). ✓
