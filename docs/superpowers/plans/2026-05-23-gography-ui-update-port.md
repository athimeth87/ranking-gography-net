# Gography UI Update Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the 12 design-improvement commits that landed on `main`'s `nextjs/` folder into our `web/` (TypeScript) rebuild — 7 new components, AppProvider extension, Nav + PhotoCard updates, ~30 new CSS classes, `PageCover` on 15 pages, landing-page visual density updates, `/showcase` page, brand assets, and the GOGRAPHY rebrand.

**Architecture:** Faithful delta port. The TypeScript rebuild's structure stays. New `editorial/` and additional `photo/` and `layout/` components are added. AppProvider gains ephemeral `sideMenuOpen` state. Static styles convert to Tailwind utilities/arbitrary values; inline `style` only for runtime-dependent values. PageCover gets applied uniformly to non-landing/non-photo pages.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS, themed shadcn/ui primitives, Vitest. Node 24.16.0.

**Sources of truth:**
- Spec: [docs/superpowers/specs/2026-05-23-gography-ui-update-port-design.md](../specs/2026-05-23-gography-ui-update-port-design.md)
- Reference (main's JS): pre-extracted to `/tmp/main-nextjs/nextjs/` (re-extract with `git archive main nextjs/ | tar -x -C /tmp/main-nextjs` if missing).

---

## Conventions used throughout this plan

**Node toolchain.** Prefix every `node`/`npm`/`npx` command with:

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
```

**Working directory.** All paths are relative to `web/` unless stated; run npm/next commands from inside `web/`.

**Git.** Work on the existing `feat/typescript-rebuild` branch. Commit after each task with the message shown; trailer:
`Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`

**Inline-style rule (strict — same rule the rebuild enforced).** Static values MUST be Tailwind utility classes (use arbitrary values for off-scale: `text-[56px]`, `tracking-[-.03em]`, `grid-cols-[1fr_360px]`, `text-[clamp(40px,4.6vw,64px)]`). Inline `style` is allowed ONLY when the value depends on a RUNTIME variable/prop/state, with a comment explaining the variable. The new helper classes in `globals.css` (`@layer components`) remain class-based (they ARE the shared styling) — don't expand them inline.

**File-port conventions** (same as rebuild plan):
- TypeScript: type all props/state/handlers; route `params` typed.
- NAMED React hook imports (`import { useState } from 'react'`); never `React.useState`.
- Data via `@/lib/data` accessors only; no raw arrays.
- `'use client'` only where hooks/handlers/`useApp()` are used.
- `<img loading="lazy">` (no `next/image`); add eslint-disable comment where the linter complains.

**Per-task verification.** Each task ends with `npm run typecheck && npm run lint && npm run build` clean unless noted.

---

## Task 1: Extend `AppProvider` with `sideMenuOpen`

**Files:**
- Modify: `web/src/providers/AppProvider.tsx`

- [ ] **Step 1: Open `web/src/providers/AppProvider.tsx`.** It currently uses a typed `AppContextValue` with persisted `AppPrefs` and 5 setters. Add ephemeral `sideMenuOpen` state alongside (NOT in the persisted prefs).

- [ ] **Step 2: Replace the file with:**

```tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Mode, Theme, UserState } from '@/lib/types';

interface AppPrefs {
  theme: Theme;
  mode: Mode;
  userState: UserState;
  bannerPhotoId: string;
  heroPhotoId: string;
}

interface AppContextValue extends AppPrefs {
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
  setUserState: (u: UserState) => void;
  setBannerPhotoId: (id: string) => void;
  setHeroPhotoId: (id: string) => void;
  sideMenuOpen: boolean;
  setSideMenuOpen: (v: boolean) => void;
  toggleSideMenu: () => void;
}

