# Implementation Plan: Dual-System (Leave & OT) with Selection Page

เป้าหมายคือการเพิ่มระบบจัดการ OT (Overtime) และสร้างหน้าทางเลือกระหว่าง "ระบบลา" และ "ระบบ OT" หลังจากที่ผู้ใช้ Login สำเร็จ

## 1. Database Schema สำหรับ OT

เราจำเป็นต้องเพิ่มตารางข้อมูลสำหรับ OT ใน Database (`ckap_leave_sys`) ดังนี้:

### [NEW] `ot_requests` Table
เก็บข้อมูลการขอขอทำงานล่วงเวลา (OT)
- `id`: INT (PK)
- `user_id`: INT (FK to users.id)
- `date`: DATE (วันที่ทำ OT)
- `start_time`: TIME (เวลาเริ่ม)
- `end_time`: TIME (เวลาสิ้นสุด)
- `total_hours`: DECIMAL(4,2) (จำนวนชั่วโมง)
- `reason`: TEXT (เหตุผล)
- `status`: ENUM('pending', 'approved', 'rejected')
- `approved_by`: INT (FK to users.id)
- `created_at`: TIMESTAMP

---

## 2. Backend Changes (Node.js)

### [NEW] [routes/otRequests.js](file:///c:/Users/progr/OneDrive/Desktop/Ckap-Leave-Management-System-HR/routes/otRequests.js)
- สร้าง API Endpoints:
    - `POST /api/ot-requests` (ยื่นคำขอ OT)
    - `GET /api/ot-requests/me` (ดูประวัติ OT ของตัวเอง)
    - `GET /api/ot-requests` (สำหรับ Admin/HR ตรวจสอบ)
    - `PATCH /api/ot-requests/:id/approve` (อนุมัติ OT โดย Admin/HR)

---

## 3. Frontend Selection Screen Logic

เพื่อให้ผู้ใช้เลือกเข้าได้ทั้งสองระบบ หลังจาก Login หน้าเว็บควรนำไปที่หน้าจอกลาง (Selection Page) แทนที่จะเข้า Dashboard ของระบบใดระบบหนึ่งทันที

### Flow การทำงาน:
1. **Login:** ผู้ใช้กรอกข้อมูลเข้าระบบปกติ
2. **Redirect to /selection:** เมื่อ Login สำเร็จ Frontend จะตรวจสอบ (เช่นใน `PrivateRoute` หรือหลังจากรับ Response 200) แล้วเปลี่ยนหน้าไปที่ `/selection`
3. **Selection Page:** 
    - มีหน้าจอสวยงาม 2 ปุ่มหลัก: "ระบบจัดการวันลา" และ "ระบบจัดการ OT"
    - เมื่อคลิก จะนำทาง (Navigate) ไปยัง Path ที่เกี่ยวข้อง เช่น `/leave/dashboard` หรือ `/ot/dashboard`

### ตัวอย่าง Layout (CSS/HTML Concept):
- **Title:** "ยินดีต้อนรับ, [ชื่อผู้ใช้]"
- **Subtitle:** "กรุณาเลือกระบบที่ต้องการใช้งาน"
- **Cards/Buttons:**
    - **Card 1:** 🏖️ **ระบบลางาน** (ประวัติการลา, ยื่นคำขอลา, ตรวจเช็คยอดวันลา)
    - **Card 2:** ⏰ **ระบบ OT** (ลงเวลา OT, ตรวจสอบสถานะการอนุมัติ, ตารางงานพิเศษ)

---

## 4. Proposed File Changes in this Repository

- **`app.js`**: จดทะเบียน Route สำหรับ OT
- **`routes/otRequests.js`**: (สร้างใหม่) จัดการ Logic ของคำขอ OT
- **Database Script**: สร้าง Script สำหรับรัน SQL ตาราง OT ใหม่

> [!NOTE]
> หากต้องการให้ผมเริ่มสร้างตาราง Database และ Route พื้นฐานของระบบ OT เลย สามารถแจ้งได้ทันทีครับ ส่วนหน้าจอ Selection (Frontend) หากแจ้ง Stack (React/Vue/HTML) ผมจะเขียนเป็นตัวอย่างให้ครับ
