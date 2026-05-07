'use strict';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER     || 'itil4_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'itil4_funnel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: false,
  timezone: 'local',
});

async function ping() {
  const conn = await pool.getConnection();
  try { await conn.query('SELECT 1'); }
  finally { conn.release(); }
}

module.exports = { pool, ping };
