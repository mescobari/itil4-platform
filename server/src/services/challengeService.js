'use strict';
const crypto    = require('crypto');
const jwt       = require('jsonwebtoken');
const { pool }  = require('../config/db');
const { normalize } = require('./textNormalize');

const SESSION_SECRET     = process.env.CHALLENGE_SESSION_SECRET;
const SESSION_TTL        = '10m';
const QUESTIONS_PER_TRY  = 3;

if (!SESSION_SECRET) {
  console.warn('[CHALLENGE] WARNING: CHALLENGE_SESSION_SECRET no está definido en .env.');
}

// Selecciona QUESTIONS_PER_TRY challenges activos al azar y devuelve sessionId firmado.
async function startChallenge() {
  const [rows] = await pool.query(
    `SELECT id, question
       FROM book_challenges
      WHERE active = 1
      ORDER BY RAND()
      LIMIT ?`,
    [QUESTIONS_PER_TRY]
  );
  if (rows.length < QUESTIONS_PER_TRY) {
    const err = new Error('No hay suficientes challenges activos en el pool. Contacta soporte.');
    err.status = 503;
    throw err;
  }
  const cids  = rows.map(r => r.id);
  const nonce = crypto.randomBytes(8).toString('hex');
  const sessionId = jwt.sign({ cids, nonce }, SESSION_SECRET, { expiresIn: SESSION_TTL });
  const questions = rows.map(r => ({ id: r.id, question: r.question }));
  return { sessionId, questions };
}

// Valida sessionId firmado + respuestas. Devuelve { passed, failedCount, challengeIds }.
async function validateAnswers(sessionId, answers) {
  let payload;
  try {
    payload = jwt.verify(sessionId, SESSION_SECRET);
  } catch (_) {
    const err = new Error('Tu sesión expiró. Solicita un nuevo set de preguntas.');
    err.status = 400;
    throw err;
  }

  const expectedIds = (payload.cids || []).slice().sort();
  const givenIds    = (answers || []).map(a => a.id).slice().sort();
  if (
    expectedIds.length !== QUESTIONS_PER_TRY ||
    givenIds.length    !== QUESTIONS_PER_TRY ||
    expectedIds.some((v, i) => v !== givenIds[i])
  ) {
    const err = new Error('Respuestas no corresponden con la sesión actual.');
    err.status = 400;
    throw err;
  }

  // Cargar respuestas esperadas de los 3 challenges
  const [rows] = await pool.query(
    `SELECT id, answer_norm FROM book_challenges WHERE id IN (?, ?, ?)`,
    payload.cids
  );
  const byId = new Map(rows.map(r => [r.id, r.answer_norm]));

  let failedCount = 0;
  for (const a of answers) {
    const expected = byId.get(a.id);
    if (!expected) { failedCount++; continue; }
    if (normalize(a.answer) !== normalize(expected)) failedCount++;
  }

  return {
    passed: failedCount === 0,
    failedCount,
    challengeIds: payload.cids,
  };
}

// CRUD admin
async function listAll() {
  const [rows] = await pool.query(
    `SELECT id, question, answer_norm, page_ref, active, created_at
       FROM book_challenges ORDER BY id DESC`
  );
  return rows;
}

async function create({ question, answer, page_ref }) {
  const answerNorm = normalize(answer);
  if (!answerNorm) throw Object.assign(new Error('La respuesta no puede estar vacía.'), { status: 400 });
  const [r] = await pool.execute(
    `INSERT INTO book_challenges (question, answer_norm, page_ref, active)
     VALUES (?, ?, ?, 1)`,
    [question.trim(), answerNorm, page_ref || null]
  );
  return { id: r.insertId };
}

async function update(id, patch) {
  const fields = [];
  const values = [];
  if (patch.question !== undefined) { fields.push('question = ?');    values.push(patch.question.trim()); }
  if (patch.answer   !== undefined) { fields.push('answer_norm = ?'); values.push(normalize(patch.answer)); }
  if (patch.page_ref !== undefined) { fields.push('page_ref = ?');    values.push(patch.page_ref || null); }
  if (patch.active   !== undefined) { fields.push('active = ?');      values.push(patch.active ? 1 : 0); }
  if (fields.length === 0) return { ok: true, changed: false };
  values.push(id);
  await pool.execute(`UPDATE book_challenges SET ${fields.join(', ')} WHERE id = ?`, values);
  return { ok: true, changed: true };
}

async function softDelete(id) {
  await pool.execute('UPDATE book_challenges SET active = 0 WHERE id = ?', [id]);
}

module.exports = {
  startChallenge,
  validateAnswers,
  listAll,
  create,
  update,
  softDelete,
  QUESTIONS_PER_TRY,
};
