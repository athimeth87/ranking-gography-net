# Handoff Brief — Gography Photo Awards Design

> 📋 **Copy this entire document** เป็น first message ให้ Claude design session ใหม่
> Self-contained — Claude session อื่นจะมี context ครบโดยไม่ต้องอ่าน ATH BRAIN wiki

---

## Project Overview

**Build:** Photo ranking + voting platform — "Gography Photo Awards"
**Inspired by:** 500px.com (but premium feel + better UX)
**Audience:** Thai photographers + Gography tour customers
**Domain:** `ranking.gography.net` (subdomain of premium photography travel brand)

**Stack already decided:**
- Next.js 14 (App Router)
- TailwindCSS + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- Vercel hosting

## What I Need From You

ออกแบบ **ครบทุกหน้า ทุก state ทุก interaction** ของระบบนี้ — ตั้งแต่ landing page ไปจนถึง admin dashboard

### Deliverables ที่ต้องการ
1. **Wireframes** ของทุก 25+ pages (mobile + desktop responsive)
2. **Component library** (Button / Card / Modal / Form / etc.)
3. **Interactive states** สำหรับทุก component (default/hover/active/disabled/loading/error)
4. **User flow diagrams** (auth, upload, vote, favorite, curation)
5. **Empty states + error states** สำหรับทุก page
6. **Animation/motion** specs (hover, transition, micro-interactions)
7. **Admin UI** ที่ functional + แต่ minimal (ไม่ต้องสวยเท่า public)

### Format ที่อยากได้
- Figma file (preferred) หรือ
- Detailed mockups + HTML/CSS prototype หรือ
- Tailwind-based React components ที่ใช้งานได้เลย

---

## Brand Direction (อ่านก่อนเริ่ม)

### Personality
- **Premium / Luxury** — Reference: BMW, Bentley, Hermès, Aesop
- **Photo-first** — UI หายไป ภาพคุยเอง
- **Editorial / Curated feel** — เหมือน art magazine + museum
- **Minimal but warm** — ไม่ cold, ไม่ corporate
- **Cinematic** — มีจังหวะ, มี breathing room

### Theme System
- **Default = Pure White** `#FFFFFF` background, `#000000` text
- **Dark mode toggle = Pure Black** `#000000` background, `#FFFFFF` text
- **NO gray backgrounds** — ใช้ pure white/black เท่านั้น
- **NO color accent** — monochrome ทั้งระบบ — accent สีเดียวที่อาจใช้: subtle warm cream `#FAFAF7` สำหรับ subtle distinction (Card highlight)

### Typography
- **Sans-serif only** — Inter หรือ Helvetica Neue หรือ system-ui
- Display large + bold สำหรับ hero + numbers
- Body regular 16px / 1.6 line-height
- Caption + metadata: small caps / uppercase / wide letterspacing
- **NO serif** (photo platform = visual-first)

### Anti-patterns ห้ามทำ
- ❌ Pastel colors, gradients, drop shadows
- ❌ Emoji ใน production UI (OK ใน admin/internal)
- ❌ Bootstrap-y feel, generic SaaS look
- ❌ Cluttered grids (whitespace = premium)
- ❌ Round-y everything (corners minimal: 0 หรือ 4-6px max)
- ❌ Color tags/badges (use type-treatment instead)

---

## Functional Requirements

### Core User Roles
1. **Visitor (no auth)** — browse, view, no vote
2. **Registered user (Gmail required)** — vote (like), favorite, comment
3. **Photographer (approved)** — upload, manage own photos, see stats
4. **Ambassador (invite-only)** — pick photos (curation tier)
5. **Customer (Gography tour alumni — admin marked)** — eligible for rewards
6. **Admin** — manage everything

### Core Features

#### Photo System
- Upload (photographer only) — drag-drop, max 25MB, JPEG/PNG/WebP
- Metadata: title, camera, category (Landscape/Portrait/BW), description, EXIF auto-extract
- Display: masonry grid, infinite scroll, lightbox view
- Single photo page: full image + sidebar (photographer, EXIF, stats, comments)

