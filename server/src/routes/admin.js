'use strict';
const express = require('express');
const { z }   = require('zod');
const router  = express.Router();

const requireAuth   = require('../middleware/requireAuth');
const requireAdmin  = require('../middleware/requireAdmin');
const validate      = require('../middleware/validate');
const codeService      = require('../services/codeService');
const challengeService = require('../services/challengeService');
const { pool }         = require('../config/db');
const { sendActivationCode } = require('../utils/email');

// Todas las rutas de este router exigen auth + admin
router.use(requireAuth, requireAdmin);

// ─── Codes ───────────────────────────────────────────────────────────────────
const generateSchema = z.object({
  count: z.number().int().min(1).max(1000),
  notes: z.string().max(255).optional().nullable(),
});

router.post('/codes', validate(generateSchema), async (req, res, next) => {
  try {
    const { count, notes } = req.body;
    const created = await codeService.generateBatch(count, notes || null);
    res.json({ ok: true, count: created.length, codes: created });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/codes', async (req, res, next) => {
  try {
    const status = (req.query.status || 'all').toString();
    const limit  = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
    const data = await codeService.listCodes({ status, limit, offset });
    res.json({ ok: true, ...data });
  } catch (err) { next(err); }
});

const issueSchema = z.object({
  email: z.string().email().max(255),
  notes: z.string().max(255).optional().nullable(),
});

router.post('/codes/issue-manual', validate(issueSchema), async (req, res, next) => {
  try {
    const { email, notes } = req.body;
    const issued = await codeService.issueToEmail(email, notes ? `[manual] ${notes}` : '[manual]');
    if (!issued) {
      return res.status(503).json({ error: 'Pool de códigos vacío. Genera más con /api/admin/codes.' });
    }
    // Email no debe romper la respuesta si falla (ya está manejado dentro de send())
    sendActivationCode(issued.email, issued.code, { manual: true }).catch(() => {});
    res.json({ ok: true, code: issued.code, email: issued.email });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── Challenges (CRUD del pool) ──────────────────────────────────────────────
const challengeCreateSchema = z.object({
  question: z.string().min(5).max(500),
  answer:   z.string().min(1).max(120),
  page_ref: z.string().max(40).optional().nullable(),
});

const challengeUpdateSchema = z.object({
  question: z.string().min(5).max(500).optional(),
  answer:   z.string().min(1).max(120).optional(),
  page_ref: z.string().max(40).optional().nullable(),
  active:   z.boolean().optional(),
});

router.get('/challenges', async (_req, res, next) => {
  try {
    const items = await challengeService.listAll();
    res.json({ ok: true, items });
  } catch (err) { next(err); }
});

router.post('/challenges', validate(challengeCreateSchema), async (req, res, next) => {
  try {
    const r = await challengeService.create(req.body);
    res.json({ ok: true, id: r.id });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.patch('/challenges/:id', validate(challengeUpdateSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    const r = await challengeService.update(id, req.body);
    res.json(r);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.delete('/challenges/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    await challengeService.softDelete(id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── Users ───────────────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10)  || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const search = req.query.q ? `%${String(req.query.q).trim().toLowerCase()}%` : null;
    const where  = search ? 'WHERE LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ?' : '';
    const args   = search ? [search, search] : [];

    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.name, u.is_admin, u.has_access,
              u.activation_code, u.created_at,
              (SELECT COUNT(*) FROM attempts a WHERE a.user_id = u.id) AS total_attempts,
              (SELECT COUNT(*) FROM attempts a WHERE a.user_id = u.id AND a.status IN ('submitted','expired')) AS finished_attempts,
              (SELECT MAX(a.score_pct) FROM attempts a WHERE a.user_id = u.id AND a.status IN ('submitted','expired')) AS best_pct,
              (SELECT a.score_pct FROM attempts a WHERE a.user_id = u.id AND a.status IN ('submitted','expired')
                  ORDER BY a.id DESC LIMIT 1) AS last_pct,
              (SELECT a.passed FROM attempts a WHERE a.user_id = u.id AND a.status IN ('submitted','expired')
                  ORDER BY a.id DESC LIMIT 1) AS last_passed
         FROM users u
         ${where}
        ORDER BY u.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      args
    );
    const [[counts]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(is_admin = 1) AS admins,
         SUM(has_access = 1) AS with_access
       FROM users`
    );
    res.json({
      ok: true,
      items: rows.map(r => ({
        id:                r.id,
        email:             r.email,
        name:              r.name,
        isAdmin:           !!r.is_admin,
        hasAccess:         !!r.has_access,
        activationCode:    r.activation_code,
        createdAt:         r.created_at,
        totalAttempts:     Number(r.total_attempts) || 0,
        finishedAttempts:  Number(r.finished_attempts) || 0,
        bestPct:           r.best_pct == null ? null : Number(r.best_pct),
        lastPct:           r.last_pct == null ? null : Number(r.last_pct),
        lastPassed:        r.last_passed === null ? null : !!r.last_passed,
      })),
      counts: {
        total:      Number(counts.total)       || 0,
        admins:     Number(counts.admins)      || 0,
        withAccess: Number(counts.with_access) || 0,
      },
    });
  } catch (err) { next(err); }
});

router.post('/users/:id/reset', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    // Marca todos los intentos del usuario como descartados (no destructivo).
    const [r] = await pool.execute(
      `UPDATE attempts SET status = 'discarded'
        WHERE user_id = ? AND status IN ('in_progress','submitted','expired')`,
      [id]
    );
    res.json({ ok: true, affected: r.affectedRows });
  } catch (err) { next(err); }
});

// ─── Stats agregadas ─────────────────────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const [[u]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(is_admin = 1)   AS admins,
         SUM(has_access = 1) AS with_access
       FROM users`
    );
    const [[c]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(issued_at IS NULL  AND redeemed_by IS NULL) AS available,
         SUM(issued_at IS NOT NULL AND redeemed_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())) AS issued,
         SUM(redeemed_by IS NOT NULL) AS redeemed,
         SUM(issued_at IS NOT NULL AND redeemed_by IS NULL AND expires_at IS NOT NULL AND expires_at <= NOW()) AS expired
       FROM access_codes`
    );
    const [[a]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'in_progress') AS in_progress,
         SUM(status = 'submitted')   AS submitted,
         SUM(status = 'expired')     AS expired,
         SUM(status = 'discarded')   AS discarded,
         SUM(passed = 1 AND status IN ('submitted','expired')) AS passed_count,
         AVG(CASE WHEN status IN ('submitted','expired') THEN score_pct END) AS avg_pct
       FROM attempts`
    );
    const [[r]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(passed = 1) AS passed,
         SUM(passed = 0) AS failed,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS last24h,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))   AS last7d
       FROM code_requests`
    );
    const [[ch]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(active = 1) AS active FROM book_challenges`
    );

    const finishedAttempts = Number(a.submitted) + Number(a.expired);
    const passRate = finishedAttempts > 0
      ? (Number(a.passed_count) / finishedAttempts) * 100
      : null;
    const challengeSuccessRate = Number(r.total) > 0
      ? (Number(r.passed) / Number(r.total)) * 100
      : null;

    res.json({
      ok: true,
      users: {
        total:      Number(u.total)       || 0,
        admins:     Number(u.admins)      || 0,
        withAccess: Number(u.with_access) || 0,
      },
      codes: {
        total:     Number(c.total)     || 0,
        available: Number(c.available) || 0,
        issued:    Number(c.issued)    || 0,
        redeemed:  Number(c.redeemed)  || 0,
        expired:   Number(c.expired)   || 0,
      },
      attempts: {
        total:      Number(a.total)        || 0,
        inProgress: Number(a.in_progress)  || 0,
        submitted:  Number(a.submitted)    || 0,
        expired:    Number(a.expired)      || 0,
        discarded:  Number(a.discarded)    || 0,
        passed:     Number(a.passed_count) || 0,
        avgPct:     a.avg_pct == null ? null : Number(a.avg_pct),
        passRate:   passRate == null ? null : Math.round(passRate * 100) / 100,
      },
      codeRequests: {
        total:        Number(r.total)   || 0,
        passed:       Number(r.passed)  || 0,
        failed:       Number(r.failed)  || 0,
        last24h:      Number(r.last24h) || 0,
        last7d:       Number(r.last7d)  || 0,
        successRate:  challengeSuccessRate == null ? null : Math.round(challengeSuccessRate * 100) / 100,
      },
      challenges: {
        total:  Number(ch.total)  || 0,
        active: Number(ch.active) || 0,
      },
    });
  } catch (err) { next(err); }
});

// ─── Code requests (log de Get Code) ─────────────────────────────────────────
router.get('/code-requests', async (req, res, next) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10)  || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const filterPassed = req.query.passed; // '1' | '0' | undefined
    const filterEmail  = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const filterIp     = req.query.ip ? String(req.query.ip).trim() : null;

    const where = [];
    const args  = [];
    if (filterPassed === '1') where.push('cr.passed = 1');
    else if (filterPassed === '0') where.push('cr.passed = 0');
    if (filterEmail) { where.push('cr.email = ?'); args.push(filterEmail); }
    if (filterIp)    { where.push('cr.ip = ?');    args.push(filterIp); }
    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT cr.id, cr.email, cr.ip, cr.user_agent, cr.challenge_ids, cr.passed,
              cr.failed_count, cr.code_id, cr.created_at, ac.code AS issued_code
         FROM code_requests cr
    LEFT JOIN access_codes ac ON ac.id = cr.code_id
        ${whereSql}
     ORDER BY cr.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      args
    );

    const [[counts]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(passed = 1) AS passed,
         SUM(passed = 0) AS failed,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS last24h
       FROM code_requests`
    );

    res.json({
      ok: true,
      items: rows,
      counts: {
        total:   Number(counts.total)   || 0,
        passed:  Number(counts.passed)  || 0,
        failed:  Number(counts.failed)  || 0,
        last24h: Number(counts.last24h) || 0,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
