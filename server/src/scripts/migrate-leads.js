'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// Migra leads.json y email_log.json (legado) a MySQL.
// Idempotente: si una fila ya existe (por email único o por id), se salta.
// Después de ejecutar exitosamente puedes borrar los .json — el servidor ya no los lee.

const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function readJson(name) {
  const p = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (err) {
    console.error(`[MIGRATE-LEADS] ${name}.json no es JSON válido:`, err.message);
    return null;
  }
}

async function migrateLeads(rows) {
  if (!rows || rows.length === 0) {
    console.log('[MIGRATE-LEADS] leads.json vacío — nada que migrar.');
    return { migrated: 0, skipped: 0 };
  }
  let migrated = 0, skipped = 0;
  for (const r of rows) {
    const [exists] = await pool.execute('SELECT id FROM leads WHERE email = ? LIMIT 1', [r.email]);
    if (exists.length > 0) { skipped++; continue; }
    await pool.execute(
      `INSERT INTO leads (name, email, whatsapp, timeline, consent, source, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.name || '',
        r.email,
        r.whatsapp || null,
        r.timeline || null,
        r.consent ? 1 : 0,
        r.source || null,
        r.ip || null,
        r.created_at ? new Date(r.created_at) : new Date(),
      ]
    );
    migrated++;
  }
  return { migrated, skipped };
}

async function migrateEmailLog(rows) {
  if (!rows || rows.length === 0) {
    console.log('[MIGRATE-LEADS] email_log.json vacío — nada que migrar.');
    return { migrated: 0 };
  }
  // No deduplicamos email_log: cada envío es un evento.
  // Para evitar duplicaciones si re-ejecutas el script, mira si la tabla está vacía;
  // si NO está vacía asumimos que ya se migró y abortamos.
  const [countRows] = await pool.execute('SELECT COUNT(*) AS c FROM email_log');
  if (countRows[0].c > 0) {
    console.log(`[MIGRATE-LEADS] email_log ya tiene ${countRows[0].c} filas — salto migración para no duplicar.`);
    return { migrated: 0 };
  }
  let migrated = 0;
  for (const r of rows) {
    await pool.execute(
      `INSERT INTO email_log (to_email, subject, type, success, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        r.to_email || '',
        r.subject || '',
        r.type || null,
        r.success ? 1 : 0,
        r.created_at ? new Date(r.created_at) : new Date(),
      ]
    );
    migrated++;
  }
  return { migrated };
}

(async () => {
  try {
    const leadRows  = readJson('leads');
    const emailRows = readJson('email_log');

    const lr = await migrateLeads(leadRows);
    console.log(`[MIGRATE-LEADS] leads:     migrados=${lr.migrated}, ya existían=${lr.skipped}`);

    const er = await migrateEmailLog(emailRows);
    console.log(`[MIGRATE-LEADS] email_log: migrados=${er.migrated}`);

    console.log('[MIGRATE-LEADS] OK');
  } catch (err) {
    console.error('[MIGRATE-LEADS] ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
