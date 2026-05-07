'use strict';
module.exports = function requireAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
  if (!req.user.hasAccess) {
    return res.status(403).json({ error: 'No tienes acceso al simulador. Activa tu código primero.' });
  }
  next();
};
