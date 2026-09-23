# แบบทดสอบก่อนเรียน–หลังเรียน (Vercel + Google Sheets)

ระบบแบบทดสอบก่อนเรียนและหลังเรียนบน **Vercel (static + serverless functions)**
โดยใช้ Google Sheets เป็นที่เก็บข้อมูล

## โครงสร้างโปรเจกต์

```
public/
  index.html       -> redirect ไปหน้า pretest
  pretest.html     -> แบบทดสอบก่อนเรียน
  video.html       -> หน้าวีดีโอ
  posttest.html    -> แบบทดสอบหลังเรียน
  questions.js     -> ชุดคำถาม 15 ข้อ (สุ่มลำดับและใช้ร่วมกันทั้ง pre/post)
  style.css        -> สไตล์
api/
  submit-pretest.js   -> POST บันทึกคะแนนก่อนเรียน
  submit-posttest.js  -> POST บันทึกคะแนนหลังเรียน + ดึงคะแนนก่อนเรียนมาคู่กัน
lib/
  sheets.js         -> บันทึกและค้นหาคะแนนใน Google Sheets
vercel.json        -> เปิด cleanUrls เพื่อให้ /pretest ใช้ได้โดยไม่ต้องมี .html
```

การไหลของระบบคือ **pretest -> video -> posttest** โดยใช้รหัสอ้างอิงชั่วคราว
(`sid`) ที่สุ่มฝั่ง client ส่งต่อผ่าน URL query string เพื่อจับคู่คะแนนก่อน/หลัง
ระบบไม่เก็บข้อมูลส่วนตัว และอนุญาตให้ส่งแบบทดสอบหลังเรียนได้เพียงครั้งเดียวต่อ `sid`
โดยคะแนนจะคำนวณที่ server จากคำตอบจริง ไม่ใช้คะแนนที่ส่งจาก browser

## ตั้งค่า Google Sheets

1. สร้าง Google Sheet ใหม่ และคัดลอก Spreadsheet ID จาก URL รูปแบบ
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
2. สร้าง Google Cloud service account และเปิดใช้งาน **Google Sheets API**
3. สร้าง key แบบ JSON ให้ service account แล้วคัดลอก `client_email` และ `private_key`
4. แชร์ Google Sheet ให้ `client_email` ของ service account โดยให้สิทธิ์ **Editor**

ระบบจะสร้างแถวหัวตารางให้เองเมื่อเรียก API ครั้งแรก โดยใช้ชีตชื่อ `Responses` เป็นค่าเริ่มต้น
แต่ละ `session_token` จะอยู่เพียงหนึ่งแถว โดยมีคอลัมน์
`id`, `created_at`, `session_token`, `pre_answers`, `pre_score`, `post_answers`, `post_score`
หากชีตมีข้อมูลรูปแบบเดิม ระบบจะรวมแถวก่อนเรียนและหลังเรียนที่มี `session_token` เดียวกันให้อัตโนมัติ

## Environment variables

ตั้งค่าใน Vercel Project Settings → Environment Variables:

```text
GOOGLE_SHEET_ID=<Spreadsheet ID>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email จากไฟล์ JSON>
GOOGLE_PRIVATE_KEY=<private_key จากไฟล์ JSON>
GOOGLE_PRIVATE_KEY_BASE64=<private_key ที่เข้ารหัส Base64>
GOOGLE_SHEET_NAME=Responses
```

แนะนำให้ใช้ `GOOGLE_PRIVATE_KEY_BASE64` ใน Vercel เพื่อป้องกันปัญหา newline
โดยใช้ค่า Base64 ที่เข้ารหัสจาก `private_key` ในไฟล์ service account JSON

## ขั้นตอน Deploy

1. Push โค้ดขึ้น Git แล้ว Import เข้า Vercel

   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. ไปที่ vercel.com → **Add New... → Project** → เลือก repo นี้ → Deploy
   จากนั้นตั้งค่า environment variables ตามด้านบน
3. เข้า URL ที่ Vercel ให้มา ระบบจะพาไปหน้า `/pretest` โดยอัตโนมัติ

ไม่ต้องตั้งค่า Build Command เพิ่ม เพราะเป็น static + serverless functions ล้วน

## รันทดสอบบนเครื่อง (ทางเลือก)

```bash
npm install -g vercel
npm install
vercel dev
```

ตั้งค่า Google Sheets variables ใน `.env.local` ก่อนรัน `vercel dev`

## หมายเหตุ

- ถ้าต้องการเปลี่ยนวีดีโอ แก้ลิงก์ YouTube ใน `public/video.html`
- ถ้าต้องการแก้ไขหรือเพิ่มคำถาม แก้ไฟล์ `public/questions.js` เพียงไฟล์เดียว
- หากต้องการดูข้อมูลดิบ ให้เปิด Google Sheet ที่แชร์ไว้กับ service account ได้โดยตรง
