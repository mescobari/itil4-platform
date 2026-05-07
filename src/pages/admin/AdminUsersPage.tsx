import { useState, useEffect, useCallback } from 'react';
import {
  adminListUsers,
  adminResetUser,
  type AdminUserRow,
  type AdminUserCounts,
} from '../../lib/api';
import { useAuth } from '../../lib/authStore';

function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

function PctBadge({ pct, passed }: { pct: number | null; passed: boolean | null }) {
  if (pct == null) return <span className="text-white/40">—</span>;
  const cls =
    passed === true  ? 'text-green-300' :
    passed === false ? 'text-red-300'   : 'text-white/70';
  return <span className={cls}>{pct.toFixed(1)}%</span>;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [counts, setCounts] = useState<AdminUserCounts | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resetting, setResetting] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await adminListUsers(token, {
        q: search.trim() || undefined,
        limit: 200,
      });
      setItems(r.items);
      setCounts(r.counts);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error cargando.');
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { refresh(); }, [refresh]);

  const onReset = async (u: AdminUserRow) => {
    if (!token) return;
    if (!confirm(`¿Marcar todos los intentos de ${u.email} como descartados?\n\nNo se borra nada — solo se ocultan del historial activo.`)) return;
    setResetting(u.id);
    try {
      const r = await adminResetUser(token, u.id);
      alert(`✓ ${r.affected} intento(s) marcado(s) como descartado(s).`);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al resetear.');
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3 justify-between">
        <h1 className="text-2xl font-extrabold">Usuarios</h1>
        {counts && (
          <div className="text-sm text-white/60">
            {counts.total} total · {counts.withAccess} con acceso · {counts.admins} admin
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por email o nombre"
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:border-[#FF6B35] focus:outline-none"
        />
        <button
          onClick={refresh}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20"
        >
          ↻ Refrescar
        </button>
      </div>

      {err && (
        <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        {loading ? (
          <div className="text-white/50 text-sm">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-white/50 text-sm">Sin resultados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 text-xs uppercase">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Roles</th>
                  <th className="py-2 pr-3">Registrado</th>
                  <th className="py-2 pr-3">Intentos</th>
                  <th className="py-2 pr-3">Mejor / Último</th>
                  <th className="py-2 pr-3">Código</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="py-2 pr-3 text-white/60">{u.id}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3 text-white/70">{u.name}</td>
                    <td className="py-2 pr-3 space-x-1">
                      {u.isAdmin && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40">
                          admin
                        </span>
                      )}
                      {u.hasAccess && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/15 text-green-300 border border-green-500/40">
                          acceso
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/50 whitespace-nowrap">{fmt(u.createdAt)}</td>
                    <td className="py-2 pr-3 text-white/70">
                      {u.totalAttempts} <span className="text-white/40">({u.finishedAttempts} fin.)</span>
                    </td>
                    <td className="py-2 pr-3">
                      <PctBadge pct={u.bestPct} passed={u.bestPct != null && u.lastPassed} />
                      <span className="text-white/30 mx-1">/</span>
                      <PctBadge pct={u.lastPct} passed={u.lastPassed} />
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-white/60">
                      {u.activationCode || '—'}
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => onReset(u)}
                        disabled={resetting === u.id || u.totalAttempts === 0}
                        className="text-xs text-red-300 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {resetting === u.id ? '…' : 'Reset intentos'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
