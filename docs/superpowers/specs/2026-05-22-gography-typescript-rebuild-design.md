# Gography Photo Awards — TypeScript Rebuild

**Date:** 2026-05-22
**Status:** Approved (design)
**Author:** brainstorming session

## Summary

Rebuild the existing `nextjs/` design preview as a clean, TypeScript-first
Next.js 14 (App Router) project with a good-practice structure, Tailwind CSS,
and selective shadcn/ui primitives. The rebuild reproduces the current look and
behaviour faithfully — it is a clean rewrite, not a redesign.

The product is "Gography Photo Awards", a premium, monochrome, Thai-first photo
ranking + voting platform for `ranking.gography.net`. Brand direction: pure
white/black, no gray backgrounds, no color accent except a warm gold
(`#b08e54`) reserved for Ambassador / Voyageur cues, sans-serif only, editorial
/ museum feel. (See `docs/handoff-brief.md` for the full brand brief.)

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Scope | Match current port — **17 public/user pages**. No admin pages. |
| Styling | **Tailwind CSS + shadcn/ui** (shadcn used selectively, themed to tokens) |
| Data | **Typed mock data** behind a clean data-access layer (no real Supabase yet) |
| Location | **New folder `web/`** at repo root; leave `nextjs/` untouched for reference |
| Structure | **Standard `src/` App Router** layout |

### Scope guardrails

- 17 routes only (the public + user-account pages that exist in `nextjs/app/`).
- **No** admin pages (`/admin/*` from the handoff brief stay out of scope).
- **No** real Supabase wiring — mock data only, behind a swappable seam.
- This is a faithful reproduction of the current preview, not a visual redesign.

## Stack & tooling

- Next.js 14 App Router + React 18 + **TypeScript (strict mode)**
- Tailwind CSS with existing design tokens mapped into `tailwind.config.ts`
  theme, so utilities like `bg-fg`, `text-fg-soft`, `border-rule`, `bg-cream`,
  `bg-tile`, `font-thai`, `font-mono` work.
- shadcn/ui for accessibility-sensitive primitives **only**, restyled to the
  monochrome tokens (shadcn defaults are rounded/gray and would violate the
  brand): `Dialog` (lightbox + confirm modals), `Tabs` (me sections, photo
  tabs), `Switch` (settings toggles), `Input` / `Textarea` / `Label` (forms),
  `Tooltip` (vote/favorite hints), `DropdownMenu` (sort/filter).
  Purely-presentational pieces (PhotoCard, PickBadge, Pulse, rank chips) stay as
  plain Tailwind components.
- ESLint + Prettier, `@/*` path alias to `src/`.
- Real dynamic-segment folders (`[id]`, `[username]`, `[filter]`, `[category]`,
  `[[...section]]`) from the start — **drop** the `bin/setup-routes.js`
  `-id-` → `[id]` rename hack entirely.

## Structure

```
web/src/
  app/
    (marketing)/          # about, about-ranking, for-customers, hall-of-fame, ambassadors → Server Components
    explore/page.tsx
    explore/[category]/page.tsx
    photo/[id]/page.tsx
    photographer/[username]/page.tsx
    photographers/page.tsx
    photographers/[filter]/page.tsx
    search/page.tsx
    login/page.tsx
    upload/page.tsx
    apply-photographer/page.tsx
    me/[[...section]]/page.tsx
    page.tsx              # landing
    layout.tsx
    globals.css
    not-found.tsx
  components/
    ui/                   # shadcn primitives (themed)
    photo/                # PhotoCard, PhotoGrid, PickBadge, PulseStat, RankChip, Lightbox
    layout/               # Nav, Footer, RoleRibbon
    icons/                # VoyageurMark, CrownIcon, EditorIcon, RewardIcon
  lib/
    data/                 # photos.ts, photographers.ts, seasons.ts, comments.ts, index.ts
    types.ts              # domain types
    pulse.ts              # pulseScore() + ranking pipeline
    utils.ts              # cn(), formatters, picsum url helper
  hooks/                  # useLocalStorage, etc.
  providers/              # AppProvider (theme/mode/userState/banner/hero)
```

### The 17 routes

Public: `/`, `/explore`, `/explore/[category]`, `/photo/[id]`,
`/photographer/[username]`, `/photographers`, `/photographers/[filter]`,
`/hall-of-fame`, `/ambassadors`, `/about-ranking`, `/about`, `/search`,
`/for-customers`.
Auth/account: `/login`, `/upload`, `/apply-photographer`, `/me/[[...section]]`.

## Type model (`lib/types.ts`)

Explicit interfaces replacing the implicit shapes documented in
`nextjs/README.md`:

