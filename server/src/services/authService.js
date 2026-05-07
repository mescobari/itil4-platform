'use strict';
const bcrypt    = require('bcryptjs');
const { pool } = require('../config/db');
const { sign } = require('../config/jwt');
const { sendWelcome } = require('../utils/email');
const tokenService = require('./tokenService');

const STRICT_EMAIL_MATCH = (process.env.STRICT_EMAIL_MATCH || 'true') === 'true';
const ADMIN_EMAIL        = (process.env.ADMIN_EMAIL || '').toLowerCase();

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function register({ email, name, password, activationCode }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode  = activationCode.trim();

  // 1) Email no debe estar ya registrado
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1', [cleanEmail]
  );
  if (existing.length > 0) throw httpError('Ya existe una cuenta con este email.', 409);

  // 2) Validar código
  const [codeRows] = await pool.execute(
    `SELECT id, code, issued_to_email, expires_at, redeemed_by
     FROM access_codes WHERE code = ? LIMIT 1`,
    [cleanCode]
  );
  if (codeRows.length === 0) throw httpError('Código de activación inválido.', 400);

  const codeRow = codeRows[0];
  if (codeRow.redeemed_by) throw httpError('Este código ya fue canjeado.', 400);
  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    throw httpError('Este código ha expirado.', 400);
  }
  if (
    STRICT_EMAIL_MATCH &&
    codeRow.issued_to_email &&
    codeRow.issued_to_email.toLowerCase() !== cleanEmail
  ) {
    throw httpError('Este código fue emitido a otro email.', 400);
  }

  // 3) Hashear password
  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = ADMIN_EMAIL && cleanEmail === ADMIN_EMAIL ? 1 : 0;

  // 4) Transacción: insertar user + canjear código
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [insertResult] = await conn.execute(
      `INSERT INTO users (email, password_hash, name, is_admin, has_access, activation_code)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [cleanEmail, passwordHash, name.trim(), isAdmin, codeRow.code]
    );
    const userId = insertResult.insertId;
    await conn.execute(
      `UPDATE access_codes SET redeemed_by = ?, redeemed_at = NOW() WHERE id = ?`,
      [userId, codeRow.id]
    );
    await conn.commit();

    const user = {
      id:        userId,
      email:     cleanEmail,
      name:      name.trim(),
      isAdmin:   !!isAdmin,
      hasAccess: true,
    };
    const token = sign({ uid: userId });

    // Email de bienvenida (fire-and-forget — no rompe la respuesta si falla SMTP)
    sendWelcome(cleanEmail, name.trim()).catch(err => {
      console.warn('[AUTH] sendWelcome failed:', err.message);
    });

    return { token, user };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Magic-link flow — read-only preview. Devuelve los datos pre-rellenados
 * para que el frontend muestre email + name (read-only) y el usuario solo
 * tipee password. No consume el token.
 */
async function beginRegistration({ token }) {
  const row = await tokenService.verifyActivationToken(token);
  // Si el email ya está registrado, el frontend debe redirigir a login en vez
  // de mostrar el form. Devolvemos un flag para que sea explícito.
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1', [row.email]
  );
  return {
    email: row.email,
    name:  row.name,
    codeMasked: tokenService.maskCode(row.code),
    expiresAt:  row.expires_at,
    alreadyRegistered: existing.length > 0,
  };
}

/**
 * Magic-link flow — completa registro. Crea user, canjea código, consume
 * token. Todo en una sola tx para que el rollback deje la BD consistente
 * si algún paso falla.
 */
async function completeRegistration({ token, password }) {
  const row = await tokenService.verifyActivationToken(token);

  // Email ya existe → guiar a login (el frontend mostrará mensaje claro).
  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1', [row.email]
  );
  if (existing.length > 0) throw httpError('Ya existe una cuenta con este email. Inicia sesión.', 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = ADMIN_EMAIL && row.email === ADMIN_EMAIL ? 1 : 0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [insertResult] = await conn.execute(
      `INSERT INTO users (email, password_hash, name, is_admin, has_access, activation_code)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [row.email, passwordHash, row.name, isAdmin, row.code]
    );
    const userId = insertResult.insertId;

    await conn.execute(
      `UPDATE access_codes SET redeemed_by = ?, redeemed_at = NOW() WHERE id = ?`,
      [userId, row.code_id]
    );

    // Quema el token (single-use). Si dos clicks simultáneos, solo uno gana.
    await tokenService.consumeActivationToken(row.id, userId, conn);

    await conn.commit();

    const user = {
      id: userId,
      email: row.email,
      name: row.name,
      isAdmin: !!isAdmin,
      hasAccess: true,
    };
    const jwt = sign({ uid: userId });

    sendWelcome(row.email, row.name).catch(err => {
      console.warn('[AUTH] sendWelcome failed:', err.message);
    });

    return { token: jwt, user };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function login({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const [rows] = await pool.execute(
    `SELECT id, email, name, password_hash, is_admin, has_access
     FROM users WHERE email = ? LIMIT 1`,
    [cleanEmail]
  );
  if (rows.length === 0) throw httpError('Email o contraseña incorrectos.', 401);

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) throw httpError('Email o contraseña incorrectos.', 401);

  const user = {
    id:        rows[0].id,
    email:     rows[0].email,
    name:      rows[0].name,
    isAdmin:   !!rows[0].is_admin,
    hasAccess: !!rows[0].has_access,
  };
  const token = sign({ uid: user.id });
  return { token, user };
}

module.exports = { register, beginRegistration, completeRegistration, login };