#### Voting & Engagement
- **Like (❤️)** — 1 Gmail = 1 vote per photo (toggle) → feeds Pulse score
- **Favorite (🔖)** — unlimited, save to personal collection (Pinterest-like)
- **Comments** — threaded, mention support
- **Share** — copy link, social share buttons

#### Pulse Score (transparent algorithm)
```
pulse = (total_likes × 1 + likes_24h × 3 + curation_bonus) / max(hours_since_upload, 1)

curation_bonus:
  - 0 if no pick
  - 50 if editor OR ambassador pick
  - 100 if both
```
**สำคัญ:** สร้างหน้า `/about-ranking` อธิบาย formula นี้ — transparency คือ differentiator

#### Curation (3 tiers)
- **Editor's Pick** — internal admin (Gography team)
- **Ambassador Pick** — trusted external photographer (invite-only by admin)
- **Both** — highest honor (badge + bonus)

#### Customer Section + Rewards
- **Manual admin marks** user เป็น "customer" (จาก Gography trip alumni)
- **Customer-only section** บน landing page
- **Best Photo of Season** — every 4 months, admin picks per category → voucher 50K THB
- **Cashback tier** — top 10 rank gets 3-15% off next trip
- **Customer of the Month** — public feature

#### Categories (start with 3)
- Landscape
- Portrait
- Black & White (BW)

#### Moderation
- Auto-publish (no pre-approval)
- Report system (users flag → admin reviews → hide if needed)
- Admin can hide any photo

#### Photographer Onboarding
- Apply with portfolio link → admin approves → upload privileges

---

## Page List (25+ pages)

### Public (no auth needed)
1. `/` — **Landing** (Hero + Featured + Customer Section + Category teasers)
2. `/explore` — Full masonry grid + filters (category, sort, time range)
3. `/explore/:category` — Per category (landscape/portrait/bw)
4. `/photo/:id/:slug` — Single photo (lightbox + sidebar)
5. `/photographer/:username` — Profile (bio + gallery + tabs)
6. `/hall-of-fame` — Past Best Photo of Season winners
7. `/ambassadors` — Ambassador list (curators)
8. `/about-ranking` — How Pulse score works (transparency page)
9. `/about` — About Gography Photo Awards
10. `/search?q=` — Search results

### Auth flow
11. `/login` — Google OAuth (one button)
12. `/onboarding` — first-time user (set username, photographer apply?)

### User account
13. `/me` — dashboard summary
14. `/me/photos` — my uploaded photos (tabs: All / Public / Hidden)
15. `/me/favorites` — my favorited photos
16. `/me/galleries` — my galleries (curated collections)
17. `/me/stats` — analytics (likes / favorites / impressions / pulse trend)
18. `/me/settings` — profile, dark mode, email prefs, danger zone (delete account)
19. `/upload` — upload form (photographer only)
20. `/apply-photographer` — application form

### Admin (role-gated)
21. `/admin` — overview dashboard
22. `/admin/users` — list + filter regular/customer/ambassador/photographer
23. `/admin/customer-marking` — mark users as customer
24. `/admin/photographer-applications` — review pending applications
25. `/admin/reports` — moderate reported photos
26. `/admin/picks` — manage Editor's Picks
27. `/admin/ambassadors` — invite/revoke ambassadors
28. `/admin/seasons` — create season, pick Best Photo winners
29. `/admin/cashback` — track eligible users + redemptions
30. `/admin/analytics` — site-wide metrics

### Errors / States
31. `/404`, `/403`, `/500`
32. Empty states for each list (no photos uploaded, no favorites, no notifications)

---

## Reference Documents (in same folder)

