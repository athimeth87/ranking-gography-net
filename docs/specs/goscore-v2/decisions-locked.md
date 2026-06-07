---
title: GoScore v2 — Locked Decisions Log
type: decision-log
parent: README.md
created: 2026-05-26
updated: 2026-05-26
tags: [decisions, ranking, scoring, locked]
status: spec-locked
session_context: deep-dive ผ่าน Claude — 5 rounds of clarifying questions
---

# GoScore v2 — Locked Decisions Log

> สรุป **8 decisions** ที่ lock ใน session design exploration วันที่ 2026-05-26
> Decisions เหล่านี้กำหนดทิศทาง [goscore-v2-design-doc.md](goscore-v2-design-doc.md)
> ถ้าจะ revisit ใด ๆ ให้ update ไฟล์นี้ + design doc พร้อมกัน

---

## D1 — Compute Model: **Hybrid**

**Locked value:** Real-time recompute เมื่อรูปอายุ ≤48h, cron 1 ชม. เมื่อรูปอายุ >48h

**Rationale:**
- รูปใหม่ (window สำคัญ) ต้องการ score real-time → user เห็นผลทันทีเมื่อ like
- รูปเก่า — recompute ทุก like สิ้นเปลือง แต่ score ก็เปลี่ยนน้อย → batch ได้

**Alternatives considered:**
- On-the-fly แบบ 500px — แม่นยำสุด แต่ DB load สูงตลอดเวลา
- Cron-only — query เร็ว แต่ user เห็น lag, UX แย่

**Implementation impact:**
- ต้องมี flag `needs_recompute` ใน photos table
- ต้อง cron `recompute_stale_photos` ทุก 1 ชม.
- Real-time path ต้องการ p95 latency <150ms

---

## D2 — Algorithm Transparency: **Layered**

**Locked value:** เปิด input (likes count, role distribution, decay %), ปิด weight formula (multipliers, voter_reputation, anti-collusion)

**Rationale:**
- "Trust ก่อน Growth" — user ต้องเชื่อว่าระบบยุติธรรม → ต้องเห็น input
- แต่ถ้าเปิดสูตรเต็ม → คน optimize ระบบ → hook #7 (hidden algorithm) หาย, anti-abuse เปราะ
- Gography ต่างจาก 500px ตรงที่ user trust = priority, ไม่ใช่ pure engagement

**Alternatives considered:**
- Full opaque (500px-style) — trust ต่ำกว่าที่ Gography ต้องการ
- Full transparent — ถูก game ทันที, ทำลาย anti-collusion

**Implementation impact:**
- Pulse breakdown modal (§5.2 ของ design doc) — UI ใหม่ที่ต้อง build
- API endpoint `/api/photos/:id?include=breakdown` ส่งเฉพาะ aggregated input
- ห้าม leak weight_components field ใน likes table ทาง API public

---

## D3 — Voter Weight Scale: **Conservative**

**Locked value:** Ambassador ×3 / Voyageur ×2 / Rank Master ×1.5 / User ×1

**Rationale:**
- Trust > Merit > Base — Ambassador/Voyageur มาจาก trust source, ต้องสูงกว่า Rank Master ที่ earn ผ่าน performance
- Voyageur (×2) > Rank Master (×1.5) — เพราะ "ลูกค้าจริง" = trust signal ที่เงินซื้อไม่ได้, ตรง mindset "Trust ก่อน Growth"
- Ambassador (×3) — ระดับสูงสุด, Gography editorial trust
- Conservative scale — ผสมผสาน trust กับ volume → User vote ปกติยังมีความหมาย

**Alternatives considered:**
- Aggressive (×4/×2.5/×2/×1) — special vote ทรงพลังมาก แต่รูปขึ้น Popular ยากถ้าไม่มี special voter
- Swap Voyageur ↔ Rank Master — ถ้าให้ merit > trust แต่ไม่ตรง mindset ของ founder

**Example calculation:**
- รูป A: 1 Ambassador + 1 Voyageur + 1 RM + 5 User = 3+2+1.5+5 = **11.5**
- รูป B: 12 User = **12**
- → รูป B ชนะเล็กน้อย — special vote มีค่ามาก แต่ไม่ dominate

**Implementation impact:**
- Hard-coded ใน `ROLE_MULT` dict
- Audit log ทุก like ต้องเก็บ `weight_components` JSONB

---

## D4 — Voyageur Boost Magnitude: **×1.5 (→ aligned to ×2 in D3)**

**Note:** ในการ discuss แรก ผมเสนอ Voyageur ×1.5 แต่หลังจาก introduce Rank Master tier ใหม่ใน D3 → ปรับเป็น **×2** เพื่อให้ trust hierarchy ชัด: User(1) < RM(1.5) < Voyageur(2) < Ambassador(3)

**Final lock:** Voyageur weight = ×2.0

---

## D5 — Photo Tier Structure: **Fresh / Popular (เหลือ 2 tier)**

