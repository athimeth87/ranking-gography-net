# ranking.gography.net — `web/`

Photo ranking + voting platform — **"Gography Photo Awards"**. Next.js 14 (App Router) + **TypeScript** + Tailwind CSS + shadcn/ui.

This is the active TypeScript rebuild of the legacy preview in [`../nextjs/`](../nextjs/). Premium, monochrome, Thai-first design; mock data behind a swappable data-access layer (no backend yet).

## Quick start

This repo uses **Node 24**. With nvm:

```bash
nvm install 24      # once
nvm use 24
cd web
npm install
npm run dev         # http://localhost:3000
```

> Fish shell users: the bundled nvm is `nvm.fish`. Run `nvm use 24` (and optionally `set --universal nvm_default_version v24.x.x`).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | `next lint` |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Vitest (unit tests for pulse, data layer, utils) |
| `npm run test:watch` | Vitest watch mode |

## Structure

```
web/src/
  app/
    (marketing)/          # about, about-ranking, for-customers, hall-of-fame, ambassadors (Server Components)
    explore/ explore/[category]/
    photo/[id]/
    photographer/[username]/
    photographers/ photographers/[filter]/
    search/  login/  upload/  apply-photographer/
    me/[[...section]]/    # dashboard / photos / favorites / galleries / stats / settings
    page.tsx layout.tsx globals.css not-found.tsx
  components/
    ui/                   # shadcn primitives, themed to the monochrome tokens
    photo/                # PhotoCard, PhotoGrid, Lightbox
    layout/               # Nav, RoleRibbon, Footer, TweaksPanel
    home/                 # landing-page sections
    account/              # /me section components
    icons/                # VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge
  lib/
    data/                 # typed mock data + the data-access layer (the swappable seam)
    types.ts              # domain types
    pulse.ts              # pulse scoring + ranking (pure)
    utils.ts              # cn, picsum, formatCount
  hooks/                  # useLocalStorage
  providers/              # AppProvider (theme / mode / persona, localStorage-backed)
```

## Design system

- **Tokens** live in `app/globals.css` (`:root` + `[data-theme="dark"]`) and are mirrored in `tailwind.config.ts` as utilities: `bg-fg`, `text-fg-soft`, `border-rule`, `bg-cream`, `bg-tile`, `text-gold`, `font-thai`, `font-mono`.
- Pure white/black, no gray backgrounds; warm gold `#b08e54` (`gold`) reserved for Ambassador/Voyageur cues.
- Components use Tailwind utilities + a small set of helper classes (`.btn`, `.caps`, `.pulse`, `.rank`, `.pcard`, …). No loose inline styles except genuinely runtime-dynamic values.

## Previewing personas & themes

There is no real auth yet. Use the **Tweaks panel** (bottom-right, on every page) to switch:

- **Theme** — light / dark
- **Mode** — atelier / editorial
- **Persona** — guest / user / customer (Voyageur) / photographer

These persist to `localStorage` (`gpa-prefs`) and drive the nav ribbons, `/me`, gating, etc.

## Data → real backend

All pages read through `@/lib/data` (`getPhotos`, `getPhoto`, `getPhotographer`, `getSeasons`, `getCommentsFor`, …). Today these return typed mock data; swapping to Supabase queries means changing **only** `src/lib/data/` — pages don't touch raw data.

## Scope

The 17 public/user pages of the original preview. Out of scope (for now): admin pages, real Supabase wiring/auth/storage. See [`../docs/superpowers/specs/2026-05-22-gography-typescript-rebuild-design.md`](../docs/superpowers/specs/2026-05-22-gography-typescript-rebuild-design.md).
