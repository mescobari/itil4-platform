import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../lib/api';
import { useAuth } from '../lib/authStore';

export default function RegisterPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get('code');
    if (code) setActivationCode(code.toUpperCase());
  }, [params]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErr('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await registerUser({
        email: email.trim(),
        name: name.trim(),
        password,
        activationCode: activationCode.trim(),
      });
      login(r.token, r.user);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error en el registro.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0014] via-[#1a0033] to-[#2d0060] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Crear cuenta</h1>
        <p className="text-gray-500 text-sm mb-6">Activa tu acceso al simulador ITIL 4.</p>

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
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña (mín. 8 caracteres)"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none"
          />
          <input
            type="text"
            required
            value={activationCode}
            onChange={e => setActivationCode(e.target.value.toUpperCase())}
            placeholder="Código de activación"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#6B2D91] focus:outline-none uppercase font-mono tracking-wider"
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
            {busy ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6 space-y-1">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#6B2D91] font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
          <p>
            ¿No tienes código?{' '}
            <Link to="/get-code" className="text-[#6B2D91] font-semibold hover:underline">
              Solicítalo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
