# Auto Add Leave Days on the 1st of Every Month

เป้าหมายคือการสร้างระบบ Background Job หรือ Cron Job ที่ทำงานอัตโนมัติในฝั่ง Backend เพื่อเพิ่มวันลา (Leave Days) ให้กับพนักงานทุกคนในทุกๆ วันที่ 1 ของเดือน 

## User Review Required

> [!IMPORTANT]
> เพื่อให้ระบบทำงานได้ตรงตามเงื่อนไขของบริษัท รบกวนช่วยยืนยันข้อมูลต่อไปนี้ครับ:
> 1. **จำนวนวันที่ต้องการเพิ่มให้ต่อเดือน:** ปกติบริษัทจะให้เดือนละกี่วันครับ? (เช่น เพิ่มเดือนละ 1 วัน หรือ 1.25 วัน หรือแล้วแต่ฝ่าย/อายุงาน)
> 2. **ประเภทของการลา:** วันลาที่เพิ่มให้อัตโนมัตินี้ เป็น "วันลาพักผ่อน" (Vacation) อย่างเดียว หรือเพิ่มไปที่สิทธิ์ลารวม `user_leave_pool` ครับ? ปัจจุบันระบบมีการแยก `leave_balances` ด้วย

## Proposed Changes

### Dependencies
- ติดตั้ง library `node-cron` เพื่อใช้จัดการการตั้งเวลาทำงาน (Scheduling) ภายใน Node.js โดยไม่ต้องพึ่งพาระบบ Cron ของ OS ซึ่งจะทำให้ Deploy และจัดการได้ง่ายกว่า

### System Design / Cron Job

#### [NEW] [cron/leaveAccrual.js](file:///c:/Users/progr/OneDrive/Desktop/Ckap-Leave-Management-System-HR/cron/leaveAccrual.js)
- สร้างไฟล์สำหรับรัน Job
- ตั้งเวลาใช้ expression `0 0 1 * *` (รันเวลา 00:00 น. ของวันที่ 1 ทุกเดือน)
- **Logic เบื้องต้น:** 
  1. ดึงข้อมูล Users ทั้งหมด
  2. วนลูปอัปเดต / Insert สิทธิ์วันลาลงในตาราง `user_leave_pool` ประจำปีนั้นๆ โดยบวกจำนวนวันที่กำหนด (+X วัน) 
  3. เขียน Log การผ่าน Audit Log หรือ Console ว่าเพิ่มสำเร็จกี่คน เพื่อการตรวจสอบย้อนหลัง

#### [MODIFY] [server.js](file:///c:/Users/progr/OneDrive/Desktop/Ckap-Leave-Management-System-HR/server.js)
- นำเข้า (import) ไฟล์ `cron/leaveAccrual.js` และสั่งเริ่มทำงาน (start) เมื่อ Server รันขึ้นมา

## Open Questions

- มีเงื่อนไขพิเศษไหมครับ เช่น พนักงานที่ยังไม่ผ่านโปร (ทดลองงาน) จะยังไม่ได้สิทธิ์นี้ หรือดูแค่วันที่เริ่มงาน? ปัจจุบันในตาราง `users` ไม่มีฟิลด์วันเริ่มงาน ควรเพิ่มไหมครับ?

## Verification Plan

### Automated / Server Tests
- จะตั้งค่า cron เปล่าๆ ให้ทำงานทุก 1 นาทีก่อนเพื่อทดสอบและดู log ว่าอัปเดตและพิมพ์ผลลัพธ์ว่า "Add Leave Days Success" จากนั้นจึงเปลี่ยนเป็นทุกวันที่ 1 (`0 0 1 * *`)

### Manual Verification
- แจ้งให้คุณผู้ใช้งานใช้ API Endpoint ตรวจสอบยอดวันลาใน HR Dashboard เพื่อดูตัวเลขว่าเพิ่มขึ้นจริงหรือไม่
