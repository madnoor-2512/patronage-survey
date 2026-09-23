import { appendResponse } from '../lib/sheets.js';
import { calculateScore } from '../lib/scoring.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { sid, answers } = req.body || {};
    if (!sid || !Array.isArray(answers)) {
      return res.status(400).json({ ok: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }

    const score = calculateScore(answers);
    await appendResponse({ sid, phase: 'pretest', answers, score });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
}
