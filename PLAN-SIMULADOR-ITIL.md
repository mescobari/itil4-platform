# Plan — Simulador de Exámenes ITIL v4

## Context

El proyecto `itil4-funnel` ya vende el libro ITIL 4 Foundation vía Amazon KDP (la migración previa eliminó PayPal/Hotmart). Ahora se necesita extender la plataforma con un **simulador de exámenes** accesible solo para quienes compraron el libro. Como Amazon KDP no expone API de validación de compra, el control de acceso debe ser independiente — se entrega vía **códigos de activación impresos dentro del libro KDP**.

El simulador debe ofrecer dos modos (Práctica / Examen 60 min), persistir progreso e historial, y tener un panel admin mínimo para que el dueño del producto gestione códigos, usuarios e intentos. La fuente de las 40 preguntas es un `.doc` binario que se convertirá una sola vez a JSON versionable.

**Resultado esperado:** un MVP funcional sin romper el funnel de ventas existente, con auth propia (email + password), MySQL como BD, y separación clara entre el módulo "ventas" (público) y el módulo "simulador" (autenticado).

---

## Decisiones tomadas (del usuario)

| Tema | Elección |
|---|---|
| Validación de compra | **Flujo "Get Code" con challenge:** el libro KDP contiene una página instructiva que dirige al lector a `/#/get-code` en la web. Allí el lector responde un *challenge* compuesto por 3 preguntas elegidas al azar de un pool, cuyas respuestas solo están en páginas específicas del libro. Si pasa → el sistema entrega un código único de un solo uso al email del lector. Luego ese código se canjea en `/#/registro`. (KDP no permite codigos únicos por copia — cada copia es idéntica — así que esta es la forma realista de probar tenencia del libro.) |
| Base de datos | **MySQL** |
| Carga de preguntas | Convertir `.doc` → `.docx` → JSON una vez con `mammoth`, commitear el JSON, seedear la BD |
| Alcance MVP | 1 simulador + admin mínimo (generar códigos, gestionar challenges, ver usuarios/intentos, resetear, ver log de solicitudes de código) |

## Asunciones (defaults razonables, mencionados aquí para que las desafíes si quieres)

- **Auth:** JWT firmado en el backend, almacenado en `localStorage` del frontend, expiración 7 días. Passwords con `bcrypt` (costo 10).
- **Nota aprobatoria:** 65% (26/40 correctas) — estándar oficial ITIL 4 Foundation.
- **Modo examen:** orden de preguntas aleatorizado por intento, tiempo 60 min, sin volver a preguntas previas.
- **Modo práctica:** orden secuencial, navegación libre, ver respuesta + justificación al instante o al final (toggle).
- **Cada código de activación:** un solo uso, queda ligado al primer email que lo canjea. Si el usuario pierde acceso → soporte manual.
- **Dominio admin:** el primer usuario que se registre con un email específico (`ADMIN_EMAIL` en `.env`) recibe `is_admin=true` automáticamente. No hay UI de gestión de admins.
- **Solo español** (sin multi-idioma).
- **Challenge del Get Code:** pool inicial de 20–30 preguntas con respuesta esperada (palabra/frase corta). Cada solicitud presenta 3 elegidas al azar; el lector debe acertar las 3. Las respuestas se comparan **normalizadas** (lowercase, trim, sin acentos, sin signos) para tolerar errores menores de tipeo.
- **Anti-abuso del Get Code:** rate limit por IP (3 solicitudes/hora) y por email (1 solicitud cada 24h, 1 código emitido por email salvo override admin), CAPTCHA en producción (Cloudflare Turnstile — gratis, sin acuerdos de privacidad invasivos), código entregado **solo por email** (no se muestra en pantalla — añade fricción al compartir y crea paper trail), expiración del código emitido a 30 días si no se canjea.

---

## Modelo de datos — MySQL

10 tablas. Conservamos las 2 actuales (`leads`, `email_log`) migrándolas de JSON a MySQL para unificar storage.