const DEFAULTS: AppPrefs = { theme: 'light', mode: 'atelier', userState: 'guest', bannerPhotoId: 'p010', heroPhotoId: 'auto' };

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useLocalStorage<AppPrefs>('gpa-prefs', DEFAULTS);
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(false);
  const patch = (p: Partial<AppPrefs>) => setPrefs({ ...prefs, ...p });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.documentElement.setAttribute('data-mode', prefs.mode);
  }, [prefs.theme, prefs.mode]);

  return (
    <AppContext.Provider
      value={{
        ...prefs,
        setTheme: (theme) => patch({ theme }),
        setMode: (mode) => patch({ mode }),
        setUserState: (userState) => patch({ userState }),
        setBannerPhotoId: (bannerPhotoId) => patch({ bannerPhotoId }),
        setHeroPhotoId: (heroPhotoId) => patch({ heroPhotoId }),
        sideMenuOpen,
        setSideMenuOpen,
        toggleSideMenu: () => setSideMenuOpen((v) => !v),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
```

- [ ] **Step 3: Verify**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/providers/AppProvider.tsx && git commit -m "Extend AppProvider with ephemeral sideMenuOpen state"
```

---

## Task 2: Brand assets (favicon + logo PNG)

**Files:**
- Create: `web/src/app/icon.png`, `web/public/logo-white.png`

- [ ] **Step 1: Copy the two PNGs from main's archive**

```bash
cp /tmp/main-nextjs/nextjs/app/icon.png /home/no13/Projects/Gography/ranking-gography-net/web/src/app/icon.png
cp /tmp/main-nextjs/nextjs/public/logo-white.png /home/no13/Projects/Gography/ranking-gography-net/web/public/logo-white.png
```
If `/tmp/main-nextjs/` is missing, first run `git archive main nextjs/ | tar -x -C /tmp/main-nextjs` from the repo root after `mkdir -p /tmp/main-nextjs`.

- [ ] **Step 2: Build to confirm the favicon is detected** (Next 14 auto-registers `app/icon.png`)

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run build
```
Expected: build succeeds. The build output should list `/icon.png` as a static asset.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/icon.png web/public/logo-white.png && git commit -m "Add brand assets: favicon and logo PNG"
```

---

## Task 3: Append new component classes to `globals.css`

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Read `/tmp/main-nextjs/nextjs/app/globals.css` to identify the new class blocks** (these did not exist in our `web/src/app/globals.css`):

The new classes are grouped as follows in main (line numbers approximate, ~595-line file):
- **Hover overlay on `.pcard`:** `.pimg-overlay`, `.pimg-overlay-grad`, `.pimg-overlay-content`, `.pimg-overlay-cat`, `.pimg-overlay-title`, `.pimg-overlay-meta`, `.pimg-overlay-sep`, `.pimg-overlay-pulse`, `.pimg-overlay-pulse-num`, `.pimg-overlay-pulse-lab` (around lines ~250–315).
- **Staggered grid:** `.pgrid`, `.pgrid-stagger > *` keyed by CSS var `--i`, with `@keyframes pgrid-fade-in` (around lines ~318–326).
- **Marquee:** `.marquee`, `.marquee-track`, `.marquee-item`, `.marquee-item .num`, `.marquee-item .ttl`, `.marquee-item .by`, `.marquee-item .dot`, plus `@keyframes marquee` (around lines ~329–360).
- **SectionNumber:** `.snum`, `.snum-num`, `.snum-rule`, `.snum-label` (around lines ~362–383).
- **SideMenu:** `.sidemenu-backdrop`, `.sidemenu-backdrop.is-open`, `.sidemenu`, `.sidemenu.is-open`, `.sidemenu-inner`, `.sidemenu-chrome`, `.sidemenu-dots`, `.sidemenu-dots .dot`, `.sidemenu-dots .dot.d1/.d2/.d3` color variants, `.sidemenu-close`, `.sidemenu-identity`, `.sidemenu-avatar`, `.sidemenu-identity-meta`, `.sidemenu-identity-name`, `.sidemenu-identity-sub`, `.sidemenu-cta`, `.sidemenu-cta .arr`, `.sidemenu-group`, `.sidemenu-group-title`, `.sidemenu-group-rows`, `.sidemenu-row`, `.sidemenu-row-label`, `.sidemenu-row-arr`, `.sidemenu-row.is-active`, `.sidemenu-footer`, `.sidemenu-theme`, `.sidemenu-theme-toggle`, `.sidemenu-theme-toggle button.is-on`, `.sidemenu-version` (around lines ~385–560).
- **Nav toggle + link arrow:** `.nav-toggle`, `.nav-toggle:hover`, `.link-arrow`, `.link-arrow .arr`, `.link-arrow:hover .arr` (around lines ~569–595).

- [ ] **Step 2: Open `web/src/app/globals.css` and locate its existing `@layer components { ... }` block.** Append the above class blocks INSIDE that `@layer components { }` (verbatim from `/tmp/main-nextjs/nextjs/app/globals.css`, preserving all rules, transitions, and `var(--*)` token references). Append the `@keyframes marquee` and `@keyframes pgrid-fade-in` keyframes OUTSIDE the layer (top-level), grouped with the existing keyframes.

**Important:** do NOT modify any of our existing tokens (`:root`, `[data-theme="dark"]`), helper resets, font references, or existing helper classes — append only. After this task `web/src/app/globals.css` should contain everything it had before plus the new class groups.

- [ ] **Step 3: Verify the build**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run build
```
Expected: succeeds. Inspect output for any unknown utility errors — there should be none since the rules are pure CSS.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/globals.css && git commit -m "Add globals.css classes for marquee, sidemenu, section number, hover overlay"
```

---

## Task 4: `Marquee` component

**Files:**
- Create: `web/src/components/editorial/Marquee.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client';

export interface MarqueeItem {
  num?: string;
  title: string;
  by?: string;
}

interface MarqueeProps {
  items: MarqueeItem[];
  speedSec?: number;
}

export function Marquee({ items, speedSec = 60 }: MarqueeProps) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div
        className="marquee-track"
        style={{ animationDuration: `${speedSec}s` }} /* runtime: speed prop */
      >
        {doubled.map((it, i) => (
          <span className="marquee-item" key={`${it.title}-${i}`}>
            {it.num && <span className="num">{it.num}</span>}
            <span className="ttl">{it.title}</span>
            {it.by && (
              <>
                <span className="dot" />
                <span className="by">{it.by}</span>
              </>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && git add web/src/components/editorial/Marquee.tsx && git commit -m "Add Marquee component"
```

---

## Task 5: `SectionNumber` component

**Files:**
- Create: `web/src/components/editorial/SectionNumber.tsx`

- [ ] **Step 1: Write the file**

```tsx
interface SectionNumberProps {
  n: number;
  label: string;
}

export function SectionNumber({ n, label }: SectionNumberProps) {
  return (
    <div className="snum">
      <span className="snum-num">{String(n).padStart(2, '0')}</span>
      <span className="snum-rule" />
      <span className="snum-label">{label}</span>
    </div>
  );
}
```
(No `'use client'` — pure presentational.)

- [ ] **Step 2: Typecheck + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && git add web/src/components/editorial/SectionNumber.tsx && git commit -m "Add SectionNumber component"
```

---

## Task 6: `PulseCountUp` component

**Files:**
- Create: `web/src/components/editorial/PulseCountUp.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';

interface PulseCountUpProps {
  value: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function PulseCountUp({
  value,
  decimals = 0,
  durationMs = 900,
  className = '',
  prefix = '',
  suffix = '',
}: PulseCountUpProps) {
  const elRef = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = elRef.current;
    if (!el) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const elapsed = t - t0;
        const p = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setDisplay(value * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            start();
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, durationMs]);

  return (
    <span
      ref={elRef}
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }} /* semantic, not layout */
    >
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && git add web/src/components/editorial/PulseCountUp.tsx && git commit -m "Add PulseCountUp component"
```

---

## Task 7: `ViewfinderFrame` component

**Files:**
- Create: `web/src/components/photo/ViewfinderFrame.tsx`
- Source: `/tmp/main-nextjs/nextjs/components/ViewfinderFrame.js`

- [ ] **Step 1: Read the source** `/tmp/main-nextjs/nextjs/components/ViewfinderFrame.js` (~156 lines).

- [ ] **Step 2: Write `web/src/components/photo/ViewfinderFrame.tsx`** porting the source with these mechanical changes:
  - Add types per the spec:
    ```ts
    interface ViewfinderFrameProps {
      children: React.ReactNode;
      cameraLabel?: string; lensLabel?: string;
      isoLabel?: string; shutterLabel?: string; apertureLabel?: string;
      recLabel?: string;
      onClick?: () => void;
      showGrid?: boolean; showCrosshair?: boolean; showAF?: boolean;
      cornerInset?: number; cornerSize?: number; cornerThickness?: number;
    }
    ```
  - Defaults: `showGrid = true`, `showCrosshair = true`, `showAF = true`, `cornerInset = 14`, `cornerSize = 28`, `cornerThickness = 1.5`, `recLabel = 'REC'`.
  - **STATIC styling → Tailwind utilities/arbitrary values.** The outer wrapper: `className="relative bg-black overflow-hidden" + cursor classes based on onClick`. The `inset 0` darkening div: arbitrary inset class. The grid `<svg>`: position absolute with inset, but the inset uses runtime `cornerInset` → inline style is appropriate. The crosshair SVG: static 28×28 absolute centered with translate — Tailwind. The metadata strips: static `font-mono text-[10px] tracking-[.18em] uppercase` + Tailwind positioning where static; left/right offsets from `cornerInset` are runtime → inline.
  - **RUNTIME inline styles permitted:** corner-bracket position/size/thickness (from `cornerInset`/`cornerSize`/`cornerThickness` props), grid `<svg>` inset (from `cornerInset`), metadata-strip absolute positions (from `cornerInset`). Comment each with `/* runtime: from prop */`.
  - Keep the `cornerColor` variable + `cornerStyle(pos)` helper as-is (it's runtime sizing).
  - Use the `font-mono` Tailwind class (mapped to `var(--font-plex-mono)`) instead of `fontFamily: 'var(--mono)'`.

- [ ] **Step 3: Typecheck + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && git add web/src/components/photo/ViewfinderFrame.tsx && git commit -m "Add ViewfinderFrame component"
```

---

## Task 8: `PageCover` component

**Files:**
- Create: `web/src/components/layout/PageCover.tsx`
- Source: `/tmp/main-nextjs/nextjs/components/PageCover.js`

- [ ] **Step 1: Read the source** `/tmp/main-nextjs/nextjs/components/PageCover.js` (~175 lines).

- [ ] **Step 2: Write `web/src/components/layout/PageCover.tsx`** porting the source with these changes:
  - Replace `import { findPhoto, findPhotographer, PHOTOS } from '@/lib/data';` with `import { getPhoto, getPhotographer, getPhotos } from '@/lib/data';`. Use `getPhotos()[0]` as the fallback when no photo is found (since `getPhotos()` returns ranked photos with #1 first).
  - Add types per spec:
    ```ts
    interface PageCoverProps {
      photoId?: string;
      src?: string;
      credit?: string;
      eyebrow?: string;
      title?: string;
      subtitle?: string;
      children?: React.ReactNode;
      height?: string;
      minHeight?: number;
      maxHeight?: number;
      align?: 'left' | 'center';
    }
    ```
  - Defaults: `height = '56vh'`, `minHeight = 420`, `maxHeight = 640`, `align = 'left'`.
  - **STATIC styling → Tailwind utilities/arbitrary values.** Examples:
    - Outer black framed div: `className="relative overflow-hidden bg-black"` + runtime height/min/max inline.
    - Gradient overlay: a single Tailwind arbitrary background-image class `bg-[linear-gradient(180deg,rgba(0,0,0,.5)_0%,rgba(0,0,0,.15)_40%,rgba(0,0,0,.2)_60%,rgba(0,0,0,.7)_100%)]` (no spaces inside the bracket — separate with `_` where Tailwind expects spaces).
    - Top strip text "GOGRAPHY Photo Awards" inside `.mono` + `text-[11px] tracking-[.22em] uppercase opacity-85`.
    - Title `<h1 className="th">` with arbitrary `text-[clamp(48px,6.5vw,96px)] font-light tracking-[-.03em] leading-[.95]`. The `maxWidth` depends on `align` → use `cn(...)` with conditional class `align === 'center' ? 'max-w-[20ch]' : 'max-w-[16ch]'` (text/flex alignment already adapts to `align`).
    - Subtitle `<p className="th text-[16px] leading-[1.55] text-white/85 mt-5 max-w-[540px]">`.
    - CTA wrapper: conditional `justify-center` vs `justify-start`.
    - Credit line: bottom-right absolute, `text-white/55`, mono small uppercase tracking.
  - **RUNTIME inline styles permitted:** the section's `height`/`minHeight`/`maxHeight` from props; text-block `align`-derived `alignItems` and `textAlign` (you may also do these via conditional classes — pick one approach consistently). Top strip absolute positions are static `top-7 left-10 right-10` (28px / 40px) — Tailwind.

- [ ] **Step 3: Typecheck + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && git add web/src/components/layout/PageCover.tsx && git commit -m "Add PageCover component"
```

---

## Task 9: `SideMenu` component

**Files:**
- Create: `web/src/components/layout/SideMenu.tsx`
- Source: `/tmp/main-nextjs/nextjs/components/SideMenu.js`

- [ ] **Step 1: Read the source** `/tmp/main-nextjs/nextjs/components/SideMenu.js` (~193 lines).

- [ ] **Step 2: Write `web/src/components/layout/SideMenu.tsx`** porting the source with these changes:
  - `'use client'`. NAMED hook imports (`useEffect` from react).
  - Replace the source's three-state username fallback with `getPhotographer('pim.travels')` / `getPhotographer('kanthorn')` from `@/lib/data` (use `.avatar` for the avatar src).
  - Add types for the four nav arrays (`PRIMARY`, `CATEGORIES`, `CURATION`, `ABOUT`) and the `Group` / `MenuRow` helper components:
    ```ts
    interface NavLink { to: string; label: string }
    interface GroupProps { title: string; children: React.ReactNode }
    interface MenuRowProps { label: string; active: boolean; onClick: () => void }
    ```
  - All `className`-based styling is via the new `.sidemenu*` classes already added in Task 3 — keep verbatim. The two inline styles on the source (avatar guest letter + theme toggle) are static and should become Tailwind: `text-[10px] opacity-65` etc.
  - The body-scroll lock + Escape listener stays unchanged — typed correctly.
  - Use `useApp()` for `sideMenuOpen`, `setSideMenuOpen`, `theme`, `setTheme`, `userState`.

- [ ] **Step 3: Typecheck + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && git add web/src/components/layout/SideMenu.tsx && git commit -m "Add SideMenu component"
```

---

## Task 10: Update `Nav.tsx` (hamburger + GOGRAPHY uppercase)

**Files:**
- Modify: `web/src/components/layout/Nav.tsx`

- [ ] **Step 1: Open `web/src/components/layout/Nav.tsx`.** Currently it has the role ribbon, the 3-col grid (left links + centered logo + right links + search + sign-in/avatar). The logo span reads `<span>Gography</span>` and there is no hamburger.

- [ ] **Step 2: Add a hamburger button at the start of `nav-left` and update the logo text to uppercase:**
  - In the `useApp()` destructure, also pull `toggleSideMenu`.
  - Insert as the first child of the `<div className="nav-left">`:
    ```tsx
    <button
      className="nav-toggle"
      onClick={toggleSideMenu}
      aria-label="Open menu"
      title="Menu"
    >
      <svg viewBox="0 0 18 18" stroke="currentColor" strokeWidth="1.4" fill="none">
        <line x1="2" y1="5" x2="16" y2="5" />
        <line x1="2" y1="9" x2="16" y2="9" />
        <line x1="2" y1="13" x2="16" y2="13" />
      </svg>
    </button>
    ```
  - Change the logo span: `<span>Gography</span>` → `<span>GOGRAPHY</span>` (the small "Photo Awards" tagline stays unchanged).
  - No inline style on the button — the `.nav-toggle` class (added in Task 3) handles size/border/hover.

- [ ] **Step 3: Verify + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && npm run lint && npm run build && git add web/src/components/layout/Nav.tsx && git commit -m "Add hamburger toggle to Nav and rebrand to GOGRAPHY"
```

---

## Task 11: Update `PhotoCard.tsx` (hover overlay) and `PhotoGrid.tsx` (stagger)

**Files:**
- Modify: `web/src/components/photo/PhotoCard.tsx`
- Modify: `web/src/components/photo/PhotoGrid.tsx`

- [ ] **Step 1: Edit `PhotoCard.tsx`** — inside the `<div className="pimg" ...>` block, AFTER the `<img>` element, insert the overlay markup (uses the `.pimg-overlay*` classes added in Task 3):

```tsx
{/* Hover overlay: photo metadata fades in from bottom */}
<div className="pimg-overlay">
  <div className="pimg-overlay-grad" />
  <div className="pimg-overlay-content">
    <div className="pimg-overlay-cat">{photo.cat}</div>
    <div className="pimg-overlay-title">{photo.title}</div>
    <div className="pimg-overlay-meta">
      <span>{photographer ? photographer.name : photo.by}</span>
      <span className="pimg-overlay-sep">·</span>
      <span>{photo.exif.camera}</span>
    </div>
    <div className="pimg-overlay-pulse">
      <span className="pimg-overlay-pulse-num">{photo.pulse.toFixed(0)}</span>
      <span className="pimg-overlay-pulse-lab">PULSE</span>
    </div>
  </div>
</div>
```

`photographer` is the already-resolved local from `getPhotographer(photo.by)` in the component. The CSS handles show-on-`.pcard:hover`.

- [ ] **Step 2: Edit `PhotoGrid.tsx`** — for both layout branches (uniform grid and masonry columns), add the `pgrid pgrid-stagger` class to the grid container and wrap each item with a `<div key={...} style={{ '--i': i }}>` so the staggered animation can read the index. The TypeScript syntax for CSS variables in `style`:

```tsx
style={{ '--i': i } as React.CSSProperties}
```

Update the `.map((p, i) => ...)` for both layouts. Uniform layout:

```tsx
<div
  className="pgrid pgrid-stagger grid gap-6"
  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} /* runtime: cols prop */
>
  {photos.map((p, i) => (
    <div key={p.id} style={{ '--i': i } as React.CSSProperties}>
      <PhotoCard
        photo={p}
        showRank={showRank}
        showRankDelta={showRankDelta}
        leaderTopScore={leaderTopScore}
        uniform
        pulseLabel={pulseLabel}
      />
    </div>
  ))}
</div>
```

Masonry layout:

```tsx
<div
  className="pgrid pgrid-stagger gap-6"
  style={{ columnCount: cols } as React.CSSProperties} /* runtime: cols prop */
>
  {photos.map((p, i) => (
    <div
      key={p.id}
      className="break-inside-avoid mb-8"
      style={{ '--i': i } as React.CSSProperties}
    >
      <PhotoCard
        photo={p}
        showRank={showRank}
        showRankDelta={showRankDelta}
        leaderTopScore={leaderTopScore}
        pulseLabel={pulseLabel}
      />
    </div>
  ))}
</div>
```

- [ ] **Step 3: Verify + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && npm run lint && npm run build && git add web/src/components/photo && git commit -m "Add hover overlay and staggered fade-in to photo grid"
```

---

## Task 12: Mount `SideMenu` in root layout

**Files:**
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Open `web/src/app/layout.tsx`.** Currently it imports `AppProvider`, `Nav`, and `TweaksPanel`, and renders `<AppProvider><Nav /><main>{children}</main><TweaksPanel /></AppProvider>` (approximately).

- [ ] **Step 2: Import and mount `SideMenu`** alongside `TweaksPanel`:

```tsx
import { SideMenu } from '@/components/layout/SideMenu';
```

And in the JSX, render `<SideMenu />` before `<TweaksPanel />`:

```tsx
<AppProvider>
  <Nav />
  <main>{children}</main>
  <SideMenu />
  <TweaksPanel />
</AppProvider>
```

- [ ] **Step 3: Verify + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && npm run lint && npm run build && git add web/src/app/layout.tsx && git commit -m "Mount SideMenu in root layout"
```

---

## Task 13: `/showcase` page

**Files:**
- Create: `web/src/app/showcase/page.tsx`
- Source: `/tmp/main-nextjs/nextjs/app/showcase/page.js`

- [ ] **Step 1: Read the source** `/tmp/main-nextjs/nextjs/app/showcase/page.js` (~171 lines). It imports themed shadcn primitives (`Button`, `Card*`, `Badge`, `Dialog*`, `Input`, `Label`) and demonstrates them.

- [ ] **Step 2: Port to `web/src/app/showcase/page.tsx`** with these changes:
  - Map shadcn imports to our themed primitives:
    - `@/components/ui/button` → `Button`
    - `@/components/ui/card` → if our setup didn't add Card, omit Card sections (use a `<div className="border border-rule p-6">` wrapper instead). Check first: `ls web/src/components/ui/card.tsx` — if absent, use the div fallback.
    - `@/components/ui/badge` → likewise; if absent, use a styled span with `.caps` class.
    - `@/components/ui/dialog` → `Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription` (we have these from Task 14 of the rebuild).
    - `@/components/ui/input` → `Input`
    - `@/components/ui/label` → `Label`
  - Add `'use client'` if the source uses any `useState` (the Dialog demo likely uses it).
  - Apply the same INLINE STYLE RULE (static → Tailwind classes/arbitrary; runtime-only inline). All Thai/English copy verbatim.

- [ ] **Step 3: Verify + commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && npm run lint && npm run build && git add web/src/app/showcase && git commit -m "Add /showcase page (shadcn demo)"
```
(If `card`/`badge` shadcn primitives are missing in our `ui/` and your fallback uses divs/spans, this is acceptable per the spec — those primitives weren't in our rebuild's `Task 14` list and aren't required for the rest of the work.)

---

## Task 14: Apply `PageCover` to the 5 marketing/info pages

**Files:** modify each
- `web/src/app/(marketing)/about/page.tsx`
- `web/src/app/(marketing)/about-ranking/page.tsx`
- `web/src/app/(marketing)/for-customers/page.tsx`
- `web/src/app/(marketing)/hall-of-fame/page.tsx`
- `web/src/app/(marketing)/ambassadors/page.tsx`
- Reference: corresponding files under `/tmp/main-nextjs/nextjs/app/`

- [ ] **Step 1: For each of the 5 pages**, read the matching source file under `/tmp/main-nextjs/nextjs/app/(same-route)/page.js` and observe how main calls `<PageCover photoId="..." eyebrow="..." title="..." subtitle="..." />` at the top of the page's main render. Copy main's exact props (photoId / eyebrow / title / subtitle / children CTAs) — these are part of the faithful port.

- [ ] **Step 2: For each page**, import `PageCover` from `@/components/layout/PageCover` and insert `<PageCover ... />` as the first element of the page body (before the existing `.wrap` content). If the existing page started with its own large title block, the PageCover replaces that block (matching main); otherwise it's added above.

- [ ] **Step 3: Verify after editing each page** (`npm run typecheck && npm run lint && npm run build`).

- [ ] **Step 4: Commit**

```bash
git add "web/src/app/(marketing)" && git commit -m "Apply PageCover to marketing pages"
```

---

## Task 15: Apply `PageCover` to explore + photographer + photographers pages

**Files:** modify each
- `web/src/app/explore/page.tsx`
- `web/src/app/explore/[category]/page.tsx`
- `web/src/app/photographer/[username]/page.tsx`
- `web/src/app/photographers/page.tsx`
- `web/src/app/photographers/[filter]/page.tsx`
- Reference: corresponding files under `/tmp/main-nextjs/nextjs/app/`

- [ ] **Step 1: For each page**, read the main source and copy the `<PageCover ... />` invocation verbatim (props: `photoId` / `eyebrow` / `title` / `subtitle`). For `[category]` / `[filter]` / `[username]`, the props are usually computed from the route param (e.g. `eyebrow={category}`, `title={photographer.name}`) — port main's exact expression.

- [ ] **Step 2: Insert at top of page render**, importing `PageCover`. Verify build after each.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/explore web/src/app/photographer web/src/app/photographers && git commit -m "Apply PageCover to explore and photographer pages"
```

---

## Task 16: Apply `PageCover` to remaining pages (search, login, upload, apply, me)

**Files:** modify each
- `web/src/app/search/page.tsx`
- `web/src/app/login/page.tsx`
- `web/src/app/upload/page.tsx`
- `web/src/app/apply-photographer/page.tsx`
- `web/src/app/me/[[...section]]/page.tsx`
- Reference: corresponding files under `/tmp/main-nextjs/nextjs/app/`

- [ ] **Step 1: For each page**, read main's source and copy its `<PageCover ... />` props verbatim. The `me` page has a search-style PageCover (eyebrow="Account" or similar — check main). The `search` page's PageCover may be smaller or have the search input as `children`.

- [ ] **Step 2: For pages that wrap content in `<Suspense>` (search), make sure PageCover renders OUTSIDE the Suspense boundary (it doesn't read `useSearchParams`).**

- [ ] **Step 3: Insert at top of page render**, importing `PageCover`. Verify build after each. For the `me` page, PageCover renders before the sidebar+content grid; the sidebar is unaffected.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/search web/src/app/login web/src/app/upload web/src/app/apply-photographer web/src/app/me && git commit -m "Apply PageCover to search/login/upload/apply/me pages"
```

---

## Task 17: Landing page visual density updates

**Files:**
- Modify: `web/src/app/page.tsx`, plus any home/section components needed (`web/src/components/home/*.tsx`)
- Reference: `/tmp/main-nextjs/nextjs/app/page.js` (especially the diff vs our rebuild's version)

- [ ] **Step 1: Read main's `/tmp/main-nextjs/nextjs/app/page.js`** to see the landing structure with the new bits. Concretely, main adds:
  - A "Cover of the week" block on `bg-black text-white` (around the top, after the hero): a wrap with eyebrow "Cover of the week" + `★ #1 PULSE <PulseCountUp value={top.pulse} decimals={0} />` mono badge, then a `<ViewfinderFrame showGrid={false} showCrosshair={false} showAF={false} onClick={() => router.push(...)}>` wrapping the top photo `<img>`, then a wrap with `<h2 className="th text-[clamp(36px,4.4vw,64px)] font-normal tracking-[-.02em] leading-[1.05] text-white">"{top.title}"</h2>` and a credit line "by ... · camera · focal" + a "View photo →" link.
  - A `<Marquee speedSec={70} items={...} />` line directly after that section, items mapped from `PHOTOS.slice(0, 12)` to `{ num: String(i+1).padStart(2,'0'), title: p.title, by: <photographer.name>.toUpperCase() }`.
  - `<SectionNumber n={1} label="Pulse Leaderboard · This week" />` above the leaderboard section header (replace/augment the existing "Pulse Leaderboard" eyebrow). Continue `n=2`, `n=3`, ... for subsequent sections matching main's numbering.
  - `PulseCountUp` for any prominent pulse number displays on the landing page.
  - The new "GOGRAPHY Photo Awards" top mono strip text in the hero (if not already present).

- [ ] **Step 2: Implement those additions in `web/src/app/page.tsx`** (and the home/* section components it composes). Use the typed accessors (`getPhotos()`, `getPhotographer`) to compute `top` etc. Import `Marquee`, `SectionNumber`, `PulseCountUp`, `ViewfinderFrame`. For the cover-of-week block, the `<img>` keeps `loading="lazy"`; the `onClick` on `ViewfinderFrame` calls `router.push(\`/photo/${top.id}\`)`.

- [ ] **Step 3: INLINE STYLE RULE** — convert all static values to Tailwind arbitrary classes (`text-[clamp(36px,4.4vw,64px)] tracking-[-.02em] leading-[1.05] text-white py-20`, `bg-black`, etc.). Runtime values (e.g. computed top photo's title in JSX text — not a style — fine) — there should be very few inline styles in this addition.

- [ ] **Step 4: Verify**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/page.tsx web/src/components/home && git commit -m "Landing page visual density: marquee, cover-of-week viewfinder, section numbers, count-up"
```

---

## Task 18: GOGRAPHY rebrand sweep + final verification

**Files:** sweep across `web/src/` for any remaining display text "Gography" → "GOGRAPHY"; plus the standard verification suite.

- [ ] **Step 1: Sweep display copy**

```bash
cd /home/no13/Projects/Gography/ranking-gography-net/web && grep -rn ">Gography<\|>Gography \|\"Gography Photo\|'Gography Photo" src --include='*.tsx' --include='*.ts' --include='*.css'
```
For each match in display copy (user-visible text — `<span>Gography</span>`, page titles, footer text, etc.), change to all-caps "GOGRAPHY". The exceptions:
- The `<title>` metadata in `layout.tsx` may remain "Gography Photo Awards — Ranking" if you prefer Sentence Case in browser tabs, OR change to "GOGRAPHY Photo Awards — Ranking" for consistency. Pick one and apply.
- Source-code identifiers, comments, and the README files do NOT change (they're not user-facing display copy).

- [ ] **Step 2: Run the full verification suite**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run lint && npm run typecheck && npm test && npm run build
```
All must pass. Test count: still 20 (no new tests in this port). Build now lists `/showcase` as an additional route (18 routes total).

- [ ] **Step 3: Dev-server runtime smoke test**

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
cd /home/no13/Projects/Gography/ranking-gography-net/web && npm run dev > /tmp/ui-update-dev.log 2>&1 &
```
Wait for "✓ Ready" then note the port (3000 or 3001). Then:
```bash
PORT=3001  # or whatever the log showed
for r in / /explore /explore/landscape /photo/p004 /photographer/kanthorn /photographers /photographers/ambassadors /hall-of-fame /ambassadors /about-ranking /about /for-customers "/search?q=fog" /login /upload /apply-photographer /me /me/settings /showcase; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT$r")
  printf "%-32s %s\n" "$r" "$code"
done
grep -iE 'error|unique .key.|hydrat|warning:' /tmp/ui-update-dev.log | head -20 || echo "log: clean"
pkill -f 'next dev'
```
Expected: every route returns 200 (the 17 original + `/showcase` = 18). No React key warnings. No hydration warnings. Any error → fix before declaring done.

- [ ] **Step 4: Inline-style audit**

```bash
cd /home/no13/Projects/Gography/ranking-gography-net/web && grep -rn "style={{" src --include='*.tsx' | grep -v 'src/components/ui/' | wc -l
```
Then `grep -rn "style={{" src --include='*.tsx' | grep -v 'src/components/ui/'` and review every match — each must read a runtime variable/prop/state and ideally carry a `// runtime: ...` comment. Any static value found → convert to Tailwind arbitrary class and re-verify.

- [ ] **Step 5: Commit the rebrand sweep + any audit fixups**

```bash
git add web/src && git commit -m "GOGRAPHY rebrand sweep across display copy"
```
(If the inline-style audit required additional edits, those can go in the same commit or a follow-up "Tighten inline-style discipline post-port" commit.)

---

## Self-review notes (spec coverage check)

- **Spec §What's being ported (12 commits):** addressed across Tasks 1 (sideMenuOpen from `2bea8d9`/`d6ea986`), 2 (assets from `c71831d`), 3 (CSS from all visual commits), 4–6 (editorial from `a29fc01`), 7 (viewfinder from `4e34e3c`/`a3a3fff`), 8 (PageCover from `a3a3fff`), 9 (SideMenu from `2bea8d9`/`d6ea986`), 10 (Nav: hamburger + GOGRAPHY rebrand from `db7b5aa`), 11 (PhotoCard hover overlay + PhotoGrid stagger from `a29fc01`), 12 (mount SideMenu), 13 (`/showcase` from `4cd21bc`), 14–16 (PageCover on 15 pages), 17 (landing visual density), 18 (rebrand sweep). The "Fix React import bugs" commit (`cdc8be0`) needs no work — our rebuild used named hooks throughout.
- **Spec §Components — types and behavior:** Tasks 4–9 each define the typed component matching the spec's interfaces.
- **Spec §AppProvider extension:** Task 1 implements `sideMenuOpen` + `setSideMenuOpen` + `toggleSideMenu` as a separate `useState`, not in persisted prefs — matches spec.
- **Spec §`Nav.tsx` update:** Task 10. Hamburger button + uppercase logo.
- **Spec §`PhotoCard.tsx` hover-overlay update:** Task 11. Markup matches spec verbatim.
- **Spec §`globals.css` additions:** Task 3. All class groups enumerated.
- **Spec §Apply `PageCover` to pages:** Tasks 14–16 cover the 15 pages.
- **Spec §Landing-page enhancements:** Task 17.
- **Spec §/showcase page:** Task 13.
- **Spec §Brand assets:** Task 2.
- **Spec §GOGRAPHY rebrand sweep:** Task 18.
- **Spec §Styling discipline:** restated in conventions; each component task and the audit in Task 18 enforce it.
- **Spec §Verification:** Task 18 step 2 (build/lint/test/typecheck), step 3 (dev curl), step 4 (inline-style audit).
- **Spec §Out of scope:** honored — no sync of `nextjs/`, no merging branches, no Supabase wiring, no scope creep.

**Type/name consistency check:** `useApp()` consumers everywhere reference the same names (`sideMenuOpen`, `setSideMenuOpen`, `toggleSideMenu`) defined in Task 1. `PageCover` prop names are reused identically in Tasks 14–16. `PhotoCard` overlay classes match the CSS class names from Task 3 (no typos: `pimg-overlay`, `pimg-overlay-grad`, `pimg-overlay-content`, `pimg-overlay-cat`, `pimg-overlay-title`, `pimg-overlay-meta`, `pimg-overlay-sep`, `pimg-overlay-pulse`, `pimg-overlay-pulse-num`, `pimg-overlay-pulse-lab`). PhotoGrid CSS-var-in-style uses the `'--i'` key consistently with the `.pgrid-stagger > *` selector reading `var(--i)`.

**Placeholder scan:** none of the plan failure patterns appear. Every "port from source" instruction names the exact source file path and what to copy.
