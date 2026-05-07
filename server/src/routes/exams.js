'use strict';
const express = require('express');
const router  = express.Router();

const requireAuth   = require('../middleware/requireAuth');
const requireAccess = require('../middleware/requireAccess');
const examService   = require('../services/examService');

router.use(requireAuth, requireAccess);

router.get('/', async (_req, res, next) => {
  try {
    const items = await examService.listExams();
    res.json({ ok: true, items });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const exam = await examService.getExamBySlug(req.params.slug);
    if (!exam) return res.status(404).json({ error: 'Examen no encontrado.' });
    res.json({ ok: true, exam });
  } catch (err) { next(err); }
});

module.exports = router;
