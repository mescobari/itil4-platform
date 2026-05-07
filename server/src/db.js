'use strict';
// ─── Fachada de acceso a datos ───────────────────────────────────────────────
// Mantiene la misma API que la versión JSON anterior (db.insertLead, db.findLead,
// db.countLeads, db.logEmail) pero ahora respaldada por MySQL.
// IMPORTANTE: todos los métodos son async — los callsites deben usar `await`.

const { pool, ping } = require('./config/db');

async function initDb() {
  await ping();
  console.log('[DB] MySQL pool inicializado:', process.env.DB_NAME || 'itil4_funnel');
}

const db = {
  // ─── leads ───────────────────────────────────────────────────────────────
  async insertLead({ name, email, whatsapp, timeline, consent, source, ip }) {
    const [result] = await pool.execute(
      `INSERT INTO leads (name, email, whatsapp, timeline, consent, source, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, whatsapp || null, timeline || null, consent ? 1 : 0, source || null, ip || null]
    );
    return { id: result.insertId, name, email };
  },

  async findLead(email) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, created_at FROM leads WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async countLeads() {
    const [rows] = await pool.execute('SELECT COUNT(*) AS c FROM leads');
    return rows[0].c;
  },

  // ─── email_log ───────────────────────────────────────────────────────────
  async logEmail({ to_email, subject, type, success }) {
    const [result] = await pool.execute(
      `INSERT INTO email_log (to_email, subject, type, success)
       VALUES (?, ?, ?, ?)`,
      [to_email, subject, type || null, success ? 1 : 0]
    );
    return { id: result.insertId };
  },
};

module.exports = { initDb, db, pool };