**Locked value:** ตัดออกจาก 4-tier เดิมที่เสนอ (Seed/Rising/Featured/Hall) → เหลือแค่ Fresh / Popular ตามที่เว็บจริงมีอยู่แล้ว

**Rationale:**
- User clarification: เว็บปัจจุบันมีแค่ 2 tier — Fresh + Popular
- Simpler than 500px (4 tier) → ลด complexity ของ UI
- Threshold ที่ 70 ยังคงเป็น snowball trigger หลัก

**Alternatives considered:**
- 4-tier (Seed/Rising/Featured/Hall) — granular มาก, ทุก threshold มี exposure boost
- 3-tier (Fresh/Rising/Popular) — กลางๆ

**Implementation impact:**
- ENUM `photo_tier` มีแค่ 3 ค่า: `pending`, `fresh`, `popular`
- Snowball event มีแค่ 1 transition: Fresh → Popular ที่ score 70

---

## D6 — Rank Master Qualification: **Top 3 Photographer Leaderboard × 3 weeks consecutive**

**Locked value:**
- "Top 3" = อันดับ 1-3 ของ **photographer leaderboard ของสัปดาห์** (ไม่ใช่รูปเดี่ยว)
- คำนวณจาก `SUM(peak_goscore)` ของรูปทุกใบของ user ในสัปดาห์นั้น
- ต้องติด 3 weeks **ติดต่อกัน** (consecutive)

**Rationale:**
- Photographer ranking สะท้อนความสม่ำเสมอ ไม่ใช่ลูคูเดียว
- ถ้าใช้รูปเดียว → ขอแค่ 1 รูปดัง 3 สัปดาห์ติด — แต่รูปนั้น decay → impossible
- Consecutive (ไม่ใช่ "3 weeks ใน 6 weeks") = active commitment

**Alternatives considered:**
- Single-photo top 3 — ไม่ practical เพราะ decay
- Top 3 ของ Popular feed (snapshot) — มี volatility สูง

**Implementation impact:**
- ต้องการ table `weekly_top3` (immutable history)
- Cron Sunday 23:59 UTC คำนวณ + insert
- Promotion logic ต้อง verify consecutive (ดู `is_consecutive_weeks()` ใน design doc)

---

## D7 — Rank Master Tenure: **Seasonal + 1 grace season**

**Locked value:** RM ที่ qualify ใน season X → มีสิทธิ์ใช้ตลอด season X + season X+1, จากนั้น demote

**Rationale:**
- Rotation พอดี — ต้อง active ต่อเนื่อง ไม่ใช่ "earn ครั้งเดียวใช้ตลอดชีวิต"
- Grace season ให้เวลา RM ได้ใช้สิทธิ์อย่างมีความหมาย ก่อนต้อง re-earn

**Alternatives considered:**
- Lifetime — sticky แต่ RM pool inflation, ลด value ของ tier
- Rolling 90 days — strict, แต่ tracking ยากกว่า + บางคน earn → ทำงานหนัก แล้ว 90 วันหาย

**Implementation impact:**
- Table `rank_master_status` มี field `active_until_season_id`
- Cron `expire_lapsed_rank_masters` รัน daily 00:05 UTC
- Demote: `role → 'user'`, set `is_active = FALSE`, `demote_reason = 'grace_season_ended'`

---

## D8 — Decay Strategy: **Gentler (floor 70%)**

**Locked value:**
```
0 – 48h     → 1.00
48h – 7d    → 1.00 → 0.92
7d – 30d    → 0.92 → 0.80
30d+        → 0.80 → floor 0.70
```

**Rationale:**
- Gography = premium = slow craft — ไม่ใช่ mass daily churn แบบ 500px
- รูปคุณภาพสูงที่ slow-burn (เช่น cinematic landscape ที่ใช้เวลา edit) ยังมี chance เข้า Popular ภายใน 7 วันแรก
- Floor 70% — รูปเก่ายังคงมี "dignity" → ไม่ทำให้ photographer demotivate

**Alternatives considered:**
- Hard cutoff (500px-style: -10/24h, decay ต่อเนื่อง) — ตรง Pulse แต่ทำลาย slow-burn photographer
- Second-wind window — รูป boost ได้ 7 วัน — complexity เพิ่มแต่ benefit ไม่ชัด

**Implementation impact:**
- `decay_curve()` function (§4.2.4 ของ design doc)
- รูปเก่า 1 ปี ยังคงคะแนน 70% ของ peak — ไม่ลดเป็น 0

---

## Decisions ที่ยังไม่ lock (Open)

| # | Question | สถานะ |
|---|----------|------|
| O1 | Comments นับเข้า GoScore ไหม? | Deferred to v3 |
| O2 | Slow-burn rule สำหรับรูปเก่าที่กลับมาดัง? | Open |
| O3 | Cross-tier value: Popular photos → Gography main site auto? | Marketing decision |
| O4 | Voter reputation visible to self only? | Open (risk of optimization) |
| ~~O5~~ | ~~Curation pick (Editor/Ambassador/Both) + GoScore: integration model?~~ | ✅ **Resolved 2026-05-26 — see D9** |