```
users
  id              INT PK AUTO_INCREMENT
  email           VARCHAR(255) UNIQUE NOT NULL
  password_hash   VARCHAR(255) NOT NULL
  name            VARCHAR(120) NOT NULL
  is_admin        BOOLEAN DEFAULT FALSE
  has_access      BOOLEAN DEFAULT FALSE     -- true tras canjear código
  activation_code VARCHAR(40) NULL          -- código que canjeó (FK lógica a access_codes.code)
  created_at      DATETIME DEFAULT NOW()

access_codes
  id              INT PK AUTO_INCREMENT
  code            VARCHAR(40) UNIQUE NOT NULL   -- ej. ITIL-A1B2-C3D4
  issued_to_email VARCHAR(255) NULL              -- email al que se envió tras pasar el challenge
  issued_at       DATETIME NULL                  -- cuándo se entregó por email
  expires_at      DATETIME NULL                  -- 30 días desde issued_at
  redeemed_by     INT NULL FK→users.id
  redeemed_at     DATETIME NULL
  notes           VARCHAR(255) NULL              -- lote, edición del libro, etc.
  created_at      DATETIME DEFAULT NOW()
  -- Estados implícitos:
  --   "available"  → issued_at IS NULL  (en el pool, listo para asignar)
  --   "issued"     → issued_at NOT NULL AND redeemed_by IS NULL
  --   "redeemed"   → redeemed_by NOT NULL
  --   "expired"    → issued_at NOT NULL AND redeemed_by IS NULL AND expires_at < NOW()

book_challenges
  id           INT PK AUTO_INCREMENT
  question     VARCHAR(500) NOT NULL    -- ej. "¿Qué palabra aparece en negrita en la página 47?"
  answer_norm  VARCHAR(120) NOT NULL    -- respuesta esperada NORMALIZADA (lower/trim/sin acentos/sin signos)
  page_ref     VARCHAR(40) NULL         -- referencia interna para el admin: "p.47", "cap.3"
  active       BOOLEAN DEFAULT TRUE
  created_at   DATETIME DEFAULT NOW()

code_requests
  id            INT PK AUTO_INCREMENT
  email         VARCHAR(255) NOT NULL
  ip            VARCHAR(45)  NOT NULL
  user_agent    VARCHAR(255) NULL
  challenge_ids JSON         NOT NULL   -- [12,5,18] IDs presentados en este request
  passed        BOOLEAN      NOT NULL
  failed_count  TINYINT      NULL       -- 0–3 (cuántas respondió mal); NULL si pasó
  code_id       INT          NULL FK→access_codes.id   -- código emitido si passed
  created_at    DATETIME     DEFAULT NOW()
  INDEX idx_email_time (email, created_at)
  INDEX idx_ip_time    (ip, created_at)

exams
  id           INT PK
  slug         VARCHAR(60) UNIQUE       -- 'itil4-foundation-v1'
  title        VARCHAR(200)
  description  TEXT
  total_questions     INT  DEFAULT 40
  pass_threshold_pct  INT  DEFAULT 65
  time_limit_minutes  INT  DEFAULT 60
  created_at   DATETIME DEFAULT NOW()

questions
  id            INT PK
  exam_id       INT FK→exams.id
  position      INT             -- orden canónico (no el del intento)
  statement     TEXT NOT NULL
  justification TEXT NOT NULL   -- explicación de la respuesta correcta
  topic         VARCHAR(120) NULL

answers
  id           INT PK
  question_id  INT FK→questions.id
  letter       CHAR(1)    -- 'A','B','C','D'
  text         TEXT NOT NULL
  is_correct   BOOLEAN DEFAULT FALSE
  UNIQUE(question_id, letter)

attempts
  id           INT PK
  user_id      INT FK→users.id
  exam_id      INT FK→exams.id
  mode         ENUM('practice','exam')
  status       ENUM('in_progress','submitted','expired')
  started_at   DATETIME DEFAULT NOW()
  submitted_at DATETIME NULL
  time_limit_seconds INT NULL          -- snapshot del límite al iniciar
  question_order JSON NOT NULL         -- [3,7,1,...] IDs en orden de presentación
  score_correct  INT NULL
  score_pct      DECIMAL(5,2) NULL
  passed         BOOLEAN NULL

attempt_answers
  id              INT PK
  attempt_id      INT FK→attempts.id
  question_id     INT FK→questions.id
  selected_letter CHAR(1) NULL    -- NULL si quedó sin responder
  is_correct      BOOLEAN NULL
  answered_at     DATETIME NULL
  UNIQUE(attempt_id, question_id)

leads             -- migrado tal cual desde JSON actual
  id, name, email, whatsapp, timeline, consent, source, ip, created_at

email_log         -- migrado tal cual desde JSON actual
  id, to_email, subject, type, success, created_at
```

Una vista `attempt_summary` (o query reutilizable) calcula stats por usuario para el dashboard.

---

## Stack añadido

**Backend** (`server/`):
- `mysql2` — driver async MySQL con prepared statements
- `bcryptjs` — hashing de passwords (no requiere build nativo, simplifica deploy en Windows)
- `jsonwebtoken` — JWT
- `zod` — validación de payloads en endpoints
- `mammoth` — convertir `.docx` → texto/HTML estructurado (solo dependencia de dev/script)

**Frontend** (`src/`):
- Sin librerías nuevas. Reusamos React Router, Tailwind, Lucide. Para el formulario admin de generación de códigos basta el stack actual.

---

## Endpoints backend

Bajo `/api`, montados con `apiLimiter`. Auth = JWT en header `Authorization: Bearer <token>`.

