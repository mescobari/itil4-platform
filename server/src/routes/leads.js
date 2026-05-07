'use strict';
const express = require('express');
const router  = express.Router();
const { db }             = require('../db');
const { sendLeadMagnet } = require('../utils/email');

// POST /api/leads
router.post('/', async (req, res, next) => {
  try {
    const { name, email, whatsapp, timeline, consent } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: 'Nombre y email son requeridos.' });
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email))
      return res.status(400).json({ error: 'Email inválido.' });

    const cleanEmail = email.trim().toLowerCase();
    const ip = req.ip || '';

    if (!(await db.findLead(cleanEmail))) {
      await db.insertLead({
        name: name.trim(), email: cleanEmail,
        whatsapp: whatsapp ? whatsapp.trim() : null,
        timeline: timeline || null, consent: consent ? 1 : 0,
        source: req.body.source || 'landing', ip,
      });
    }

    await sendLeadMagnet(cleanEmail, name.trim());
    res.json({ ok: true, message: 'Revisa tu bandeja — recibirás los PDFs en 5 minutos.' });
  } catch (err) { next(err); }
});

// GET /api/leads/count
router.get('/count', async (_req, res) => {
  try {
    const total = (await db.countLeads()) + 1000;
    res.json({ total });
  } catch (_) { res.json({ total: 1000 }); }
});

module.exports = router;
