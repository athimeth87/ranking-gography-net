# Ranking Rebrand & Cover Redesign — Dev Handoff

**Branch:** `feat/ranking-rebrand-and-cover-update`
**Base:** `feat/likes-comments-notifications`
**Commit:** `2092948` — `feat(ui): ranking rebrand, cover redesign, and layout polish`
**Date:** 2026-05-24
**PR link:** https://github.com/athimeth87/ranking-gography-net/pull/new/feat/ranking-rebrand-and-cover-update

---

## Stats

- **25 files changed** (+236 / -268 lines)
- **1 new asset** — `public/cover-of-the-week.jpg` (1.7 MB)

---

## 1. Cover (Global — all pages)

**`src/components/layout/PageCover.tsx`**

- Default image: Unsplash mountains URL set as `DEFAULT_COVER_SRC` constant
- Fallback logic changed: `src ?? DEFAULT_COVER_SRC` — `photoId` is no longer used for image (callers passing explicit `src`, like photographer profile, still work as before)
- Title size reduced ~55% — `text-[clamp(20px,4.5vw,54px)] md:text-[clamp(28px,3.6vw,54px)]` (was max 96px)
- Font weight changed `light` → `normal`, tracking `-.03em` → `-.015em`
- Inline `fontFamily` removed — title uses global `h1 { font-family: var(--serif) }` rule

---

## 2. Navigation / Logo

| File | Change |
|------|--------|
| `src/components/layout/Nav.tsx` | Remove `<small>Photo Awards</small>`, rename `Pulse Score` → `Ranking` |
| `src/components/layout/SideMenu.tsx` | `Pulse Score` → `Ranking` |
| `src/components/layout/Footer.tsx` | `Pulse Score` → `Ranking` |
| `src/components/home/HeroSection.tsx` | Button text `How Pulse works` → `How ranking works` |
| `src/app/globals.css` (`.logo span`) | Add `letter-spacing: 0.3em` for GOGRAPHY |

---

## 3. Pick Badge — Editor → Rank Master

**`src/components/icons/index.tsx`** (PickBadge config)

```ts
editor: { bg: '#c0c0c0', fg: '#1a1a1a', label: 'Rank Master', icon: <CrownIcon /> },
ambassador: { bg: '#b08e54', fg: '#fff', label: "Ambassador's Pick", icon: <CrownIcon /> },
both: { bg: '#b08e54', fg: '#fff', label: "Rank Master + Ambassador's Pick", icon: <CrownIcon withStar /> },
```

