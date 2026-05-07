'use strict';
/**
 * Renderiza un email a HTML estático sin enviarlo. Uso:
 *   node server/src/scripts/preview-email.js activation jperez@gmail.com ITIL-5B9F-JUAF
 *   node server/src/scripts/preview-email.js welcome   jperez@gmail.com "Juan Perez"
 *
 * Monkey-patcheamos nodemailer.createTransport para capturar el HTML en vez de mandarlo.
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');

let captured = null;
require('nodemailer').createTransport = () => ({
  sendMail: async (opts) => { captured = opts; return { messageId: 'preview' }; },
});
// Stub del logger de DB para que no toque MySQL al previsualizar.
require.cache[require.resolve('../db')] = {
  exports: { db: { logEmail: async () => {} } },
};

const email = require('../utils/email');

(async () => {
  const [, , kind, to, arg3] = process.argv;
  if (!kind || !to) {
    console.error('Uso: node preview-email.js <kind> <to> [arg3]');
    console.error('  kind: activation | welcome | result-pass | result-fail | lead-magnet');
    process.exit(1);
  }

  switch (kind) {
    case 'activation':
      // Sin token → flujo legacy (sólo código)
      await email.sendActivationCode(to, arg3 || 'ITIL-XXXX-XXXX');
      break;
    case 'activation-magic':
      // Con token y nombre → flujo nuevo magic-link
      await email.sendActivationCode(to, arg3 || 'ITIL-XXXX-XXXX', {
        token: 'fcca5b863f5de402746018e1b2a85b959d4795bee5c55bed5ea3a9f30d8a0f03',
        name: process.argv[5] || 'Juan Perez',
      });
      break;
    case 'welcome':
      await email.sendWelcome(to, arg3 || 'Juan Perez');
      break;
    case 'result-pass':
      await email.sendResultEmail(to, arg3 || 'Juan Perez', {
        mode: 'exam', scoreCorrect: 33, scoreTotal: 38, scorePct: 86.8,
        threshold: 84, passed: true, attemptId: 1,
      });
      break;
    case 'result-fail':
      await email.sendResultEmail(to, arg3 || 'Juan Perez', {
        mode: 'exam', scoreCorrect: 24, scoreTotal: 38, scorePct: 63.2,
        threshold: 84, passed: false, attemptId: 1,
      });
      break;
    case 'lead-magnet':
      await email.sendLeadMagnet(to, arg3 || 'Juan');
      break;
    default:
      console.error('kind desconocido:', kind);
      process.exit(1);
  }

  if (!captured) {
    console.error('No se capturo el email.');
    process.exit(1);
  }

  const outDir  = path.join(__dirname, '..', '..', 'preview');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${kind}-${Date.now()}.html`);
  fs.writeFileSync(outPath, captured.html, 'utf8');

  console.log('--- META ---');
  console.log('From   :', captured.from || process.env.EMAIL_FROM || '"Max Escobari" <soporte@mescobari.com>');
  console.log('To     :', captured.to);
  console.log('Subject:', captured.subject);
  console.log('Saved  :', outPath);
})();
