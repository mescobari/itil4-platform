import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getReview, type ReviewResponse } from '../lib/api';
import { useAuth } from '../lib/authStore';
import { ResultSummary } from '../components/sim/ResultSummary';

type Filter = 'all' | 'wrong' | 'unanswered';

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const attemptId = id ? parseInt(id, 10) : 0;
  const { token } = useAuth();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    (async () => {
      if (!token || !attemptId) return;
      try {
        const r = await getReview(token, attemptId);
        setData(r);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Error.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0014] flex items-center justify-center text-white/60">
        Cargando resultado…
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="min-h-screen bg-[#0a0014] flex flex-col items-center justify-center gap-4 text-white">
        <p>{err || 'No se pudo cargar.'}</p>
        <Link to="/dashboard" className="text-[#FF6B35] hover:underline">← Volver al dashboard</Link>
      </div>
    );
  }

  const att   = data.attempt;
  const items = data.items.filter(it => {
    if (filter === 'wrong')      return it.isCorrect === false;
    if (filter === 'unanswered') return it.selectedLetter == null;
    return true;
  });

  const wrongCount      = data.items.filter(i => i.isCorrect === false).length;
  const unansweredCount = data.items.filter(i => i.selectedLetter == null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="text-sm">
          <Link to="/dashboard" className="text-white/60 hover:text-white">← Dashboard</Link>
          <span className="mx-2 text-white/30">|</span>
          <span className="font-semibold">{att.examTitle}</span>
          <span className="ml-2 text-xs text-white/50">
            {att.mode === 'practice' ? '🟢 Práctica' : '🔵 Examen'}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <ResultSummary
          scoreCorrect={att.scoreCorrect ?? 0}
          scoreTotal={att.scoreTotal}
          scorePct={att.scorePct ?? 0}
          threshold={att.threshold}
          passed={att.passed === true}
          status={att.status}
        />

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-white/50 uppercase tracking-wider mr-1">Mostrar:</span>
          {([
            ['all',        `Todas (${data.items.length})`],
            ['wrong',      `Incorrectas (${wrongCount})`],
            ['unanswered', `Sin responder (${unansweredCount})`],
          ] as [Filter, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                filter === k
                  ? 'bg-white text-[#1a0033]'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="text-white/50 text-sm rounded-xl bg-white/5 border border-white/10 p-6">
            No hay preguntas en este filtro.
          </div>
        ) : (
          items.map(it => {
            const ok = it.isCorrect === true;
            const unanswered = it.selectedLetter == null;
            return (
              <article
                key={it.questionId}
                className={`rounded-2xl border p-5 sm:p-6 ${
                  unanswered ? 'border-white/15 bg-white/5'
                  : ok        ? 'border-green-500/40 bg-green-500/5'
                              : 'border-red-500/40 bg-red-500/5'
                }`}
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wider text-white/50">#{it.orderIndex}</span>
                  {unanswered ? (
                    <span className="text-xs text-white/50">— Sin responder</span>
                  ) : ok ? (
                    <span className="text-xs text-green-300">— Correcta</span>
                  ) : (
                    <span className="text-xs text-red-300">— Incorrecta</span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">{it.statement}</h3>
                <ul className="space-y-1.5 mb-4">
                  {it.answers.map(a => {
                    const isUserPick = a.letter === it.selectedLetter;
                    const isCorrect  = a.letter === it.correctLetter;
                    return (
                      <li
                        key={a.letter}
                        className={`flex gap-2 px-3 py-2 rounded-lg text-sm ${
                          isCorrect
                            ? 'bg-green-500/15 border border-green-500/40 text-green-100'
                            : isUserPick
                              ? 'bg-red-500/15 border border-red-500/40 text-red-100'
                              : 'bg-white/5 border border-white/10 text-white/70'
                        }`}
                      >
                        <span className="font-bold w-5">{a.letter}.</span>
                        <span className="flex-1">{a.text}</span>
                        {isCorrect && <span className="text-xs">✓</span>}
                        {isUserPick && !isCorrect && <span className="text-xs">✗ tu opción</span>}
                      </li>
                    );
                  })}
                </ul>
                {it.justification && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-white/70 hover:text-white">
                      Ver justificación
                    </summary>
                    <p className="mt-2 text-white/80 whitespace-pre-line">
                      {it.justification}
                    </p>
                  </details>
                )}
              </article>
            );
          })
        )}

        <div className="pt-4 flex justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl bg-[#6B2D91] hover:bg-[#561d75] text-white font-semibold"
          >
            Volver al dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
