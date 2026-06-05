# UAT Report — GOGRAPHY Ranking
**วันที่ทดสอบ:** 2026-06-04  
**Branch:** `admin`  
**สภาพแวดล้อม:** Local dev server (Next.js 14, Node 23, port 3001)  
**ผู้ทดสอบ:** Claude Code (automated)

---

## สรุปผลโดยรวม

| หัวข้อ | ผล |
|---|---|
| Routes ทั้งหมด | ✅ 30/30 ผ่าน |
| Auth Guard | ✅ ทำงานถูกต้อง |
| Upload changes (toast) | ✅ ถูกต้อง |
| SEO (404 pages) | ⚠️ พบปัญหา |
| Upload redirect | ⚠️ พบปัญหา |
| Inline styles | ⚠️ พบ convention violations |

**Verdict: PASS** — ระบบทำงานได้ครบทุก route แต่มีจุดที่ควรแก้ก่อน production

---

## 1. Route Status — ผลการทดสอบทุกหน้า

### หน้า Marketing / Public
| Route | Status | ผล |
|---|---|---|
| `/` (หน้าแรก) | 200 | ✅ |
| `/about` | 200 | ✅ |
| `/about-ranking` | 200 | ✅ |
| `/ambassadors` | 200 | ✅ |
| `/for-customers` | 200 | ✅ |
| `/hall-of-fame` | 200 | ✅ |
| `/showcase` | 200 | ✅ |
| `/privacy` | 200 | ✅ |
| `/terms` | 200 | ✅ |

### หน้า Explore / Photos
| Route | Status | ผล |
|---|---|---|
| `/explore` | 200 | ✅ |
| `/explore/landscape` | 200 | ✅ |
| `/explore/portrait` | 200 | ✅ |
| `/explore/bw` | 200 | ✅ |
| `/photo/p001` | 200 | ✅ |
| `/photo/sea-of-clouds` | 200 | ✅ |

### หน้า Photographer
| Route | Status | ผล |
|---|---|---|
| `/photographers` | 200 | ✅ |
| `/photographers/all` | 200 | ✅ |
| `/photographers/ambassadors` | 200 | ✅ |
| `/photographers/voyageurs` | 200 | ✅ |
| `/photographer/kanthorn` | 200 | ✅ |

### หน้า User / Auth
| Route | Status | ผล |
|---|---|---|
| `/login` | 200 | ✅ |
| `/upload` | 200 | ✅ |
| `/search` | 200 | ✅ |
| `/apply-photographer` | 200 | ✅ |
| `/me` (ไม่ login) | 307 → `/login?next=%2Fme` | ✅ |

### หน้า Admin
| Route | Status | ผล |
|---|---|---|
| `/admin` (ไม่ login) | 307 → `/admin/login` | ✅ |
| `/admin/login` | 200 | ✅ |

### Error handling
| Route | Status | ผล |
|---|---|---|
| `/does-not-exist-at-all` | 404 | ✅ |

---

## 2. การตรวจสอบ Uncommitted Changes (Branch `admin`)

มี 3 ไฟล์ที่แก้ไขแต่ยังไม่ commit — ตรวจพบว่าทำงานถูกต้องทั้งหมด

### `src/app/upload/page.tsx`
- ✅ เพิ่ม `import { toast } from 'sonner'`
- ✅ เปลี่ยน `alert('Upload successful!')` → `toast.success('อัปโหลดสำเร็จแล้ว!')`
- ✅ เพิ่ม `router.push(profilePath)` หลัง upload สำเร็จ

### `src/components/shared/GlobalUploadModal.tsx`
- ✅ เพิ่ม `import { toast } from 'sonner'`
- ✅ เปลี่ยน `alert()` → `toast.error()` ครบ **5 จุด** (file too large, conversion failed, URL error, upload failed, DB error)
- ✅ เพิ่ม `toast.success()` หลัง upload สำเร็จ

### `src/app/auth/callback/route.ts`
- ✅ เปลี่ยน `origin` (จาก URL destructure) → `request.nextUrl.origin` — ป้องกัน edge case บางกรณีใน production

---

## 3. ปัญหาที่พบ

### 🔴 ปัญหาระดับควรแก้ก่อน production