---

## D9 — Curation × GoScore Integration: **Direct Points** (resolved 2026-05-26)

**Locked value:** เก็บ `pick_type` ENUM ('none'/'editor'/'ambassador'/'both') ของ baseline ไว้ + บวกเป็น `photos.curation_bonus` field ของ GoScore โดยตรง

**Mapping:**
- `pick_type = 'none'` → `curation_bonus = 0`
- `pick_type = 'editor'` → `curation_bonus = 50`
- `pick_type = 'ambassador'` → `curation_bonus = 50`
- `pick_type = 'both'` → `curation_bonus = 100`

**Rationale:**
- Simple, transparent — เหมือนสูตรเดิม (consistent with public expectation)
- ไม่งัด UI เดิม — Editor/Ambassador pick action ทำงานเหมือนเดิม
- Curation_bonus เป็น direct addition ใน GoScore formula → ใช้สร้าง snowball ให้รูป quality

**Alternatives rejected:**
- Editor pick = bypass tier (Editor's Choice parallel track) — ทำได้ในอนาคต (Future O3) แต่ตอนนี้ keep simple
- Boost weight ของ voter ที่มาหลัง pick — complex, harder to debug

**Implementation impact:**
- Trigger on `INSERT/DELETE` ของ `editor_picks`/`ambassador_picks` → recalc `photos.pick_type` + `photos.curation_bonus` + `photos.needs_recompute = true`
- Migration: backfill `photos.curation_bonus` จาก existing `pick_type` values

---

## D10 — Voyageur Assignment: **Auto-sync จาก Gography booking DB** (resolved 2026-05-26 rev 2)

**Locked value:** `users.is_customer` set โดย cron sync จาก Gography Dashboard booking DB (เปลี่ยนจาก vault canon เดิมที่เป็น admin manual flag)

**Mapping:**
- `booking_status = 'completed'` + `tier IN ('gography_premium', 'gography_expedition')` + `refund_status != 'refunded'` + completed ใน 24 เดือน → `is_customer = TRUE`, `role = 'voyageur'`
- Refund webhook → if no other active bookings → revoke
- Weekly cron — expire 24-month inactive

**Rationale:**
- "Trust ก่อน Growth" — Voyageur ต้อง verifiable จากของจริง ไม่ใช่ admin discretion
- ลดภาระ founder — admin ไม่ต้องคอย mark ลูกค้าทุกคน
- Premium tier filter (Gography only, ไม่นับ LensVoyage) — Voyageur เป็น **premium customer signal** เท่านั้น

**Admin override:** PATCH endpoint ยังเซ็ต `is_customer` ตรงได้ สำหรับเคสจองนอก booking system

**Implementation impact:**
- Cron `sync_voyageur_status` ทุก 30 นาที (§4.6.1 ของ design doc)
- Webhook handler `revoke_voyageur_on_refund` (Gography Dashboard ฝั่ง booking ต้องส่ง webhook)
- Cron `expire_inactive_voyageurs` รัน weekly
- Schema: `users` table เพิ่ม `is_customer` + `is_ambassador` boolean (§4.6.4)

**Supersedes:** vault canon เดิมใน LOGIC.md:189–195 ที่ระบุ `is_customer=true (admin marks)`

---

## D11 — Ambassador Assignment: **Admin manual flag (vault canon retained)**

**Locked value:** `users.is_ambassador = TRUE` ตั้งโดย admin ตรงๆ — ไม่มี email invite, pending state, หรือ expiry

**Rationale:**
- Ambassador = high-trust role (×3 weight + curation power) → ต้อง admin verify ก่อน, ไม่ใช่ self-service
- Simpler than email invite flow — ลด surface ของ bug + ลด state management

**Revoke:** Admin set `is_ambassador = FALSE` → role restored to `'voyageur'` (ถ้า `is_customer = TRUE`) else `'user'`

**Implementation impact:**
- `set_ambassador()` / `revoke_ambassador()` functions (§4.6.2)
- ทุก promote/demote → INSERT ลง `role_audit_log` table
- **ไม่มี** `ambassador_invites` table (เคยถูก draft แต่ลบทิ้ง)

---

## Revision History

| Date | Change | By |
|------|--------|-----|
| 2026-05-26 | Initial lock (8 decisions) จาก Claude design session | Founder + Claude |
| 2026-05-26 | Resolved O5 → D9 (Direct Points) + integrated GoScore v2 into LOGIC.md + tech/spec.md | Founder + Claude |
| 2026-05-26 (rev 2) | Implementation-ready audit: +D10 (Voyageur auto-sync), +D11 (Ambassador admin flag) + 13 bug fixes synced ใน design doc | Founder + Claude |

---

## เชื่อมโยง

- Folder index: [README.md](README.md)
- Full design doc: [goscore-v2-design-doc.md](goscore-v2-design-doc.md)
- Source material: [500px-pulse-source.md](500px-pulse-source.md)
- Existing project decisions: [../decisions.md](../decisions.md) (different scope — covers domain, stack, name)
