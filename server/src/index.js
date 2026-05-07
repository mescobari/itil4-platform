'use strict';
require('dotenv').config();

const path      = require('path');
const fs        = require('fs');
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const { initDb }     = require('./db');
const leadsRouter    = require('./routes/leads');
const authRouter     = require('./routes/auth');
const accessRouter   = require('./routes/access');
const examsRouter    = require('./routes/exams');
const attemptsRouter = require('./routes/attempts');
const adminRouter    = require('./routes/admin');

// ─── App ──────────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// En producción Hostinger pone Apache delante (reverse proxy). Trust proxy=1
// hace que req.ip y X-Forwarded-* lleguen bien al rate limiter y a `ipOf`.
// En dev sin proxy delante es no-op, así que es seguro dejarlo siempre.
app.set('trust proxy', 1);

// ─── Security ─────────────────────────────────────────────────────────────────
// CSP relajado: la app sirve HTML+JS+CSS desde el mismo origen. Permitimos
// 'self' para scripts/styles/imgs/fonts, más data: para SVG inline e imágenes
// embebidas. unsafe-inline en style se necesita porque algunos componentes
// (lucide, gradientes Tailwind 4) emiten estilos inline.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
      frameAncestors: ["'none'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'https:'],
      fontSrc:     ["'self'", 'data:'],
      connectSrc:  ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  strictTransportSecurity: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: false } : false,
  referrerPolicy: { policy: 'no-referrer' },
}));
app.disable('x-powered-by');

// CORS solo importa en dev (cuando frontend corre en :5173 separado).
// En prod frontend y backend son el mismo origen → CORS es no-op.
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 1 minuto.' },
  skipSuccessfulRequests: true,
});

const accessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas solicitudes. Vuelve a intentar más tarde.' },
});

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/leads', apiLimiter, leadsRouter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', apiLimiter, authRouter);
app.use('/api/access', accessLimiter, accessRouter);
app.use('/api/exams', apiLimiter, examsRouter);
app.use('/api/attempts', apiLimiter, attemptsRouter);
app.use('/api/admin', apiLimiter, adminRouter);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Static frontend (SOLO en producción) ────────────────────────────────────
// Gateado estrictamente por NODE_ENV. En dev queremos que Vite (puerto 5173)
// sirva el frontend con HMR — Express acá solo atiende /api/*. Para probar
// el build de prod localmente, usa: `npm run start:prod` (que setea NODE_ENV).
if (isProd) {
  const distPath  = path.join(__dirname, '..', '..', 'dist');
  const distIndex = path.join(distPath, 'index.html');
  if (!fs.existsSync(distIndex)) {
    console.error('[FATAL] NODE_ENV=production pero no existe dist/index.html. Ejecuta `npm run build` primero.');
    process.exit(1);
  }
  app.use(express.static(distPath, {
    // Vite emite assets con hash en el nombre → cacheables por 1 año
    setHeaders(res, filePath) {
      if (/\.(js|css|woff2?|ttf|eot|png|jpg|svg|webp)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));
  // Catch-all SPA: cualquier ruta no-/api devuelve index.html.
  // (Aunque usamos HashRouter, esto cubre links directos a /algo.)
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(distIndex);
  });
  console.log('[STATIC] Sirviendo frontend desde', distPath);
} else {
  console.log('[STATIC] Modo dev — Express solo sirve /api/* (Vite atiende :5173)');
}

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
(async () => {
  try {
    await initDb();
  } catch (err) {
    console.error('[FATAL] No se pudo conectar a MySQL:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    const url = isProd ? `(producción, puerto ${PORT})` : `http://localhost:${PORT}`;
    console.log(`\n🚀 ITIL4 Server corriendo en ${url}\n`);
  });
})();
