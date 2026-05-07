'use strict';
// Helper de normalización de texto para comparar respuestas de challenges
// y otros inputs donde toleramos variación cosmética.
//
// Reglas (en orden):
//   1. NFD + remove combining marks → quita acentos
//   2. lowercase
//   3. remove puntuación común
//   4. colapsa múltiples espacios a uno
//   5. trim
//
// Ejemplo: "  Cómo Estás? "  →  "como estas"

function normalize(s) {
  if (s == null) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacríticos (rango Combining)
    .toLowerCase()
    .replace(/[.,;:!?¿¡"'`´()\[\]{}<>\\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { normalize };
