'use strict';
const { pool } = require('../config/db');

async function listExams() {
  const [rows] = await pool.query(
    `SELECT id, slug, title, description, total_questions, pass_threshold_pct, time_limit_minutes
     FROM exams ORDER BY id ASC`
  );
  return rows;
}

async function getExamBySlug(slug) {
  const [rows] = await pool.execute(
    `SELECT id, slug, title, description, total_questions, pass_threshold_pct, time_limit_minutes
     FROM exams WHERE slug = ? LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

async function getExamById(id) {
  const [rows] = await pool.execute(
    `SELECT id, slug, title, description, total_questions, pass_threshold_pct, time_limit_minutes
     FROM exams WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { listExams, getExamBySlug, getExamById };