```
PUBLIC (sin auth)
GET    /api/access/challenge       → { sessionId, questions: [{id, question}, ... x3] }
                                     -- elige 3 challenges activos al azar, devuelve sessionId firmado
POST   /api/access/redeem          { sessionId, answers: [{id, answer}, ... x3], email, captchaToken? }
                                     -- valida 3/3, rate-limit, anti-bot, marca code_requests, asigna y envía código por email
                                     -- responde 200 { ok: true, message } SIN exponer el código (va por email)
                                     -- responde 429 si rate-limited, 400 si fallaron respuestas (con failed_count)

POST   /api/auth/register       { email, name, password, activationCode }
POST   /api/auth/login          { email, password } → { token, user }
GET    /api/auth/me             → { user } (requiere token)

USER (requiere token + has_access)
GET    /api/exams               → lista de exámenes disponibles
GET    /api/exams/:slug         → detalle (sin respuestas correctas)
POST   /api/attempts            { examSlug, mode } → crea intento, devuelve { attemptId, questionOrder, timeLimit }
GET    /api/attempts/:id        → estado actual del intento (sin marcar correctas en modo examen)
POST   /api/attempts/:id/answer { questionId, letter } → guarda respuesta parcial
POST   /api/attempts/:id/submit → cierra intento, calcula score, devuelve resultado completo (con respuestas correctas + justificaciones)
GET    /api/attempts            → historial del usuario (lista de intentos pasados)
GET    /api/attempts/:id/review → revisión post-submit (preguntas + tu respuesta + correcta + justificación)

ADMIN (requiere token + is_admin)
POST   /api/admin/codes              { count, notes? } → pre-genera N códigos al pool (sin issued_to_email)
GET    /api/admin/codes              → lista paginada filtrable (available / issued / redeemed / expired)
POST   /api/admin/codes/issue-manual { email, notes? } → emite un código a un email saltándose el challenge (uso de soporte)
GET    /api/admin/users              → lista de usuarios + #intentos + último score
POST   /api/admin/users/:id/reset    → marca todos los intentos como descartados (no destructivo)
GET    /api/admin/challenges         → lista pool completo
POST   /api/admin/challenges         { question, answer, page_ref? } → crea challenge (normaliza answer al guardar)
PATCH  /api/admin/challenges/:id     { question?, answer?, active? }
DELETE /api/admin/challenges/:id     (soft: marca active=false)
GET    /api/admin/code-requests      → log de solicitudes de Get Code (último N, filtros: passed, email, ip)
GET    /api/admin/stats              → resumen: usuarios, códigos por estado, intentos, % aprobados, # solicitudes Get Code (24h/7d), tasa de éxito del challenge

EXISTENTES (no se tocan)
POST   /api/leads
GET    /api/leads/count
GET    /api/health
```

**Middleware nuevos** (en `server/src/middleware/`):
- `requireAuth.js` — extrae JWT, carga `req.user`
- `requireAccess.js` — exige `req.user.has_access`
- `requireAdmin.js` — exige `req.user.is_admin`
- `validate.js` — wrapper de `zod` para schemas de payload

---

## Estructura de archivos a crear

### Backend (`server/src/`)
```
config/
  db.js                 -- pool mysql2 con prepared statements (reusable)
  jwt.js                -- sign/verify helpers

middleware/
  requireAuth.js
  requireAccess.js
  requireAdmin.js
  validate.js

routes/
  access.js             -- /access/challenge, /access/redeem (Get Code, público)
  auth.js               -- /register, /login, /me
  exams.js              -- /exams, /exams/:slug
  attempts.js           -- /attempts/* (crear, responder, submit, review, historial)
  admin.js              -- /admin/codes, /admin/challenges, /admin/code-requests, /admin/users, /admin/stats

services/
  authService.js        -- bcrypt + JWT, lógica de canje de código
  examService.js
  attemptService.js     -- crea intento, aleatoriza orden, valida submit, calcula score
  codeService.js        -- pool de códigos (generar, asignar, canjear), expiración 30 días
  challengeService.js   -- selecciona 3 challenges aleatorios, valida respuestas normalizadas, firma sessionId
  rateLimitService.js   -- rate limit por email/IP basado en code_requests (sirve también de antifraude)
  captchaService.js     -- valida token Cloudflare Turnstile (no-op en dev si TURNSTILE_SECRET no está)
  textNormalize.js      -- helper compartido: lower + trim + remove diacritics + collapse spaces + remove punctuation

scripts/
  migrate.js            -- crea tablas (idempotente)
  seed-exam.js          -- carga JSON de preguntas a la BD
  seed-challenges.js    -- carga pool inicial desde simulador/challenges.seed.json
  parse-docx.js         -- (dev) convierte simulador.docx → simulador/exam.json
  generate-codes.js     -- CLI para crear códigos en lote (alternativa al endpoint admin)
  migrate-leads.js      -- migra server/data/leads.json y email_log.json a MySQL

utils/
  email.js              -- (existente) añadir sendActivationCode (Get Code), sendWelcome, sendResultEmail
```

`server/src/index.js` se actualiza para:
- Inicializar pool MySQL al arranque (en lugar de `initDb()` JSON).
- Montar los nuevos routers `/api/access` (con su propio rate limiter agresivo), `/api/auth`, `/api/exams`, `/api/attempts`, `/api/admin`.
- Conservar `/api/leads` y `/api/health`.

`server/src/db.js` (JSON) se elimina **al final**, una vez `migrate-leads.js` haya copiado los datos. Hasta entonces convive con el pool MySQL.

