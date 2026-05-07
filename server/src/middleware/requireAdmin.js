'use strict';
module.exports = function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso restringido.' });
  next();
};
