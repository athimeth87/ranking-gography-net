---
title: 500px Pulse — Deep Logic Analysis (Source Material)
type: research-source
parent: README.md
created: 2026-05-26
updated: 2026-05-26
tags: [500px, pulse, ranking-algorithm, source-material, reference]
status: reference (immutable analysis)
source_url_origin: /Users/athimethlerdkitveruj/Downloads/500px_pulse_logic.md
---

# แกะ Logic การให้คะแนน (Pulse) ของ 500px

> เอกสาร research ที่รวบรวมจาก 500px Support, GitHub API docs (legacy), และงานวิเคราะห์เชิงสถิติของ community ที่ดึงข้อมูลจริงผ่าน API
> อัลกอริทึมเต็มเป็น **trade secret** 500px ไม่ได้เปิดเผย — แต่ปัจจัยและพฤติกรรมที่สังเกตได้รวบรวมไว้ด้านล่าง
>
> ใช้เป็น reference สำหรับ design [GoScore v2](goscore-v2-design-doc.md) ของ Gography Photo Awards

---

## 1. Pulse คืออะไร

Pulse คือคะแนน 0–100 ที่ 500px ใช้วัด "ความนิยม" ของรูปแต่ละใบ ไม่ใช่คะแนนคุณภาพภาพ ระบบนี้ออกแบบมาเพื่อ promote การมองเห็นใหม่ ๆ รายวัน ดังนั้นมันคือ **engagement × exposure × ความสด** มากกว่าจะเป็นคำพิพากษาด้านศิลปะ

- รูปที่เพิ่ง upload จะมี Pulse = N/A หรือ 0
- เมื่อมีคน Like จะค่อย ๆ ขึ้น
- 500px เก็บค่า `highest_rating` (Pulse สูงสุดที่เคยทำได้) ไว้ถาวร แม้คะแนนปัจจุบันจะตกลงแล้ว

## 2. Input ของอัลกอริทึม (เท่าที่ 500px ยอมเปิด)

จากศูนย์ช่วยเหลือทางการ Pulse ถูกคำนวณจาก **Views + Likes** เป็นหลัก แต่รายละเอียดอื่นทั้งหมดถูกซ่อนไว้เพื่อกัน abuse

แต่จากการสังเกตของ community และคำใบ้ของ 500px เอง ปัจจัยอื่นที่มีผลแน่ ๆ ประกอบด้วย

- **น้ำหนักของแต่ละ vote ไม่เท่ากัน** — vote หนึ่งครั้งของ user แต่ละคนถูกให้ค่า "เฉพาะตัว" ตามกิจกรรมของผู้โหวตและของช่างภาพเจ้าของรูป
- **ความสัมพันธ์ผู้โหวต ↔ ช่างภาพ** — มีหลักฐานว่า vote จาก follower ของคุณเองมีน้ำหนัก *น้อยกว่า* คนที่ไม่ใช่ follower และถ้าคุณโหวตให้คนอื่นแล้วเขาโหวตคืน (reciprocal vote) ค่าของ vote นั้นจะถูกลดทอนเช่นกัน นี่คือกลไกกันการ "ตีไก่" ในวงแลกโหวต
- **ความสดของรูป (recency)** — เป็นปัจจัยใหญ่ ที่จะอธิบายต่อในข้อ 4
- **Metadata ขั้นต่ำ** — รูปจะถูกจัดเข้า Fresh ก็ต่อเมื่อมี title, category, และอย่างน้อย 3 tags ถ้าไม่มีแม้แต่จะมี Like ก็ไม่เข้าสาย exposure

## 3. Threshold ของหน้า Feed

500px แบ่งหน้า feed สามชั้นที่ผูกกับ Pulse ตรง ๆ

| หน้า | เงื่อนไข Pulse | บทบาท |
|------|--------------|------|
| **Fresh** | ทุกรูปที่ผ่าน metadata ขั้นต่ำ | จุดเริ่มต้นของทุกใบ |
| **Upcoming** | Pulse > 70 | exposure ก้าวกระโดด รูปเริ่มถูกเห็นโดย user ที่ไม่ใช่ follower |
| **Popular** | Pulse > 80 | หน้าที่ traffic หนาที่สุด เป็นเป้าหมายของช่างภาพส่วนใหญ่ |
| **Editors' Choice** | ทีม editorial คัดด้วยมือ | bypass อัลกอริทึมทั้งหมด, ขึ้น ribbon บนรูป |

ที่สำคัญคือ threshold ทั้งสองนี้ไม่ใช่แค่ "ขีดแบ่งเพื่อโชว์" — มันเป็น **positive-feedback gate**: พอข้ามได้ exposure เพิ่ม → like เพิ่ม → Pulse เพิ่มอีก เกิด snowball

## 4. Pulse Decay (กลไกบังคับ "หมุนของใหม่")

500px ตั้งใจให้รูปใหม่มีโอกาสขึ้น Popular ทุกวัน จึงใช้ time decay บังคับให้รูปเก่าตกลง