### Frontend (`src/`)
```
pages/
  ITIL4SalesPage.tsx     -- (existente) añadir CTA secundario "¿Ya compraste? Obtén tu código →" → /#/get-code
  SalesPage.tsx          -- (existente) sin cambios
  ContentPage.tsx        -- (existente) sin cambios

  GetCodePage.tsx        -- /#/get-code — flujo público: muestra 3 preguntas del libro, valida, dispara emisión por email
                            -- 3 estados internos: idle (form de email + captcha) → challenge (3 preguntas) → done (mensaje "revisa tu email")
                            -- también muestra mensaje claro cuando rate-limited (con tiempo de reintento) o cuando email ya tiene código emitido
  RegisterPage.tsx       -- /#/registro?code=XXX — form: email, name, password, código activación (prefilled si viene por query)
  LoginPage.tsx          -- /#/login
  DashboardPage.tsx      -- /#/dashboard — selector de modo (Práctica / Examen) + historial
  AttemptPage.tsx        -- /#/intento/:id — UI del simulador (1 pregunta por pantalla, timer en modo examen)
  ResultPage.tsx         -- /#/resultado/:id — score, aprobado/reprobado, lista de errores con justificación

  admin/
    AdminLayout.tsx
    AdminCodesPage.tsx          -- /#/admin/codigos — generar/listar/filtrar por estado, emitir manual
    AdminChallengesPage.tsx     -- /#/admin/challenges — CRUD del pool de preguntas-trampa
    AdminCodeRequestsPage.tsx   -- /#/admin/solicitudes — log de Get Code (pasados/fallidos, IP, timestamp)
    AdminUsersPage.tsx          -- /#/admin/usuarios
    AdminStatsPage.tsx          -- /#/admin/stats

components/sim/
  QuestionCard.tsx
  Timer.tsx
  ProgressBar.tsx
  AnswerOption.tsx
  ResultSummary.tsx

components/access/
  ChallengeForm.tsx      -- 3 preguntas + inputs de respuesta (texto libre)
  CaptchaWidget.tsx      -- Cloudflare Turnstile widget (no-op si VITE_TURNSTILE_SITE_KEY no está)
  RateLimitNotice.tsx    -- mensaje cuando 429

lib/
  authStore.ts           -- mini store (Context) con JWT + user + helpers login/logout
  api.ts                 -- (existente) añadir bloques auth/exams/attempts/admin
  config.ts              -- (existente) sin cambios
  guards.tsx             -- <RequireAuth>, <RequireAccess>, <RequireAdmin> wrappers
```

`src/App.tsx` se amplía con las nuevas rutas (todas dentro del HashRouter actual). Las rutas autenticadas se envuelven con `<RequireAuth>` / `<RequireAccess>` / `<RequireAdmin>`.

### Repo raíz / data
```
simulador/
  Simulador de examen ITIL v4 - 003.doc      (existente)
  Simulador de examen ITIL v4 - 003.docx     (NUEVO — paso manual de Word: Guardar como)
  exam.json                                  (NUEVO — generado por scripts/parse-docx.js, commiteado)
```

---

## Flujo de carga de preguntas (one-shot)

1. **Manual:** abrir el `.doc` en Word, "Guardar como" → `.docx` en el mismo directorio.
2. `node server/src/scripts/parse-docx.js` lee el `.docx` con `mammoth`, extrae estructura por heurística (numeración, marcador de respuesta correcta, sección "Justificación:") y emite `simulador/exam.json` validado contra un schema. Si la heurística falla en alguna pregunta, el script imprime un diff y pide intervención manual sobre el JSON.
3. Revisión manual del JSON (commit).
4. `node server/src/scripts/migrate.js` crea las tablas.
5. `node server/src/scripts/seed-exam.js` lee `exam.json` y puebla `exams`/`questions`/`answers`. Idempotente (UPSERT por `exams.slug`).

Si el parse automático sale demasiado sucio, fallback: te paso el template JSON y armas las 40 preguntas a mano (~1-2 h).

---

## Flujo Get Code (detalle paso a paso)

**Lo que ve el comprador del libro:**
1. Compra el libro en Amazon KDP.
2. Dentro del libro encuentra una página tipo:
   > **¿Listo para practicar con el simulador?**
   > Visita **mescobari.com/#/get-code**, ingresa tu email y responde 3 preguntas cortas sobre el libro. En segundos recibirás tu código de activación por correo electrónico.
3. Va a `/#/get-code`.

**Lo que pasa en el frontend (`GetCodePage.tsx`):**

*Estado 1 — `idle`:*
- Form con: input `email`, widget Cloudflare Turnstile (opcional en dev), botón "Solicitar mis preguntas".
- Submit → `GET /api/access/challenge` (sin email todavía — el email se manda en el redeem, así el log marca el intento aunque abandone).
- Backend responde:
  ```json
  { "sessionId": "<JWT corto: ids+nonce, 10 min de validez>",
    "questions": [
      { "id": 12, "question": "¿Qué palabra aparece en negrita en la página 47?" },
      { "id":  5, "question": "Escribe la primera palabra del párrafo 3 de la página 89." },
      { "id": 18, "question": "¿Cómo se llama la práctica explicada en el cap. 5?" }
    ]
  }
  ```