#### P1 — `/photo/[id]` คืน HTTP 200 แม้ไม่มีรูป (ควรเป็น 404)
**Route:** `/photo/nonexistent-photo`  
**สิ่งที่เกิด:** หน้าแสดง "Photo Not Found" แต่ HTTP status เป็น **200**  
**ผลกระทบ:** Google จะ index หน้า error ราวกับว่ามี content จริง ทำให้เกิด SEO duplicate/ghost pages  
**สาเหตุ:** หน้านี้เป็น `'use client'` component ใช้ `notFound()` แบบ client-side ซึ่งไม่ส่ง 404 header  
**วิธีแก้:** แยก data fetching ออกเป็น Server Component หรือ redirect ด้วย `generateMetadata` ที่ฝั่ง server

#### P2 — `/photographer/[username]` คืน HTTP 200 แม้ไม่มีช่างภาพ (ควรเป็น 404)
**Route:** `/photographer/does-not-exist`  
**สิ่งที่เกิด:** หน้าแสดง "Photographer Not Found" แต่ HTTP status เป็น **200**  
**ผลกระทบ:** เช่นเดียวกับ P1 — SEO  
**วิธีแก้:** เช่นเดียวกับ P1

---

### 🟡 ปัญหาระดับควรแก้ในรอบถัดไป

#### P3 — Upload redirect ไปหน้าช่างภาพ Mock ไม่ใช่โปรไฟล์จริง
**ไฟล์:** `src/app/upload/page.tsx:309`  
**โค้ดปัจจุบัน:**
```js
const profilePath = '/photographer/' + (userState === 'customer' ? 'pim.travels' : 'kanthorn');
```
**สิ่งที่เกิด:** หลัง upload สำเร็จ ระบบ redirect ไปหน้าของ `kanthorn` หรือ `pim.travels` (mock data) ไม่ใช่โปรไฟล์จริงของ user ที่ login  
**วิธีแก้:** ใช้ `authUser?.user_metadata?.username` หรือ query จาก Supabase

#### P4 — `const profilePath` ถูก reference ก่อน declare ในโค้ด
**ไฟล์:** `src/app/upload/page.tsx` บรรทัด 306 vs 309  
**สิ่งที่เกิด:** `router.push(profilePath)` อยู่บรรทัด 306, `const profilePath = ...` อยู่บรรทัด 309  
**ผลกระทบ:** ทำงานได้จริงเพราะ JavaScript closure แต่ทำให้โค้ดอ่านยากและสับสน  
**วิธีแก้:** ย้าย `profilePath` ขึ้นมาก่อน `handleSubmit`

#### P5 — Static inline styles ไม่ตาม Convention
พบใน 2 ไฟล์:

| ไฟล์ | โค้ด | ควรเปลี่ยนเป็น |
|---|---|---|
| `src/app/explore/page.tsx:175` | `style={{ height: '42vh', minHeight: 340, maxHeight: 520 }}` | `className="h-[42vh] min-h-[340px] max-h-[520px]"` |
| `src/app/(marketing)/about/page.tsx:42,51,59` | `style={{ fontFamily: 'var(--serif)' }}` | `className="font-serif"` (เพิ่ม token ใน tailwind.config) |

---

## 4. จุดที่ตรวจแล้วไม่พบปัญหา

- ✅ **Auth guard** `/me` redirect ไป `/login?next=%2Fme` ถูกต้อง ครบ
- ✅ **Auth guard** `/admin` redirect ไป `/admin/login` ถูกต้อง ครบ
- ✅ **Category explore links** — SideMenu, Footer, CategoryChips ทุกที่ใช้ lowercase (`/explore/landscape`) ถูกต้อง ไม่มีลิงก์ uppercase ที่จะ 404
- ✅ **404 page** — route ที่ไม่มีอยู่จริง (`/does-not-exist-at-all`) คืน 404 ถูกต้อง
- ✅ **Toast import** — `sonner` import ถูกต้องทั้ง 2 ไฟล์ที่แก้ไข
- ✅ **Explore tabs** — `router.push(t.id ? /explore/${t.id} : '/explore')` ใช้ lowercase เสมอ ไม่ 404

---

## 5. สรุปสิ่งที่ต้องทำ

| ลำดับ | งาน | ความเร่งด่วน |
|---|---|---|
| 1 | Commit uncommitted changes (3 ไฟล์) | ทำได้เลย |
| 2 | แก้ `/photo/[id]` และ `/photographer/[username]` ให้คืน HTTP 404 จริง | ก่อน production |
| 3 | แก้ `profilePath` ใน upload page ให้ใช้ข้อมูล user จริง | รอบถัดไป |
| 4 | แก้ static inline styles ใน explore และ about | รอบถัดไป |

---

*รายงานนี้ generated โดย Claude Code — 2026-06-04*
