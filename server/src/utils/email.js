'use strict';
const nodemailer = require('nodemailer');
const { db }     = require('../db');

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || '"Max Escobari" <soporte@mescobari.com>';
const BASE = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function send(to, subject, html, type = 'general') {
  try {
    await transport.sendMail({ from: FROM, to, subject, html });
    await db.logEmail({ to_email: to, subject, type, success: 1 });
    console.log(`[EMAIL] ✅ Sent "${subject}" → ${to}`);
  } catch (err) {
    try { await db.logEmail({ to_email: to, subject, type, success: 0 }); } catch (_) {}
    console.error(`[EMAIL] ❌ Failed → ${to}:`, err.message);
    // Don't rethrow — email failure should not break the request
  }
}

const base = (content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body{margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;color:#1F2937;}
    .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
    .header{background:linear-gradient(135deg,#6B2D91,#8B5CF6);padding:40px 32px;text-align:center;}
    .header h1{margin:0;color:#fff;font-size:24px;font-weight:800;}
    .header p{margin:8px 0 0;color:rgba(255,255,255,.8);font-size:14px;}
    .body{padding:32px;}
    .body p{line-height:1.7;margin:0 0 16px;}
    .btn{display:inline-block;padding:14px 32px;background:#FF6B35;color:#fff!important;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;margin:16px 0;}
    .box{background:#F3EEFF;border-left:4px solid #6B2D91;border-radius:8px;padding:16px 20px;margin:16px 0;}
    .footer{background:#1a0033;padding:24px 32px;text-align:center;color:rgba(255,255,255,.5);font-size:12px;}
    .footer a{color:rgba(255,255,255,.6);text-decoration:none;}
    .stars{color:#f59e0b;font-size:20px;letter-spacing:2px;}
  </style>
</head>
<body>
  <div style="padding:24px 16px;">
    <div class="wrap">${content}</div>
  </div>
</body>
</html>`;

const footer = () => `
<div class="footer">
  <p>© ${new Date().getFullYear()} Ing. Max Escobari Quiroga · <a href="${BASE}">mescobari.com</a></p>
  <p>Para cancelar suscripción: <a href="#">clic aquí</a> · <a href="#">Soporte</a></p>
  <p style="font-size:10px;margin-top:8px;">ITIL® es marca registrada de AXELOS Limited. Sin afiliación oficial.</p>
</div>`;

// ─── Email 1: Lead Magnet delivery ────────────────────────────────────────────
async function sendLeadMagnet(to, name) {
  const subject = '🎁 Tus PDFs gratuitos de ITIL 4 están aquí';
  const html = base(`
    <div class="header">
      <h1>¡Hola, ${name}! 👋</h1>
      <p>Tus recursos de estudio gratuitos te esperan</p>
    </div>
    <div class="body">
      <p>Me alegra mucho que hayas dado el primer paso hacia tu certificación ITIL 4.</p>
      <p>Aquí tienes los dos PDFs que prometí:</p>
      <div class="box">
        <strong>📋 Checklist: Los 7 Días Previos al Examen</strong><br/>
        <small>El plan exacto para llegar en óptimas condiciones al día del examen.</small>
      </div>
      <div class="box">
        <strong>📖 Glosario de Términos Clave de ITIL 4</strong><br/>
        <small>Los 80+ términos que sí o sí aparecen en el examen, con definiciones claras.</small>
      </div>
      <p style="text-align:center">
        <a class="btn" href="${BASE}/#/ventas?ref=email1">
          📥 Descargar mis PDFs Gratis
        </a>
      </p>
      <p>En los próximos días te enviaré más recursos de estudio. Pero si estás decidido a certificarte pronto, hay una forma más rápida:</p>
      <p style="text-align:center">
        <a href="${BASE}/#/ventas" style="color:#6B2D91;font-weight:600;">
          → Ver la guía completa con 40 exámenes tipo resueltos
        </a>
      </p>
      <p>Cualquier pregunta, responde este email directamente.</p>
      <p>¡A certificarse! 🏆<br/><strong>Max Escobari</strong><br/><small>ITIL® Certified Professional</small></p>
    </div>
    ${footer()}
  `);
  await send(to, subject, html, 'lead_magnet');
}

// ─── Email 2: Day 2 — Testimonio ──────────────────────────────────────────────
async function sendLeadDay2(to, name) {
  const subject = '📊 Carlos aprobó ITIL 4 con 87%... así lo hizo';
  const html = base(`
    <div class="header">
      <h1>${name}, mira este resultado 👇</h1>
      <p>Una historia real que te va a motivar</p>
    </div>
    <div class="body">
      <div class="box">
        <div class="stars">★★★★★</div>
        <p style="margin:8px 0 4px;font-style:italic;">"Estudié con este libro durante 4 semanas y aprobé con 87%. Las explicaciones de cada pregunta son lo que realmente marca la diferencia — entiendes por qué está bien o mal, no solo memorizas."</p>
        <small>— <strong>Carlos R.</strong>, IT Service Manager · Lima, Perú</small>
      </div>
      <p>Lo que Carlos hizo diferente fue simple: usó un método.</p>
      <p>No estudió más horas. Estudió de forma diferente, con material que explica el <em>razonamiento</em> del examinador.</p>
      <p>El libro tiene exactamente eso: 40 preguntas tipo con análisis completo de cada opción.</p>
      <p style="text-align:center">
        <a class="btn" href="${BASE}/#/ventas">
          🎯 Ver el contenido completo del libro
        </a>
      </p>
      <p>¿Tienes alguna duda sobre si este material es para ti? Responde este email y te ayudo personalmente.</p>
      <p>Saludos,<br/><strong>Max</strong></p>
    </div>
    ${footer()}
  `);
  await send(to, subject, html, 'lead_day2');
}

// ─── Email 3: Day 4 — Contenido del libro ─────────────────────────────────────
async function sendLeadDay4(to, name) {
  const subject = '📚 Por dentro: qué incluye el libro de ITIL 4';
  const html = base(`
    <div class="header">
      <h1>¿Qué hay dentro del libro?</h1>
      <p>Un desglose honesto para que decidas con información</p>
    </div>
    <div class="body">
      <p>Hola ${name},</p>
      <p>Muchos me preguntan exactamente qué incluye el libro antes de comprarlo. Respuesta directa:</p>
      <div class="box"><strong>📅 Capítulo 1 – Plan de 4 Semanas</strong><br/>Un plan día a día con objetivos claros. Semana 1: fundamentos. Semana 2: SVS y prácticas. Semana 3: simulacros intensivos. Semana 4: estrategia final.</div>
      <div class="box"><strong>🧠 Capítulo 2 – Fundamentos Técnicos</strong><br/>Los 7 principios guía, las 4 dimensiones, la cadena de valor, y las 14 prácticas explicadas con analogías reales. Sin jerga innecesaria.</div>
      <div class="box"><strong>✅ Capítulo 3 – Solucionario de 40 Preguntas</strong><br/>Cada pregunta tiene: respuesta correcta, análisis de las 4 opciones, y la "trampa mental" que usa el examinador. Esto es lo que más diferencia al libro.</div>
      <p>Todo esto por <strong>$37 USD</strong> (precio normal: $97).</p>
      <p style="text-align:center">
        <a class="btn" href="${BASE}/#/ventas">🚀 Quiero el libro completo →</a>
      </p>
      <p>La oferta especial expira pronto. Cualquier consulta, estoy aquí.</p>
      <p><strong>Max</strong></p>
    </div>
    ${footer()}
  `);
  await send(to, subject, html, 'lead_day4');
}

// ─── Email 4: Day 7 — Oferta final ────────────────────────────────────────────
async function sendLeadDay7(to, name) {
  const subject = '⏰ Última oportunidad — Oferta termina hoy';
  const html = base(`
    <div class="header">
      <h1>Hoy es el último día, ${name}</h1>
      <p>La oferta especial termina a medianoche</p>
    </div>
    <div class="body">
      <p>Esta semana te compartí recursos gratis, testimonios reales y el contenido del libro.</p>
      <p>Hoy quiero ser directo contigo:</p>
      <p style="font-size:18px;font-weight:700;color:#6B2D91;">¿Cuánto vale para ti aprobar la certificación ITIL 4?</p>
      <p>Un aumento salarial promedio tras certificarte en ITIL 4: <strong>+15% a +30%</strong>.</p>
      <p>El costo de reprobar el examen: <strong>$250+ USD</strong> solo en fees.</p>
      <p>El costo del libro: <strong>$37 USD hoy</strong>. Un café por semana.</p>
      <div class="box" style="text-align:center;border-color:#FF6B35;">
        <p style="font-size:32px;font-weight:900;color:#FF6B35;margin:0;">$37 USD</p>
        <p style="margin:4px 0 0;font-size:13px;color:#666;">Precio normal: <s>$97 USD</s> · Solo hoy</p>
      </div>
      <p style="text-align:center">
        <a class="btn" href="${BASE}/#/ventas">🏆 Sí, quiero certificarme →</a>
      </p>
      <p>Si decides que no es para ti, lo entiendo. Pero si hay una parte de ti que sabe que quieres avanzar en tu carrera… este es el momento.</p>
      <p>Con todo el apoyo,<br/><strong>Max Escobari</strong></p>
    </div>
    ${footer()}
  `);
  await send(to, subject, html, 'lead_day7');
}

// ─── Activation code (Get Code / admin issue-manual) ─────────────────────────
// Si `opts.token` viene (flujo Get Code), el CTA primario es magic-link a
// /#/activar?t=<token> donde solo se pide password (email + name pre-rellenados
// por el backend desde el token). Caso emisión manual del admin, no hay token y
// se cae al flujo legacy /#/registro?code=XXX (el usuario tipea email/name a mano).
async function sendActivationCode(to, code, opts = {}) {
  const magicLink  = opts.token ? `${BASE}/#/activar?t=${encodeURIComponent(opts.token)}` : null;
  const legacyLink = `${BASE}/#/registro?code=${encodeURIComponent(code)}`;
  const primaryLink = magicLink || legacyLink;
  const greeting    = opts.name ? `Hola ${opts.name},` : 'Hola,';
  const subject     = '🔑 Tu código de acceso al simulador ITIL 4';
  const intro = opts.manual
    ? 'Hemos emitido manualmente un código de acceso para ti.'
    : 'Has pasado la verificación. Aquí está tu acceso al simulador.';

  // Bloque secundario con el código en texto: solo lo mostramos como fallback.
  // En el flujo magic-link, el código real es opcional para el usuario — el
  // backend ya lo conoce. Lo dejamos por si el botón falla en algún cliente.
  const fallbackBlock = magicLink ? `
      <p style="font-size:13px;color:#6b7280;margin-top:24px;text-align:center;">
        ¿Problemas con el botón? También puedes
        <a href="${legacyLink}" style="color:#6B2D91;font-weight:600;">activar manualmente con tu código</a>:<br/>
        <span style="font-family:'Courier New',monospace;font-size:14px;letter-spacing:1px;color:#1F2937;">${code}</span>
      </p>
  ` : `
      <div class="box" style="text-align:center;border-color:#FF6B35;background:#fff7ed;">
        <p style="margin:0 0 4px;font-size:13px;color:#7c2d12;">Tu código:</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:26px;font-weight:900;color:#1F2937;letter-spacing:2px;">
          ${code}
        </p>
      </div>
  `;

  const html = base(`
    <div class="header">
      <h1>Tu acceso al simulador 🔑</h1>
      <p>Simulador de Examen ITIL 4 Foundation</p>
    </div>
    <div class="body">
      <p>${greeting}</p>
      <p>${intro}</p>
      ${magicLink ? '' : fallbackBlock}
      <p style="text-align:center">
        <a class="btn" href="${primaryLink}">🚀 Activar mi cuenta ahora</a>
      </p>
      ${magicLink ? '<p style="font-size:13px;color:#6b7280;text-align:center;">Solo necesitas crear tu contraseña — tus datos ya están listos.</p>' : ''}
      <p style="font-size:13px;color:#6b7280;">
        Tu acceso es de un solo uso y queda ligado a este email.
        Tienes <strong>30 días</strong> para activarlo.
      </p>
      ${magicLink ? fallbackBlock : ''}
      <p>Cualquier problema, responde este email.</p>
      <p>¡Éxitos en el simulador! 🏆<br/><strong>Max Escobari</strong></p>
    </div>
    ${footer()}
  `);
  await send(to, subject, html, opts.manual ? 'activation_code_manual' : 'activation_code');
}

// ─── Welcome (post-registro) ─────────────────────────────────────────────────
async function sendWelcome(to, name) {
  const subject = '✅ Bienvenido al simulador ITIL 4';
  const html = base(`
    <div class="header">
      <h1>¡Bienvenido, ${name}! 🎓</h1>
      <p>Tu cuenta del simulador está lista</p>
    </div>
    <div class="body">
      <p>Tu acceso al simulador ITIL 4 Foundation ya está activo.</p>
      <div class="box">
        <strong>📋 Modo Práctica:</strong> ideal para repasar — verás la respuesta correcta y la justificación al instante.<br/>
        <strong>📝 Modo Examen:</strong> simulación real — 38 preguntas en 60 minutos, evaluación al final.
      </div>
      <p style="text-align:center">
        <a class="btn" href="${BASE}/#/dashboard">🚀 Entrar al simulador</a>
      </p>
      <p>Recomendación: empieza con el modo Práctica para familiarizarte con la temática y los formatos. Cuando te sientas con confianza, pasa al modo Examen para evaluar tu nivel real.</p>
      <p>¿Cualquier duda, problema o feedback? Responde este email directamente.</p>
      <p>¡Éxitos en tu certificación! 🏆<br/><strong>Max Escobari</strong></p>
    </div>
    ${footer()}
  `);
  await send(to, subject, html, 'welcome');
}

// ─── Resultado de intento ────────────────────────────────────────────────────
async function sendResultEmail(to, name, summary) {
  // summary: { mode, scoreCorrect, scoreTotal, scorePct, threshold, passed, attemptId }
  const passed   = summary.passed;
  const isExam   = summary.mode === 'exam';
  const subject  = passed
    ? `🎉 ¡Aprobaste! ${summary.scoreCorrect}/${summary.scoreTotal} en el simulador ITIL 4`
    : `📊 Tu resultado del simulador: ${summary.scoreCorrect}/${summary.scoreTotal}`;
  const reviewUrl = `${BASE}/#/resultado/${summary.attemptId}`;
  const html = base(`
    <div class="header" style="background:linear-gradient(135deg,${passed ? '#10b981,#059669' : '#6B2D91,#8B5CF6'});">
      <h1>${passed ? '¡Aprobaste el simulador!' : 'Resultado disponible'} ${passed ? '🎉' : '📊'}</h1>
      <p>${isExam ? 'Modo Examen' : 'Modo Práctica'} · ${name}</p>
    </div>
    <div class="body">
      <div class="box" style="text-align:center;border-color:${passed ? '#10b981' : '#FF6B35'};">
        <p style="margin:0 0 4px;font-size:13px;color:#7c2d12;">Tu puntaje:</p>
        <p style="margin:0;font-size:38px;font-weight:900;color:${passed ? '#10b981' : '#FF6B35'};">
          ${summary.scoreCorrect}/${summary.scoreTotal}
        </p>
        <p style="margin:8px 0 0;font-size:14px;color:#666;">
          ${summary.scorePct.toFixed(1)}% · Umbral: ${summary.threshold}%
        </p>
      </div>
      <p>${passed
        ? '¡Excelente! Tu resultado supera el umbral aprobatorio. Estás en buen camino para la certificación oficial.'
        : 'No alcanzaste el umbral esta vez. Revisa las preguntas que erraste — la mejora viene de entender el porqué.'}</p>
      <p style="text-align:center">
        <a class="btn" href="${reviewUrl}">📖 Ver review completa con justificaciones</a>
      </p>
      <p>Cualquier consulta, responde este email.</p>
      <p><strong>Max Escobari</strong></p>
    </div>
    ${footer()}
  `);
  await send(to, subject, html, passed ? 'result_passed' : 'result_failed');
}

module.exports = {
  sendLeadMagnet,
  sendLeadDay2,
  sendLeadDay4,
  sendLeadDay7,
  sendActivationCode,
  sendWelcome,
  sendResultEmail,
};