*Estado 2 — `challenge`:*
- 3 inputs de texto libre, contador visible "3 preguntas — debes acertar las 3".
- Submit → `POST /api/access/redeem { sessionId, answers, email, captchaToken }`.

*Estado 3 — `done`:*
- Mensaje: "✅ Si tus respuestas son correctas, hemos enviado tu código a `<email>`. Revisa tu bandeja en los próximos 5 minutos. Si no llega, revisa Spam/Promociones."
- (Mensaje constante en éxito o fallo silencioso de email — evitamos timing oracle: no revelamos si las respuestas estuvieron bien hasta que el email llegue. Excepción: si claramente fallaron 1+ respuestas, sí mostramos "Una o más respuestas no coincidieron. Vuelve a intentarlo." con un nuevo set de preguntas.)

*Estado de error / 429:*
- "Has hecho demasiados intentos. Vuelve a intentar en X minutos." (`Retry-After` del backend).

**Lo que pasa en el backend (`POST /api/access/redeem`):**

1. **Rate limit checks** (todos via `code_requests`, ventana móvil):
   - Por IP: máximo **3 solicitudes en 1 hora**. Si excedido → 429.
   - Por email: máximo **1 solicitud cada 24 horas**. Si excedido → 429.
   - Código ya emitido a este email (en `access_codes` con `issued_to_email = email AND expires_at > NOW()`): bloquea, sugiere revisar email previo. Si quiere otro, debe esperar a expiración o pedir soporte. Esto evita farming.

2. **Validar CAPTCHA:** llamar `captchaService.verify(captchaToken, ip)`. Si falla → 400. (No-op en dev.)

3. **Validar `sessionId`:** desempaquetar JWT, obtener los 3 `challenge_ids` y nonce. Si firma inválida o expirado → 400.

4. **Validar respuestas:** por cada `(id, answer)`:
   - `answerNorm = normalize(answer)` con el helper compartido (lower + trim + sin acentos + sin puntuación + colapso de espacios).
   - Cargar `book_challenges.answer_norm` por id.
   - Comparar exactamente normalizado vs normalizado. (Considerar `levenshtein <= 1` como match si la respuesta de la BD tiene ≤6 caracteres, para tolerar typo de una sola letra. Configurable.)

5. **Registrar intento** en `code_requests` SIEMPRE (passed o no) con email, IP, UA, challenge_ids, passed bool, failed_count.

6. **Si pasó:**
   - Tomar un código del pool: `SELECT id, code FROM access_codes WHERE issued_at IS NULL AND redeemed_by IS NULL LIMIT 1 FOR UPDATE` (transacción).
   - Si pool vacío → loggear alerta + responder 503 "Servicio temporalmente no disponible. Te notificaremos por email."
   - Marcar `issued_to_email = email`, `issued_at = NOW()`, `expires_at = NOW() + 30 días`.
   - Linkear `code_requests.code_id`.
   - Enviar email vía `sendActivationCode(email, code)` que linkea a `/#/registro?code=<code>`.

7. **Si no pasó:**
   - Devolver 400 con `{ failed_count, message: "Una o más respuestas no son correctas." }`. El frontend pide nuevo `/api/access/challenge` y permite reintento (sujeto a rate limits).

**Notas de seguridad implementadas:**
- ✅ Códigos de un solo uso (`redeemed_by` lo marca).
- ✅ Expiración del código emitido (30 días → re-emitible solo por admin).
- ✅ Rate limit por IP y por email.
- ✅ CAPTCHA en producción.
- ✅ Pool finito de challenges con N=20-30 → cada solicitud presenta 3 al azar; con failed_count tracking en `code_requests` se puede detectar farming (mismo IP/email rotando hasta acertar).
- ✅ Código entregado solo por email (no en pantalla) → no se puede screenshotear y compartir el código sin compartir también el inbox.
- ✅ Logs auditables en `code_requests` para análisis posterior y en el panel admin.

**Lo que NO previene** (por diseño, para no saturar al lector legítimo):
- Compartir 1 a 1 entre amigos: dos personas pueden coordinar y la primera responde por la segunda. Mitigación residual: cada usuario solo puede usar 1 cuenta + el código queda ligado al canjeador.
- Filtración pública de respuestas. Mitigación: rotar/ampliar el pool de challenges trimestralmente desde el panel admin.

---

## Flujo de auth + canje de código

