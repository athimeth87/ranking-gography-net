# Pulse Algorithm Specification

**Source:** Derived from 500px Pulse (legacy + community research) and adapted for Ranking by GOGRAPHY.

This file is the SOURCE OF TRUTH for how a photo's Pulse score is calculated.
The implementation in [`src/lib/pulse-engine.ts`](../../src/lib/pulse-engine.ts) mirrors
this spec; constants at the top of that file map 1:1 to the parameters below.

When this spec changes, update `pulse-engine.ts` constants and the unit tests.

---

## 1. What Pulse Is

Pulse is a 0–100 score representing the "current momentum" of a photo within a season.
It is **not** a pure quality score — it blends `engagement × exposure × quality signals`
into a single number used to surface and promote photos.

### Our adaptations from vanilla 500px

| Parameter | 500px default | Ranking value | Reason |
| --- | --- | --- | --- |
| Floor (minimum) | 0 / N/A | **19** | Pulse never reads below 19% so new uploads always show a value |
| Ceiling | 100 | **100** | Same |
| Reset cadence | rolling forever | **per season** | We re-baseline at the start of each season (`seasons` table) |
| Editor's Choice bonus | bypasses ceiling | **+15 added, still capped at 100** | Premium curation should boost but not bypass |

---

## 2. Input Signals (per photo)

| Signal | DB source | Used for |
| --- | --- | --- |
| `likes_count` | `photos.likes_count` (counter cache from `votes`) | Base engagement |
| `favorites_count` | `photos.favorites_count` | Engagement × 2 weight (deeper signal than like) |
| `comments_count` | `photos.comments_count` | Engagement × 1.5 weight (effortful signal) |
| `impressions_count` | `photos.impressions_count` | Exposure / view-rate denominator |
| `uploaded_at` | `photos.uploaded_at` | Recency / decay |
| `pick_type` | `photos.pick_type` ∈ `none|editor|ambassador|both` | Curation bonus |
| Vote rows | `votes` (with `user_id`, `voted_at`) | Vote weight (follower / activity / reciprocal / anti-collusion) |
| Follow rows | `follows` | Follower-vs-non-follower vote weighting |
| Photo metadata | `photos` (title, category, location, camera, lens) | Metadata-complete eligibility |

---

## 3. Vote Weight (per individual vote)

Not all votes count equally. For each vote `v` cast by user `u` on photo `p` (owned by `owner`):

```
weight(v) = base × follower_factor × activity_factor × reciprocity_factor × anti_collusion_factor
```

| Factor | Formula | Range |
| --- | --- | --- |
| `base` | `1.0` | constant |
| `follower_factor` | `1.0` if `u` does NOT follow `owner`, else `0.6` | 0.6–1.0 (non-followers carry more weight — independent signal) |
| `activity_factor` | `clamp(log10(u.total_votes + 1) / 2, 0.5, 1.2)` | 0.5–1.2 (active voters carry more weight, but capped) |
| `reciprocity_factor` | `0.4` if `owner` has voted on any of `u`'s photos in the last 30 days, else `1.0` | 0.4 or 1.0 |
| `anti_collusion_factor` | `0.3` if `u` and `owner` share ≥ 5 reciprocal votes in 7 days, else `1.0` | 0.3 or 1.0 (heavy penalty for vote rings) |

When per-vote data is unavailable (mock photos, missing rows), the algorithm falls back
to `likes_count` with `weight = 1.0` per vote.

---

## 4. Engagement Score

```
engagement_raw =
    Σ weight(v_like)        // sum of weighted votes
  + favorites_count × 2.0
  + comments_count × 1.5
```

Apply a logarithmic curve (diminishing returns — section 5 of source):

```
engagement = 25 × log10(engagement_raw + 1)
```

This puts a photo with 10 weighted engagements at ~26, 100 at ~50, 1000 at ~75.

---

## 5. Exposure / View Rate

