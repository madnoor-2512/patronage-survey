# แบบทดสอบก่อนเรียน–หลังเรียน (Vercel + Postgres)

พอร์ตจาก Google Apps Script + Google Sheet มาเป็น **Vercel (static + serverless functions)**
และ **ฐานข้อมูล Postgres** (แนะนำ Vercel Postgres ซึ่งขับเคลื่อนโดย Neon)

## โครงสร้างโปรเจกต์

```
public/
  index.html       -> redirect ไปหน้า pretest
  pretest.html     -> แบบทดสอบก่อนเรียน
  video.html       -> หน้าวีดีโอ
  posttest.html    -> แบบทดสอบหลังเรียน
  questions.js     -> ชุดคำถาม 11 ข้อ (ใช้ร่วมกันทั้ง pre/post)
  style.css        -> สไตล์ (พอร์ตมาจากไฟล์ Questions.html เดิม)
api/
  submit-pretest.js   -> POST บันทึกคะแนนก่อนเรียน
  submit-posttest.js  -> POST บันทึกคะแนนหลังเรียน + ดึงคะแนนก่อนเรียนมาคู่กัน
lib/
  db.js            -> สร้างตาราง responses อัตโนมัติถ้ายังไม่มี
schema.sql         -> schema อ้างอิง (ไม่จำเป็นต้องรันเอง)
vercel.json        -> เปิด cleanUrls เพื่อให้ /pretest ใช้ได้โดยไม่ต้องมี .html
```

การไหลของระบบเหมือนเดิมทุกประการ: **pretest -> video -> posttest** โดยใช้
"รหัสอ้างอิงชั่วคราว" (`sid`) ที่สุ่มฝั่ง client ส่งต่อผ่าน URL query string
เพื่อจับคู่คะแนนก่อน/หลัง — ไม่เก็บข้อมูลส่วนตัวใด ๆ เหมือนระบบเดิม

## ขั้นตอน Deploy

1. **สร้างฐานข้อมูล**
   ใน Vercel Dashboard ไปที่โปรเจกต์ (หรือสร้างใหม่) → แท็บ **Storage** →
   **Create Database** → เลือก **Postgres** (Neon) → เชื่อมต่อ (Connect) เข้ากับโปรเจกต์นี้
   Vercel จะตั้งค่า environment variable `POSTGRES_URL` และตัวแปรที่เกี่ยวข้องให้อัตโนมัติ

2. **Push โค้ดขึ้น Git แล้ว Import เข้า Vercel**
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
   แล้วไปที่ vercel.com → **Add New... → Project** → เลือก repo นี้ → Deploy
   (ไม่ต้องตั้งค่า Build Command ใด ๆ เป็นพิเศษ เพราะเป็น static + serverless functions ล้วน)

3. **ทดสอบ**
   เข้า URL ที่ Vercel ให้มา (เช่น `https://your-project.vercel.app`)
   ระบบจะพาไปหน้า `/pretest` โดยอัตโนมัติ
   ตารางฐานข้อมูล `responses` จะถูกสร้างอัตโนมัติในการเรียก API ครั้งแรก
   (ไม่ต้องรัน `schema.sql` เอง เว้นแต่ต้องการสร้างล่วงหน้า)

## รันทดสอบบนเครื่อง (ทางเลือก)

```bash
npm install -g vercel
npm install
vercel env pull .env.local   # ดึงค่า POSTGRES_URL จากโปรเจกต์ที่เชื่อม Storage แล้ว
vercel dev
```

## หมายเหตุ

- ถ้าต้องการเปลี่ยนวีดีโอ แก้ลิงก์ YouTube ใน `public/video.html`
- ถ้าต้องการแก้ไข/เพิ่มคำถาม แก้ไฟล์ `public/questions.js` เพียงไฟล์เดียว
  (ใช้ร่วมกันทั้ง pretest และ posttest เหมือนไฟล์ `Questions.html` เดิม)
- หากต้องการดูข้อมูลดิบ สามารถเข้าไปที่แท็บ Storage ในโปรเจกต์ Vercel แล้วเปิด
  Query/Data Browser ของ Postgres เพื่อดูตาราง `responses` ได้โดยตรง
