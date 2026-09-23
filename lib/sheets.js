import { google } from 'googleapis';
import { randomUUID } from 'node:crypto';

const HEADERS = ['id', 'created_at', 'session_token', 'pre_answers', 'pre_score', 'post_answers', 'post_score'];
let headersReady = false;

function getSheetName() {
  return process.env.GOOGLE_SHEET_NAME || 'Responses';
}

function getRange(range) {
  const sheetName = getSheetName().replaceAll("'", "''");
  return `'${sheetName}'!${range}`;
}

function getSheetsClient() {
  const encodedPrivateKey = process.env.GOOGLE_PRIVATE_KEY_BASE64;
  const privateKey = encodedPrivateKey
    ? Buffer.from(encodedPrivateKey, 'base64').toString('utf8')
    : process.env.GOOGLE_PRIVATE_KEY
      ?.replace(/^"|"$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\r/g, '');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey || !process.env.GOOGLE_SHEET_ID) {
    throw new Error('ต้องตั้งค่า GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY และ GOOGLE_SHEET_ID');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function ensureHeaders(sheets) {
  if (headersReady) return;
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: getRange('A1:G'),
  });
  const values = result.data.values || [];
  const currentHeaders = values[0] || [];

  if (!currentHeaders.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: getRange('A1:G1'),
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    headersReady = true;
    return;
  }

  if (currentHeaders[3] === 'phase') {
    const grouped = new Map();
    for (const row of values.slice(1)) {
      const sid = row[2];
      if (!sid) continue;
      const entry = grouped.get(sid) || {
        id: row[0] || randomUUID(),
        createdAt: row[1] || new Date().toISOString(),
        preAnswers: '',
        preScore: '',
        postAnswers: '',
        postScore: '',
      };
      if (row[3] === 'pretest') {
        entry.preAnswers = row[4] || '';
        entry.preScore = row[5] ?? '';
      } else if (row[3] === 'posttest') {
        entry.postAnswers = row[4] || '';
        entry.postScore = row[5] ?? '';
      }
      grouped.set(sid, entry);
    }

    const migratedRows = [...grouped.entries()].map(([sid, entry]) => [
      entry.id,
      entry.createdAt,
      sid,
      entry.preAnswers,
      entry.preScore,
      entry.postAnswers,
      entry.postScore,
    ]);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: getRange('A:G'),
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: getRange(`A1:G${migratedRows.length + 1}`),
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS, ...migratedRows] },
    });
  }
  headersReady = true;
}

export async function appendResponse({ sid, phase, answers, score, existingSession = null }) {
  const sheets = getSheetsClient();
  await ensureHeaders(sheets);

  const session = existingSession || await findSession(sid);
  const rowIndex = session ? session.rowIndex - 2 : -1;
  const columnStart = phase === 'pretest' ? 'D' : 'F';
  const rowValues = [JSON.stringify(answers), score];

  if (rowIndex >= 0) {
    const sheetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: getRange(`${columnStart}${sheetRow}:${columnStart === 'D' ? 'E' : 'G'}${sheetRow}`),
      valueInputOption: 'RAW',
      requestBody: { values: [rowValues] },
    });
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: getRange('A:G'),
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[randomUUID(), new Date().toISOString(), sid, phase === 'pretest' ? JSON.stringify(answers) : '', phase === 'pretest' ? score : '', phase === 'posttest' ? JSON.stringify(answers) : '', phase === 'posttest' ? score : '']],
    },
  });
}

export async function findSession(sid) {
  const sheets = getSheetsClient();
  await ensureHeaders(sheets);

  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: getRange('A2:G'),
  });
  const rows = result.data.values || [];
  const rowIndex = rows.findIndex((row) => row[2] === sid);

  if (rowIndex < 0) return null;
  return { rowIndex: rowIndex + 2, row: rows[rowIndex] };
}
