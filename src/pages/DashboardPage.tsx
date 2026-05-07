import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listExams,
  listAttempts,
  createAttempt,
  type Exam,
  type AttemptListItem,
  type AttemptMode,
} from '../lib/api';
import { useAuth } from '../lib/authStore';

function fmt(d: string | null): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

/**
 * Card de upsell del coaching dentro del dashboard. El copy se adapta a la
 * situación del usuario: sin intentos → soft pitch, con fallos repetidos →
 * pitch directo al gap, con aprobados → pitch de refuerzo pre-oficial.
 */
function CoachingUpsellCard({ attempts }: { attempts: AttemptListItem[] }) {
  const finished = attempts.filter(a => a.status === 'submitted' || a.status === 'expired');
  const passedAny = finished.some(a => a.passed);
  const failedCount = finished.filter(a => a.passed === false).length;

  let headline: string;
  let pitch: string;
  if (finished.length === 0) {
    headline = '¿Y si te quedas atascado?';
    pitch = 'Practica primero — pero si después de 2-3 intentos sientes que repites los mismos errores, una hora 1:1 conmigo destrabaría lo que el libro solo no aclara.';
  } else if (failedCount >= 2 && !passedAny) {
    headline = `${failedCount} intentos sin aprobar. Hablemos.`;
    pitch = 'Esto no significa que no sepas — significa que te falta una pieza específica que el libro y los simulacros no te están dando. En 1 hora identificamos cuál.';
  } else if (passedAny) {
    headline = '¡Aprobaste el simulador! Ahora… ¿el oficial?';
    pitch = 'El simulador es el primer filtro. El examen oficial tiene matices que solo se ven con alguien que ya pasó por ahí. Una sesión te da la confianza final.';
  } else {
    headline = '¿Quieres acelerar tu aprobación?';
    pitch = 'Una hora 1:1 conmigo equivale a 10 horas estudiando solo: te muestro exactamente qué patrones de error tiene tu cabeza y cómo cerrarlos.';
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#6B2D91]/30 to-[#FF6B35]/15 border border-[#FF6B35]/30 p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="text-4xl flex-shrink-0">🎯</div>
        <div className="flex-1">
          <h3 className="font-extrabold text-lg sm:text-xl mb-1.5">{headline}</h3>
          <p className="text-white/75 text-sm leading-relaxed">{pitch}</p>
        </div>
        <Link
          to="/coaching"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#e85a25] text-white font-bold text-sm whitespace-nowrap transition-colors shadow-lg shadow-[#FF6B35]/20"
        >
          Ver coaching 1:1 →
        </Link>
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
        <span>💵 Desde <strong className="text-white/85">$30 USD</strong> / hora</span>
        <span>·</span>
        <span>📦 Plan 4h por <strong className="text-white/85">$100</strong> (ahorras $20)</span>
        <span>·</span>
        <span>🛡️ Garantía sin letra chica</span>
      </div>
    </section>
  );
}

