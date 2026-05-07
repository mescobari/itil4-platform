'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Carga el pool de challenges desde simulador/challenges.seed.json a la BD.
// Idempotente: deduplica por `question` exacta (CASE-SENSITIVE — para reactivar
// cambia el JSON o usa el panel admin).

const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { normalize } = require('../services/textNormalize');

const SEED_PATH = path.join(__dirname, '..', '..', '..', 'simulador', 'challenges.seed.json');

(async () => {
  if (!fs.existsSync(SEED_PATH)) {
    console.error('[SEED] Archivo no encontrado:', SEED_PATH);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const list = Array.isArray(raw.challenges) ? raw.challenges : [];
  if (list.length === 0) {
    console.log('[SEED] No hay challenges en el JSON. Nada que cargar.');
    await pool.end();
    return;
  }

  let inserted = 0, skipped = 0;
  try {
    for (const c of list) {
      if (!c.question || !c.answer) { skipped++; continue; }
      const [exists] = await pool.execute(
        'SELECT id FROM book_challenges WHERE question = ? LIMIT 1',
        [c.question.trim()]
      );
      if (exists.length > 0) { skipped++; continue; }
      await pool.execute(
        `INSERT INTO book_challenges (question, answer_norm, page_ref, active)
         VALUES (?, ?, ?, 1)`,
        [c.question.trim(), normalize(c.answer), c.page_ref || null]
      );
      inserted++;
    }
    const [[{ active }]] = await pool.query(
      'SELECT COUNT(*) AS active FROM book_challenges WHERE active = 1'
    );
    console.log(`[SEED] Insertados=${inserted} · Saltados=${skipped} · Total activos en BD=${active}`);
    if (active < 3) {
      console.warn('[SEED] WARNING: el pool tiene menos de 3 challenges activos. /api/access/challenge fallará hasta que añadas más.');
    }
  } catch (err) {
    console.error('[SEED] ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
