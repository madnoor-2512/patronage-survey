import { appendResponse, findSession } from '../lib/sheets.js';
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
    const session = await findSession(sid);
    if (!session || session.row[4] === undefined || session.row[4] === '') {
      return res.status(400).json({ ok: false, error: 'ไม่พบผลแบบทดสอบก่อนเรียนของรอบนี้' });
    }
    if (session?.row?.[6] !== undefined && session.row[6] !== '') {
      return res.status(409).json({ ok: false, error: 'แบบทดสอบหลังเรียนถูกส่งไปแล้ว ไม่สามารถทำซ้ำได้' });
    }

    await appendResponse({ sid, phase: 'posttest', answers, score, existingSession: session });
    const preScore = Number(session.row[4]);

    return res.status(200).json({ ok: true, postScore: score, preScore });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
}