Read these for detail:
1. **`design-system.md`** — tokens, typography, components, motion specs
2. **`pages-public.md`** — wireframes + states for pages 1-20
3. **`pages-admin.md`** — wireframes + logic for admin pages 21-30
4. **`user-flows.md`** — state machines for auth, upload, vote, favorite, curation
5. **`rewards-mockup.md`** — Customer Hall of Fame + cashback UI mockup
6. **`../tech/spec.md`** — DB schema + API routes + Pulse formula

---

## Constraints & Non-negotiables

### Must Have
- Mobile-first responsive (start mobile, scale up)
- Accessibility — WCAG AA minimum (contrast, keyboard nav, screen reader)
- Loading states (skeleton) สำหรับทุก async load
- Empty states + error states ที่มีคำแนะนำ (ไม่ใช่แค่ "No data")
- Premium typography (font selection สำคัญ)
- Image optimization (Next.js Image + responsive sizes)
- Dark mode pixel-perfect toggle

### Nice to Have
- Smooth scroll restoration
- Page transition animations
- Micro-interactions (heart pulse, button press)
- Keyboard shortcuts (J/K to navigate photos, L to like, F to favorite)

### Out of Scope (for MVP)
- Multi-language (Thai only ก่อน — English ภายหลัง)
- Mobile app (web responsive พอ)
- Payments (Pixels currency จาก 500px — เราไม่ทำ)
- DMs / messaging
- Stories / long-form blog (Phase 2)

---

## Tone of Voice (for copy)

- **Thai primary**, English ใช้สำหรับ technical terms (camera, EXIF, ฯลฯ)
- กระชับแต่อบอุ่น — "เลือกภาพแห่งฤดูกาล" (ไม่ใช่ "vote now!")
- หลีกเลี่ยง gamification language ("level up", "achievement unlocked") — ดู casual
- Editorial tone — "ภาพแห่งฤดูกาล Spring 2026" — เหมือน art magazine
- Error messages = ขออภัย + ระบุปัญหา + วิธีแก้

### ตัวอย่าง copy

**Hero:** "ภาพถ่ายที่เล่าเรื่อง — โดยช่างภาพและนักเดินทาง"
**Empty state (no photos):** "ยังไม่มีภาพในหมวดนี้ — เป็นคนแรกที่อัพโหลด"
**Vote tooltip:** "ลงคะแนนภาพนี้ (1 Gmail ต่อ 1 คะแนน)"
**Favorite tooltip:** "บันทึกไว้ใน My Favorites"
**Login CTA:** "เข้าสู่ระบบด้วย Gmail เพื่อโหวต"

---

## Questions to Ask Founder (ถ้ามี gap)

ใน decisions.md ของ project มี Round 2 (R1-R8) ที่ founder ยังไม่ tick — บางคำตอบส่งผลกับ design:
- R4: Favorites public หรือ private? (affects profile page design)
- R5: Profile tabs structure (3 vs 4 tabs)
- R8: Customer section content (showcase vs hall of fame vs both)

ถ้า design ของคุณต้องการ assumption — เลือกตาม recommendation ของ wiki + flag ใน design notes

---

## Success Criteria

Design ของคุณจะ "ผ่าน" ถ้า:
1. ✅ ทุก page มี wireframe + states ครบ (default/loading/empty/error)
2. ✅ Mobile + Desktop responsive ทั้งคู่
3. ✅ Pure white/black ไม่มี gray slip ใน UI
4. ✅ Typography hierarchy ชัด — premium feel
5. ✅ User flows ครบ — ไม่มี dead end
6. ✅ Component library reusable (≥15 base components)
7. ✅ Handoff-ready — dev เริ่ม build ได้เลย

---

**Start:** อ่าน `design-system.md` ก่อน → แล้ว tackle pages ตามลำดับใน list ข้างบน
**Ask questions ถ้าไม่ชัด** — better to clarify than assume
**Deliver in chunks** — ไม่ต้องรอจบทั้งหมด ส่ง draft ทีละ section ได้