1. Usuario llega a `/#/registro?code=<XYZ>` (linkado desde el email de activación) o sin código (si busca registrarse manualmente).
2. Llena email + name + password + `activationCode`.
3. Backend (`POST /api/auth/register`):
   - Valida que el código exista en `access_codes`, no esté canjeado (`redeemed_by IS NULL`), y no esté expirado (`expires_at > NOW()`).
   - Valida que el email del registro coincida con `issued_to_email` del código (evita que un código emitido a un email se canjee con otro). Configurable: si `STRICT_EMAIL_MATCH=false` se permite mismatch para flexibilidad de soporte.
   - Hashea password (bcrypt).
   - Crea fila en `users` con `has_access=true` y `activation_code=<code>`.
   - Marca `access_codes.redeemed_by` y `redeemed_at`.
   - Si `email === ADMIN_EMAIL` (env), setea `is_admin=true`.
   - Devuelve JWT + user.
4. Frontend guarda JWT en `localStorage`, redirige a `/dashboard`.
5. En cada request a endpoint protegido el frontend manda `Authorization: Bearer <jwt>`. Middleware `requireAuth` valida y carga `req.user`.

Login (`POST /api/auth/login`) es estándar: compara hash, emite JWT.

---

## Flujo del simulador

**Iniciar intento:**
- Usuario en `/dashboard` elige `Práctica` o `Examen`.
- Frontend hace `POST /api/attempts { examSlug, mode }`.
- Backend crea fila en `attempts`, genera `question_order` aleatorizado, crea N filas vacías en `attempt_answers`. Devuelve `attemptId`, `questionOrder` (sólo IDs, no contenido), `timeLimit` (en modo examen).
- Frontend redirige a `/intento/:id`.

**Responder:**
- En cada pregunta, usuario selecciona letra → `POST /api/attempts/:id/answer { questionId, letter }` (autosave). Modo práctica: la respuesta queda y el frontend pide otra ruta `/api/questions/:id/correct` (solo modo práctica) si quiere ver justificación inmediata. Modo examen: solo guarda, no devuelve correcta.

**Tiempo (modo examen):**
- Frontend usa `useCountdown` (ya existente en `src/hooks/useCountdown.ts`) basado en `started_at + timeLimit`. Si llega a 0: auto-submit.
- Backend valida server-side: si `submit` llega después de `started_at + timeLimit + 30s grace`, marca `status='expired'` igualmente y entrega resultado con respuestas registradas hasta ese momento.

**Submit:**
- `POST /api/attempts/:id/submit` calcula `score_correct`, `score_pct`, `passed`, marca `status='submitted'` y `submitted_at=NOW()`.
- Frontend redirige a `/resultado/:id`. Esa vista llama `GET /api/attempts/:id/review` que devuelve preguntas con la respuesta del usuario + correcta + justificación.

**Persistencia:**
- En cada `POST /answer` la BD queda al día. Si el usuario cierra el navegador, al volver el frontend hace `GET /api/attempts/:id` y reconstruye el estado. El timer se calcula desde `started_at` (no desde el reload).

---

## Plan de implementación por fases

