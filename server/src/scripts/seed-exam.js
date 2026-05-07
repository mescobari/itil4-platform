'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Carga simulador/exam.json a las tablas exams / questions / answers.
// Idempotente: UPSERT por exam.slug. Si el exam ya existe con preguntas, NO inserta de nuevo
// (para sobreescribir, borrar manualmente las filas o usar otro slug).

const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const JSON_PATH = path.join(__dirname, '..', '..', '..', 'simulador', 'exam.json');

(async () => {
  if (!fs.existsSync(JSON_PATH)) {
    console.error('[SEED-EXAM] No existe', JSON_PATH, '— corre primero `npm run parse:exam`.');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const meta = data.exam;
  const list = data.questions;
  if (!meta || !Array.isArray(list) || list.length === 0) {
    console.error('[SEED-EXAM] JSON inválido.');
    process.exit(1);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) UPSERT exam por slug
    const [rows] = await conn.execute('SELECT id FROM exams WHERE slug = ? LIMIT 1', [meta.slug]);
    let examId;
    if (rows.length > 0) {
      examId = rows[0].id;
      await conn.execute(
        `UPDATE exams
            SET title = ?, description = ?, total_questions = ?,
                pass_threshold_pct = ?, time_limit_minutes = ?
          WHERE id = ?`,
        [meta.title, meta.description, meta.total_questions, meta.pass_threshold_pct, meta.time_limit_minutes, examId]
      );
      // Si ya tenía preguntas, no las re-insertamos (idempotencia conservadora)
      const [[{ c }]] = await conn.query('SELECT COUNT(*) AS c FROM questions WHERE exam_id = ?', [examId]);
      if (c > 0) {
        console.log(`[SEED-EXAM] Exam "${meta.slug}" (id=${examId}) ya tenía ${c} preguntas. Solo se actualizó la metadata.`);
        await conn.commit();
        return;
      }
    } else {
      const [r] = await conn.execute(
        `INSERT INTO exams (slug, title, description, total_questions, pass_threshold_pct, time_limit_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [meta.slug, meta.title, meta.description, meta.total_questions, meta.pass_threshold_pct, meta.time_limit_minutes]
      );
      examId = r.insertId;
    }

    // 2) Insertar preguntas y respuestas
    let qInserted = 0, aInserted = 0;
    for (const q of list) {
      const [qr] = await conn.execute(
        `INSERT INTO questions (exam_id, position, statement, justification, topic)
         VALUES (?, ?, ?, ?, NULL)`,
        [examId, q.position, q.statement, q.justification || '']
      );
      const questionId = qr.insertId;
      qInserted++;
      for (const a of q.answers) {
        await conn.execute(
          `INSERT INTO answers (question_id, letter, text, is_correct)
           VALUES (?, ?, ?, ?)`,
          [questionId, a.letter, a.text, a.is_correct ? 1 : 0]
        );
        aInserted++;
      }
    }

    await conn.commit();
    console.log(`[SEED-EXAM] ✓ exam id=${examId} slug="${meta.slug}"`);
    console.log(`[SEED-EXAM]   ${qInserted} preguntas · ${aInserted} respuestas insertadas.`);
  } catch (err) {
    await conn.rollback();
    console.error('[SEED-EXAM] ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
