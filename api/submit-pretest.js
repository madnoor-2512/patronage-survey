import { sql } from '@vercel/postgres';
import { ensureTable } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { sid, answers, score } = req.body || {};
    if (!sid || !Array.isArray(answers) || typeof score !== 'number') {
      return res.status(400).json({ ok: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }

    await ensureTable();

    await sql`
      INSERT INTO responses (session_token, phase, answers, score)
      VALUES (${sid}, 'pretest', ${JSON.stringify(answers)}, ${score})
    `;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
}
