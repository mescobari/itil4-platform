'use strict';
/**
 * E2E del flujo magic-link. Toma un código disponible, lo emite a un email
 * de prueba, genera un token real, y prueba begin + complete + replay.
 *
 * Uso: node server/src/scripts/e2e-magic-link.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { pool }     = require('../config/db');
const tokenService = require('../services/tokenService');

const API   = process.env.E2E_API_BASE || 'http://localhost:3001';
const EMAIL = `e2e-magic-${Date.now()}@example.com`;
const NAME  = 'E2E Tester';
const PASS  = 'TestPass123!';

async function http(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log('━'.repeat(60));
  console.log('E2E magic-link flow');
  console.log('━'.repeat(60));
  console.log(`Test email: ${EMAIL}`);
  console.log(`Test name : ${NAME}`);
  console.log();

  // 1) Seleccionar y emitir un código disponible
  const conn = await pool.getConnection();
  let codeRow;
  try {
    await conn.beginTransaction();
    const [avail] = await conn.execute(
      `SELECT id, code FROM access_codes
        WHERE issued_at IS NULL AND redeemed_by IS NULL
        ORDER BY id ASC LIMIT 1 FOR UPDATE`
    );
    if (avail.length === 0) throw new Error('No hay códigos disponibles para el test.');
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

  // 2) Generar token directamente vía service
  const { rawToken, tokenId, expiresAt } = await tokenService.createActivationToken({
    codeId: codeRow.id, email: EMAIL, name: NAME,
  });
  console.log(`[2] Token generado: id=${tokenId}, expires=${expiresAt.toISOString()}`);
  console.log(`    URL: ${API.replace(':3001', ':5173')}/#/activar?t=${rawToken}`);
  console.log(`    rawToken=${rawToken.slice(0, 8)}…${rawToken.slice(-8)}`);

  // 3) begin-registration — read-only
  console.log('\n[3] POST /api/auth/begin-registration');
  const begin = await http('/api/auth/begin-registration', { token: rawToken });
  console.log(`    HTTP ${begin.status}`);
  console.log('    response:', JSON.stringify(begin.data, null, 2).split('\n').map(l => '      ' + l).join('\n').trim());
  if (!begin.ok) throw new Error('begin-registration falló');
  if (begin.data.email !== EMAIL) throw new Error(`Email mismatch: ${begin.data.email} ≠ ${EMAIL}`);
  if (begin.data.name !== NAME)   throw new Error(`Name mismatch: ${begin.data.name} ≠ ${NAME}`);
  if (!begin.data.codeMasked.startsWith('ITIL-•••-')) throw new Error('codeMasked no enmascara');
  if (begin.data.alreadyRegistered) throw new Error('No debe estar ya registrado');

  // 4) Repeat begin — debe seguir funcionando (no consume)
  console.log('\n[4] POST /api/auth/begin-registration (segunda vez, no consume)');
  const begin2 = await http('/api/auth/begin-registration', { token: rawToken });
  console.log(`    HTTP ${begin2.status}, ok=${begin2.ok}`);
  if (!begin2.ok) throw new Error('Begin debería ser idempotente');

  // 5) complete-registration
  console.log('\n[5] POST /api/auth/complete-registration');
  const complete = await http('/api/auth/complete-registration', { token: rawToken, password: PASS });
  console.log(`    HTTP ${complete.status}, ok=${complete.ok}`);
  if (!complete.ok) {
    console.error('    error:', complete.data);
    throw new Error('complete-registration falló');
  }
  console.log(`    user.id=${complete.data.user.id}, email=${complete.data.user.email}, hasAccess=${complete.data.user.hasAccess}`);
  console.log(`    JWT (primeros 20): ${complete.data.token.slice(0, 20)}…`);

  // 6) Verificar BD
  console.log('\n[6] Verificación BD');
  const [[userRow]]  = await pool.query('SELECT id, email, name, has_access FROM users WHERE email = ?', [EMAIL]);
  const [[codeRow2]] = await pool.query('SELECT redeemed_by, redeemed_at FROM access_codes WHERE id = ?', [codeRow.id]);
  const [[tokRow]]   = await pool.query('SELECT consumed_at, consumed_by_user_id FROM activation_tokens WHERE id = ?', [tokenId]);
  console.log('    user:', userRow);
  console.log('    code redeemed_by:', codeRow2.redeemed_by, 'at:', codeRow2.redeemed_at);
  console.log('    token consumed_at:', tokRow.consumed_at, 'by user:', tokRow.consumed_by_user_id);
  if (codeRow2.redeemed_by !== userRow.id) throw new Error('redeemed_by no coincide con user.id');
  if (tokRow.consumed_by_user_id !== userRow.id) throw new Error('token.consumed_by_user_id no coincide');

  // 7) Replay: complete-registration con mismo token → debe fallar 410
  console.log('\n[7] POST /api/auth/complete-registration (replay con token quemado)');
  const replay = await http('/api/auth/complete-registration', { token: rawToken, password: PASS });
  console.log(`    HTTP ${replay.status}, error: ${replay.data.error}`);
  if (replay.status !== 410) throw new Error(`Esperaba 410, obtuve ${replay.status}`);

  // 8) begin con token quemado → debe fallar 410
  console.log('\n[8] POST /api/auth/begin-registration (con token quemado)');
  const beginAfter = await http('/api/auth/begin-registration', { token: rawToken });
  console.log(`    HTTP ${beginAfter.status}, error: ${beginAfter.data.error}`);
  if (beginAfter.status !== 410) throw new Error(`Esperaba 410, obtuve ${beginAfter.status}`);

  console.log('\n' + '━'.repeat(60));
  console.log('✅ E2E magic-link OK — todos los pasos pasaron');
  console.log('━'.repeat(60));

  // Cleanup opcional: dejar el user de prueba creado para inspección
  console.log(`\nUser de prueba dejado en BD (email=${EMAIL}). Para borrarlo:`);
  console.log(`  DELETE FROM users WHERE email = '${EMAIL}';`);
  console.log(`  -- (FK ON DELETE SET NULL en access_codes y activation_tokens limpia las refs)\n`);

  await pool.end();
}

main().catch(err => {
  console.error('\n❌ E2E FALLÓ:', err.message);
  pool.end().finally(() => process.exit(1));
});
