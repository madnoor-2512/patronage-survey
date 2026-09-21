import { sql } from '@vercel/postgres';

let tableReady = false;

// สร้างตารางเก็บคะแนน (ครั้งแรกที่มีการเรียกใช้เท่านั้น)
export async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      session_token TEXT NOT NULL,
      phase TEXT NOT NULL CHECK (phase IN ('pretest', 'posttest')),
      answers JSONB NOT NULL,
      score INT NOT NULL
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_responses_sid_phase ON responses (session_token, phase);`;
  tableReady = true;
}
