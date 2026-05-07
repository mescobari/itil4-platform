'use strict';
// Rate limit y anti-abuso del flujo Get Code, basados en la tabla code_requests.
//   - Por IP:    máximo 3 solicitudes en 1 hora (cualquier passed)
//   - Por email: máximo 1 solicitud en 24 horas
//   - Email con código vigente: bloquea (debe esperar a expiración o pedir soporte)

const { pool } = require('../config/db');

const IP_WINDOW_HOURS    = 1;
const IP_MAX_PER_WINDOW  = 3;
const EMAIL_WINDOW_HOURS = 24;
const EMAIL_MAX_PER_WINDOW = 1;

async function check(email, ip) {
  // 1. Email con código emitido vigente (no expirado, no canjeado)
  const [active] = await pool.execute(
    `SELECT id, code, expires_at FROM access_codes
       WHERE issued_to_email = ?
         AND redeemed_by IS NULL
         AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
    [email]
  );
  if (active.length > 0) {
    return {
      ok: false,
      reason: 'email_has_active_code',
      retryAfterSec: 0,
      message: 'Ya emitimos un código a este email. Revisa tu bandeja de entrada (y carpeta Spam). Si no lo encuentras, contacta soporte.',
    };
  }

  // 2. Por IP — última hora
  const [ipRows] = await pool.execute(
    `SELECT COUNT(*) AS c, MIN(created_at) AS earliest
       FROM code_requests
      WHERE ip = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
    [ip, IP_WINDOW_HOURS]
  );
  if (ipRows[0].c >= IP_MAX_PER_WINDOW) {
    const earliestMs = new Date(ipRows[0].earliest).getTime();
    const windowEnds = earliestMs + IP_WINDOW_HOURS * 3600 * 1000;
    const retryAfterSec = Math.max(60, Math.ceil((windowEnds - Date.now()) / 1000));
    return {
      ok: false,
      reason: 'rate_limit_ip',
      retryAfterSec,
      message: `Has hecho demasiados intentos. Vuelve a intentar en ${Math.ceil(retryAfterSec / 60)} minutos.`,
    };
  }

  // 3. Por email — últimas 24 horas
  const [emailRows] = await pool.execute(
    `SELECT COUNT(*) AS c, MIN(created_at) AS earliest
       FROM code_requests
      WHERE email = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
    [email, EMAIL_WINDOW_HOURS]
  );
  if (emailRows[0].c >= EMAIL_MAX_PER_WINDOW) {
    const earliestMs = new Date(emailRows[0].earliest).getTime();
    const windowEnds = earliestMs + EMAIL_WINDOW_HOURS * 3600 * 1000;
    const retryAfterSec = Math.max(60, Math.ceil((windowEnds - Date.now()) / 1000));
    return {
      ok: false,
      reason: 'rate_limit_email',
      retryAfterSec,
      message: 'Ya recibiste (o intentaste recibir) un código con este email recientemente. Espera 24 horas o contacta soporte.',
    };
  }

  return { ok: true };
}

module.exports = { check };
