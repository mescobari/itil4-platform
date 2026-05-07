'use strict';
/**
 * Demo end-to-end del flujo magic-link. Toma un código disponible, lo emite
 * a un email demo, genera un token REAL no-consumido, y renderiza el email
 * con el link funcional para que se pueda completar el flujo desde el browser.
 *
 * Uso: node server/src/scripts/demo-magic-link.js [email] [name]
 *      Defaults: demo@example.com / "María Demo"
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs   = require('fs');
const path = require('path');

// Monkey-patch nodemailer ANTES de cargar email.js para capturar el HTML
let captured = null;
require('nodemailer').createTransport = () => ({
  sendMail: async (opts) => { captured = opts; return { messageId: 'preview' }; },
});
// Stub del logger de DB para que no escriba en email_log al previsualizar
require.cache[require.resolve('../db')] = {
  exports: { db: { logEmail: async () => {} } },
};

const { pool }     = require('../config/db');
const tokenService = require('../services/tokenService');
const { sendActivationCode } = require('../utils/email');

const EMAIL = (process.argv[2] || 'demo@example.com').toLowerCase();
const NAME  = process.argv[3] || 'María Demo';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

async function main() {
  console.log('━'.repeat(64));
  console.log('Demo magic-link — generando token REAL no consumido');
  console.log('━'.repeat(64));
  console.log(`Email: ${EMAIL}`);
  console.log(`Name : ${NAME}`);
  console.log();

  // Si ya existe usuario con ese email, abortar — el flujo no aplicaría
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [EMAIL]);
  if (existing.length > 0) {
    console.error(`✗ Ya existe usuario con ${EMAIL}. Usa otro email o borra primero:`);
    console.error(`    DELETE FROM users WHERE email = '${EMAIL}';`);
    await pool.end();
    process.exit(1);
  }

  // Si ya hay un token activo no consumido para ese email, lo reusamos
  // (esto permite re-ejecutar el script sin gastar más códigos)
  const [activeTok] = await pool.execute(
    `SELECT t.id, t.code_id, c.code
       FROM activation_tokens t
       JOIN access_codes c ON c.id = t.code_id
      WHERE t.email = ? AND t.consumed_at IS NULL AND t.expires_at > NOW()
      ORDER BY t.id DESC LIMIT 1`,
    [EMAIL]
  );
  if (activeTok.length > 0) {
    console.log(`⚠ Ya hay un token activo (id=${activeTok[0].id}) para ${EMAIL}.`);
    console.log('  No se puede recuperar el plaintext — está hasheado en BD.');
    console.log('  Para regenerar uno fresco, primero limpia tokens previos:');
    console.log(`    DELETE FROM activation_tokens WHERE email = '${EMAIL}';`);
    console.log('  (y opcionalmente devuelve el código al pool si no quieres gastar uno nuevo)');
    await pool.end();
    process.exit(1);
  }

  // Tomar un código disponible y emitirlo
  const conn = await pool.getConnection();
  let codeRow;
  try {
    await conn.beginTransaction();
    const [avail] = await conn.execute(
      `SELECT id, code FROM access_codes
        WHERE issued_at IS NULL AND redeemed_by IS NULL
        ORDER BY id ASC LIMIT 1 FOR UPDATE`
    );
    if (avail.length === 0) throw new Error('No hay códigos disponibles. Genera más con `npm run codes -- --count 10`.');
    codeRow = avail[0];
    await conn.execute(
      `UPDATE access_codes
          SET issued_to_email = ?, issued_at = NOW(),
              expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY)
        WHERE id = ?`,
      [EMAIL, codeRow.id]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  console.log(`[1] Código emitido: id=${codeRow.id}, code=${codeRow.code}`);

  // Generar token real
  const { rawToken, tokenId } = await tokenService.createActivationToken({
    codeId: codeRow.id, email: EMAIL, name: NAME,
  });
  console.log(`[2] Token generado: id=${tokenId}`);
  console.log(`    rawToken=${rawToken}`);

  // Renderizar el email exactamente como se enviaría
  await sendActivationCode(EMAIL, codeRow.code, { token: rawToken, name: NAME });
  if (!captured) throw new Error('No se capturó el email.');

  const outDir  = path.join(__dirname, '..', '..', 'preview');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `demo-${Date.now()}.html`);
  fs.writeFileSync(outPath, captured.html, 'utf8');

  const activateUrl = `${FRONTEND}/#/activar?t=${rawToken}`;

  console.log(`[3] Email renderizado: ${outPath}`);
  console.log();
  console.log('━'.repeat(64));
  console.log('Activate URL (copialo en el browser o abre el HTML y haz clic):');
  console.log('━'.repeat(64));
  console.log(activateUrl);
  console.log();
  console.log('Para revertir si quieres limpiar:');
  console.log(`  UPDATE access_codes SET issued_to_email=NULL, issued_at=NULL, expires_at=NULL`);
  console.log(`     WHERE id=${codeRow.id};`);
  console.log(`  DELETE FROM activation_tokens WHERE id=${tokenId};`);
  console.log(`  DELETE FROM users WHERE email='${EMAIL}';   -- si ya completaste el registro`);

  await pool.end();
}

main().catch(err => {
  console.error('\n✗ ERROR:', err.message);
  pool.end().finally(() => process.exit(1));
});