- หลัง upload ~24 ชั่วโมง: Pulse ลดประมาณ 10 คะแนน
- หลัง ~1 สัปดาห์: ลดอีกระลอกหนึ่ง
- จากนั้นค่อย ๆ ตกต่อเนื่อง

ผลรวม: รูปแทบทุกใบจะแตะ "max pulse" ภายใน 24 ชั่วโมงแรก หลังจากนั้นเป็นขาลง นี่คือเหตุผลที่ช่างภาพให้ความสำคัญกับการ "เลือกเวลา upload" ให้ตรงกับชั่วโมงที่ฐาน user (อเมริกาเหนือ + ยุโรปเป็นหลัก) active ที่สุด

## 5. หลักฐานเชิงสถิติ — รูปร่างจริงของ Distribution

ผู้ใช้ Mike Creeth (2014) ดึงข้อมูล ~28,000 รูปจาก feed `fresh_yesterday` ผ่าน 500px API แล้ววิเคราะห์ด้วย R พบว่า

- Median Pulse ของรูปที่ upload วันเดียว ≈ **60**
- รูปประมาณ **31%** ทำคะแนนถึง 80+ และเข้า Popular
- Distribution เป็น **bimodal** ชัดเจน: รูปต่ำกว่า 70 กับรูปสูงกว่า 70 มีพฤติกรรมต่างกันคนละโลก
- ช่วง Pulse 70–79 มีรูป **น้อยมาก** — เพราะพอข้าม 70 ปุ๊บ ระบบดันขึ้นหน้า Upcoming ทันที, exposure พุ่ง, แล้วก็ไหลไป 80+ ภายในไม่นาน
- vote แรก ๆ ที่เข้ามาตอนรูปยังคะแนนต่ำ ให้ผลกระโดดเยอะ (สมัย 2014 vote แรก ≈ +20.7, สมัย 2015 ≈ +12.9) ส่วน vote ที่เข้ามาตอนรูปคะแนนสูงแล้ว ให้ผลเป็นเศษส่วนของจุด

นั่นแปลว่า curve ของ Pulse vs จำนวน Like มีลักษณะ **logarithmic / diminishing return** — ผ่านยากตอนช่วงต้น, เร็วช่วงกลาง (พอ exposure เปิด), แล้วช้าอีกครั้งช่วงปลาย

## 6. ทำไมคำนวณ Pulse ของรูปตัวเองไม่ได้

500px ระบุชัดในศูนย์ช่วยเหลือว่า "เป็นไปไม่ได้ที่จะคำนวณ Pulse ของคุณเอง" เหตุผลเชิงเทคนิคที่ทำให้สูตรไม่ stable คือ

1. **น้ำหนัก vote = ฟังก์ชันของผู้โหวต ณ ตอนนั้น** — ค่าของ user A vote ให้คุณวันนี้กับเดือนหน้าไม่เท่ากัน
2. **อัลกอริทึมถูก rewrite อย่างน้อยหนึ่งครั้ง (Pulse 2.0)** และมีการปรับอย่างต่อเนื่อง
3. **มี signal ที่เราเข้าถึงไม่ได้** — engagement velocity, suspicious-vote detection, anti-collusion ฯลฯ
4. **มี time-dependent term** — ลด 10 จุดหลัง 24 ชม. แล้วลดอีก ไม่ใช่ค่าคงที่

## 7. มุม API (สำหรับสาย dev)

500px เคยมี public API (ตอนนี้เป็น *legacy* แล้ว, repo: `500px/legacy-api-documentation` บน GitHub) ที่เปิดให้ดึง metadata ของรูปได้แต่ไม่ให้ upload ฟิลด์ที่เกี่ยวกับ Pulse ที่ดึงได้คือ

- `rating` — Pulse ปัจจุบัน
- `highest_rating` — Pulse สูงสุดที่รูปเคยทำได้
- `highest_rating_date` — เวลาทำ peak
- `times_viewed`, `votes_count`, `favorites_count` — ตัวเลขดิบที่ป้อนเข้าอัลกอริทึม

จุดสังเกต: ความที่ 500px เก็บทั้ง "ค่าปัจจุบัน" + "ค่า peak" + "เวลา peak" บ่งบอกว่า Pulse ปัจจุบันถูกคำนวณ on-the-fly ผ่าน decay function จากเวลา peak ไม่ใช่เก็บค่าเดียวแล้วลดทีละนิด

## 8. สรุปเป็นโมเดล (Mental Model)

ถ้าจะ reverse-engineer เป็นสมการคร่าว ๆ (ระดับสมมติฐาน ไม่ใช่สูตรจริง):

```
Pulse(t) = f( Σ w_i · vote_i ,  Σ view_j ,  engagement_velocity ) · decay(t - t_upload)

w_i = g( voter_activity_i, photographer_activity, relationship(voter_i, photographer), anti_collusion_signals )

decay(Δt):
    Δt ≤ 24h    → ≈ 1.0
    24h < Δt ≤ 1week → ≈ 0.9 (ลดประมาณ 10 จุด)
    Δt > 1week  → ลดต่อเป็น curve
```

