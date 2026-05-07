'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { generateBatch } = require('../services/codeService');
const { pool } = require('../config/db');

function parseArgs(argv) {
  const out = { count: 10, notes: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--count' || a === '-n') out.count = parseInt(argv[++i], 10);
    else if (a === '--notes')          out.notes = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Uso: node generate-codes.js --count N [--notes "texto"]');
      process.exit(0);
    }
  }
  return out;
}

(async () => {
  const { count, notes } = parseArgs(process.argv);
  console.log(`[CODES] Generando ${count} código(s)${notes ? ` con notes="${notes}"` : ''}...`);
  try {
    const created = await generateBatch(count, notes);
    console.log(`[CODES] OK — ${created.length} insertados:`);
    for (const c of created) console.log('   -', c.code);
  } catch (err) {
    console.error('[CODES] ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
