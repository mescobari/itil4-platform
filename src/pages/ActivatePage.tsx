import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { beginRegistration, completeRegistration, type BeginRegistrationResponse } from '../lib/api';
import { useAuth } from '../lib/authStore';

/**
 * Magic-link landing. Recibe ?t=<64-hex-chars>, valida vía POST a
 * /api/auth/begin-registration (no consume el token), muestra email + name
 * pre-rellenados (read-only) y un único campo: password.
 *
 * Single-use real ocurre en /api/auth/complete-registration: si el usuario
 * llega aquí y cierra la pestaña sin tipear password, el token sigue válido.
 */
type State =
  | { kind: 'loading' }
  | { kind: 'invalid'; message: string }
  | { kind: 'already-registered'; email: string }
  | { kind: 'ready'; data: BeginRegistrationResponse };

export default function ActivatePage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { login }  = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const rawToken = params.get('t') || '';

  useEffect(() => {
    if (!rawToken) {
      setState({ kind: 'invalid', message: 'Falta el token de activación en el link.' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await beginRegistration(rawToken);
        if (cancelled) return;
        if (data.alreadyRegistered) {
          setState({ kind: 'already-registered', email: data.email });
        } else {
          setState({ kind: 'ready', data });
        }
      } catch (e) {
        if (cancelled) return;
        setState({
          kind: 'invalid',
          message: e instanceof Error ? e.message : 'Link de activación no válido.',
        });
      }
    })();
    return () => { cancelled = true; };
  }, [rawToken]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErr('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await completeRegistration(rawToken, password);
      login(r.token, r.user);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al activar la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Activar mi cuenta</h1>
        <p className="text-gray-500 text-sm mb-6">Solo falta crear tu contraseña.</p>

        {state.kind === 'loading' && (
          <div className="text-center py-8 text-gray-500 text-sm">Validando tu link…</div>
        )}

        {state.kind === 'invalid' && (
          <div className="space-y-4">
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {state.message}
            </div>
            <p className="text-sm text-gray-600">
              Si el link expiró o ya fue usado, puedes{' '}
              <Link to="/get-code" className="text-[#6B2D91] font-semibold hover:underline">
                solicitar uno nuevo
              </Link>{' '}
              o{' '}
              <Link to="/login" className="text-[#6B2D91] font-semibold hover:underline">
                iniciar sesión
              </Link>{' '}
              si ya tienes cuenta.
            </p>
          </div>
        )}

        {state.kind === 'already-registered' && (
          <div className="space-y-4">
            <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
              Ya existe una cuenta con <strong>{state.email}</strong>. Inicia sesión para continuar.
            </div>
            <Link
              to="/login"
              className="block w-full text-center py-3 rounded-xl bg-[#FF6B35] text-white font-bold hover:bg-[#e85a25] transition-colors"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        )}

        {state.kind === 'ready' && (
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email y name en read-only — vienen del token; no permitimos editarlos
                aquí porque cambiarían el contrato del registro. Si el usuario
                quiere otros datos, debe ir a /#/registro y tipearlos a mano. */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
              <input
                type="email"
                value={state.data.email}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">NOMBRE</label>
              <input
                type="text"
                value={state.data.name}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">CÓDIGO</label>
              <input
                type="text"
                value={state.data.codeMasked}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-mono tracking-wider"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">CONTRASEÑA</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
              />
            </div>

            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || password.length < 8}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-bold hover:bg-[#e85a25] transition-colors disabled:opacity-50"
            >
              {busy ? 'Activando…' : 'Activar y entrar al simulador'}
            </button>

            <p className="text-xs text-center text-gray-500">
              Al activar aceptas que el código quede ligado a este email.
            </p>
          </form>
        )}

        <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#6B2D91] font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
