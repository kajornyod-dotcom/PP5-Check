# ระบบส่งไฟล์ ปพ.5

ระบบอัปโหลดไฟล์ Excel และ PDF สำหรับข้อมูล ปพ.5 และรายงาน SGS

## 🚀 การติดตั้งและรัน

1. **ติดตั้ง dependencies:**

   ```bash
   npm install
   ```

2. **ตั้งค่า Environment Variables:**
   สร้างไฟล์ `.env.local` ในโฟลเดอร์รูท:

   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api/upload
   ```

3. **รันโปรเจ็กต์:**
   ```bash
   npm run dev
   ```

## ⚙️ การตั้งค่า Backend URL

แก้ไขไฟล์ `.env.local` และเปลี่ยน `NEXT_PUBLIC_BACKEND_URL` เป็น URL ของ backend server:

- **Development:** `http://localhost:3001/api/upload`
- **Production:** `https://your-backend-domain.com/api/upload`

## 🛠️ การแก้ไขปัญหา

### ❌ TypeError: Failed to fetch

**สาเหตุที่เป็นไปได้:**

1. ไม่มีการตั้งค่า `NEXT_PUBLIC_BACKEND_URL`
2. Backend server ไม่ได้รัน
3. URL ไม่ถูกต้อง
4. ปัญหา CORS

**วิธีแก้ไข:**

1. **ตรวจสอบไฟล์ `.env.local`:**

   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api/upload
   ```

2. **ทดสอบการเชื่อมต่อ:**

   - คลิกปุ่ม "🔍 ทดสอบการเชื่อมต่อเซิร์ฟเวอร์" ใน panel

3. **ตรวจสอบ Backend Server:**

   ```bash
   # ตรวจสอบว่า server รันที่ port 3001
   curl http://localhost:3001/api/health
   ```

4. **ตรวจสอบ Console Log:**
   - เปิด Developer Tools (F12)
   - ดูใน Console tab สำหรับข้อผิดพลาด

### 🌐 การตั้งค่า CORS (สำหรับ Backend)

หาก backend เป็น Express.js:

```javascript
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3000", // URL ของ frontend
    credentials: true,
  })
);
```

## 📋 ฟีเจอร์

- ✅ อัปโหลดไฟล์ Excel (.xlsx)
- ✅ อัปโหลดไฟล์ PDF รายงาน SGS
- ✅ Drag & Drop
- ✅ การตรวจสอบไฟล์
- ✅ ทดสอบการเชื่อมต่อ
- ✅ แสดงข้อผิดพลาดแบบละเอียด
- ✅ Responsive Design

## 🏗️ โครงสร้างโปรเจ็กต์

```
pp5_form_submit/
├── app/
│   ├── page.tsx          # หน้าหลัก
│   ├── layout.tsx        # Layout
│   └── globals.css       # Styles
├── public/               # Static files
├── .env.local           # Environment variables
└── package.json         # Dependencies
```

## 📚 Technologies

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **File Upload:** FormData API
- **State Management:** React Hooks
