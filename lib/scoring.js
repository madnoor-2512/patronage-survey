const ANSWER_KEY = [true, false, true, true, true, false, true, true, false, true, false, true, false, true, false];

export function calculateScore(answers) {
  if (!Array.isArray(answers) || answers.length !== ANSWER_KEY.length || answers.some((answer) => !answer || !Number.isInteger(answer.questionId) || typeof answer.value !== 'boolean')) {
    throw new Error('ข้อมูลคำตอบไม่ถูกต้อง');
  }

  const questionIds = new Set(answers.map((answer) => answer.questionId));
  if (questionIds.size !== ANSWER_KEY.length || [...questionIds].some((id) => id < 0 || id >= ANSWER_KEY.length)) {
    throw new Error('ข้อมูลคำตอบไม่ครบหรือซ้ำกัน');
  }

  return answers.reduce((score, answer) => score + (answer.value === ANSWER_KEY[answer.questionId] ? 1 : 0), 0);
}