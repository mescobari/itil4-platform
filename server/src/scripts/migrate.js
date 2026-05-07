'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { pool } = require('../config/db');

const STATEMENTS = [
  // ─── users ──────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(120) NOT NULL,
    is_admin        TINYINT(1) NOT NULL DEFAULT 0,
    has_access      TINYINT(1) NOT NULL DEFAULT 0,
    activation_code VARCHAR(40) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── access_codes ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS access_codes (
    id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(40) NOT NULL UNIQUE,
    issued_to_email VARCHAR(255) NULL,
    issued_at       DATETIME NULL,
    expires_at      DATETIME NULL,
    redeemed_by     INT NULL,
    redeemed_at     DATETIME NULL,
    notes           VARCHAR(255) NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_codes_status (issued_at, redeemed_by, expires_at),
    INDEX idx_codes_issued_email (issued_to_email),
    CONSTRAINT fk_codes_user FOREIGN KEY (redeemed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── book_challenges ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS book_challenges (
    id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    question     VARCHAR(500) NOT NULL,
    answer_norm  VARCHAR(120) NOT NULL,
    page_ref     VARCHAR(40) NULL,
    active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chal_active (active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── code_requests ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS code_requests (
    id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    ip            VARCHAR(45) NOT NULL,
    user_agent    VARCHAR(255) NULL,
    challenge_ids JSON NOT NULL,
    passed        TINYINT(1) NOT NULL,
    failed_count  TINYINT NULL,
    code_id       INT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_creq_email_time (email, created_at),
    INDEX idx_creq_ip_time    (ip, created_at),
    CONSTRAINT fk_creq_code FOREIGN KEY (code_id) REFERENCES access_codes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── exams ──────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS exams (
    id                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    slug                VARCHAR(60) NOT NULL UNIQUE,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NULL,
    total_questions     INT NOT NULL DEFAULT 40,
    pass_threshold_pct  INT NOT NULL DEFAULT 65,
    time_limit_minutes  INT NOT NULL DEFAULT 60,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── questions ──────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS questions (
    id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    exam_id       INT NOT NULL,
    position      INT NOT NULL,
    statement     TEXT NOT NULL,
    justification TEXT NOT NULL,
    topic         VARCHAR(120) NULL,
    INDEX idx_q_exam (exam_id),
    CONSTRAINT fk_q_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── answers ────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS answers (
    id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    question_id  INT NOT NULL,
    letter       CHAR(1) NOT NULL,
    text         TEXT NOT NULL,
    is_correct   TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_answer_letter (question_id, letter),
    CONSTRAINT fk_a_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── attempts ───────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS attempts (
    id                 INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id            INT NOT NULL,
    exam_id            INT NOT NULL,
    mode               ENUM('practice','exam') NOT NULL,
    status             ENUM('in_progress','submitted','expired','discarded') NOT NULL DEFAULT 'in_progress',
    started_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at       DATETIME NULL,
    time_limit_seconds INT NULL,
    question_order     JSON NOT NULL,
    score_correct      INT NULL,
    score_pct          DECIMAL(5,2) NULL,
    passed             TINYINT(1) NULL,
    INDEX idx_at_user (user_id),
    INDEX idx_at_exam (exam_id),
    CONSTRAINT fk_at_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_at_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── attempt_answers ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS attempt_answers (
    id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    attempt_id      INT NOT NULL,
    question_id     INT NOT NULL,
    selected_letter CHAR(1) NULL,
    is_correct      TINYINT(1) NULL,
    answered_at     DATETIME NULL,
    UNIQUE KEY uq_attempt_question (attempt_id, question_id),
    CONSTRAINT fk_aa_attempt  FOREIGN KEY (attempt_id)  REFERENCES attempts(id)  ON DELETE CASCADE,
    CONSTRAINT fk_aa_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── leads (migrado de JSON) ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS leads (
    id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    whatsapp   VARCHAR(40) NULL,
    timeline   VARCHAR(60) NULL,
    consent    TINYINT(1) NOT NULL DEFAULT 0,
    source     VARCHAR(60) NULL,
    ip         VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leads_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── email_log (migrado de JSON) ────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS email_log (
    id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    to_email   VARCHAR(255) NOT NULL,
    subject    VARCHAR(255) NOT NULL,
    type       VARCHAR(60) NULL,
    success    TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_emaillog_to (to_email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ─── activation_tokens (magic-link de un solo uso) ──────────────────────────
  // Guardamos el SHA-256 del token, no el token plano: si la BD se filtra,
  // un atacante no puede replay-attackearnos. La columna `name` se rellena al
  // emitir el código (form de Get Code), para que en /complete-registration
  // solo se pida password.
  `CREATE TABLE IF NOT EXISTS activation_tokens (
    id                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token_hash          CHAR(64) NOT NULL UNIQUE,
    code_id             INT NOT NULL,
    email               VARCHAR(255) NOT NULL,
    name                VARCHAR(120) NOT NULL,
    expires_at          DATETIME NOT NULL,
    consumed_at         DATETIME NULL,
    consumed_by_user_id INT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_actok_code  (code_id),
    INDEX idx_actok_email (email),
    CONSTRAINT fk_actok_code FOREIGN KEY (code_id)             REFERENCES access_codes(id) ON DELETE CASCADE,
    CONSTRAINT fk_actok_user FOREIGN KEY (consumed_by_user_id) REFERENCES users(id)        ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Añadimos `name` a code_requests (paper trail del Get Code).
  // MariaDB 10.4+ soporta IF NOT EXISTS en ADD COLUMN — idempotente.
  `ALTER TABLE code_requests ADD COLUMN IF NOT EXISTS name VARCHAR(120) NULL AFTER email`,
];

(async () => {
  const conn = await pool.getConnection();
  try {
    console.log('[MIGRATE] Conectado a', process.env.DB_NAME || 'itil4_funnel');
    for (const sql of STATEMENTS) {
      const tableName = (sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/) || [])[1] || '?';
      await conn.query(sql);
      console.log(`[MIGRATE] ✓ ${tableName}`);
    }
    const [rows] = await conn.query('SHOW TABLES');
    console.log(`[MIGRATE] Total tablas en BD: ${rows.length}`);
    for (const r of rows) console.log('   -', Object.values(r)[0]);
    console.log('[MIGRATE] OK');
  } catch (err) {
    console.error('[MIGRATE] ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
