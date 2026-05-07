'use strict';
const express = require('express');
const { z }   = require('zod');
const router  = express.Router();

const { pool }    = require('../config/db');
const validate    = require('../middleware/validate');
const challengeService = require('../services/challengeService');
const rateLimitService = require('../services/rateLimitService');
const captchaService   = require('../services/captchaService');
const tokenService     = require('../services/tokenService');
const { sendActivationCode } = require('../utils/email');

function ipOf(req) {
  // express ya respeta X-Forwarded-For si se configura trust proxy. En dev usamos req.ip.
  return req.ip || req.connection?.remoteAddress || '';
}

function uaOf(req) {
  const ua = req.headers['user-agent'] || '';
  return ua.length > 255 ? ua.slice(0, 255) : ua;
}

// Detecta patrones de actividad sospechosa y los loggea como WARN (admin puede
// inspeccionar el detalle vía /api/admin/code-requests). No bloquea por sí solo —
// los rate limits ya se ocupan de eso. Esto es paper trail/observability.
const SUSPICIOUS_IP_DISTINCT_EMAILS_LAST_HOUR = 5; // mismo IP, ≥5 emails distintos en 1h
const SUSPICIOUS_EMAIL_FAILS_LAST_DAY         = 3; // mismo email, ≥3 fallos en 24h

async function detectSuspicious(email, ip) {
  const [[byIp]] = await pool.query(
    `SELECT COUNT(DISTINCT email) AS distinct_emails, COUNT(*) AS attempts
       FROM code_requests
      WHERE ip = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    [ip]
  );
  if (Number(byIp.distinct_emails) >= SUSPICIOUS_IP_DISTINCT_EMAILS_LAST_HOUR) {
    console.warn(`[ACCESS][SUSPICIOUS] IP ${ip} probó ${byIp.distinct_emails} emails distintos en última hora (${byIp.attempts} intentos).`);
  }
  const [[byEmail]] = await pool.query(
    `SELECT COUNT(*) AS fails
       FROM code_requests
      WHERE email = ? AND passed = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [email]
  );
  if (Number(byEmail.fails) >= SUSPICIOUS_EMAIL_FAILS_LAST_DAY) {
    console.warn(`[ACCESS][SUSPICIOUS] Email ${email} acumula ${byEmail.fails} fallos en últimas 24h.`);
  }
}

// ─── GET /api/access/challenge ───────────────────────────────────────────────
// Devuelve sessionId firmado + 3 preguntas. No identifica al usuario aún.
router.get('/challenge', async (req, res, next) => {
  try {
    const result = await challengeService.startChallenge();
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── POST /api/access/redeem ─────────────────────────────────────────────────
// `name` es requerido para el flujo magic-link: lo capturamos aquí para que en
// /complete-registration el usuario solo tipee el password.
const redeemSchema = z.object({
  sessionId:    z.string().min(10),
  email:        z.string().email().max(255),
  name:         z.string().trim().min(1, 'Nombre requerido.').max(120),
  captchaToken: z.string().optional().nullable(),
  answers: z.array(z.object({
    id:     z.number().int().positive(),
    answer: z.string().min(1).max(200),
  })).min(3).max(3),
});

router.post('/redeem', validate(redeemSchema), async (req, res, next) => {
  const { sessionId, email, name, captchaToken, answers } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const cleanName  = name.trim();
  const ip         = ipOf(req);
  const ua         = uaOf(req);

  try {
    // 1. CAPTCHA (no-op en dev)
    const captcha = await captchaService.verify(captchaToken, ip);
    if (!captcha.ok) {
      return res.status(400).json({ error: 'CAPTCHA inválido. Vuelve a intentar.' });
    }

    // 2. Rate limits + bloqueo por código activo
    const rl = await rateLimitService.check(cleanEmail, ip);
    if (!rl.ok) {
      const status = rl.reason === 'email_has_active_code' ? 409 : 429;
      if (status === 429 && rl.retryAfterSec) res.set('Retry-After', String(rl.retryAfterSec));
      return res.status(status).json({ error: rl.message, reason: rl.reason });
    }

    // 3. Validar respuestas (firma + comparación normalizada)
    const validation = await challengeService.validateAnswers(sessionId, answers);

    // 4. Si NO pasó: registrar y devolver 400
    if (!validation.passed) {
      await pool.execute(
        `INSERT INTO code_requests (email, name, ip, user_agent, challenge_ids, passed, failed_count)
         VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [cleanEmail, cleanName, ip, ua, JSON.stringify(validation.challengeIds), validation.failedCount]
      );
      // Detección de actividad sospechosa: warns en logs (no bloquea — el usuario legítimo
      // tampoco debe sufrir, pero el admin puede verlo via /admin/solicitudes).
      detectSuspicious(cleanEmail, ip).catch(() => {});
      return res.status(400).json({
        error: `Una o más respuestas no son correctas (${validation.failedCount}/3 fallaron). Inténtalo de nuevo.`,
        failedCount: validation.failedCount,
      });
    }

    // 5. Pasó. Tomar código del pool y emitir.
    const conn = await pool.getConnection();
    let issued = null;
    try {
      await conn.beginTransaction();
      const [available] = await conn.execute(
        `SELECT id, code FROM access_codes
           WHERE issued_at IS NULL AND redeemed_by IS NULL
           ORDER BY id ASC LIMIT 1 FOR UPDATE`
      );
      if (available.length === 0) {
        await conn.rollback();
        // Igual registramos el intento — pasó pero no había stock
        await pool.execute(
          `INSERT INTO code_requests (email, name, ip, user_agent, challenge_ids, passed, failed_count)
           VALUES (?, ?, ?, ?, ?, 1, NULL)`,
          [cleanEmail, cleanName, ip, ua, JSON.stringify(validation.challengeIds)]
        );
        return res.status(503).json({
          error: 'Pool de códigos vacío. Te notificaremos por email cuando esté disponible.',
        });
      }
      const { id: codeId, code } = available[0];
      await conn.execute(
        `UPDATE access_codes
           SET issued_to_email = ?, issued_at = NOW(),
               expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
         WHERE id = ?`,
        [cleanEmail, codeId]
      );
      const [reqInsert] = await conn.execute(
        `INSERT INTO code_requests (email, name, ip, user_agent, challenge_ids, passed, failed_count, code_id)
         VALUES (?, ?, ?, ?, ?, 1, 0, ?)`,
        [cleanEmail, cleanName, ip, ua, JSON.stringify(validation.challengeIds), codeId]
      );

      // Magic-link token: generado dentro de la misma tx para que si algo
      // falla, no quedan tokens huérfanos sin código emitido. TTL = 30 días
      // (igual que el código), single-use enforced en /complete-registration.
      const tokenInfo = await tokenService.createActivationToken({
        codeId, email: cleanEmail, name: cleanName, conn,
      });

      await conn.commit();
      issued = {
        code, codeId,
        requestId: reqInsert.insertId,
        magicToken: tokenInfo.rawToken,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    // 6. Enviar email (fire-and-forget — no rompe la respuesta si SMTP falla)
    sendActivationCode(cleanEmail, issued.code, { token: issued.magicToken, name: cleanName }).catch(err => {
      console.error('[ACCESS] sendActivationCode failed:', err.message);
    });

    res.json({
      ok: true,
      message: 'Hemos enviado tu código a tu email. Revisa tu bandeja en los próximos 5 minutos (y la carpeta Spam).',
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

module.exports = router;
