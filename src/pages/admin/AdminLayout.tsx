import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authStore';

const navLinks = [
  { to: '/admin/stats',       label: 'Resumen' },
  { to: '/admin/codigos',     label: 'Códigos' },
  { to: '/admin/challenges',  label: 'Challenges' },
  { to: '/admin/solicitudes', label: 'Solicitudes' },
  { to: '/admin/usuarios',    label: 'Usuarios' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0014] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="font-bold text-white/90">
            ← Dashboard
          </Link>
          <span className="text-white/40">|</span>
          <span className="font-semibold">Panel admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-white/60">{user.email}</span>
          <button
            onClick={() => { logout(); navigate('/coaching'); }}
            className="text-white/60 hover:text-white"
          >
            Salir
          </button>
        </div>
      </header>

      <nav className="border-b border-white/10 px-6">
        <ul className="flex gap-1">
          {navLinks.map(l => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `inline-block px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#FF6B35] text-white'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
