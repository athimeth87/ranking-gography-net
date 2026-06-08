# FAQ Page Consolidation — Dev Handoff

**Branch:** `feat/faq-consolidation`
**Base:** `admin` (@ `850dfec`)
**Commit:** `1d26d35` — `feat: consolidate /about and /about-ranking into single /faq accordion page`
**Date:** 2026-06-06
**PR target:** `dev`

---

## Stats

- **9 files changed** (+275 / -262 lines)
- **2 new files** — `src/app/faq/page.tsx`, `docs/2026-06-06-faq-page-consolidation.md`

---

## Why this change

The old navigation had two separate info pages — `/about-ranking` (ranking concept + statuses) and `/about` (brand story + member types). Users had no clear mental model for which to visit. Both pages are now merged into a single `/faq` page with accordion sections, reducing nav depth and giving users one place to learn about the platform.

---

## 1. New page — `/faq`

**`src/app/faq/page.tsx`**

- `'use client'` — uses `useState<number | null>` to track which accordion item is open (one at a time)
- 7 accordion items, content sourced verbatim from the two retired pages
- `PageCover` reuses `photoId="p013"` (same as old `/about`)
- No new dependencies, no new CSS classes, no new data fetching

**Accordion items:**
| # | Question |
|---|---|
| 1 | Gography Photo Ranking คืออะไร? |
| 2 | มีหมวดการแข่งขันอะไรบ้าง? |
| 3 | สมาชิกมีกี่ประเภท? |
| 4 | Ambassador คืออะไร? |
| 5 | Ranked Master Badge คืออะไร? |
| 6 | Travellers ได้สิทธิ์อะไรบ้าง? |
| 7 | รางวัล Season มีอะไรบ้าง? |

---

## 2. Retired pages — redirects

**`src/app/(marketing)/about-ranking/page.tsx`**
**`src/app/(marketing)/about/page.tsx`**

Both files replaced with:
```tsx
import { redirect } from 'next/navigation';
export default function Page() { redirect('/faq'); }
```

Old bookmarks and external links remain functional — no 404s.

---

## 3. Navigation updates

| File | Before | After |
|---|---|---|
| `src/components/layout/Nav.tsx` | `{ to: '/about', translationKey: 'about' }` | `{ to: '/faq', translationKey: 'faq' }` |
| `src/components/layout/SideMenu.tsx` | `[ranking→/about-ranking, about→/about, for_voyageurs→/for-customers]` | `[faq→/faq, for_voyageurs→/for-customers]` |
| `src/components/home/HeroSection.tsx` | `router.push('/about-ranking')` | `router.push('/faq')` |

---

## 4. Translations

New key `"faq": "FAQ"` added to both `src/messages/en.json` and `src/messages/th.json` under the `Nav` and `SideMenu` namespaces. Existing `"about"` key is retained (may still appear in other i18n contexts).

---

## Review checklist

- [ ] `GET /faq` — accordion renders, each item expands/collapses correctly
- [ ] `GET /about` — redirects to `/faq` (no 404)
- [ ] `GET /about-ranking` — redirects to `/faq` (no 404)
- [ ] Nav bar shows "FAQ" link and it is active when on `/faq`
- [ ] SideMenu "About" group shows FAQ + For Travellers only
- [ ] HeroSection "How ranking works" button navigates to `/faq`
- [ ] `npm run typecheck` — clean
- [ ] `npm run build` — all routes compile

---

## No migrations required

No database changes, no new environment variables, no new dependencies.
