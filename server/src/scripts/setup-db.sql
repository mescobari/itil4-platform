-- ─── Setup inicial de la BD para itil4-funnel ───────────────────────────────
-- Crea la base de datos `itil4_funnel` (UTF8MB4) y un usuario dedicado de la app.
-- Ejecutar UNA VEZ con un usuario admin (root) de MySQL/MariaDB:
--
--   mysql -u root -p < server/src/scripts/setup-db.sql
--
-- Si tu root no tiene contraseña (XAMPP por defecto):
--
--   mysql -u root < server/src/scripts/setup-db.sql
--
-- IMPORTANTE: si cambias la contraseña aquí, sincronízala con server/.env (DB_PASSWORD).

CREATE DATABASE IF NOT EXISTS itil4_funnel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Usuario local de la app (no usar root desde Node por buena práctica)
CREATE USER IF NOT EXISTS 'itil4_app'@'localhost'
  IDENTIFIED BY 'A1CYv8_KPqCQ9FAvmXRNkzvAcCpYnP8a';

GRANT ALL PRIVILEGES ON itil4_funnel.* TO 'itil4_app'@'localhost';

FLUSH PRIVILEGES;

-- Verificación: lista bases creadas y privilegios del nuevo usuario
SHOW DATABASES LIKE 'itil4_funnel';
SHOW GRANTS FOR 'itil4_app'@'localhost';
