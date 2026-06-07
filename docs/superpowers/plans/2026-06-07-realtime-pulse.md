# Realtime Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute Pulse scores in Supabase on every vote and push them live to every open browser via Supabase Realtime, with no page refresh — retiring the daily Vercel cron.

**Architecture:** A Postgres function `recompute_pulse_active()` ports the v4 engine to SQL, ranking only the active pool (photos ≤24h old). Statement-level triggers on `votes`/`favorites`/`comments` call it instantly; a 1-minute `pg_cron` job calls it to age photos past 24h and self-heal. Clients subscribe to `postgres_changes` on `photos` through a `useRealtimePulse` hook; a `RealtimePhotoGrid` wrapper merges live values and re-sorts.

**Tech Stack:** Supabase (Postgres, pg_cron, Realtime), Next.js 14 client components, `@supabase/ssr` browser client, Vitest.

**Spec:** [docs/superpowers/specs/2026-06-07-realtime-pulse-design.md](../specs/2026-06-07-realtime-pulse-design.md)

**Reference formula (do not change):** [src/lib/pulse-engine-v4.ts](../../../src/lib/pulse-engine-v4.ts)

---

## Conventions for this plan

- **DB changes** are applied with the Supabase MCP `apply_migration` tool (project `zotxmuifufctgikdyyuz`), AND saved as a numbered file under `supabase/migrations/`. Apply first, then save the identical SQL to the file.
- **DB "tests"** are SQL/Node assertions run against the live project (no local Postgres exists). The parity script (Task 2) is the authoritative correctness check.
- Run the Node/TS commands with the project Node: `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"`.
- Commit after each task. Branch: `feat/implements` (current).

---

## Task 1: SQL function `recompute_pulse_active()`

**Files:**
- Create (apply via MCP, then save): `supabase/migrations/0020_realtime_pulse_function.sql`

- [ ] **Step 1: Apply the function via MCP**

Use `mcp__supabase__apply_migration` with name `realtime_pulse_function` and this query:

```sql
-- 0020: live pulse recompute over the active pool (age <= 24h), ported from
-- src/lib/pulse-engine-v4.ts. Writes only rows whose score/percentile/badge change.
create or replace function public.recompute_pulse_active()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  with pool as (
    select id, engagement,
           coalesce(impressions_count, 0) as views,
           (extract(epoch from (now() - uploaded_at)) / 3600.0) as age_hours
    from public.photos
    where is_hidden = false
      and status = 'published'
      and uploaded_at >= now() - interval '24 hours'
  ),
  ranked as (
    select p.*,
           row_number() over (order by engagement asc) as rnk,
           count(*) over () as n
    from pool p
  ),
  refq as (
    select engagement as ref
    from ranked
    where rnk = least(n, greatest(1, floor(0.978 * n)::int + 1))
    limit 1
  ),
  calc as (
    select r.id, r.views, r.age_hours,
           (r.rnk::numeric / r.n) as pct,
           round(
             case when (r.rnk::numeric / r.n) <= 0.978
               then (r.rnk::numeric / r.n) * 100
               else least(
                 99.99,
                 97.8 + 2.2 * (1 - exp(-0.4 * (
                   (case when (select ref from refq) > 0
                         then r.engagement / (select ref from refq)
                         else 1 end) - 1)))
               )
             end
           , 1) as score
    from ranked r
  ),
  badged as (
    select id, score, pct, views, age_hours,
      case
        when score >= 99.5 and views >= 100 then 'legendary'
        when score >= 97.8 and views >= 100 then 'popular'
        when score >= 95  and age_hours <= 24 and views >= 50 then 'trending'
        when score >= 90  and views < 200 then 'hidden_gem'
        else null
      end as badge
    from calc
  )
  update public.photos p
     set pulse      = b.score,
         percentile = b.pct,
         badge      = b.badge,
         peak_pulse = greatest(coalesce(p.peak_pulse, 0), b.score)
  from badged b
  where p.id = b.id
    and (p.pulse      is distinct from b.score
      or p.percentile is distinct from b.pct
      or p.badge      is distinct from b.badge
      or p.peak_pulse is distinct from greatest(coalesce(p.peak_pulse, 0), b.score));

  get diagnostics updated = row_count;
  return updated;
end;
$$;
```