**User-facing label updates (Editor's Pick → Rank Master):**

- `src/components/account/MeSettings.tsx:115`
- `src/components/account/MeDashboard.tsx:75,77,125`
- `src/components/mobile/MobileMe.tsx:249`
- `src/app/photographer/[username]/page.tsx:208`
- `src/app/showcase/page.tsx:82,87`
- `src/app/(marketing)/ambassadors/page.tsx:96`

**Not changed (intentional):**
- `Editorial team` / `Editor in Chief` role references (refers to team of editors, not the badge)
- Internal pick key `picks.includes('editor')` in data layer

---

## 4. Pick Badge Hover (Bug Fix)

**`src/components/icons/index.tsx`** — remove inline `maxWidth: 0`
**`src/app/globals.css`** — add default `.pickbadge-label { max-width: 0; padding-left: 0 }`

> Inline styles were overriding CSS `:hover` rule. Now hover correctly expands the label to show "Rank Master" / "Ambassador's Pick" text.

---

## 5. `/about-ranking` — Full rewrite

**`src/app/(marketing)/about-ranking/page.tsx`**

Removed: Pulse formula, Curation bonus table, Worked example, Principles, FAQ.

New sections (replacing old content):
1. **About** — Gography Photo Ranking intro
2. **Ambassador** — special status, invite-only
3. **Ranked Master** — badge for 4 consecutive weeks Top 1-3
4. **Voyageurs** — special category for travel customers

URL stays `/about-ranking`.

---

## 6. `/about` — Layout & font polish

**`src/app/(marketing)/about/page.tsx`** (section under Cover)

- `className="th text-[22px] ..."` → `style={{ fontFamily: 'var(--serif)' }}` with `clamp(22px,2.4vw,30px)`
- Padding added: `pt-[96px] pb-[120px]`
- Body text: 16px / leading 1.85 (was 15px / 1.8)
- 2-col body: `gap-[48px] md:gap-[64px]`, responsive stacked on mobile
- magrule: `my-[64px]` (was 48px)

> English words (GOGRAPHY, Patagonia, Iceland, Atacama, Mongolia, 500px, Instagram, etc.) render in Playfair Display via the `--serif` font stack; Thai falls back to Noto Thai automatically.

---

## 7. Section Heading Font Consistency

`globals.css` has a base rule: `h1, h2, h3, h4, h5, h6 { font-family: var(--serif); }`

The `.th` class was overriding this with Noto Thai (sans-serif look) on section headers. **Removed `.th` from headings in:**

| File | Heading |
|------|---------|
| `src/components/home/TrendsNowSection.tsx` | (already correct) |
| `src/components/home/FeaturedPhotographersSection.tsx:26` | "Featured Photographers" |
| `src/components/home/AlltimeSection.tsx:39` | "All-time" |
| `src/components/home/LeaderboardSection.tsx:31` | "Leaderboard" |
| `src/components/home/VoyageursSection.tsx:96` | "Travelled with us? / Become a Voyageur" |
| `src/app/(marketing)/about/page.tsx:12,109` | SectionHeader + "Want to join us?" |
| `src/app/(marketing)/about-ranking/page.tsx:12` | SectionHeader (4 sections) |
| `src/app/(marketing)/hall-of-fame/page.tsx:126` | Winner photo h3 |
| `src/app/explore/page.tsx:131` | "Explore" h1 |

> **`.th` kept on `<p>`, `<div>`, etc.** — these are body content (mostly Thai), Noto Thai is more readable.

---

## 8. Naming

| Before | After | Files |
|--------|-------|-------|
| Pulse Leaderboard | Leaderboard | `LeaderboardSection.tsx`, `MeDashboard.tsx:77` |
| Every photo | Explore | `explore/page.tsx:131` |

---

## 9. Trends Now — 9 photos / 3 columns

**`src/components/home/TrendsNowSection.tsx`**

- `photos.slice(0, 5)` → `photos.slice(0, 9)`
- Grid: `lg:grid-cols-2` → `md:grid-cols-2 lg:grid-cols-3`
- Removed `max-w-[1100px]` constraint
- Border-top reset for first row at each breakpoint

---

## 10. Cover of the Week — Custom asset

- `public/cover-of-the-week.jpg` — copied from `J:\CANVAS\Namibia Ad\87N_3729-Edit.jpg` (1.7 MB)
- `src/components/home/HeroSection.tsx:111` — `src={top.src}` → `src="/cover-of-the-week.jpg"`
- Title / by photographer / camera info still pull from `top` (rank #1 photo)

---

## 11. Profile Picture Upload (NEW feature)

**`src/components/account/MeSidebar.tsx`**

- Avatar is now clickable (button wrapper around `<img>`)
- Clicking opens file picker
- Validates: image MIME type, max 5MB
- Uploads to Supabase Storage: bucket `photos`, path `avatars/{user_id}-{timestamp}.{ext}`
- Updates `users.avatar_url` with `getPublicUrl()`
- UI: "Change" overlay on hover, "Uploading…" overlay during upload
- New prop `onAvatarUpdated?: (url: string) => void` for parent refresh

**`src/app/me/[[...section]]/page.tsx`**
- Wires `onAvatarUpdated` callback to update local `profile` state immediately (no refetch needed)

### Backend requirements (Dev to verify)

- Supabase Storage bucket named `photos` must exist
- RLS policy on `storage.objects` must allow authenticated users to upload to path matching `avatars/{auth.uid()}-*`
- RLS policy on `users` table must allow users to UPDATE their own `avatar_url`

---

## 12. `.section-alt` — Dark Panel Class

**`src/app/globals.css`** — new utility:

```css
.section-alt {
  background: #0d0c0a;
  color: #ffffff;
  --fg: #ffffff;
  --fg-soft: rgba(255,255,255,.65);
  --fg-faint: rgba(255,255,255,.32);
  --rule: rgba(255,255,255,.14);
  --cream: #1a1a18;
}
```

**Why it works in both themes:**
- Overrides CSS custom properties locally → child elements that read `var(--fg)`, `var(--fg-soft)`, etc. automatically render with light values
- Both light and dark themes get the same dark band; the trick is `--fg` becomes white inside the section

**Used in:** `src/app/(marketing)/about-ranking/page.tsx` — alternating sections (Ambassador, Voyageurs)

---

## Files Modified

```
public/cover-of-the-week.jpg                          (new asset)
src/app/(marketing)/about-ranking/page.tsx            (rewritten)
src/app/(marketing)/about/page.tsx                    (layout + font)
src/app/(marketing)/ambassadors/page.tsx              (label)
src/app/(marketing)/hall-of-fame/page.tsx             (heading font)
src/app/explore/page.tsx                              (heading text + font)
src/app/globals.css                                   (.section-alt, .logo span, .pickbadge-label)
src/app/me/[[...section]]/page.tsx                    (avatar callback wiring)
src/app/photographer/[username]/page.tsx              (label)
src/app/showcase/page.tsx                             (label)
src/components/account/MeDashboard.tsx                (labels)
src/components/account/MeSettings.tsx                 (label)
src/components/account/MeSidebar.tsx                  (avatar upload feature)
src/components/home/AlltimeSection.tsx                (heading font)
src/components/home/FeaturedPhotographersSection.tsx  (heading font)
src/components/home/HeroSection.tsx                   (CTA text + cover image)
src/components/home/LeaderboardSection.tsx            (heading font + rename)
src/components/home/TrendsNowSection.tsx              (9 photos / 3 cols)
src/components/home/VoyageursSection.tsx              (heading font)
src/components/icons/index.tsx                        (Rank Master badge config)
src/components/layout/Footer.tsx                      (label)
src/components/layout/Nav.tsx                         (logo + label)
src/components/layout/PageCover.tsx                   (default img, font, size)
src/components/layout/SideMenu.tsx                    (label)
src/components/mobile/MobileMe.tsx                    (label)
```

---

## Testing checklist for Dev

- [ ] Cover renders on all pages with new mountains image (except `/photographer/[username]` which has its own cover)
- [ ] All section headings (home + about pages) render in Playfair Display
- [ ] "Pulse Score" replaced with "Ranking" in Nav, SideMenu, Footer, Hero CTA
- [ ] `/about-ranking` shows new 4-section content
- [ ] Rank Master badge (silver crown) hover shows "Rank Master" label expanding
- [ ] Ambassador badge (gold crown) hover shows "Ambassador's Pick" expanding
- [ ] Trends Now shows 9 photos in 3 columns on desktop
- [ ] Hero "Cover of the Week" shows the Namibia image
- [ ] `/me` page: clicking avatar opens file picker, upload completes, avatar updates instantly
- [ ] Verify Supabase Storage `photos` bucket + RLS policies (see section 11)
- [ ] Light theme + Dark theme both work on `/about-ranking` alternating sections
