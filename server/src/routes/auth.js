'use strict';
const express = require('express');
const { z }   = require('zod');
const router  = express.Router();

const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');
const authService = require('../services/authService');

const registerSchema = z.object({
  email:          z.string().email('Email inválido.').max(255),
  name:           z.string().min(1, 'Nombre requerido.').max(120),
  password:       z.string().min(8, 'Mínimo 8 caracteres.').max(200),
  activationCode: z.string().min(4).max(40),
});

const loginSchema = z.object({
  email:    z.string().email('Email inválido.').max(255),
  password: z.string().min(1, 'Contraseña requerida.').max(200),
});

// Magic-link: 64 hex chars (32 bytes hex)
const beginSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, 'Token inválido.'),
});

const completeSchema = z.object({
  token:    z.string().regex(/^[a-f0-9]{64}$/i, 'Token inválido.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.').max(200),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// ─── Magic-link flow ─────────────────────────────────────────────────────────
// begin-registration: read-only, devuelve email + name pre-rellenados.
// complete-registration: crea user, canjea código, quema token (single-use).
router.post('/begin-registration', validate(beginSchema), async (req, res, next) => {
  try {
    const result = await authService.beginRegistration(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/complete-registration', validate(completeSchema), async (req, res, next) => {
  try {
    const result = await authService.completeRegistration(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
