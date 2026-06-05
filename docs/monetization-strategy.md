# GOGRAPHY Ranking — Monetization Strategy

> วิเคราะห์จากโครงสร้างโปรเจคจริง (ranking.gography.net)  
> อัปเดต: 2026-06-04

---

## ภาพรวม: เว็บนี้คืออะไรจริงๆ

`ranking.gography.net` ไม่ใช่แค่เว็บโชว์รูป —  
มันคือ **community showcase สำหรับลูกค้าที่ซื้อทริปกับ GOGRAPHY**

ระบบที่มีอยู่แล้วในโค้ด:
- **Voyageur** = ลูกค้าที่ซื้อทริป (มีข้อมูล `tripContext` ในรูป เช่น Patagonia 2025, Atacama 2025, Iceland 2024)
- **Ambassador** = ช่างภาพระดับ brand face ของ GOGRAPHY
- **Seasons** = รอบการแข่งขัน มีผู้ชนะ มีรางวัล voucher
- **Whitelist** = admin approve ว่าใครเป็น Voyageur / Photographer ได้

ดังนั้น ranking ทำหน้าที่เป็น **top-of-funnel** สำหรับธุรกิจทริปของ GOGRAPHY อยู่แล้ว

---

## โมเดลทำเงิน — 3 ระดับ

---

### ระดับ 1 — ทำได้เร็ว (ไม่ต้องพัฒนาระบบใหม่มาก)

#### 1A. Voyageur Membership Fee
ระบบ whitelist + role มีแล้ว เพียงแต่ยังไม่มี payment gate

| รายการ | รายละเอียด |
|---|---|
| ราคาแนะนำ | 990–1,990 บาท/ปี |
| สิทธิ์ที่ได้ | ส่งภาพเข้าหมวด Voyageur, ลุ้นรางวัล 50,000 บาท, ป้าย Voyageur บนโปรไฟล์ |
| สิ่งที่ต้องสร้าง | ระบบ payment (Stripe / Omise), หน้า pricing, เปลี่ยน whitelist เป็น self-service |

**ทำไมถึงได้ผล:** คนที่ซื้อทริปกับ GOGRAPHY มีกำลังซื้อสูงอยู่แล้ว ค่าสมาชิกปีละ ~1,500 บาทไม่ใช่อุปสรรค

---

#### 1B. Verified Photographer Badge
หน้า `/apply-photographer` มีอยู่แล้ว แต่ยังไม่มี monetize

| รายการ | รายละเอียด |
|---|---|
| ราคาแนะนำ | 490–990 บาท/ปี |
| สิทธิ์ที่ได้ | Verified badge, แสดงบน Featured Photographers, analytics รูปตัวเอง |
| สิ่งที่ต้องสร้าง | payment + analytics dashboard |

---

### ระดับ 2 — ต้องพัฒนาเพิ่ม (1–3 เดือน)

#### 2A. Season Sponsorship (B2B)
แบรนด์กล้อง / travel brand จ่ายเพื่อ sponsor Season หนึ่งๆ

| รายการ | รายละเอียด |
|---|---|
| ราคาแนะนำ | 30,000–100,000 บาท/Season |
| สิ่งที่ได้ | โลโก้บน Hall of Fame, banner ใน Season page, mention ใน email ถึง community |
| กลุ่มเป้าหมาย | Sony Thailand, Canon Thailand, Fujifilm, สายการบิน, โรงแรม |
| สิ่งที่ต้องสร้าง | Sponsor slot ใน Hall of Fame UI, admin ที่ set sponsor ได้ |

**ทำไมถึงได้ผล:** Hall of Fame อยู่บนเว็บถาวร — แบรนด์ได้ exposure ระยะยาว ไม่ใช่แค่โฆษณา

---

#### 2B. Print & License Sales
รูปที่ติดอันดับ Top มีมูลค่าทางการตลาด

| ช่องทาง | รายละเอียด |
|---|---|
| Fine Art Print | พิมพ์อลูมิเนียม / Acrylic ราคา 3,000–15,000 บาท แบ่งกับช่างภาพ 60/40 |
| License | แบรนด์ขอใช้รูปสำหรับ campaign — GOGRAPHY เป็นตัวกลาง รับ commission |
| สิ่งที่ต้องสร้าง | ปุ่ม "Buy Print / License this photo" บนหน้า photo detail |

---

#### 2C. Voyageur Trip → Ranking Funnel
เปลี่ยน `/for-customers` ให้เป็น landing page ที่ขายทริปได้จริง

ปัจจุบัน `/for-customers` อธิบาย Voyageur tier แต่ยังไม่มี CTA ที่ link ไปหน้าซื้อทริปจริง

สิ่งที่ต้องสร้าง:
- เพิ่ม section "ทริปที่กำลังเปิดรับ" พร้อมราคาและปุ่ม register interest
- embed รูป Voyageur photos จากทริปที่ผ่านมาเป็น social proof
- tracking: คนดูรูป Voyageur → คลิก "ร่วมทริปนี้" → lead

---

### ระดับ 3 — ระยะยาว (3–12 เดือน)

#### 3A. Workshop & Masterclass
ช่างภาพระดับ Ambassador (มีอยู่ในระบบแล้ว) สอน online course

| รายการ | รายละเอียด |
|---|---|
| ราคา | 1,500–4,900 บาท/course |
| platform | embed video บนเว็บ หรือ redirect ไป Teachable / Luma |
| revenue split | GOGRAPHY 30%, ช่างภาพ 70% |

#### 3B. Brand Campaign ผ่าน Community
เว็บมี community ของช่างภาพและนักเดินทางที่มีกำลังซื้อสูง — แบรนด์จ่ายสำหรับ:
- Sponsored challenge ("ถ่ายภาพกับ Sony FX3 และลุ้น...")
- Featured placement ใน Marquee / HeroSection
- Newsletter shoutout (ถ้ามี email list)

---

## สรุป Priority

| ลำดับ | งาน | เวลาโดยประมาณ | รายได้ที่คาด |
|---|---|---|---|
| 1 | เพิ่ม payment สำหรับ Voyageur membership | 2–4 สัปดาห์ | recurring ปีละ X × จำนวนสมาชิก |
| 2 | เปลี่ยน `/for-customers` เป็น trip sales funnel | 1–2 สัปดาห์ | เพิ่ม conversion จาก traffic ที่มีอยู่ |
| 3 | Season Sponsorship package | 1 สัปดาห์ (UI) + sales effort | 30K–100K บาท/Season |
| 4 | Print / License marketplace | 1–2 เดือน | ขึ้นกับ volume |

---

## สิ่งที่ต้องตัดสินใจก่อนเริ่ม

1. **Payment provider** — Stripe (ง่าย แต่ค่าธรรมเนียมสูงกว่า) หรือ Omise/2C2P (ไทยมากกว่า, รองรับ PromptPay)
2. **Voyageur membership ราคาเท่าไหร่?** — ต้องไม่แพงกว่าทริปซึ่งหลักหมื่น แต่ต้องรู้สึก "worth it"
3. **ใครเป็นคนขายทริป?** — เว็บนี้จะ integrate กับ booking system ของ GOGRAPHY หลัก หรือแค่ส่ง lead?

---

*เอกสารนี้ถูก generate จากการวิเคราะห์ codebase โดย Claude Code — 2026-06-04*
