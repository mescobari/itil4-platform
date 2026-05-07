import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getAttempt, getAttemptQuestion, submitAnswer, submitAttempt,
  type AttemptState, type QuestionPayload,
} from '../lib/api';
import { useAuth } from '../lib/authStore';
import { QuestionCard } from '../components/sim/QuestionCard';
import { AnswerOption } from '../components/sim/AnswerOption';
import { ProgressBar } from '../components/sim/ProgressBar';
import { Timer } from '../components/sim/Timer';

type Letter = 'A' | 'B' | 'C' | 'D';

export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const attemptId = id ? parseInt(id, 10) : 0;
  const { token } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<AttemptState | null>(null);
  const [pos, setPos] = useState(0);                  // índice en questionOrder
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean; correctLetter: Letter; justification: string;
  } | null>(null);

  // Para evitar overlapping fetches al cambiar pregunta rápidamente
  const fetchSeq = useRef(0);

  const reloadState = useCallback(async (): Promise<AttemptState | null> => {
    if (!token || !attemptId) return null;
    const r = await getAttempt(token, attemptId);
    setState(r.attempt);
    return r.attempt;
  }, [token, attemptId]);

  const loadQuestion = useCallback(async (s: AttemptState, idx: number) => {
    if (!token) return;
    const seq = ++fetchSeq.current;
    setQuestion(null);
    setFeedback(null);
    const qid = s.questionOrder[idx];
    if (qid == null) return;
    const isFinalState = s.status !== 'in_progress';
    const reveal = s.mode === 'practice' && (s.answers[qid]?.selectedLetter != null);
    try {
      const r = await getAttemptQuestion(token, attemptId, qid, reveal || isFinalState);
      if (seq !== fetchSeq.current) return; // se cambió de pregunta antes de responder
      setQuestion(r.question);
      // En práctica si ya había respondido, prepoblar feedback
      if (s.mode === 'practice' && s.answers[qid]?.selectedLetter && r.question.justification != null) {
        const corr = r.question.answers.find(a => a.isCorrect)?.letter;
        setFeedback({
          isCorrect: !!s.answers[qid]?.isCorrect,
          correctLetter: (corr || 'A') as Letter,
          justification: r.question.justification || '',
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error cargando pregunta.');
    }
  }, [token, attemptId]);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const s = await reloadState();
        if (!s) return;
        // Si ya está cerrado, ir directo al resultado
        if (s.status !== 'in_progress') {
          navigate(`/resultado/${attemptId}`, { replace: true });
          return;
        }
        // Iniciar en la primera pregunta no respondida (si hay), si no en 0
        const firstUnanswered = s.questionOrder.findIndex(qid => !s.answers[qid]?.selectedLetter);
        const startPos = firstUnanswered === -1 ? 0 : firstUnanswered;
        setPos(startPos);
        await loadQuestion(s, startPos);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Error.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelect = async (letter: Letter) => {
    if (!state || !question || !token) return;
    if (state.status !== 'in_progress') return;
    setBusy(true);
    setErr(null);
    try {
      const r = await submitAnswer(token, attemptId, question.id, letter);
      // Actualizar estado local sin re-fetch completo
      setState(s => s ? {
        ...s,
        answers: {
          ...s.answers,
          [question.id]: {
            selectedLetter: letter,
            isCorrect: r.isCorrect ?? null,
            answeredAt: new Date().toISOString(),
          },
        },
      } : s);
      if (state.mode === 'practice' && r.correctLetter) {
        setFeedback({
          isCorrect: !!r.isCorrect,
          correctLetter: r.correctLetter as Letter,
          justification: r.justification || '',
        });
        // Reload question con reveal=true para que se marquen visualmente las opciones
        const reveal = await getAttemptQuestion(token, attemptId, question.id, true);
        setQuestion(reveal.question);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error guardando.');
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (!state) return;
    const next = pos + 1;
    if (next >= state.questionOrder.length) return;
    setPos(next);
    await loadQuestion(state, next);
  };

  const goPrev = async () => {
    if (!state) return;
    if (state.mode === 'exam') return; // examen no permite volver
    const prev = pos - 1;
    if (prev < 0) return;
    setPos(prev);
    await loadQuestion(state, prev);
  };

  const onSubmit = async () => {
    if (!token || !state) return;
    const unanswered = state.questionOrder.filter(qid => !state.answers[qid]?.selectedLetter).length;
    const msg = unanswered > 0
      ? `Te faltan ${unanswered} pregunta(s) sin responder. ¿Enviar de todos modos?`
      : '¿Confirmas que quieres enviar y ver tu resultado?';
    if (!confirm(msg)) return;
    setBusy(true);
    setErr(null);
    try {
      await submitAttempt(token, attemptId);
      navigate(`/resultado/${attemptId}`, { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al enviar.');
    } finally {
      setBusy(false);
    }
  };

  const onTimerExpire = useCallback(async () => {
    if (!token) return;
    try {
      await submitAttempt(token, attemptId);
    } catch (_) { /* noop — el backend igual marca expired al re-leer */ }
    navigate(`/resultado/${attemptId}`, { replace: true });
  }, [token, attemptId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0014] flex items-center justify-center text-white/60">
        Cargando intento…
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-[#0a0014] flex flex-col items-center justify-center gap-4 text-white">
        <p>{err || 'No se pudo cargar el intento.'}</p>
        <Link to="/dashboard" className="text-[#FF6B35] hover:underline">← Volver al dashboard</Link>
      </div>
    );
  }

  const total       = state.questionOrder.length;
  const answeredQs  = Object.values(state.answers).filter(a => a.selectedLetter).length;
  const currentQid  = state.questionOrder[pos];
  const myAnswer    = state.answers[currentQid];
  const selected    = myAnswer?.selectedLetter || null;
  const isLast      = pos === total - 1;
  const isFirst     = pos === 0;
  const isExam      = state.mode === 'exam';
  const inFeedback  = state.mode === 'practice' && feedback != null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="text-sm">
          <Link to="/dashboard" className="text-white/60 hover:text-white">← Dashboard</Link>
          <span className="mx-2 text-white/30">|</span>
          <span className="font-semibold">{state.examTitle}</span>
          <span className="ml-2 text-xs text-white/50">
            {state.mode === 'practice' ? '🟢 Práctica' : '🔵 Examen'}
          </span>
        </div>
        {isExam && state.timeLimitSeconds && (
          <Timer
            startedAt={state.startedAt}
            timeLimitSeconds={state.timeLimitSeconds}
            onExpire={onTimerExpire}
          />
        )}
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <ProgressBar current={pos + 1} total={total} answered={answeredQs} />

        {err && (
          <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {question && (
          <QuestionCard
            index={pos + 1}
            total={total}
            statement={question.statement}
            footer={
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  {!isExam && (
                    <button
                      onClick={goPrev}
                      disabled={isFirst || busy}
                      className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-30"
                    >
                      ← Anterior
                    </button>
                  )}
                  <button
                    onClick={goNext}
                    disabled={isLast || busy || (isExam && !selected)}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-30"
                  >
                    Siguiente →
                  </button>
                </div>
                <button
                  onClick={onSubmit}
                  disabled={busy}
                  className="px-5 py-2 rounded-lg bg-[#FF6B35] text-white font-bold hover:bg-[#e85a25] disabled:opacity-50"
                >
                  {busy ? 'Enviando…' : isLast ? 'Enviar y ver resultado' : 'Enviar antes'}
                </button>
              </div>
            }
            feedback={
              inFeedback && feedback ? (
                <div className={`rounded-xl border p-4 ${
                  feedback.isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                }`}>
                  <div className="font-bold mb-2">
                    {feedback.isCorrect ? '✓ Correcto' : '✗ Incorrecto'} — la respuesta correcta es {feedback.correctLetter}
                  </div>
                  {feedback.justification && (
                    <div className="text-sm text-white/80 whitespace-pre-line">
                      {feedback.justification}
                    </div>
                  )}
                </div>
              ) : null
            }
          >
            {question.answers.map(a => (
              <AnswerOption
                key={a.letter}
                letter={a.letter}
                text={a.text}
                selected={selected === a.letter}
                reveal={inFeedback}
                isCorrect={a.isCorrect}
                correctLetter={feedback?.correctLetter || null}
                disabled={busy || (state.mode === 'practice' && inFeedback)}
                onClick={() => onSelect(a.letter)}
              />
            ))}
          </QuestionCard>
        )}
      </main>
    </div>
  );
}
