'use strict';
// Parser robusto: simulador/Simulador de examen ITIL v4 - 003.docx → simulador/exam.json
//
// Estrategia:
//   1. Texto plano de mammoth → array `lines` (trim).
//   2. Construir array `paras` de párrafos no-vacíos junto con su índice de línea.
//      Si dos párrafos consecutivos forman juntos una pregunta partida (el primero
//      no termina en '?' y el segundo SÍ y es corto), se fusionan.
//   3. Localizar el inicio "Preguntas de examen". Trabajar desde ahí.
//   4. Iterar:
//        - statement = párrafo que termina con '?' (o tiene '¿').
//        - 4 opciones = los 4 párrafos siguientes.
//        - respuesta = primer párrafo siguiente que matchea cualquiera de los
//          patrones de respuesta conocidos.
//        - justificación = todo entre el marcador de respuesta y el siguiente
//          enunciado de pregunta.
//   5. Validar 40 preguntas, cada una con 4 opciones y 1 letra correcta A/B/C/D.

const fs       = require('fs');
const path     = require('path');
const mammoth  = require('mammoth');

const DOCX_PATH = path.join(__dirname, '..', '..', '..', 'simulador', 'Simulador de examen ITIL v4 - 003.docx');
const OUT_PATH  = path.join(__dirname, '..', '..', '..', 'simulador', 'exam.json');

const QUESTIONS_SECTION_MARKER = 'Preguntas de examen';

// Múltiples patrones para detectar el marcador de respuesta y extraer la letra correcta:
const ANSWER_PATTERNS = [
  /^La respuesta correcta es la opci[oó]n\s+([ABCD])\s*[:.]/i,
  /^La respuesta correcta es\s+([ABCD])\s*[:.]/i,
  /^[A-Z][^?]{1,200}\s+es la opci[oó]n\s+([ABCD])\s*[:.]/i,   // "La práctica que ... es la opción B:"
  /^[A-Z][^?]{1,200}\s+es\s+([ABCD])\s*[:.]/i,                 // "El propósito ... es A.", "La afirmación correcta es D."
];
// Variantes "trailing colon": el marcador termina en ':' y la letra está en la línea siguiente.
// Cubre formas como "... es:" / "... es la siguiente:" / "... son las siguientes:".
const ANSWER_TRAILING_COLON = /^(?:[A-Z][^?]{1,200})\s+(?:es|son)(?:\s+l[ao]s?\s+siguientes?)?\s*:\s*$/i;
const LETTER_LEADING = /^([ABCD])\s*[:.]/;

// Nota sobre el conteo: las instrucciones del documento dicen 40 preguntas pero
// el contenido real son 38 (probable error del manuscrito). El umbral 32/38 ≈ 84%.
const EXAM_META = {
  slug: 'itil4-foundation-v3',
  title: 'Simulador ITIL 4 Foundation — Examen 003',
  description: '38 preguntas · 60 min · 32 aciertos para aprobar (~84%) · "a libro cerrado"',
  total_questions: 38,
  pass_threshold_pct: 84,
  time_limit_minutes: 60,
};

function fail(msg, ctx) {
  console.error(`[PARSE] ✗ ${msg}`);
  if (ctx) console.error('  Contexto:', ctx);
  process.exit(1);
}