**Fase 0 — Setup MySQL + envs** (manual del usuario)
- Instalar MySQL local (XAMPP, MySQL Installer o similar).
- Crear DB `itil4_funnel` y usuario.
- (Opcional, producción) Crear cuenta Cloudflare Turnstile y obtener site key + secret.
- Añadir al `server/.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `TURNSTILE_SECRET` (opc), `STRICT_EMAIL_MATCH=true`, `CHALLENGE_SESSION_SECRET`.
- Añadir al `.env` raíz frontend: `VITE_TURNSTILE_SITE_KEY` (opc).

**Fase 1 — Schema + migración de datos existentes**
- `mysql2`, `bcryptjs`, `jsonwebtoken`, `zod`, `mammoth` añadidos a `server/package.json`.
- `config/db.js` (pool).
- `scripts/migrate.js` crea las 10 tablas (idempotente).
- `scripts/migrate-leads.js` mueve `leads.json` y `email_log.json` a MySQL.
- `server/src/db.js` reescrito para exponer la misma fachada (`db.insertLead`, `db.findLead`, `db.countLeads`, `db.logEmail`) pero contra MySQL en vez de JSON. **Compatibilidad total con `routes/leads.js` y `utils/email.js`** (no se tocan esos archivos).

**Fase 2 — Auth**
- Middleware + servicios + routes/auth.js.
- Frontend: `RegisterPage`, `LoginPage`, `authStore`, guards.
- Smoke test: registrar manual con un código semilla, login, llamar `GET /api/auth/me`.

**Fase 3 — Códigos de acceso (pool)**
- `services/codeService.js`, `scripts/generate-codes.js` (CLI), endpoints admin de códigos.
- Página admin `AdminCodesPage` (genera, lista filtrable por estado, exporta CSV, emisión manual a email).
- Smoke test: generar 20 códigos al pool por CLI, listarlos como "available" en admin, emitir uno manual a un email, ver el email recibido.

**Fase 4 — Get Code (challenge público)**
- `services/challengeService.js`, `services/rateLimitService.js`, `services/captchaService.js`, `services/textNormalize.js`.
- `routes/access.js` con su propio rate limiter.
- `simulador/challenges.seed.json` con 20-30 preguntas iniciales basadas en el libro real (lo armas tú; te paso template).
- `scripts/seed-challenges.js`.
- Página admin `AdminChallengesPage` (CRUD del pool) y `AdminCodeRequestsPage` (log).
- Frontend: `GetCodePage.tsx` con sus 3 estados.
- Smoke tests:
   - Pasar el challenge → recibir email con código → registrarse con ese código.
   - Fallar 1 respuesta → recibir mensaje claro, poder reintentar.
   - Triggerar rate limit (4ª solicitud desde misma IP) → recibir 429 con `Retry-After`.
   - CAPTCHA inválido en producción → 400.

**Fase 5 — Carga de preguntas del simulador**
- Convertir `.doc` → `.docx` (manual).
- `scripts/parse-docx.js`, revisar `exam.json` resultante.
- `scripts/seed-exam.js`, ejecutar.

**Fase 6 — Simulador (core)**
- `routes/exams.js`, `routes/attempts.js`, `services/attemptService.js`.
- Páginas `DashboardPage`, `AttemptPage`, `ResultPage` + componentes en `components/sim/`.
- Smoke test end-to-end: usuario con acceso hace examen completo, recibe score correcto.

**Fase 7 — Admin (resto)**
- `AdminUsersPage`, `AdminStatsPage`. (Las de códigos/challenges/code-requests ya quedaron en Fases 3-4.)

**Fase 8 — Hardening** ✅ implementada
- ✅ Rate limiter en `/auth/login` (10/min/IP, no cuenta éxitos) y `/api/access/*` (20/15min) — ya estaban desde Fases 2/4.
- ✅ Helmet endurecido: CSP estricta (`default-src 'none'`, todo bloqueado salvo `connect-src 'self'`), `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy: same-origin`, HSTS solo en producción, `X-Powered-By` removido.
- ✅ `sendWelcome(to, name)` tras `auth/register` (fire-and-forget en authService).
- ✅ `sendResultEmail(to, name, summary)` tras `submitAttempt` solo en modo `exam` (la práctica suele ser exploratoria — no saturar inbox).
- ✅ Detección de actividad sospechosa en `/api/access/redeem`: log `[ACCESS][SUSPICIOUS]` cuando una IP prueba ≥5 emails distintos en 1h o cuando un email acumula ≥3 fallos en 24h. No bloquea (el rate limit ya lo hace) — es paper trail para inspección vía `/admin/solicitudes`.

**Follow-ups (no implementados — decisiones futuras):**
- **Cookie httpOnly para JWT**: actualmente vive en `localStorage` del navegador (riesgo XSS teórico). Pasar a cookie `httpOnly + SameSite=Strict + Secure` requiere: (a) backend setea cookie en login/register en lugar de devolver token, (b) frontend cambia `Authorization: Bearer` por `credentials: 'include'`, (c) backend lee cookie en `requireAuth`, (d) hay que añadir token CSRF (origin check o double-submit) porque CORS-credentials sin CSRF es atacable. Es un refactor de medio día. Postpuesto a producción.
- **CSP del frontend**: hoy el frontend (Vite) no tiene CSP propia. En producción detrás de nginx/Cloudflare conviene meter CSP a nivel del proxy con `script-src 'self'`, `connect-src 'self' <api-domain>`, etc.
- **Logs centralizados**: hoy los `console.warn` van a stdout. En producción en Railway/Render ya quedan capturados; si se va a otro hosting, considerar Sentry o un drain a Logtail.

---

## Archivos críticos a modificar (los existentes)

| Archivo | Cambio |
|---|---|
| [server/package.json](server/package.json) | Añadir mysql2, bcryptjs, jsonwebtoken, zod, mammoth |
| [server/.env](server/.env) | Añadir DB_*, JWT_SECRET, ADMIN_EMAIL, TURNSTILE_SECRET, CHALLENGE_SESSION_SECRET, STRICT_EMAIL_MATCH |
| [.env](.env) (raíz frontend) | Añadir VITE_TURNSTILE_SITE_KEY (opcional) |
| [server/src/index.js](server/src/index.js) | Pool MySQL en arranque + 5 routers nuevos (access, auth, exams, attempts, admin) |
| [server/src/db.js](server/src/db.js) | Reescrito a MySQL preservando la fachada |
| [server/src/routes/leads.js](server/src/routes/leads.js) | Sin cambios (usa la fachada) |
| [server/src/utils/email.js](server/src/utils/email.js) | Añadir sendActivationCode, sendWelcome, sendResultEmail |
| [src/App.tsx](src/App.tsx) | Añadir rutas + envoltorios de guards |
| [src/lib/api.ts](src/lib/api.ts) | Añadir bloques access, auth, exams, attempts, admin |
| [src/pages/ITIL4SalesPage.tsx](src/pages/ITIL4SalesPage.tsx) | Añadir CTA "¿Ya compraste el libro? Obtén tu código →" → `/#/get-code` |

Los demás son archivos nuevos (ver "Estructura de archivos a crear").

---

## Verificación end-to-end

Una vez implementado:

1. **Schema:** `node server/src/scripts/migrate.js` crea las 10 tablas sin error en una BD vacía. Re-ejecutarlo no hace cambios.
2. **Datos legacy migrados:** `node server/src/scripts/migrate-leads.js`. Verificar que `SELECT COUNT(*) FROM leads` coincide con la longitud del JSON antes del cambio.
3. **Carga de exam:** `node server/src/scripts/seed-exam.js`. `SELECT COUNT(*) FROM questions WHERE exam_id=1` = 40, `SELECT COUNT(*) FROM answers` = 160 (4 por pregunta), exactamente una con `is_correct=true` por pregunta.
4. **Carga de challenges:** `node server/src/scripts/seed-challenges.js`. `SELECT COUNT(*) FROM book_challenges WHERE active=1` ≥ 20.
5. **Lead capture sigue funcionando:** desde `/#/itil4` enviar formulario → fila nueva en MySQL `leads` + email enviado.
6. **Pool de códigos:** `node server/src/scripts/generate-codes.js --count 50 --notes "lote-1"`. Listarlos via `/api/admin/codes` filtrando por `available` → 50.
7. **Get Code happy path:**
   - GET `/api/access/challenge` → recibe sessionId + 3 preguntas.
   - POST `/api/access/redeem` con respuestas correctas + email + captcha (mock en dev) → 200.
   - Verificar: fila en `code_requests` con `passed=true` y `code_id`. Fila en `access_codes` con `issued_to_email` y `expires_at` set. Email recibido con código y link a `/#/registro?code=XXX`.
8. **Get Code fallo de respuestas:** mismo flujo pero con 1 respuesta mal → 400 con `failed_count: 1`. Fila en `code_requests` con `passed=false`. Pool de códigos no decrece.
9. **Get Code rate limit IP:** disparar 4 solicitudes desde la misma IP en menos de 1 hora → la 4ª devuelve 429 con `Retry-After`. (Limpiar `code_requests` para retests.)
10. **Get Code rate limit email:** registrar 1 solicitud exitosa para `foo@bar.com`, intentar de nuevo en <24h → 429 con mensaje "ya recibiste un código a este email".
11. **Auth:** registrar usando código del paso 7, login, `GET /api/auth/me` devuelve user con `has_access=true`. Verificar que `access_codes.redeemed_by` quedó marcado.
12. **Email mismatch (STRICT_EMAIL_MATCH=true):** intentar registrarse con un código emitido a `a@x.com` pero usando `b@y.com` → 400.
13. **Intento práctica:** crear, responder 5, ver justificación inmediata, no requiere submit final, queda en historial.
14. **Intento examen:** crear, responder 40, submit antes de 60 min → score correcto. Crear otro, dejar pasar 60 min → al volver, ver `status='expired'`, score parcial.
15. **Persistencia:** crear examen, responder 10, refrescar página → vuelve al estado correcto, timer continúa donde estaba.
16. **Admin:** desde cuenta admin, ver dashboard de stats, resetear intentos de un usuario, ver que en el dashboard del usuario aparezcan como descartados. Crear/editar/desactivar un challenge desde `AdminChallengesPage`. Ver el log de solicitudes en `AdminCodeRequestsPage` con filtros por IP/email/passed.
17. **Build:** `npm run build` (frontend) sin errores de TS. `node server/src/index.js` arranca sin errores con DB conectada.
18. **No regresión:** las tres páginas de ventas (`/itil4`, `/ventas`, `/content`) y todos los CTAs Amazon siguen funcionando idénticos a antes.

---

## Pendientes operacionales (post-implementación)

- Producción: hosting con MySQL (Railway, PlanetScale, Hostinger, etc.). Decidir antes del deploy.
- Rotación de `JWT_SECRET` y `CHALLENGE_SESSION_SECRET` (documentar — cualquier rotación invalida sesiones activas / sessionIds emitidos).
- Backup automatizado de la BD (al menos un dump diario).
- Política de soporte: qué hacer si un usuario pierde su cuenta o su código (proceso manual via `POST /api/admin/codes/issue-manual`).
- Política de rotación del pool de challenges: cada N meses, marcar la mitad como `active=false` y publicar un nuevo lote para evitar filtración pública de respuestas.

## Lo que necesito de ti (entregables del producto, no código)

1. **`.docx` del simulador:** abrir `simulador/Simulador de examen ITIL v4 - 003.doc` en Word y guardar como `.docx` en el mismo directorio.
2. **Pool inicial de 20-30 challenges** del libro: lista de `(pregunta, respuesta esperada, página/ref)`. Te paso un template `challenges.seed.json` con ejemplos. Las respuestas deben ser palabras o frases cortas (1-3 palabras) para que la normalización tolere typos sin volverse ambigua.
3. **Página dentro del libro KDP:** texto que dirige al lector a `mescobari.com/#/get-code`. Esto lo añades al manuscrito KDP y republicas la edición. (Sin esto, el flujo Get Code no tiene cómo conectar con compradores reales.)
4. **Email del admin:** valor para `ADMIN_EMAIL` del `.env`.
