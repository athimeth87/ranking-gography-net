# GoScore v2 — Scoring Spec (Folder Index)

> Canonical scoring spec for `ranking.gography.net` photo voting platform.
> Locked 2026-05-26. Supersedes the scoring sections of [`docs/LOGIC.md`](../../LOGIC.md) and [`docs/specs/pulse-algorithm.md`](../pulse-algorithm.md).

## Files

| File | Purpose | When to read |
|------|---------|--------------|
| [`design-doc.md`](design-doc.md) | Full design (12 sections + 2 appendix, ~1500 lines). Schema, algorithms, API contracts, anti-abuse, UI, sprint plan. | Primary reference for any GoScore-related work. |
| [`decisions-locked.md`](decisions-locked.md) | D1–D11 — the locked design decisions with rationale + alternatives considered. | When revisiting "why does it work this way" or proposing a change. |
| [`500px-pulse-source.md`](500px-pulse-source.md) | Source analysis of 500px Pulse algorithm (the inspiration). 7 hooks + anti-abuse mechanics. | Before debating scoring trade-offs. |

## Companion: schema migration

[`supabase/migrations/0013_goscore_v2.sql`](../../../supabase/migrations/0013_goscore_v2.sql) — incremental migration that adds GoScore v2 schema on top of 0001–0012. **Review-only** until founder + dev sign off on TODO items at the bottom of that file.

## What GoScore v2 changes vs. the existing pulse engine

Replaces the flat 500px-style Pulse (`docs/specs/pulse-algorithm.md`) with:

- **4-tier voter weight** — User ×1 / Rank Master ×1.5 / Voyageur ×2 / Ambassador ×3 (D3)
- **Hybrid compute** — real-time recompute ≤48h, cron 1h >48h (D1)
- **Layered transparency** — show inputs, hide multipliers (D2)
- **2 photo tiers** — Fresh / Popular at GoScore ≥ 70 (D5)
- **Rank Master earn path** — Top 3 photographer × 3 consecutive weeks (D6, D7)
- **Gentler decay** — floor 70%, not hard cutoff (D8)
- **Curation bonus** — Editor +50 / Ambassador +50 / Both +100, pre-log additive (D9)
- **Voyageur auto-sync** — from Gography booking DB, not admin flag (D10)
- **Ambassador admin flag** — manual `is_ambassador = TRUE`, no email invite (D11)
- **Anti-abuse stack** — reciprocal vote penalty 0.3×, follower 0.7×, mutual 0.4×, new-account 0.3×, velocity tier, EXIF integrity, voter reputation 0.3–2.0

## What 0013_goscore_v2.sql adds (database)

**ENUMs (2):** `user_role`, `photo_tier` (pick_type stays as CHECK on photos)

**Tables (5 new):**
- `weekly_top3` — immutable weekly leaderboard snapshot
- `rank_master_status` — RM tenure + `original_role` restore target + `extension_count`
- `rm_achievements` — Voyageur/Ambassador who qualify RM but keep higher role
- `abuse_flags` — velocity / reciprocal / EXIF anomaly audit trail
- `role_audit_log` — every role transition (promote / demote / sync)

**Columns added (existing tables):**
- `users`: `role`, `voter_reputation` (0.3–2.0), `account_status`
- `seasons`: `photos_per_user_limit` (default 12), `is_active`
- `photos`: `season_id`, `tags`, `current_goscore`, `peak_goscore`, `peak_at`, `tier`, `metadata_complete`, `needs_recompute`, `curation_bonus`, `flagged_for_review`, `flag_reason`
- `votes`: `weight`, `weight_components`, `is_reciprocal`, `is_follower`, `voter_ip_hash`, `voter_subnet_hash`
- `editor_picks`: `notes`

**Trigger updated:** `recompute_pick_type()` (from 0002) now also sets `photos.curation_bonus` per D9 and `photos.needs_recompute = true`.

## Naming map — existing schema → GoScore v2 spec

The spec uses canonical names; the existing schema (0001–0012) uses different conventions. Migration 0013 **does not rename** — app code should map via the data accessor layer (`src/lib/data/`).

| GoScore v2 spec name | Existing schema name | Notes |
|----------------------|----------------------|-------|
| `users.handle` | `users.username` | Aliased in accessors |
| `photos.user_id` | `photos.photographer_id` | Same FK target |
| `photos.url` | `photos.storage_url` | Aliased |
| `likes` table | `votes` table | Extended with weight columns in 0013 |
| `follows.followed_id` | `follows.following_id` | Aliased |
| `follows.created_at` | `follows.followed_at` | Aliased |
| `editor_picks.curator_id` | `editor_picks.editor_id` | Same FK target |
| `ambassador_picks.curator_id` | `ambassador_picks.ambassador_id` | Same FK target |
| `editor_picks.notes` | `editor_picks.notes` (added in 0013) | New column |
| `ambassador_picks.notes` | `ambassador_picks.reason` | Same intent, different name — aliased |
| `seasons.start_at / end_at` | `seasons.start_date / end_date` (DATE) | App converts; no schema change |

## TODO before applying 0013 to production

See checklist at the bottom of [`supabase/migrations/0013_goscore_v2.sql`](../../../supabase/migrations/0013_goscore_v2.sql). Key blockers:

1. Backfill `photos.tags` + decide whether to add `CHECK (array_length(tags,1) >= 3)`
2. Backfill `photos.season_id` from upload timestamps
3. Backfill `users.role` from `is_customer` / `is_ambassador` / `photographer_status`
4. Decide `users.role` sync strategy — trigger vs view-based derivation
5. Write RLS policies for the 5 new tables (currently RLS-enabled, all-denied)
6. Wire Gography booking-DB → `sync_voyageur_status` cron (per D10, §4.6.1)
7. Update `src/lib/pulse.ts` to consume `votes.weight` instead of raw count

## Sprint plan reference

See §8 of [`design-doc.md`](design-doc.md) — 5 sprints × 2 weeks = 10 weeks total:

| Sprint | Weeks | Focus |
|--------|-------|-------|
| 1 | W24–25 | Schema + weight function + hybrid compute |
| 2 | W26–27 | Transparency UX (Pulse breakdown modal, "Almost Popular" badge) |
| 3 | W28–29 | Rank Master engine (weekly cron, promotion, badges) |
| 4 | W30–31 | Anti-abuse (rate limit, velocity detection, EXIF, voter reputation) |
| 5 | W32–33 | Observability (KPI dashboard, calibration, snowball analytics) |

## Related (in this repo)

- [`docs/LOGIC.md`](../../LOGIC.md) — full project logic (scoring section deprecated by this folder)
- [`docs/specs/pulse-algorithm.md`](../pulse-algorithm.md) — original 500px-style Pulse engine (superseded by GoScore v2)
- [`docs/BACKEND_ARCHITECTURE.md`](../../BACKEND_ARCHITECTURE.md) — non-scoring backend (auth, storage, etc.)
- [`src/lib/pulse.ts`](../../../src/lib/pulse.ts) — current pulse implementation (to be replaced per design-doc §4.2)
