# Frontend Selection Page Implementation Guide

เพื่อรองรับระบบ Dual-System (ระบบลา และ ระบบ OT) หลังจาก Login สำเร็จ คุณควรปรับเปลี่ยน Flow ของ Frontend ดังนี้:

### 1. ปรับหน้า Login (Login Page)
หลังจากที่คุณเรียก API `/api/auth/login` และได้รับสถานะ 200 (Success) แทนที่จะ redirect ไปยัง `/dashboard` ทันที ให้ขยับไปที่หน้า `/selection` แทน

```javascript
// ตัวอย่าง (Pseudo-code) ใน Login component
const handleLogin = async () => {
    const res = await axios.post('/api/auth/login', { employee_code, password });
    if (res.status === 200) {
        // แทนที่จะไปที่ /dashboard เลย
        // window.location.href = '/dashboard';
        
        // ให้ไปที่หน้า 'เลือกครึ่ง' แทน
        window.location.href = '/selection';
    }
};
```

### 2. สร้างหน้าทางเลือก (Selection Page)
หน้านี้ทำหน้าที่เป็น Dashboard กลาง (Portal) เพื่อให้พนักงานเลือกว่าจะจัดการ "วันลา" หรือ "OT"

**โครงสร้าง HTML/JSX พื้นฐาน:**
```jsx
const SelectionPage = () => {
  return (
    <div className="selection-container">
      <h1>ยินดีต้อนรับ</h1>
      <p>กรุณาเลือกระบบที่คุณต้องการใช้งานวันนี้</p>
      
      <div className="card-grid">
        {/* Card สำหรับระบบลา */}
        <div className="system-card" onClick={() => navigate('/leave/dashboard')}>
          <div className="icon">🏝️</div>
          <h2>ระบบจัดการวันลา</h2>
          <p>ยื่นคำขอลา, ตรวจสอบวันลาคงเหลือ และประวัติการลา</p>
        </div>

        {/* Card สำหรับระบบ OT */}
        <div className="system-card" onClick={() => navigate('/ot/dashboard')}>
          <div className="icon">⏰</div>
          <h2>ระบบจัดการ OT</h2>
          <p>ยื่นคำขอ OT, ตรวจสอบสถานะการอนุมัติ และสถิติ OT</p>
        </div>
      </div>
    </div>
  );
};
```

### 3. การจัดการ Routing
ในการตั้งค่า Routing (เช่น React Router) ให้แยกส่วนของระบบลาและระบบ OT ออกจากกันเพื่อให้จัดการง่าย:

```jsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/selection" element={<SelectionPage />} />
  
  {/* ส่วนของระบบลางาน */}
  <Route path="/leave/*" element={<LeaveLayout />}>
    <Route path="dashboard" element={<LeaveDashboard />} />
    <Route path="request" element={<LeaveRequest />} />
  </Route>
  
  {/* ส่วนของระบบ OT */}
  <Route path="/ot/*" element={<OtLayout />}>
    <Route path="dashboard" element={<OtDashboard />} />
    <Route path="request" element={<OtRequest />} />
  </Route>
</Routes>
```

---

### จุดเด่นของการทำหน้า Selection:
1. **User Experience:** ผู้ใช้งานไม่สับสนว่าปัจจุบันกำลังจัดการอะไรอยู่
2. **Modular Design:** หากในอนาคตมี "ระบบเบิกค่าใช้จ่าย" หรือ "ระบบอบรม" ก็สามารถเพิ่ม Card เข้าไปในหน้า Selection ได้ทันทีโดยไม่กระทบเมนูเดิม
3. **Clean Sidebar:** แต่ละระบบย่อยสามารถมี Sidebar ของตัวเองที่เกี่ยวข้องกับฟังก์ชันนั้นๆ ได้โดยตรง
