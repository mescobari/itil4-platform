'use strict';
const express = require('express');
const { z }   = require('zod');
const router  = express.Router();

const requireAuth     = require('../middleware/requireAuth');
const requireAccess   = require('../middleware/requireAccess');
const validate        = require('../middleware/validate');
const attemptService  = require('../services/attemptService');

router.use(requireAuth, requireAccess);

// ─── Crear intento ────────────────────────────────────────────────────────────
const createSchema = z.object({
  examSlug: z.string().min(1).max(60),
  mode:     z.enum(['practice', 'exam']),
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const result = await attemptService.createAttempt({
      userId:   req.user.id,
      examSlug: req.body.examSlug,
      mode:     req.body.mode,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── Historial del usuario ────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const items = await attemptService.listUserAttempts(req.user.id);
    res.json({ ok: true, items });
  } catch (err) { next(err); }
});

// ─── Estado de un intento ─────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    const state = await attemptService.getState({ attemptId: id, userId: req.user.id });
    res.json({ ok: true, attempt: state });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── Pregunta dentro de un intento ────────────────────────────────────────────
router.get('/:id/question/:qid', async (req, res, next) => {
  try {
    const id  = parseInt(req.params.id, 10);
    const qid = parseInt(req.params.qid, 10);
    if (!id || !qid) return res.status(400).json({ error: 'IDs inválidos.' });
    const reveal = req.query.reveal === '1';
    const q = await attemptService.getQuestion({
      attemptId: id, userId: req.user.id, questionId: qid, reveal,
    });
    res.json({ ok: true, question: q });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── Guardar respuesta parcial ───────────────────────────────────────────────
const answerSchema = z.object({
  questionId: z.number().int().positive(),
  letter:     z.enum(['A', 'B', 'C', 'D']),
});

router.post('/:id/answer', validate(answerSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    const r = await attemptService.recordAnswer({
      attemptId: id, userId: req.user.id,
      questionId: req.body.questionId, letter: req.body.letter,
    });
    res.json({ ok: true, ...r });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── Submit ───────────────────────────────────────────────────────────────────
router.post('/:id/submit', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    const r = await attemptService.submitAttempt({ attemptId: id, userId: req.user.id });
    res.json({ ok: true, ...r });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── Review post-submit ───────────────────────────────────────────────────────
router.get('/:id/review', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido.' });
    const data = await attemptService.getReview({ attemptId: id, userId: req.user.id });
    res.json({ ok: true, ...data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

module.exports = router;
