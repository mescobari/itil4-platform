'use strict';
const { pool } = require('../config/db');
const examService = require('./examService');
const { sendResultEmail } = require('../utils/email');

const GRACE_SECONDS = 30; // grace period tras time_limit antes de marcar expired

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function shuffle(arr) {
  // Fisher–Yates inmutable
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Parse de JSON columnas (mysql2 puede devolver string o array según driver/version)
function parseJSON(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return fallback; } }
  return v;
}

// ────────────────────────────────────────────────────────────────────────────
// Crear intento: aleatoriza orden, prefilla attempt_answers, devuelve resumen.
// ────────────────────────────────────────────────────────────────────────────
async function createAttempt({ userId, examSlug, mode }) {
  if (!['practice', 'exam'].includes(mode)) {
    throw httpError('mode debe ser "practice" o "exam".', 400);
  }
  const exam = await examService.getExamBySlug(examSlug);
  if (!exam) throw httpError('Examen no encontrado.', 404);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [qs] = await conn.execute(
      'SELECT id FROM questions WHERE exam_id = ? ORDER BY position ASC',
      [exam.id]
    );
    if (qs.length === 0) throw httpError('Examen sin preguntas.', 500);
    const questionIds = qs.map(q => q.id);
    const order = shuffle(questionIds);
    const timeLimitSeconds = mode === 'exam' ? exam.time_limit_minutes * 60 : null;

    const [r] = await conn.execute(
      `INSERT INTO attempts
         (user_id, exam_id, mode, status, started_at, time_limit_seconds, question_order)
       VALUES (?, ?, ?, 'in_progress', NOW(), ?, ?)`,
      [userId, exam.id, mode, timeLimitSeconds, JSON.stringify(order)]
    );
    const attemptId = r.insertId;

    // Prefilla filas de attempt_answers vacías (una por pregunta)
    if (order.length > 0) {
      const placeholders = order.map(() => '(?, ?, NULL, NULL, NULL)').join(', ');
      const params = [];
      for (const qid of order) { params.push(attemptId, qid); }
      await conn.execute(
        `INSERT INTO attempt_answers (attempt_id, question_id, selected_letter, is_correct, answered_at)
         VALUES ${placeholders}`,
        params
      );
    }

    await conn.commit();
    return {
      attemptId,
      examSlug,
      mode,
      questionOrder: order,
      timeLimitSeconds,
      startedAt: new Date().toISOString(),
      total: order.length,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Cargar fila de attempt + verificar ownership.
// ────────────────────────────────────────────────────────────────────────────
async function loadAttempt(attemptId, userId) {
  const [rows] = await pool.execute(
    `SELECT a.*, e.slug AS exam_slug, e.title AS exam_title, e.pass_threshold_pct
       FROM attempts a JOIN exams e ON e.id = a.exam_id
      WHERE a.id = ? LIMIT 1`,
    [attemptId]
  );
  if (rows.length === 0) throw httpError('Intento no encontrado.', 404);
  const row = rows[0];
  if (row.user_id !== userId) throw httpError('Sin acceso a este intento.', 403);
  row.question_order = parseJSON(row.question_order, []);
  return row;
}

// Marca expired si en modo examen el tiempo ya pasó (idempotente).
async function expireIfNeeded(att) {
  if (att.status !== 'in_progress') return att;
  if (att.mode !== 'exam' || !att.time_limit_seconds) return att;
  const startedMs = new Date(att.started_at).getTime();
  const deadlineMs = startedMs + (att.time_limit_seconds + GRACE_SECONDS) * 1000;
  if (Date.now() <= deadlineMs) return att;
  // Tiempo agotado → submit forzado (calcula score con respuestas actuales)
  return await submitAttempt({ attemptId: att.id, userId: att.user_id, force: true });
}

// ────────────────────────────────────────────────────────────────────────────
// Estado del intento (sin mostrar correctas en modo examen activo).
// ────────────────────────────────────────────────────────────────────────────
async function getState({ attemptId, userId }) {
  let att = await loadAttempt(attemptId, userId);
  att = await expireIfNeeded(att);
  if (typeof att === 'object' && att.attemptId) {
    // expireIfNeeded devolvió el resultado de submit (otra firma) → recargar
    att = await loadAttempt(attemptId, userId);
  }

  const [answers] = await pool.execute(
    `SELECT question_id, selected_letter, is_correct, answered_at
       FROM attempt_answers WHERE attempt_id = ?`,
    [attemptId]
  );
  // En modo examen activo (no submitted/expired), nunca exponer is_correct
  const showCorrect = att.status !== 'in_progress' || att.mode === 'practice';
  const map = {};
  for (const a of answers) {
    map[a.question_id] = {
      selectedLetter: a.selected_letter,
      isCorrect:      showCorrect ? (a.is_correct === null ? null : !!a.is_correct) : null,
      answeredAt:     a.answered_at,
    };
  }
  return {
    id: att.id,
    examSlug:       att.exam_slug,
    examTitle:      att.exam_title,
    mode:           att.mode,
    status:         att.status,
    startedAt:      att.started_at,
    submittedAt:    att.submitted_at,
    timeLimitSeconds: att.time_limit_seconds,
    questionOrder:  att.question_order,
    scoreCorrect:   att.score_correct,
    scorePct:       att.score_pct == null ? null : Number(att.score_pct),
    passed:         att.passed === null ? null : !!att.passed,
    answers:        map,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Cargar una pregunta (sin marcar correctas durante examen activo).
// Modo práctica: puede revelar correcta + justificación si reveal=true.
// ────────────────────────────────────────────────────────────────────────────
async function getQuestion({ attemptId, userId, questionId, reveal = false }) {
  let att = await loadAttempt(attemptId, userId);
  att = await expireIfNeeded(att);
  if (typeof att === 'object' && att.attemptId) att = await loadAttempt(attemptId, userId);

  if (!att.question_order.includes(questionId)) {
    throw httpError('La pregunta no pertenece a este intento.', 400);
  }
  const [qRows] = await pool.execute(
    'SELECT id, statement, justification FROM questions WHERE id = ? LIMIT 1',
    [questionId]
  );
  if (qRows.length === 0) throw httpError('Pregunta no encontrada.', 404);
  const q = qRows[0];

  const [aRows] = await pool.execute(
    'SELECT letter, text, is_correct FROM answers WHERE question_id = ? ORDER BY letter ASC',
    [questionId]
  );

  // Reglas de exposición:
  //   - Modo examen + status in_progress → nunca revelar correcta/justificación.
  //   - Modo práctica → revelar siempre o cuando reveal=true (frontend decide UX).
  //   - Si status submitted/expired → revelar (sirve para review).
  const isFinal = att.status === 'submitted' || att.status === 'expired';
  const canReveal = isFinal || att.mode === 'practice';

  return {
    id:        q.id,
    statement: q.statement,
    answers: aRows.map(a => ({
      letter:    a.letter,
      text:      a.text,
      isCorrect: canReveal && (reveal || isFinal) ? !!a.is_correct : null,
    })),
    justification: canReveal && (reveal || isFinal) ? q.justification : null,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Guardar respuesta parcial (autosave).
// ────────────────────────────────────────────────────────────────────────────
async function recordAnswer({ attemptId, userId, questionId, letter }) {
  if (!['A', 'B', 'C', 'D'].includes(letter)) throw httpError('Letra inválida.', 400);

  let att = await loadAttempt(attemptId, userId);
  att = await expireIfNeeded(att);
  if (typeof att === 'object' && att.attemptId) att = await loadAttempt(attemptId, userId);

  if (att.status !== 'in_progress') {
    throw httpError('El intento ya está cerrado.', 409);
  }
  if (!att.question_order.includes(questionId)) {
    throw httpError('La pregunta no pertenece a este intento.', 400);
  }

  // Calcular si la letra es correcta (server-side)
  const [aRows] = await pool.execute(
    'SELECT is_correct FROM answers WHERE question_id = ? AND letter = ? LIMIT 1',
    [questionId, letter]
  );
  const isCorrect = aRows.length > 0 ? !!aRows[0].is_correct : false;

  await pool.execute(
    `UPDATE attempt_answers
        SET selected_letter = ?, is_correct = ?, answered_at = NOW()
      WHERE attempt_id = ? AND question_id = ?`,
    [letter, isCorrect ? 1 : 0, attemptId, questionId]
  );

  // En modo práctica devolvemos también si fue correcta + justificación;
  // en examen, solo confirmamos que se guardó.
  if (att.mode === 'practice') {
    const [qRows] = await pool.execute('SELECT justification FROM questions WHERE id = ?', [questionId]);
    const [allAns] = await pool.execute(
      'SELECT letter, is_correct FROM answers WHERE question_id = ? ORDER BY letter ASC',
      [questionId]
    );
    const correctLetter = allAns.find(a => a.is_correct)?.letter || null;
    return {
      saved: true,
      isCorrect,
      correctLetter,
      justification: qRows[0]?.justification || '',
    };
  }
  return { saved: true };
}

// ────────────────────────────────────────────────────────────────────────────
// Submit: cierra intento, calcula score, marca status.
// ────────────────────────────────────────────────────────────────────────────
async function submitAttempt({ attemptId, userId, force = false }) {
  const att = await loadAttempt(attemptId, userId);
  if (att.status !== 'in_progress' && !force) {
    throw httpError('El intento ya está cerrado.', 409);
  }

  const exam = await examService.getExamById(att.exam_id);
  const total = att.question_order.length;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [aRows] = await conn.execute(
      'SELECT is_correct FROM attempt_answers WHERE attempt_id = ?',
      [attemptId]
    );
    const correct = aRows.filter(r => r.is_correct === 1).length;
    const pct = total > 0 ? (correct / total) * 100 : 0;
    const passed = pct >= exam.pass_threshold_pct ? 1 : 0;

    // Determinar si fue por timeout (examen, expiró)
    let newStatus = 'submitted';
    if (att.mode === 'exam' && att.time_limit_seconds) {
      const startedMs = new Date(att.started_at).getTime();
      const deadlineMs = startedMs + (att.time_limit_seconds + GRACE_SECONDS) * 1000;
      if (Date.now() > deadlineMs) newStatus = 'expired';
    }

    await conn.execute(
      `UPDATE attempts
          SET status = ?, submitted_at = NOW(),
              score_correct = ?, score_pct = ?, passed = ?
        WHERE id = ?`,
      [newStatus, correct, pct.toFixed(2), passed, attemptId]
    );
    await conn.commit();

    const summary = {
      attemptId,
      status:        newStatus,
      scoreCorrect:  correct,
      scoreTotal:    total,
      scorePct:      Math.round(pct * 100) / 100,
      passed:        !!passed,
      threshold:     exam.pass_threshold_pct,
      mode:          att.mode,
    };

    // Email del resultado solo en modo examen (la práctica suele ser exploratoria
    // y muchos intentos seguidos saturarían el inbox).
    if (att.mode === 'exam') {
      try {
        const [[u]] = await pool.execute('SELECT email, name FROM users WHERE id = ? LIMIT 1', [att.user_id]);
        if (u) {
          sendResultEmail(u.email, u.name, summary).catch(err => {
            console.warn('[ATTEMPT] sendResultEmail failed:', err.message);
          });
        }
      } catch (_) { /* el envío de email no debe romper la respuesta */ }
    }

    return summary;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Review post-submit: preguntas con respuesta del usuario + correcta + justificación.
// ────────────────────────────────────────────────────────────────────────────
async function getReview({ attemptId, userId }) {
  const att = await loadAttempt(attemptId, userId);
  if (att.status === 'in_progress') {
    throw httpError('El intento aún no ha sido enviado.', 409);
  }

  const exam = await examService.getExamById(att.exam_id);
  const [qRows] = await pool.query(
    `SELECT q.id, q.statement, q.justification, q.position
       FROM questions q WHERE q.exam_id = ? ORDER BY q.id ASC`,
    [att.exam_id]
  );
  const qById = new Map(qRows.map(q => [q.id, q]));

  const [aRows] = await pool.query(
    `SELECT a.question_id, a.letter, a.text, a.is_correct
       FROM answers a JOIN questions q ON q.id = a.question_id
      WHERE q.exam_id = ? ORDER BY a.question_id, a.letter`,
    [att.exam_id]
  );
  const answersByQ = new Map();
  for (const a of aRows) {
    if (!answersByQ.has(a.question_id)) answersByQ.set(a.question_id, []);
    answersByQ.get(a.question_id).push({ letter: a.letter, text: a.text, isCorrect: !!a.is_correct });
  }

  const [aaRows] = await pool.execute(
    `SELECT question_id, selected_letter, is_correct
       FROM attempt_answers WHERE attempt_id = ?`,
    [attemptId]
  );
  const userAnsByQ = new Map(
    aaRows.map(r => [r.question_id, { selectedLetter: r.selected_letter, isCorrect: r.is_correct === null ? null : !!r.is_correct }])
  );

  const items = att.question_order.map((qid, idx) => {
    const q = qById.get(qid);
    const all = answersByQ.get(qid) || [];
    const ua = userAnsByQ.get(qid) || { selectedLetter: null, isCorrect: null };
    return {
      orderIndex:    idx + 1,
      questionId:    qid,
      statement:     q?.statement || '',
      answers:       all,
      correctLetter: all.find(a => a.isCorrect)?.letter || null,
      selectedLetter: ua.selectedLetter,
      isCorrect:     ua.isCorrect,
      justification: q?.justification || '',
    };
  });

  return {
    attempt: {
      id: att.id,
      examSlug:       att.exam_slug,
      examTitle:      att.exam_title,
      mode:           att.mode,
      status:         att.status,
      startedAt:      att.started_at,
      submittedAt:    att.submitted_at,
      scoreCorrect:   att.score_correct,
      scoreTotal:     att.question_order.length,
      scorePct:       att.score_pct == null ? null : Number(att.score_pct),
      passed:         att.passed === null ? null : !!att.passed,
      threshold:      exam.pass_threshold_pct,
    },
    items,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Historial del usuario.
// ────────────────────────────────────────────────────────────────────────────
async function listUserAttempts(userId) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.mode, a.status, a.started_at, a.submitted_at,
            a.score_correct, a.score_pct, a.passed,
            e.slug AS exam_slug, e.title AS exam_title, e.total_questions
       FROM attempts a JOIN exams e ON e.id = a.exam_id
      WHERE a.user_id = ?
      ORDER BY a.id DESC
      LIMIT 50`,
    [userId]
  );
  return rows.map(r => ({
    id:           r.id,
    mode:         r.mode,
    status:       r.status,
    examSlug:     r.exam_slug,
    examTitle:    r.exam_title,
    startedAt:    r.started_at,
    submittedAt:  r.submitted_at,
    scoreCorrect: r.score_correct,
    scoreTotal:   r.total_questions,
    scorePct:     r.score_pct == null ? null : Number(r.score_pct),
    passed:       r.passed === null ? null : !!r.passed,
  }));
}

module.exports = {
  createAttempt,
  getState,
  getQuestion,
  recordAnswer,
  submitAttempt,
  getReview,
  listUserAttempts,
};