**กุญแจที่ทำให้คำนวณตามไม่ได้:** `w_i` และ `anti_collusion_signals` ซึ่ง 500px ปรับและคำนวณจาก state ทั้งระบบในเวลานั้น

## 9. Implication เชิงปฏิบัติ (ถ้าจะใช้กับการเล่นจริง)

- Pulse ไม่ใช่คะแนนคุณภาพ — เป็น engagement × exposure × ความสด
- เวลา upload สำคัญที่สุด เพราะ window 24 ชั่วโมงแรกตัดสินเกือบทุกอย่าง
- ตั้งเป้าผ่าน 70 ก่อน 24 ชั่วโมง — เพราะหลังจากนั้น decay เริ่มทำงาน และโอกาสเข้า Upcoming ลดลง
- กลุ่ม "แลกโหวต" ได้ผลน้อยลงเรื่อย ๆ เพราะระบบลดน้ำหนัก vote ที่ reciprocal
- Editors' Choice เป็น track คู่ขนาน — ไม่ขึ้นกับ Pulse เลย, แต่อิงคนจริง
- รูปต้องมี title + category + ≥ 3 tags ไม่งั้นไม่เข้าระบบตั้งแต่ต้น

---

## 7 Psychological Hooks ที่ทำให้ Pulse เสพติด (synthesis ของผม)

| # | Hook | กลไก | ผลต่อพฤติกรรม |
|---|------|------|----------------|
| 1 | **Time-decay** (loss aversion) | ลด ~10 จุด หลัง 24 ชม. | บังคับให้ "เลือกเวลา upload" + เช็คคะแนนใน 24 ชม. แรก |
| 2 | **Threshold gating** (70 → 80) | ข้ามแล้ว exposure ก้าวกระโดด | สร้าง moment "ใกล้ทะลุ" → คนเช็คซ้ำๆ |
| 3 | **Snowball effect** | ผ่าน 70 → exposure ↑ → like ↑ → คะแนน ↑ | dopamine spike แบบ unpredictable reward |
| 4 | **Diminishing return** | vote แรก +20.7 / vote ปลาย +0.X | แต่ละ like ไม่เท่ากัน → คนคำนวณ timing |
| 5 | **Peak score ถาวร** (`highest_rating`) | เก็บคะแนนสูงสุดที่เคยทำได้ | กลายเป็น identity / portfolio signal |
| 6 | **Bimodal gap** (70–79 ว่าง) | กราฟเป็นรูปอูฐ | สร้างความรู้สึก "ต้องทะลุให้ได้" |
| 7 | **Hidden algorithm** | สูตรไม่เปิด | คนเดา → engagement กับการ analyze เพิ่ม |

**กลไก anti-abuse ที่ฝังเข้ามา:**
- น้ำหนัก vote ไม่เท่ากัน (function ของผู้โหวต)
- Reciprocal vote ถูกลดทอน
- Vote จาก follower < non-follower
- Min metadata gate (title + category + ≥3 tags)

---

## แหล่งอ้างอิง

- [What is Pulse and Views? – 500px Support Center](https://support.500px.com/hc/en-us/articles/203999378-What-is-Pulse-and-Views) — เอกสารทางการของ 500px
- [What does the 500px pulse score really mean? – Mike Creeth](https://mikecreeth.wordpress.com/2014/11/19/what-does-the-500px-pulse-score-really-mean/) — งานวิเคราะห์ ~28k รูปผ่าน 500px API ด้วย R
- [My Thoughts on 500px's Pulse 2.0 – Jason Waltman](https://www.jasonwaltman.com/blog/2013/my-thoughts-on-500px-pulse-2-0/) — บันทึกการเปลี่ยนสูตรเป็น Pulse 2.0
- [How does 500px.com calculate 'pulse'? – Quora](https://www.quora.com/How-does-500px-com-calculate-pulse) — คำอธิบายเรื่องน้ำหนัก vote จาก follower vs non-follower และ reciprocal voting
- [500px Legacy API Documentation – GitHub](https://github.com/500px/legacy-api-documentation) — repo เอกสาร API สำหรับสาย dev
- [Best Time to Upload and Get Popular on 500px – tl-photography](https://tl-photography.at/misc/the-best-time-to-upload-on-500px-com/) — สถิติช่วงเวลา upload
- [15 tips for getting your photo Popular on 500px.com – D. Brenton](https://dbrenton.com/929/photography/15-tips-photo-popular-500px/) — รวมเทคนิคจาก community

---

## เชื่อมโยง

- ใช้เป็น input ของ → [goscore-v2-design-doc.md](goscore-v2-design-doc.md)
- เทียบกับ → [../audit/500px-analysis.md](../audit/500px-analysis.md) (UI + general patterns analysis)
- อ้างอิงสำหรับ → [../tech/spec.md](../tech/spec.md) (current Pulse formula baseline)
