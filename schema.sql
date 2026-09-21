-- ตารางนี้จะถูกสร้างอัตโนมัติโดยแอปเมื่อมีการเรียก API ครั้งแรก
-- (ดู lib/db.js) แต่สามารถรันเองล่วงหน้าได้เช่นกัน

CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_token TEXT NOT NULL,      -- รหัสอ้างอิงชั่วคราว (สุ่ม, ไม่ใช่ข้อมูลส่วนตัว)
  phase TEXT NOT NULL CHECK (phase IN ('pretest', 'posttest')),
  answers JSONB NOT NULL,           -- คำตอบรายข้อ (true/false ต่อข้อ)
  score INT NOT NULL                -- คะแนนรวม (เต็ม 11)
);

CREATE INDEX IF NOT EXISTS idx_responses_sid_phase ON responses (session_token, phase);