```ts
type Category = 'Landscape' | 'Portrait' | 'BW';
type PickKind = 'editor' | 'ambassador';
type UserState = 'guest' | 'user' | 'customer' | 'photographer';
type Theme = 'light' | 'dark';
type Mode = 'atelier' | 'editorial';

interface Exif { camera: string; lens: string; iso: number; shutter: string; aperture: string; focal: string; }

interface Photo {
  id: string; slug: string; title: string; by: string; cat: Category;
  w: number; h: number; src: string; caption: string; exif: Exif;
  likes: number; likes24h: number; comments: number; favorites: number;
  hours: number; picks: PickKind[]; date: string; tripContext?: string;
  // derived (computed in lib/pulse.ts, not mutated onto source data):
  pulse: number; rank: number;
}

interface Photographer {
  username: string; name: string; loc: string; bio: string;
  avatar: string; cover: string; followers: number; photos: number;
  isAmbassador: boolean; isCustomer?: boolean; customerTrips?: string[];
  joined: string; cameras: string[];
}

interface Season { id: string; name: string; range: string; status: 'live' | 'closed'; winners: Record<Category, { photoId: string; voucher: string }> | null; }
interface Comment { user: string; text: string; at: string; }
```

`pulse` and `rank` are computed in a typed pipeline rather than mutated onto a
global array (the current `lib/data.js` does `PHOTOS.forEach(p => p.pulse = ...)`
and sorts in place). Source data stays pure; derived values come from
`lib/pulse.ts`.

Pulse formula (unchanged, from the brief):
```
pulse = (likes × 1 + likes24h × 3 + curation_bonus) / max(hours, 1)
curation_bonus = 100 if editor AND ambassador pick, else 50 if any pick, else 0
```

## Data-access layer (`lib/data/index.ts`)

A thin, typed API the pages call:

- `getPhotos(opts?)` — list with optional category / sort / time filters
- `getPhoto(id)` → `Photo | undefined`
- `getPhotographer(username)` → `Photographer | undefined`
- `getSeasons()`, `getAmbassadors()`, `getCommentsFor(id)`,
  `getVoyageurUsernames()`

Today these read the typed mock arrays. The seam is deliberate: a later swap to
Supabase queries touches **only `lib/data/`**, not the pages. (Matches the
existing roadmap step 3, "Replace `lib/data.js` with Supabase queries page by
page".)

## Server vs Client split

- **Server Components**: marketing/info pages (`about`, `about-ranking`,
  `for-customers`, `hall-of-fame`, `ambassadors`) and the static shells of list
  pages — they read the data layer directly.
- **Client Components**: interactive surfaces — `AppProvider`, `Nav` (role
  ribbons), theme toggle, like/favorite buttons, lightbox, search, filter/sort
  controls, `upload` / `apply-photographer` forms, and `me/*` (persona-driven).
  Interactive leaves are isolated so server pages stay server where possible.
- `AppProvider` keeps the localStorage-backed `theme` / `mode` / `userState` /
  `bannerPhotoId` / `heroPhotoId` demo state (typed `useApp()` hook, SSR-safe
  `useLocalStorage`), so the design preview behaves exactly as today. It sets
  `data-theme` / `data-mode` on `<html>`.

## Styling migration

- Port `globals.css` tokens to `:root` / `[data-theme="dark"]` and mirror them
  in the Tailwind theme so both CSS-var and utility usage work.
- Reusable bits currently in `globals.css` (`.btn`, `.caps`, `.pulse`, `.rank`,
  `.heart`, `.input`, `.section-h`, `.skel`) become themed shadcn components
  (Button, Input) or small typed React components / `@layer components` classes.
- No loose inline `style={{...}}` objects in the rebuilt components.
- Fonts: Inter, Noto Sans Thai, IBM Plex Mono via `next/font` (replacing the raw
  `<link>` tags in the current `layout.js`).

## Error handling & states

- Typed `not-found.tsx`; guard dynamic routes — `getPhoto` / `getPhotographer`
  returning `undefined` → `notFound()`.
- Preserve existing empty states (e.g. `EmptyMe`, "ยังไม่มีภาพในหมวดนี้") and the
  skeleton / `.skel` shimmer, typed as reusable components.
- Fix the latent bug in the current `me` page: it calls `React.useState` /
  `React.useState` without importing `React` (only the named hooks are
  imported). The rebuild uses named hook imports throughout.

## Verification

- `tsc --noEmit` clean under strict mode.
- `next build` succeeds.
- `next lint` clean.
- All 17 routes render in `next dev` across the four `userState` personas
  (guest / user / customer / photographer) and both themes (light / dark).

## Out of scope

- Admin pages (`/admin/*`).
- Real Supabase wiring / auth / storage (mock data only, behind the data seam).
- Mobile-responsive redesign beyond what the current preview already does.
- Multi-language, payments, messaging (per the handoff brief's out-of-scope).
