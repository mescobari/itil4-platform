'use strict';
const jwt = require('jsonwebtoken');

const SECRET     = process.env.JWT_SECRET;
const EXPIRES_IN = '7d';

if (!SECRET) {
  console.warn('[JWT] WARNING: JWT_SECRET no está definido en .env — los tokens no podrán firmarse.');
}

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };
