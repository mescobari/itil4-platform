'use strict';
const crypto   = require('crypto');
const { pool } = require('../config/db');

// Charset sin caracteres ambiguos (sin 0/O/1/I/L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomChunk(len = 4) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += CHARSET[bytes[i] % CHARSET.length];
  return out;
}

// Formato: ITIL-XXXX-YYYY
function generateCode() {
  return `ITIL-${randomChunk(4)}-${randomChunk(4)}`;
}

// Genera N códigos únicos y los inserta. Idempotente ante colisiones (reintenta).
async function generateBatch(count, notes = null) {
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    throw new Error('count debe ser un entero entre 1 y 1000.');
  }
  const conn = await pool.getConnection();
  const inserted = [];
  try {
    await conn.beginTransaction();
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      while (attempts < 5) {
        const code = generateCode();
        try {
          const [r] = await conn.execute(
            'INSERT INTO access_codes (code, notes) VALUES (?, ?)',
            [code, notes]
          );
          inserted.push({ id: r.insertId, code });
          break;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') { attempts++; continue; }
          throw err;
        }
      }
      if (attempts >= 5) throw new Error('No se pudo generar un código único después de 5 intentos.');
    }
    await conn.commit();
    return inserted;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Lista códigos con filtro de estado y paginación
async function listCodes({ status = 'all', limit = 100, offset = 0 } = {}) {
  const cap = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const off = Math.max(parseInt(offset, 10) || 0, 0);

  // Estado calculado en SQL para que el filtro sea consistente
  let where = '1=1';
  if (status === 'available')      where = 'issued_at IS NULL AND redeemed_by IS NULL';
  else if (status === 'issued')    where = 'issued_at IS NOT NULL AND redeemed_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())';
  else if (status === 'redeemed')  where = 'redeemed_by IS NOT NULL';
  else if (status === 'expired')   where = 'issued_at IS NOT NULL AND redeemed_by IS NULL AND expires_at IS NOT NULL AND expires_at <= NOW()';

  const [rows] = await pool.query(
    `SELECT id, code, issued_to_email, issued_at, expires_at, redeemed_by, redeemed_at, notes, created_at,
       CASE
         WHEN redeemed_by IS NOT NULL THEN 'redeemed'
         WHEN issued_at IS NULL       THEN 'available'
         WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 'expired'
         ELSE 'issued'
       END AS status
     FROM access_codes
     WHERE ${where}
     ORDER BY id DESC
     LIMIT ${cap} OFFSET ${off}`
  );

  const [[counts]] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(issued_at IS NULL AND redeemed_by IS NULL) AS available,
       SUM(issued_at IS NOT NULL AND redeemed_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())) AS issued,
       SUM(redeemed_by IS NOT NULL) AS redeemed,
       SUM(issued_at IS NOT NULL AND redeemed_by IS NULL AND expires_at IS NOT NULL AND expires_at <= NOW()) AS expired
     FROM access_codes`
  );

  return {
    items: rows,
    counts: {
      total:     Number(counts.total)     || 0,
      available: Number(counts.available) || 0,
      issued:    Number(counts.issued)    || 0,
      redeemed:  Number(counts.redeemed)  || 0,
      expired:   Number(counts.expired)   || 0,
    },
  };
}

// Asigna un código del pool a un email (uso admin/soporte). 30 días de expiración.
// Si pool vacío, devuelve null (caller decide).
async function issueToEmail(email, notes = null) {
  const cleanEmail = email.trim().toLowerCase();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [available] = await conn.execute(
      `SELECT id, code FROM access_codes
       WHERE issued_at IS NULL AND redeemed_by IS NULL
       ORDER BY id ASC LIMIT 1 FOR UPDATE`
    );
    if (available.length === 0) {
      await conn.rollback();
      return null;
    }
    const { id, code } = available[0];
    await conn.execute(
      `UPDATE access_codes
       SET issued_to_email = ?, issued_at = NOW(),
           expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [cleanEmail, notes, id]
    );
    await conn.commit();
    return { id, code, email: cleanEmail };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  generateCode,
  generateBatch,
  listCodes,
  issueToEmail,
};
