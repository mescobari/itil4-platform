import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getChallenge, redeemChallenge, type ChallengeQuestion } from '../lib/api';

type State =
  | { kind: 'idle' }
  | { kind: 'challenge'; sessionId: string; questions: ChallengeQuestion[]; answers: Record<number, string> }
  | { kind: 'done'; email: string; message: string };

export default function GetCodePage() {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startChallenge = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await getChallenge();
      setState({
        kind: 'challenge',
        sessionId: r.sessionId,
        questions: r.questions,
        answers: Object.fromEntries(r.questions.map(q => [q.id, ''])),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo iniciar el challenge.');
    } finally {
      setBusy(false);
    }
  };

  const submitAnswers = async (e: FormEvent) => {
    e.preventDefault();
    if (state.kind !== 'challenge') return;
    setBusy(true);
    setErr(null);
    try {
      const answers = state.questions.map(q => ({ id: q.id, answer: state.answers[q.id] || '' }));
      const r = await redeemChallenge({ sessionId: state.sessionId, email, name, answers });
      setState({ kind: 'done', email, message: r.message });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al validar.';
      setErr(msg);
      // Si fue por respuestas mal, al frontend le conviene pedir nuevo challenge
      if (msg.toLowerCase().includes('no son correctas')) {
        try {
          const fresh = await getChallenge();
          setState({
            kind: 'challenge',
            sessionId: fresh.sessionId,
            questions: fresh.questions,
            answers: Object.fromEntries(fresh.questions.map(q => [q.id, ''])),
          });
        } catch (_) {/* keep error visible */}
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8">
        <div className="flex items-center gap-2 mb-1 text-[#6B2D91]">
          <Link to="/itil4" className="text-sm hover:underline">← Volver</Link>
        </div>
        <h1 className="text-2xl font-extrabold text-[#1F2937] mb-2">Obtén tu código de acceso</h1>
        <p className="text-gray-500 text-sm mb-6">
          Si compraste el libro ITIL 4 Foundation en Amazon KDP, responde 3 preguntas cortas y te enviaremos
          tu código por email para activar el simulador.
        </p>

        {state.kind === 'idle' && (
          <form onSubmit={startChallenge} className="space-y-4">
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
            />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Tu email (donde recibirás el código)"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Capturamos tu nombre y email ahora para que al activar tu cuenta solo tipees tu contraseña.
            </p>
            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={busy || !email || !name.trim()}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-bold hover:bg-[#e85a25] transition-colors disabled:opacity-50"
            >
              {busy ? 'Cargando…' : 'Continuar — Solicitar mis preguntas'}
            </button>
          </form>
        )}

        {state.kind === 'challenge' && (
          <form onSubmit={submitAnswers} className="space-y-5">
            <div className="text-xs text-gray-500 mb-2">
              Email: <strong>{email}</strong> · 3 preguntas — debes acertar las 3
            </div>

            {state.questions.map((q, i) => (
              <div key={q.id}>
                <label className="block text-sm font-semibold text-[#1F2937] mb-2">
                  {i + 1}. {q.question}
                </label>
                <input
                  type="text"
                  required
                  value={state.answers[q.id] || ''}
                  onChange={e =>
                    setState(s =>
                      s.kind === 'challenge'
                        ? { ...s, answers: { ...s.answers, [q.id]: e.target.value } }
                        : s,
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
                />
              </div>
            ))}

            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-bold hover:bg-[#e85a25] transition-colors disabled:opacity-50"
            >
              {busy ? 'Validando…' : 'Enviar respuestas'}
            </button>
            <button
              type="button"
              onClick={() => { setState({ kind: 'idle' }); setErr(null); }}
              className="w-full text-xs text-gray-500 hover:text-gray-700"
            >
              Cancelar y empezar de nuevo
            </button>
          </form>
        )}

        {state.kind === 'done' && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">📬</div>
            <h2 className="text-xl font-bold text-[#1F2937]">¡Casi listo!</h2>
            <p className="text-gray-600 text-sm">{state.message}</p>
            <p className="text-xs text-gray-500">
              ¿Llegó tu código? Úsalo en{' '}
              <Link to="/registro" className="text-[#6B2D91] font-semibold hover:underline">
                la página de registro
              </Link>{' '}
              para activar tu simulador.
            </p>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-100 space-y-1">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#6B2D91] font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
          <p>
            ¿Ya tienes el código?{' '}
            <Link to="/registro" className="text-[#6B2D91] font-semibold hover:underline">
              Registrarme
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
