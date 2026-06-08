# Hall of Fame — Season & Winner Logic

## ภาพรวม

Hall of Fame ไม่ใช้ตาราง `seasons` หรือ `season_winners` ใน Supabase  
Winner คำนวณอัตโนมัติจากภาพที่มีอยู่จริงในระบบ ไม่ต้องกรอกข้อมูลด้วยมือ

---

## Season Definitions

Season กำหนดเป็น config ใน code ที่ไฟล์:  
`src/app/(marketing)/hall-of-fame/HallOfFameClient.tsx`

```ts
const SEASON_DEFS = [
  { id: 'spring-2026', name: 'Spring 2026', startDate: '2026-01-01', endDate: '2026-04-30', status: 'live'   },
  { id: 'winter-2025', name: 'Winter 2025', startDate: '2025-09-01', endDate: '2025-12-31', status: 'closed' },
  { id: 'autumn-2025', name: 'Autumn 2025', startDate: '2025-05-01', endDate: '2025-08-31', status: 'closed' },
];
```

**เพิ่ม season ใหม่** → เพิ่มบรรทัดใน `SEASON_DEFS` แล้ว deploy  
ไม่ต้องทำอะไรใน Supabase

---

## Winner Computation

```
สำหรับแต่ละ closed season:
  1. กรอง photos ที่ uploaded_at อยู่ในช่วง startDate–endDate
  2. แยกตาม category (landscape / portrait / bw)
  3. หาภาพที่ likes_count สูงสุดในแต่ละหมวด
  4. ภาพนั้นคือ winner — voucher = 50,000 THB
```

ฟังก์ชัน: `computeWinners(photos, startDate, endDate)`

### ตัวอย่าง

ถ้า Winter 2025 มีภาพ landscape ที่ถ่ายในช่วง ก.ย.–ธ.ค. 2025 รวม 12 ภาพ  
ภาพที่ได้ likes สูงสุดในหมวด landscape จะเป็น winner ของ Winter 2025 / Landscape

---

## Status: live vs closed

| status   | ผลที่แสดง |
|----------|-----------|
| `live`   | "ฤดูกาลปัจจุบันยังเปิดอยู่ — ผลจะประกาศในเดือน X" |
| `closed` | แสดง winner card ทุกหมวด (คำนวณจาก likes) |

**เปลี่ยน season จาก live → closed:**  
แก้ `status: 'live'` เป็น `status: 'closed'` ใน `SEASON_DEFS` แล้ว deploy  
Winner จะคำนวณขึ้นมาทันทีจากภาพที่มีอยู่

---

## Fallback

| สถานการณ์ | ผลลัพธ์ |
|-----------|---------|
| Supabase มีภาพ | คำนวณ winner จาก real photos |
| Supabase ไม่มีภาพเลย | แสดง mock data (3 season จาก `src/lib/data/seasons.ts`) |
| เกิด error ในการ fetch | แสดง mock data |
| closed season แต่ไม่มีภาพในช่วงนั้น | แสดง "ยังไม่มีภาพในช่วงฤดูกาลนี้" |

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/app/(marketing)/hall-of-fame/HallOfFameClient.tsx` | logic หลัก + desktop UI |
| `src/components/mobile/MobileHallOfFame.tsx` | mobile UI (รับ props จาก HallOfFameClient) |
| `src/lib/data/seasons.ts` | mock data สำหรับ fallback |
| `src/lib/types.ts` | `Season`, `SeasonWinner`, `Category` types |
