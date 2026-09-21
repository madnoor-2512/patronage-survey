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
      VALUES (${sid}, 'posttest', ${JSON.stringify(answers)}, ${score})
    `;

    const pre = await sql`
      SELECT score FROM responses
      WHERE session_token = ${sid} AND phase = 'pretest'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const preScore = pre.rows.length ? pre.rows[0].score : null;

    return res.status(200).json({ ok: true, postScore: score, preScore });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
}
