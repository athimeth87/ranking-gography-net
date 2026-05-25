# ระบบ Backend Architecture & Specifications

เอกสารฉบับนี้รวบรวมข้อกำหนดและสถาปัตยกรรมสำหรับฝั่ง Backend ของโปรเจกต์ Gography (Ranking System)

## 1. Tech Stack Overview
- **Framework:** Next.js (App Router - API Routes & Server Actions)
- **Database & Auth:** Supabase (PostgreSQL)
- **Email Service:** SMTP (ใช้ Nodemailer ร่วมกับ App Password)
- **SMS Service:** SepSMS (API สำหรับส่งข้อความเข้ามือถือ)

---

## 2. Database Schema (Supabase)

เราจะใช้ Supabase ในการจัดการฐานข้อมูล PostgreSQL โดยมีโครงสร้างตารางหลักๆ ดังนี้:

### 2.1 `users` (ข้อมูลผู้ใช้งาน)
- `id` (UUID, Primary Key) - ผูกกับ Supabase Auth
- `email` (String, Unique)
- `username` (String, Unique)
- `full_name` (String)
- `role` (Enum: `voyageur`, `photographer`, `admin`, `superadmin`)
- `phone_number` (String) - สำหรับส่ง SMS
- `avatar_url` (String)
- `created_at` (Timestamp)

### 2.2 `photos` (ระบบจัดการรูปภาพ)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `image_url` (String)
- `status` (Enum: `pending`, `approved`, `rejected`)
- `created_at` (Timestamp)

### 2.3 `popups` (ระบบแคมเปญโฆษณา)
- `id` (UUID, Primary Key)
- `name` (String)
- `image_url` (String)
- `target_url` (String)
- `audience` (String)
- `status` (Enum: `draft`, `active`, `paused`)
- `start_date` (Timestamp)
- `end_date` (Timestamp)

---

## 3. Integrations (ระบบเชื่อมต่อภายนอก)

### 3.1 ระบบ Authentication (Supabase Auth)
- จัดการการเข้าสู่ระบบและสมัครสมาชิกผ่าน **Supabase Auth**
- ป้องกันสิทธิ์การเข้าถึงหน้า Admin ด้วยการตรวจสอบ Role ใน Database (Row Level Security - RLS)

### 3.2 ระบบ Email Notification (App Passwords)
- **Library:** `nodemailer`
- **วิธีใช้งาน:** แจ้งเตือนผู้ใช้งานเมื่อรูปภาพผ่านการอนุมัติ, แจ้งเตือนการรีเซ็ตรหัสผ่าน, หรืออัปเดตสถานะบัญชี
- **Environment Variables (`.env.local`):**
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your_email@gmail.com
  SMTP_PASS=your_app_password
  ```
- **ข้อควรระวัง:** App Password มักจะใช้คู่กับ Gmail (ต้องเปิด 2-Step Verification ก่อนสร้างรหัสผ่านแอป)

### 3.3 ระบบ SMS Notification (SepSMS)
- **บริการ:** SepSMS (REST API)
- **วิธีใช้งาน:** ส่ง SMS สำหรับยืนยันเบอร์โทรศัพท์ (OTP) หรือแจ้งเตือนด่วน (เช่น ระงับบัญชี)
- **Environment Variables (`.env.local`):**
  ```env
  SEPSMS_API_KEY=your_sepsms_api_key
  SEPSMS_SENDER_NAME=GOGRAPHY
  ```
- **ตัวอย่างการเรียก API:**
  ใช้ `fetch` ใน Next.js Server Actions ยิงไปที่ Endpoint ของ SepSMS พร้อมส่ง Header หรือ Parameter ตาม Document ของ SepSMS

---

## 4. โครงสร้างโฟลเดอร์ Backend ใน Next.js

เพื่อความเป็นระเบียบ จะแยกส่วนของการติดต่อ Backend ออกมาดังนี้:

```text
src/
 ┣ lib/
 ┃ ┣ supabase/        # ตั้งค่า Supabase Client (createClient)
 ┃ ┣ mailer.ts        # ฟังก์ชัน Nodemailer สำหรับส่ง Email
 ┃ ┗ sms.ts           # ฟังก์ชัน Fetch API สำหรับส่ง SepSMS
 ┣ actions/           # Next.js Server Actions สำหรับเรียกใช้ใน Client Components
 ┃ ┣ user-actions.ts  # จัดการข้อมูลผู้ใช้
 ┃ ┣ photo-actions.ts # จัดการอนุมัติรูปภาพ
 ┃ ┗ popup-actions.ts # จัดการแคมเปญโฆษณา
 ┗ app/api/           # (ถ้าจำเป็นต้องสร้าง Webhook หรือ REST API ให้ระบบอื่นเรียกใช้)
```

## 5. Security & Best Practices
- **Row Level Security (RLS):** ต้องเปิด RLS บน Supabase ทุกตาราง และเขียน Policy ให้ Admin เท่านั้นที่แก้ไขข้อมูลระบบได้
- **Environment Variables:** ห้ามหลุด API Keys หรือ App Password เข้าไปใน GitHub เด็ดขาด (ใช้ `.env.local` เสมอ)
- **Server Actions:** ฟังก์ชันที่ส่ง Email หรือ SMS ต้องถูกเรียกผ่าน `use server` เสมอเพื่อไม่ให้ Key หลุดไปฝั่ง Client
