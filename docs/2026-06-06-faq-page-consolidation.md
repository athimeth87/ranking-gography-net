# FAQ Page Consolidation — 2026-06-06

## Summary

The two separate marketing pages (`/about-ranking` and `/about`) have been merged into a single `/faq` page with accordion-style sections. This reduces navigation complexity and gives users one canonical place to learn about the platform.

---

## What Changed

### New page: `/faq`
- **File:** `src/app/faq/page.tsx`
- Client Component (`'use client'`) — uses `useState` to manage open/close per accordion item.
- Contains 7 accordion sections, each click-to-expand:
  1. Gography Photo Ranking คืออะไร?
  2. มีหมวดการแข่งขันอะไรบ้าง? (Classic / Traveller)
  3. สมาชิกมีกี่ประเภท? (User / Traveller / Rank Master / Ambassador)
  4. Ambassador คืออะไร?
  5. Ranked Master Badge คืออะไร?
  6. Travellers ได้สิทธิ์อะไรบ้าง?
  7. รางวัล Season มีอะไรบ้าง?
- Content is sourced from both old pages — no content was removed, only reorganized.

### Retired pages → redirect
| Old URL | Status |
|---|---|
| `/about-ranking` | 302 → `/faq` |
| `/about` | 302 → `/faq` |

Both files now contain only a `redirect('/faq')` call. Old links (bookmarks, external referrals) continue to work.

### Navigation updates
| File | Change |
|---|---|
| `src/components/layout/Nav.tsx` | Center link: `about → faq`, translationKey `about → faq` |
| `src/components/layout/SideMenu.tsx` | ABOUT group: replaced `[ranking→/about-ranking, about→/about, for_voyageurs→/for-customers]` with `[faq→/faq, for_voyageurs→/for-customers]` |
| `src/components/home/HeroSection.tsx` | "How ranking works" button: `router.push('/about-ranking') → router.push('/faq')` |

### Translation keys added
Both `src/messages/en.json` and `src/messages/th.json` have a new key added to the `Nav` and `SideMenu` namespaces:

```json
"faq": "FAQ"
```

The existing `"about"` key in both namespaces is kept (it may be used elsewhere) but is no longer referenced by any nav component.

---

## No Breaking Changes

- `/about` and `/about-ranking` still resolve — they redirect rather than 404.
- No database migrations required.
- No new dependencies added.
- TypeScript strict mode passes clean (`tsc --noEmit`).

---

## File Map

```
src/app/faq/page.tsx                          ← NEW — FAQ accordion page
src/app/(marketing)/about-ranking/page.tsx    ← REPLACED with redirect('/faq')
src/app/(marketing)/about/page.tsx            ← REPLACED with redirect('/faq')
src/components/home/HeroSection.tsx           ← link target updated
src/components/layout/Nav.tsx                 ← link target updated
src/components/layout/SideMenu.tsx            ← ABOUT group simplified
src/messages/en.json                          ← added faq key (Nav + SideMenu)
src/messages/th.json                          ← added faq key (Nav + SideMenu)
```