function StatusBadge({ s }: { s: AttemptListItem['status'] }) {
  const map: Record<string, string> = {
    in_progress: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/40',
    submitted:   'bg-green-500/15 text-green-200 border-green-500/40',
    expired:     'bg-red-500/15 text-red-200 border-red-500/40',
    discarded:   'bg-white/10 text-white/40 border-white/20',
  };
  const label: Record<string, string> = {
    in_progress: 'En curso',
    submitted: 'Enviado',
    expired: 'Expirado',
    discarded: 'Descartado',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${map[s] || ''}`}>
      {label[s] || s}
    </span>
  );
}

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<AttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const [e, a] = await Promise.all([listExams(token), listAttempts(token)]);
      setExams(e.items);
      setAttempts(a.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error cargando.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const start = async (slug: string, mode: AttemptMode) => {
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await createAttempt(token, slug, mode);
      navigate(`/intento/${r.attemptId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo iniciar.');
    } finally {
      setBusy(false);
    }
  };

  const inProgress = attempts.find(a => a.status === 'in_progress');

  if (!user) return null;
  const exam = exams[0]; // MVP: 1 simulador

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="font-bold">ITIL 4 Foundation · Simulador</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/70">{user.name}</span>
          <Link
            to="/coaching"
            className="hidden sm:inline-flex items-center gap-1 text-[#FFB89A] hover:text-[#FF6B35] font-semibold"
          >
            💬 Coaching 1:1
          </Link>
          {user.isAdmin && (
            <Link to="/admin/stats" className="text-[#FF6B35] hover:underline font-semibold">
              Admin
            </Link>
          )}
          <button
            onClick={() => { logout(); navigate('/coaching'); }}
            className="text-white/60 hover:text-white"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">¡Hola, {user.name}!</h1>
          <p className="text-white/60">
            {exam ? exam.title : 'Cargando simulador…'}
          </p>
        </div>

        {err && (
          <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {inProgress && (
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-yellow-200 font-bold mb-1">Tienes un intento en curso</div>
              <div className="text-sm text-white/70">
                Modo {inProgress.mode === 'practice' ? 'Práctica' : 'Examen'} — iniciado {fmt(inProgress.startedAt)}
              </div>
            </div>
            <button
              onClick={() => navigate(`/intento/${inProgress.id}`)}
              className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm whitespace-nowrap"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Selector de modo */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="text-2xl mb-2">🟢</div>
            <h2 className="text-xl font-bold mb-2">Modo Práctica</h2>
            <p className="text-white/60 text-sm mb-4">
              Navega libremente entre {exam?.total_questions ?? '—'} preguntas. Verás la respuesta correcta y la
              justificación al instante. Sin tiempo límite.
            </p>
            <button
              disabled={busy || !exam || !!inProgress}
              onClick={() => exam && start(exam.slug, 'practice')}
              className="w-full py-3 rounded-xl bg-[#6B2D91] hover:bg-[#561d75] text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {inProgress ? 'Termina el intento en curso primero' : busy ? 'Creando…' : 'Iniciar práctica'}
            </button>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="text-2xl mb-2">🔵</div>
            <h2 className="text-xl font-bold mb-2">Modo Examen</h2>
            <p className="text-white/60 text-sm mb-4">
              {exam?.total_questions ?? '—'} preguntas en {exam?.time_limit_minutes ?? '—'} minutos. Aprobado con
              {' '}{exam?.pass_threshold_pct ?? '—'}% o más. Sin feedback hasta el final.
            </p>
            <button
              disabled={busy || !exam || !!inProgress}
              onClick={() => exam && start(exam.slug, 'exam')}
              className="w-full py-3 rounded-xl bg-[#FF6B35] hover:bg-[#e85a25] text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {inProgress ? 'Termina el intento en curso primero' : busy ? 'Creando…' : 'Iniciar examen'}
            </button>
          </div>
        </div>

        {/* Coaching upsell — visible siempre, copy adaptativo segun historial */}
        <CoachingUpsellCard attempts={attempts} />

        {/* Historial */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-lg font-bold mb-4">Historial</h2>
          {loading ? (
            <div className="text-white/50 text-sm">Cargando…</div>
          ) : attempts.length === 0 ? (
            <div className="text-white/50 text-sm">Aún no has realizado ningún intento.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/50 text-xs uppercase">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Modo</th>
                    <th className="py-2 pr-3">Iniciado</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(it => (
                    <tr key={it.id} className="border-t border-white/5">
                      <td className="py-2 pr-3 text-white/60">{it.id}</td>
                      <td className="py-2 pr-3">
                        {it.mode === 'practice' ? '🟢 Práctica' : '🔵 Examen'}
                      </td>
                      <td className="py-2 pr-3 text-white/60 whitespace-nowrap">{fmt(it.startedAt)}</td>
                      <td className="py-2 pr-3"><StatusBadge s={it.status} /></td>
                      <td className="py-2 pr-3">
                        {it.scorePct != null ? (
                          <span className={it.passed ? 'text-green-300' : 'text-white/70'}>
                            {it.scoreCorrect}/{it.scoreTotal} ({it.scorePct.toFixed(0)}%)
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {it.status === 'in_progress' ? (
                          <Link to={`/intento/${it.id}`} className="text-[#FF6B35] hover:underline">Continuar</Link>
                        ) : (
                          <Link to={`/resultado/${it.id}`} className="text-white/70 hover:underline">Ver review</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
