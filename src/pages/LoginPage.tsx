import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../lib/api';
import { useAuth } from '../lib/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await loginUser({ email, password });
      login(r.token, r.user);
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Iniciar sesión</h1>
        <p className="text-gray-500 text-sm mb-6">Accede a tu simulador ITIL 4.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
          />
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
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6 space-y-1">
          <p>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-[#6B2D91] font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
          <p>
            ¿Aún no tienes código?{' '}
            <Link to="/get-code" className="text-[#6B2D91] font-semibold hover:underline">
              Solicítalo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