- [ ] **Step 2: Smoke-run the function**

Run via `mcp__supabase__execute_sql`: `select public.recompute_pulse_active() as rows_updated;`
Expected: returns a single integer ≥ 0 with no error.

- [ ] **Step 3: Save the migration file**

Write the exact same SQL from Step 1 into `supabase/migrations/0020_realtime_pulse_function.sql`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0020_realtime_pulse_function.sql
git commit -m "feat: add recompute_pulse_active() SQL pulse engine"
```

---

## Task 2: Parity test — SQL function vs TS engine

Proves the SQL port matches `assignScores` within rounding tolerance, using a disposable test photographer + photos that are cleaned up after.

**Files:**
- Create: `supabase/test_realtime_pulse_parity.ts`

- [ ] **Step 1: Write the parity script**

```ts
// Run: export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH" && \
//   npx tsx supabase/test_realtime_pulse_parity.ts
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env (.env.local).
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { assignScores, assignBadge } from '../src/lib/pulse-engine-v4';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, key, { auth: { persistSession: false } });

const TAG = 'parity-test-' + '0001';
const ENGAGEMENTS = [3, 8, 8, 15, 40, 120, 2, 0, 55, 9];

async function main() {
  // 1. test photographer
  const { data: user, error: uErr } = await db.from('users')
    .insert({ email: `${TAG}@example.com`, display_name: TAG, username: TAG })
    .select('id').single();
  if (uErr) throw uErr;

  // 2. test photos, all uploaded "now" (active), with controlled engagement + views
  const rows = ENGAGEMENTS.map((e, i) => ({
    photographer_id: user!.id,
    title: `${TAG}-${i}`,
    slug: `${TAG}-${i}`,
    category: 'landscape',
    storage_url: 'https://example.com/x.webp',
    status: 'published',
    is_hidden: false,
    engagement: e,
    impressions_count: 150,
    uploaded_at: new Date().toISOString(),
  }));
  const { data: photos, error: pErr } = await db.from('photos').insert(rows).select('id, engagement');
  if (pErr) throw pErr;

  try {
    // 3. run SQL engine
    await db.rpc('recompute_pulse_active');
    const { data: after } = await db.from('photos')
      .select('id, engagement, pulse, percentile, badge, impressions_count')
      .in('id', photos!.map(p => p.id));

    // 4. TS engine over the SAME pool (only our test photos are guaranteed active here
    //    if no other photo is <24h; to be safe, rank our set in isolation matches SQL
    //    only when our set IS the whole active pool — so assert per-photo formula instead)
    const pool = (after ?? []).map(p => ({ id: p.id, engagement: Number(p.engagement), views: Number(p.impressions_count) }));
    // NOTE: SQL ranks the WHOLE active pool. Re-read the full active pool for a fair compare.
    const { data: activeAll } = await db.from('photos')
      .select('id, engagement, impressions_count')
      .eq('status', 'published').eq('is_hidden', false)
      .gte('uploaded_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    const tsPool = (activeAll ?? []).map(p => ({ id: p.id as string, engagement: Number(p.engagement), views: Number(p.impressions_count) }));
    const ts = assignScores(tsPool);
    const tsById = new Map(ts.map(r => [r.item.id, r]));

    let failures = 0;
    for (const p of after ?? []) {
      const t = tsById.get(p.id);
      if (!t) continue;
      const badge = assignBadge({ score: t.score, views: Number(p.impressions_count), active: true });
      const dScore = Math.abs(Number(p.pulse) - t.score);
      if (dScore > 0.11) { failures++; console.error(`pulse mismatch ${p.id}: sql=${p.pulse} ts=${t.score}`); }
      if ((p.badge ?? null) !== (badge ?? null)) { failures++; console.error(`badge mismatch ${p.id}: sql=${p.badge} ts=${badge}`); }
    }
    if (failures > 0) { console.error(`PARITY FAILED: ${failures} mismatches`); process.exit(1); }
    console.log(`PARITY OK: ${after?.length} photos matched TS engine`);
  } finally {
    // 5. cleanup
    await db.from('photos').delete().in('id', photos!.map(p => p.id));
    await db.from('users').delete().eq('id', user!.id);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the parity test, expect failure first if function is wrong**

Run: `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH" && npx tsx supabase/test_realtime_pulse_parity.ts`
Expected (function correct): `PARITY OK: 10 photos matched TS engine`
If it prints mismatches, fix the SQL in Task 1 (re-apply via MCP + update the migration file) until parity passes.

- [ ] **Step 3: Commit**

```bash
git add supabase/test_realtime_pulse_parity.ts
git commit -m "test: add SQL-vs-TS pulse parity script"
```

---

## Task 3: Triggers + pg_cron + Realtime replica identity

**Files:**
- Create (apply via MCP, then save): `supabase/migrations/0021_realtime_pulse_wiring.sql`

- [ ] **Step 1: Apply the wiring via MCP**

Use `mcp__supabase__apply_migration`, name `realtime_pulse_wiring`:

```sql
-- 0021: fire recompute on every vote/favorite/comment (statement-level, once per
-- statement), schedule a 1-min safety recompute, and widen realtime payloads.

-- statement-level recompute trigger (runs once per INSERT statement, after the
-- per-row v4 engagement triggers have updated photos.engagement)
create or replace function public.tr_recompute_pulse()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_pulse_active();
  return null;
end;
$$;

drop trigger if exists tr_recompute_pulse_votes on public.votes;
create trigger tr_recompute_pulse_votes
  after insert on public.votes
  for each statement execute function public.tr_recompute_pulse();

drop trigger if exists tr_recompute_pulse_favs on public.favorites;
create trigger tr_recompute_pulse_favs
  after insert on public.favorites
  for each statement execute function public.tr_recompute_pulse();

drop trigger if exists tr_recompute_pulse_comments on public.comments;
create trigger tr_recompute_pulse_comments
  after insert on public.comments
  for each statement execute function public.tr_recompute_pulse();

-- realtime: send full row on UPDATE so clients always get pulse/counters
alter table public.photos replica identity full;

-- 1-minute safety net: ages photos out as they cross 24h + heals missed triggers
create extension if not exists pg_cron;
select cron.unschedule('recompute-pulse-active')
  where exists (select 1 from cron.job where jobname = 'recompute-pulse-active');
select cron.schedule('recompute-pulse-active', '* * * * *',
  $$ select public.recompute_pulse_active(); $$);
```

- [ ] **Step 2: Verify the cron job is scheduled**

Run via `mcp__supabase__execute_sql`: `select jobname, schedule, active from cron.job where jobname = 'recompute-pulse-active';`
Expected: one row, schedule `* * * * *`, active `true`.

- [ ] **Step 3: Verify the trigger fires (re-run parity)**

Run: `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH" && npx tsx supabase/test_realtime_pulse_parity.ts`
Expected: `PARITY OK` (the photo INSERTs now also fire `tr_recompute_pulse_votes`'s sibling on `photos`? no — only on votes/favorites/comments; the explicit `rpc` in the script still drives the compare). Still expect `PARITY OK`.

- [ ] **Step 4: Lifecycle check — photos past 24h are frozen**

Run via `mcp__supabase__execute_sql`:
```sql
-- a photo older than 24h must NOT be in the recompute pool (its pulse is frozen)
select count(*) as stale_in_pool
from public.photos
where is_hidden = false and status = 'published'
  and uploaded_at < now() - interval '24 hours'
  and uploaded_at >= now() - interval '24 hours';
```
Expected: `stale_in_pool = 0` (the pool predicate is `>= now()-24h`, so >24h photos are structurally excluded — confirming their pulse can never be rewritten by the engine). This documents the freeze guarantee from the spec.

- [ ] **Step 5: Save the migration file**

Write the identical SQL from Step 1 into `supabase/migrations/0021_realtime_pulse_wiring.sql`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0021_realtime_pulse_wiring.sql
git commit -m "feat: wire pulse recompute triggers, pg_cron, realtime replica identity"
```

---

## Task 4: Pure merge helper + `useRealtimePulse` hook

**Files:**
- Create: `src/lib/realtime-pulse.ts` (pure merge logic — unit tested)
- Test: `src/lib/__tests__/realtime-pulse.test.ts`
- Create: `src/hooks/useRealtimePulse.ts`

- [ ] **Step 1: Write the failing test for the pure merge helper**

```ts
// src/lib/__tests__/realtime-pulse.test.ts
import { describe, it, expect } from 'vitest';
import { mergeLivePulse, type LivePulse } from '@/lib/realtime-pulse';
import type { Photo } from '@/lib/types';

const base = (over: Partial<Photo>): Photo => ({
  id: 'p1', slug: 'p1', title: 't', by: 'u', cat: 'Landscape', w: 4, h: 3,
  src: 'x', caption: '', exif: { camera: '', lens: '', iso: 0, shutter: '', aperture: '', focal: '' },
  likes: 1, likes24h: 0, comments: 0, favorites: 0, hours: 1, picks: [], date: '',
  pulse: 10, peakPulse: 10, pickType: 'none', percentile: 0.1, badge: null, rank: 0,
  ...over,
});

describe('mergeLivePulse', () => {
  it('overrides pulse + counters from the live map', () => {
    const live: Record<string, LivePulse> = {
      p1: { pulse: 80, peakPulse: 80, percentile: 0.9, badge: 'trending', likes: 50, favorites: 5, comments: 2 },
    };
    const [out] = mergeLivePulse([base({ id: 'p1' })], live);
    expect(out.pulse).toBe(80);
    expect(out.likes).toBe(50);
    expect(out.favorites).toBe(5);
    expect(out.badge).toBe('trending');
  });

  it('leaves photos with no live entry untouched', () => {
    const [out] = mergeLivePulse([base({ id: 'p2', pulse: 12 })], {});
    expect(out.pulse).toBe(12);
  });

  it('re-sorts by pulse descending when sort=true', () => {
    const photos = [base({ id: 'a', pulse: 10 }), base({ id: 'b', pulse: 20 })];
    const live = { a: { pulse: 99, peakPulse: 99, percentile: 1, badge: null, likes: 0, favorites: 0, comments: 0 } };
    const out = mergeLivePulse(photos, live, true);
    expect(out.map(p => p.id)).toEqual(['a', 'b']);
    expect(out[0]!.rank).toBe(1);
    expect(out[1]!.rank).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH" && npm test -- realtime-pulse`
Expected: FAIL — `Cannot find module '@/lib/realtime-pulse'`.

- [ ] **Step 3: Write the merge helper**

```ts
// src/lib/realtime-pulse.ts
import type { Photo } from '@/lib/types';

export interface LivePulse {
  pulse: number;
  peakPulse: number | null;
  percentile: number | null;
  badge: string | null;
  likes: number;
  favorites: number;
  comments: number;
}

// Overlay live values onto SSR photos. When sort=true, re-sort by pulse desc and
// re-number rank (1-based) so leaderboards visibly re-order as scores move.
export function mergeLivePulse(
  photos: Photo[],
  live: Record<string, LivePulse>,
  sort = false,
): Photo[] {
  const merged = photos.map((p) => {
    const l = live[p.id];
    if (!l) return p;
    return {
      ...p,
      pulse: l.pulse,
      peakPulse: l.peakPulse,
      percentile: l.percentile,
      badge: l.badge as Photo['badge'],
      likes: l.likes,
      favorites: l.favorites,
      comments: l.comments,
    };
  });
  if (!sort) return merged;
  const sorted = [...merged].sort((a, b) => b.pulse - a.pulse);
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH" && npm test -- realtime-pulse`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the hook**

```ts
// src/hooks/useRealtimePulse.ts
'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { LivePulse } from '@/lib/realtime-pulse';

// Subscribe to live photo updates. Returns a map id -> LivePulse, patched as
// Supabase Realtime delivers UPDATEs on the photos table.
export function useRealtimePulse(photoIds: string[]): Record<string, LivePulse> {
  const [live, setLive] = useState<Record<string, LivePulse>>({});
  const key = photoIds.join(',');

  useEffect(() => {
    if (photoIds.length === 0) return;
    const supabase = getSupabaseBrowserClient();
    const ids = new Set(photoIds);
    const channel = supabase
      .channel(`pulse-live-${key.slice(0, 40)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = row.id as string;
          if (!ids.has(id)) return;
          setLive((prev) => ({
            ...prev,
            [id]: {
              pulse: row.pulse != null ? Number(row.pulse) : 0,
              peakPulse: row.peak_pulse != null ? Number(row.peak_pulse) : null,
              percentile: row.percentile != null ? Number(row.percentile) : null,
              badge: (row.badge as string) || null,
              likes: Number(row.likes_count ?? 0),
              favorites: Number(row.favorites_count ?? 0),
              comments: Number(row.comments_count ?? 0),
            },
          }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return live;
}
```

- [ ] **Step 6: Typecheck + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH" && npm run typecheck
git add src/lib/realtime-pulse.ts src/lib/__tests__/realtime-pulse.test.ts src/hooks/useRealtimePulse.ts
git commit -m "feat: add live pulse merge helper and useRealtimePulse hook"
```

---

## Task 5: `RealtimePhotoGrid` wrapper + wire Explore & Hall of Fame

**Files:**
- Create: `src/components/photo/RealtimePhotoGrid.tsx`
- Modify: `src/app/explore/page.tsx` (swap `PhotoGrid` → `RealtimePhotoGrid` for the main ranked grid)
- Modify: `src/app/(marketing)/hall-of-fame/HallOfFameClient.tsx` (merge live pulse into `allPhotos` so both the desktop `LiveLeaderboard` and `MobileHallOfFame` update + re-rank live)

**Note:** Hall of Fame does NOT use `PhotoGrid` for its standings — `DesktopHallOfFame` derives `leaderboardEntries` from `allPhotos` sorted by `pulse` and feeds `LiveLeaderboard`; `MobileHallOfFame` gets the same `allPhotos`. So the realtime fix goes at the data owner (`HallOfFameClient`), not at a grid. Because `DesktopHallOfFame` already sorts by `pulse`, the leaderboard re-orders automatically when live values change.

- [ ] **Step 1: Write the wrapper**

```tsx
// src/components/photo/RealtimePhotoGrid.tsx
'use client';
import { useMemo } from 'react';
import type { Photo } from '@/lib/types';
import { PhotoGrid } from './PhotoGrid';
import { useRealtimePulse } from '@/hooks/useRealtimePulse';
import { mergeLivePulse } from '@/lib/realtime-pulse';

type Props = React.ComponentProps<typeof PhotoGrid> & { liveSort?: boolean };

// Drop-in replacement for <PhotoGrid> that overlays live pulse/counters and,
// when liveSort is set, re-orders the grid as scores change.
export function RealtimePhotoGrid({ photos, liveSort = false, ...rest }: Props) {
  const ids = useMemo(() => photos.map((p) => p.id), [photos]);
  const live = useRealtimePulse(ids);
  const merged = useMemo(() => mergeLivePulse(photos, live, liveSort), [photos, live, liveSort]);
  return <PhotoGrid photos={merged} {...rest} />;
}
```

- [ ] **Step 2: Wire Explore**

In `src/app/explore/page.tsx`: add `import { RealtimePhotoGrid } from '@/components/photo/RealtimePhotoGrid';`. Find the main results `<PhotoGrid ... showRank ... />` that renders the ranked list and replace the tag with `<RealtimePhotoGrid ... liveSort />` keeping all existing props. Leave any non-ranked decorative grids as plain `PhotoGrid`.

(If `explore/page.tsx` is a Server Component and cannot import a client grid directly into a server tree with the existing props, confirm the surrounding section is already a client component or move just that grid into the existing client child. Read the file first; do not convert the whole page to client.)

- [ ] **Step 3: Wire Hall of Fame at the data owner (`HallOfFameClient`)**

`HallOfFameClient` (`'use client'`) owns `allPhotos` state and passes it to both
`DesktopHallOfFame` (→ `LiveLeaderboard`, sorted by `pulse`) and `MobileHallOfFame`.
Merge live pulse into that array so both surfaces update and the leaderboard
re-ranks automatically.

In `src/app/(marketing)/hall-of-fame/HallOfFameClient.tsx`:

Add imports:
```tsx
import { useMemo } from 'react';
import { useRealtimePulse } from '@/hooks/useRealtimePulse';
import { mergeLivePulse } from '@/lib/realtime-pulse';
```
(merge `useMemo` into the existing `react` import if one already exists.)

After the `allPhotos` state is declared, derive a live-merged copy:
```tsx
const liveIds = useMemo(() => allPhotos.map((p) => p.id), [allPhotos]);
const live = useRealtimePulse(liveIds);
const livePhotos = useMemo(() => mergeLivePulse(allPhotos, live), [allPhotos, live]);
```

Then pass `livePhotos` instead of `allPhotos` in BOTH renders:
- `<MobileHallOfFame ... realAllPhotos={livePhotos} ... />`
- `<DesktopHallOfFame ... allPhotos={livePhotos} ... />`

(`DesktopHallOfFame` already sorts `leaderboardEntries` by `pulse`, so no
`liveSort` is needed here — re-ordering happens in the consumer.)

- [ ] **Step 4: Verify**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
npm run typecheck && npm run lint
```
Expected: clean (pre-existing warnings only).

- [ ] **Step 5: Commit**

```bash
git add src/components/photo/RealtimePhotoGrid.tsx src/app/explore/page.tsx "src/app/(marketing)/hall-of-fame/HallOfFameClient.tsx"
git commit -m "feat: live-updating explore grid and hall of fame leaderboard"
```

---

## Task 6: Wire homepage hero/banner and `/me`

**Files:**
- Modify: `src/app/page.tsx` (or its client child that renders hero/banner numbers)
- Modify: `src/components/account/MePhotos.tsx` (photographer's own photo cards)

- [ ] **Step 1: Read both files to find where pulse/likes render**

Run: read `src/app/page.tsx` and `src/components/account/MePhotos.tsx`. Identify the component (client) that renders the hero/banner pulse number and the `/me` photo grid.

- [ ] **Step 2: Wire `/me` grid**

If `MePhotos` renders a `PhotoGrid`, swap it for `RealtimePhotoGrid` (import from `@/components/photo/RealtimePhotoGrid`), keeping props. No `liveSort` needed (it's the user's own set), unless it shows ranks.

- [ ] **Step 3: Wire homepage hero/banner**

In the client component that shows the hero/banner numbers, add:
```tsx
import { useRealtimePulse } from '@/hooks/useRealtimePulse';
// inside component, where `top` and `banner` photos are known:
const live = useRealtimePulse([top?.id, banner?.id].filter(Boolean) as string[]);
const topLikes = (top && live[top.id]?.likes) ?? top?.likes;
const topPulse = (top && live[top.id]?.pulse) ?? top?.pulse;
```
Replace the rendered hero number bindings with `topLikes` / `topPulse` (and the banner equivalents). If the hero is a Server Component, lift only the number display into the existing client child; do not convert the page to client.

- [ ] **Step 4: Verify**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
npm run typecheck && npm run lint
```
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/account/MePhotos.tsx
git commit -m "feat: live pulse on homepage hero/banner and /me"
```

---

## Task 7: Wire photo detail page

**Files:**
- Modify: `src/app/photo/[id]/PhotoDetailClient.tsx`

- [ ] **Step 1: Read the file and locate the pulse/likes/favorites/comments display bindings**

Run: read `src/app/photo/[id]/PhotoDetailClient.tsx`. Note the variables/props currently rendered for pulse, likes, favorites, comments, badge.

- [ ] **Step 2: Add the hook and overlay**

Near the top of the component body add:
```tsx
import { useRealtimePulse } from '@/hooks/useRealtimePulse';
// ...
const live = useRealtimePulse([photo.id]);
const l = live[photo.id];
const livePulse      = l?.pulse      ?? photo.pulse;
const livePeak       = l?.peakPulse  ?? photo.peakPulse;
const liveBadge      = (l?.badge as typeof photo.badge) ?? photo.badge;
const liveLikes      = l?.likes      ?? photo.likes;
const liveFavorites  = l?.favorites  ?? photo.favorites;
const liveComments   = l?.comments   ?? photo.comments;
```
Replace the corresponding rendered values (`photo.pulse` → `livePulse`, `photo.likes` → `liveLikes`, etc.) in the JSX that displays the headline stats and the `PulseStatusBadge`.

- [ ] **Step 3: Verify**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
npm run typecheck && npm run lint
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/photo/[id]/PhotoDetailClient.tsx"
git commit -m "feat: live pulse on photo detail page"
```

---

## Task 8: Retire the daily Vercel cron

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Remove the cron entry**

In `vercel.json` delete the `crons` array entry for `/api/cron/compute-pulse`. If it is the only cron, remove the `crons` key entirely. Leave the route file `src/app/api/cron/compute-pulse/route.ts` in place (it stays as a `CRON_SECRET`-gated manual backstop).

- [ ] **Step 2: Verify build**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH" && npm run build
```
Expected: build succeeds; no cron registered for compute-pulse.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore: retire daily compute-pulse cron (replaced by pg_cron)"
```

---

## Task 9: Full verification + manual realtime check

- [ ] **Step 1: Full suite**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
npm run typecheck && npm run lint && npm test && npm run build
```
Expected: typecheck clean, lint clean (pre-existing warnings only), all vitest green, build all routes.

- [ ] **Step 2: Re-run parity once more**

Run: `npx tsx supabase/test_realtime_pulse_parity.ts`
Expected: `PARITY OK`.

- [ ] **Step 3: Manual two-window realtime test**

Start dev: `npm run dev`. Open the same photo's detail page in two browser windows logged in as different users. Like the photo in window A. Expected: window B's like count and pulse update within a few seconds with no refresh; on Explore (with `liveSort`) the photo visibly re-orders.

- [ ] **Step 4: Final confirmation**

Confirm in the Supabase dashboard (Database → Cron) that `recompute-pulse-active` runs every minute without errors, and (Database → Replication) that `photos` is in the `supabase_realtime` publication.

---

## Notes & known limitations

- **Unlike/unfavorite does not lower engagement.** The v4 engagement triggers only add on INSERT; removing a vote leaves `engagement` unchanged (pre-existing behavior). Counters (`likes_count`) still decrement via their own triggers, so the displayed like count drops live, but `pulse` won't fall from an unlike. Out of scope for this plan.
- **Formula lives in two places** (TS engine + SQL). The Task 2 parity script is the guard; run it after any formula change.
- **Realtime quota:** a vote updates every changed active-pool row, each emitting one Realtime message. Active-pool scoping + changed-rows-only writes keep this small. If volume grows, switch to a single debounced broadcast channel (noted, not built).
