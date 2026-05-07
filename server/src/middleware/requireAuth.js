'use strict';
const { verify } = require('../config/jwt');
const { pool }   = require('../config/db');

module.exports = async function requireAuth(req, res, next) {
  try {
    const auth  = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token requerido.' });

    const payload = verify(token);
    const [rows] = await pool.execute(
      `SELECT id, email, name, is_admin, has_access
       FROM users WHERE id = ? LIMIT 1`,
      [payload.uid]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado.' });

    req.user = {
      id:        rows[0].id,
      email:     rows[0].email,
      name:      rows[0].name,
      isAdmin:   !!rows[0].is_admin,
      hasAccess: !!rows[0].has_access,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};
