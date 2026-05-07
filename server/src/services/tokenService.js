'use strict';
/**
 * Magic-link token para activación de cuenta.
 *
 * Genera un token opaco aleatorio (32 bytes hex = 64 chars) que viaja en el
 * link del email. Guardamos en BD el SHA-256 del token, no el token plano —
 * defensa en profundidad: si alguien lee la BD, no puede replay-attackearnos.
 *
 * Single-use: solo `consume()` (llamado en /complete-registration) marca el
 * token como gastado. /begin-registration es read-only (verify) y se puede
 * llamar varias veces antes de completar.
 */
const crypto    = require('crypto');
const { pool }  = require('../config/db');

const TOKEN_BYTES = 32;          // 32 bytes → 64 hex chars
const DEFAULT_TTL_DAYS = 30;

function generateRawToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Crea un token de activación y lo guarda hasheado en BD.
 * Devuelve el token plano (SOLO se ve aquí — es lo que va al email).
 *
 * @param {Object} opts
 * @param {number} opts.codeId       — id de access_codes (FK)
 * @param {string} opts.email
 * @param {string} opts.name
 * @param {number} [opts.ttlDays=30]
 * @param {import('mysql2').PoolConnection} [opts.conn] — para anidar en una tx existente
 * @returns {Promise<{ rawToken: string, tokenId: number, expiresAt: Date }>}
 */
async function createActivationToken({ codeId, email, name, ttlDays = DEFAULT_TTL_DAYS, conn }) {
  if (!codeId || !email || !name) throw new Error('createActivationToken: codeId, email y name son requeridos.');
  const rawToken  = generateRawToken();
  const hash      = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const exec = conn || pool;
  const [r] = await exec.execute(
    `INSERT INTO activation_tokens (token_hash, code_id, email, name, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [hash, codeId, email, name, expiresAt]
  );
  return { rawToken, tokenId: r.insertId, expiresAt };
}

/**
 * Verifica un token (sin consumir). Lanza Error con .status si no es válido.
 * Devuelve el row completo (incluye email, name, code, etc).
 */
async function verifyActivationToken(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length !== TOKEN_BYTES * 2) {
    const e = new Error('Token inválido.');
    e.status = 400;
    throw e;
  }
  const hash = hashToken(rawToken);
  const [rows] = await pool.execute(
    `SELECT t.id, t.code_id, t.email, t.name, t.expires_at, t.consumed_at,
            c.code, c.redeemed_by, c.expires_at AS code_expires_at
       FROM activation_tokens t
       JOIN access_codes c ON c.id = t.code_id
      WHERE t.token_hash = ? LIMIT 1`,
    [hash]
  );
  if (rows.length === 0) {
    const e = new Error('Link de activación no válido o ya utilizado.');
    e.status = 400;
    throw e;
  }
  const row = rows[0];
  if (row.consumed_at) {
    const e = new Error('Este link de activación ya fue utilizado. Si ya tienes cuenta, inicia sesión.');
    e.status = 410; // Gone
    throw e;
  }
  if (new Date(row.expires_at) < new Date()) {
    const e = new Error('Este link de activación ha expirado. Solicita uno nuevo.');
    e.status = 410;
    throw e;
  }
  if (row.redeemed_by) {
    const e = new Error('Este código ya fue canjeado por otra cuenta.');
    e.status = 409;
    throw e;
  }
  if (row.code_expires_at && new Date(row.code_expires_at) < new Date()) {
    const e = new Error('El código asociado ha expirado.');
    e.status = 410;
    throw e;
  }
  return row;
}

/**
 * Marca el token como consumido. Pensado para llamarse dentro de la misma tx
 * que crea el usuario y canjea el código.
 *
 * Uso obligado de UPDATE con WHERE consumed_at IS NULL → previene race condition
 * (dos clicks simultáneos): solo uno gana, el otro recibe affectedRows=0.
 */
async function consumeActivationToken(tokenId, userId, conn) {
  const exec = conn || pool;
  const [r] = await exec.execute(
    `UPDATE activation_tokens
        SET consumed_at = NOW(), consumed_by_user_id = ?
      WHERE id = ? AND consumed_at IS NULL`,
    [userId, tokenId]
  );
  if (r.affectedRows === 0) {
    const e = new Error('Este link ya fue utilizado. Por favor solicita uno nuevo.');
    e.status = 410;
    throw e;
  }
  return true;
}

/** Helper para máscara visual del código en respuestas (defensa: no mostrar full). */
function maskCode(code) {
  // ITIL-5B9F-JUAF → ITIL-•••-JUAF
  if (!code || typeof code !== 'string') return '';
  const parts = code.split('-');
  if (parts.length < 2) return '•••';
  return `${parts[0]}-•••-${parts[parts.length - 1]}`;
}

module.exports = {
  createActivationToken,
  verifyActivationToken,
  consumeActivationToken,
  maskCode,
};