function detectAnswerLetter(para, nextPara) {
  for (const re of ANSWER_PATTERNS) {
    const m = re.exec(para);
    if (m) return m[1].toUpperCase();
  }
  if (ANSWER_TRAILING_COLON.test(para) && nextPara) {
    const m = LETTER_LEADING.exec(nextPara);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

function isAnswerMarker(para, nextPara) {
  return detectAnswerLetter(para, nextPara) !== null;
}

function looksLikeQuestion(para) {
  // Termina con '?' o empieza con '¿'
  return /\?$/.test(para) || /^¿/.test(para);
}

(async () => {
  if (!fs.existsSync(DOCX_PATH)) fail(`No existe el .docx en ${DOCX_PATH}`);
  const { value: rawText } = await mammoth.extractRawText({ path: DOCX_PATH });
  const lines = rawText.split('\n').map(l => l.trim());

  // Construir párrafos no-vacíos
  const rawParas = lines.map((l, idx) => ({ idx, text: l })).filter(p => p.text.length > 0);

  // Fusionar enunciados partidos: si para[i] no termina en '?' y para[i+1] SÍ termina en '?',
  // y para[i+1] es relativamente corto (es claramente continuación), fusionar.
  // CRÍTICO: la fusión solo aplica cuando ambos párrafos están muy cercanos en el .docx
  // (separación < MAX_GAP_LINES líneas vacías). Si están muy separados es justificación + nueva
  // pregunta, no una pregunta multilínea.
  const MAX_GAP_LINES = 4;
  const paras = [];
  for (let i = 0; i < rawParas.length; i++) {
    const cur = rawParas[i];
    const nxt = rawParas[i + 1];
    const gap = nxt ? (nxt.idx - cur.idx) : 99;
    if (
      nxt &&
      gap <= MAX_GAP_LINES &&
      !/\?$/.test(cur.text) &&             // actual no termina en ?
      /\?$/.test(nxt.text) &&              // siguiente sí
      nxt.text.length < 80 &&              // siguiente es corto
      !isAnswerMarker(cur.text, nxt.text)
    ) {
      paras.push({ idx: cur.idx, text: cur.text + ' ' + nxt.text });
      i++; // saltar nxt — ya consumido
    } else {
      paras.push(cur);
    }
  }

  // Buscar inicio
  const startPi = paras.findIndex(p => p.text === QUESTIONS_SECTION_MARKER);
  if (startPi < 0) fail(`No se encontró "${QUESTIONS_SECTION_MARKER}".`);

  const questions = [];
  let pi = startPi + 1;
  while (pi < paras.length && questions.length < EXAM_META.total_questions) {
    const stmt = paras[pi];
    if (!looksLikeQuestion(stmt.text)) {
      // Avanzar — quizás encabezado intermedio, sección, etc.
      pi++;
      continue;
    }

    // 4 opciones siguientes (deben no ser marcadores)
    const opts = [];
    let scan = pi + 1;
    while (scan < paras.length && opts.length < 4) {
      const p = paras[scan];
      if (isAnswerMarker(p.text, paras[scan + 1]?.text)) {
        fail(`Pregunta ${questions.length + 1}: encontré marcador de respuesta antes de las 4 opciones.`,
             `pregunta="${stmt.text.slice(0, 80)}" / marcador="${p.text.slice(0, 80)}"`);
      }
      if (looksLikeQuestion(p.text) && opts.length === 0) {
        // Otro enunciado consecutivo — no debería pasar; saltar pregunta vacía
        fail(`Pregunta ${questions.length + 1}: dos enunciados consecutivos.`, p.text);
      }
      opts.push(p.text);
      scan++;
    }
    if (opts.length < 4) fail(`Pregunta ${questions.length + 1}: solo ${opts.length} opciones encontradas.`);

    // Buscar respuesta
    let answerLetter = null;
    let answerByFallback = false;
    const candidatePostOptions = []; // párrafos entre opciones y siguiente pregunta — para fallback
    while (scan < paras.length) {
      const p = paras[scan];
      const next = paras[scan + 1];
      const letter = detectAnswerLetter(p.text, next?.text);
      if (letter) {
        answerLetter = letter;
        if (ANSWER_TRAILING_COLON.test(p.text) && next && LETTER_LEADING.test(next.text)) {
          scan += 2;
        } else {
          scan += 1;
        }
        break;
      }
      // Si encontramos un nuevo enunciado antes que la respuesta → entrar en modo fallback:
      // la respuesta correcta es la opción cuyo texto aparezca en alguno de los párrafos
      // entre las opciones y este nuevo enunciado.
      if (looksLikeQuestion(p.text)) {
        for (const para of candidatePostOptions) {
          for (let i = 0; i < 4; i++) {
            // Comparación normalizada: ignora puntos finales, mayúsculas y comillas
            const cleanOpt  = opts[i].toLowerCase().replace(/["”“'`.]/g, '').trim();
            const cleanPara = para.toLowerCase().replace(/["”“'`.]/g, '').trim();
            if (cleanOpt.length > 8 && cleanPara.includes(cleanOpt)) {
              answerLetter = 'ABCD'[i];
              answerByFallback = true;
              break;
            }
          }
          if (answerLetter) break;
        }
        if (!answerLetter) {
          fail(`Pregunta ${questions.length + 1}: no encontré marcador de respuesta y el fallback por texto no acertó.`,
               `pregunta="${stmt.text.slice(0, 80)}"`);
        }
        break; // scan se queda en el siguiente enunciado; justification queda en candidatePostOptions
      }
      candidatePostOptions.push(p.text);
      scan++;
    }
    if (!answerLetter) fail(`Pregunta ${questions.length + 1}: sin marcador de respuesta hasta el final del documento.`);
    if (answerByFallback) {
      console.warn(`[PARSE] ⚠ Pregunta ${questions.length + 1}: letra detectada por fallback de texto (${answerLetter}). Verificar manualmente.`);
    }

    // Justificación: si fallback, usa los párrafos ya recolectados; si no, lee hasta siguiente pregunta.
    const justParas = answerByFallback ? candidatePostOptions.slice() : [];
    if (!answerByFallback) {
      while (scan < paras.length) {
        const p = paras[scan];
        if (looksLikeQuestion(p.text)) break;
        if (isAnswerMarker(p.text, paras[scan + 1]?.text)) break;
        justParas.push(p.text);
        scan++;
      }
    }
    // Limpiar prefijo "Justificación: " del primer párrafo
    if (justParas.length > 0) {
      justParas[0] = justParas[0].replace(/^Justificaci[oó]n\s*:\s*/i, '');
    }
    const justification = justParas.join('\n\n').trim();

    const answers = opts.map((text, idx) => ({
      letter: 'ABCD'[idx],
      text,
      is_correct: 'ABCD'[idx] === answerLetter,
    }));

    questions.push({
      position: questions.length + 1,
      statement: stmt.text,
      answers,
      justification,
    });

    pi = scan;
  }

  if (questions.length !== EXAM_META.total_questions) {
    fail(`Esperaba ${EXAM_META.total_questions} preguntas, parseé ${questions.length}.`);
  }

  // Validaciones finales
  for (const q of questions) {
    if (q.answers.length !== 4) fail(`Pregunta ${q.position}: ${q.answers.length} opciones.`);
    const correct = q.answers.filter(a => a.is_correct).length;
    if (correct !== 1) fail(`Pregunta ${q.position}: ${correct} respuestas correctas.`);
  }

  const out = { exam: EXAM_META, questions };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[PARSE] ✓ ${questions.length} preguntas → ${OUT_PATH}`);
  const dist = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of questions) dist[q.answers.find(a => a.is_correct).letter]++;
  console.log(`[PARSE] Distribución correctas:`, dist);
  const noJust = questions.filter(q => !q.justification).length;
  if (noJust > 0) console.log(`[PARSE] ⚠ ${noJust} preguntas sin justificación.`);
})();