```
exposure = clamp( (likes_count + favorites_count) / max(impressions_count, 1) , 0, 0.5)
exposure_score = exposure × 200       // 0 → 0, 0.5 → 100
```

If `impressions_count` is 0 (no views tracked yet), `exposure_score = 0` — it just doesn't contribute.

---

## 6. Metadata Completeness (Fresh-eligibility gate)

```
has_metadata = title.length > 0
            && category != null
            && (location || camera || lens)   // at least one descriptor
metadata_bonus = has_metadata ? 5 : 0
```

This mirrors 500px's "Fresh" requirement (title + category + ≥3 tags). We don't have tags,
so we substitute location/camera/lens as our equivalent descriptors.

---

## 7. Pick Bonus

| `pick_type` | Bonus |
| --- | --- |
| `none` | 0 |
| `editor` | +10 |
| `ambassador` | +10 |
| `both` | +15 |

---

## 8. Time Decay (within current season)

Let `hours = (now - uploaded_at) in hours`, clamped to current season's start.

```
if hours <= 24:       decay = 1.0
if 24 < hours <= 168: decay = 1.0 - 0.10 × ((hours - 24) / 24)   // -10% per day
if hours > 168:       decay = max(0.3, 1.0 - 0.60 × log10((hours - 168) / 24 + 1))
```

A fresh upload starts at full strength. After a week the score is around 30–50% of peak.
A floor of 0.3 prevents total collapse — a viral photo from week 1 of the season still has presence.

---

## 9. Final Pulse

```
combined = (engagement + exposure_score + metadata_bonus + pick_bonus) × decay
pulse = clamp(combined, FLOOR_19, 100)
```

Where `FLOOR_19 = 19`. Photos never display below 19%.

---

## 10. Season Reset

At season boundary (`seasons.status` flips, new `seasons` row becomes active):
- The algorithm uses **only votes/favorites/comments cast within the active season** for
  `engagement_raw` and `exposure`.
- `decay` clock starts from `max(uploaded_at, season.start)`.
- Photos uploaded in previous seasons can still earn Pulse in the new season but start
  their decay clock at the season start, not their original upload date.

(Implementation note: until the seasons schema is fully wired into the query layer, the
engine treats `season.start = epoch` so behavior is identical to "rolling forever". The
season-scope filter is a one-line swap when ready.)

---

## 11. Display Rules

- Always show an integer (`Math.round(pulse)`).
- Always append the `%` suffix.
- Never show "0%" — the floor is 19.
- If the score cannot be computed (network error, missing data), show `19%` and log a warning.

---

## 12. Future Phase 2 (not yet implemented)

These require per-vote DB access at compute time. They are stubbed in the engine and
return the neutral `1.0` factor today.

- `activity_factor` requires querying `votes WHERE user_id = u` count.
- `reciprocity_factor` requires querying `votes WHERE user_id = owner AND photo_id IN (u's photos)` in last 30 days.
- `anti_collusion_factor` requires the same with a 7-day window and count threshold.

Phase 2 will move these into a Supabase function `calculate_pulse(photo_id)` and
materialize the result into a `photos.pulse` column updated via trigger.

---

## References

- 500px Support: [What is Pulse and Views?](https://support.500px.com/hc/en-us/articles/203999378)
- Mike Creeth (2014): [What does the 500px pulse score really mean?](https://mikecreeth.wordpress.com/2014/11/19/what-does-the-500px-pulse-score-really-mean/) — empirical analysis of ~28k photos
- Jason Waltman: [My Thoughts on 500px's Pulse 2.0](https://www.jasonwaltman.com/blog/2013/my-thoughts-on-500px-pulse-2-0/)
- Quora: [How does 500px.com calculate 'pulse'?](https://www.quora.com/How-does-500px-com-calculate-pulse)
- [500px Legacy API Documentation (GitHub)](https://github.com/500px/legacy-api-documentation)
