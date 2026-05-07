import { useState, useEffect, useCallback } from 'react';
import {
  adminListCodeRequests,
  type CodeRequestRow,
  type CodeRequestCounts,
} from '../../lib/api';
import { useAuth } from '../../lib/authStore';

type FilterPassed = 'all' | '1' | '0';

function formatDate(s: string): string {
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

export default function AdminCodeRequestsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<CodeRequestRow[]>([]);
  const [counts, setCounts] = useState<CodeRequestCounts | null>(null);
  const [filterPassed, setFilterPassed] = useState<FilterPassed>('all');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterIp, setFilterIp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await adminListCodeRequests(token, {
        passed: filterPassed === 'all' ? undefined : filterPassed,
        email:  filterEmail.trim() || undefined,
        ip:     filterIp.trim()    || undefined,
        limit:  200,
      });
      setItems(r.items);
      setCounts(r.counts);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error cargando log.');
    } finally {
      setLoading(false);
    }
  }, [token, filterPassed, filterEmail, filterIp]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Log de solicitudes Get Code</h1>

      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['total', 'passed', 'failed', 'last24h'] as const).map(k => (
            <div key={k} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs uppercase text-white/50 tracking-wider">{k}</div>
              <div className="text-2xl font-bold mt-1">{counts[k]}</div>
            </div>
          ))}
        </div>
      )}

      {err && (
        <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex gap-1">
            {(['all', '1', '0'] as FilterPassed[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterPassed(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  filterPassed === f
                    ? 'bg-white text-[#1a0033]'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {f === 'all' ? 'Todos' : f === '1' ? 'Passed' : 'Failed'}
              </button>
            ))}
          </div>
          <input
            value={filterEmail}
            onChange={e => setFilterEmail(e.target.value)}
            placeholder="Filtrar por email"
            className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          />
          <input
            value={filterIp}
            onChange={e => setFilterIp(e.target.value)}
            placeholder="Filtrar por IP"
            className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
          />
          <button
            onClick={refresh}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70 hover:bg-white/20"
          >
            ↻ Refrescar
          </button>
        </div>

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
                  <th className="py-2 pr-3">Cuándo</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">IP</th>
                  <th className="py-2 pr-3">Resultado</th>
                  <th className="py-2 pr-3">Fallos</th>
                  <th className="py-2 pr-3">Código emitido</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-t border-white/5">
                    <td className="py-2 pr-3 text-white/60">{it.id}</td>
                    <td className="py-2 pr-3 text-white/60 whitespace-nowrap">{formatDate(it.created_at)}</td>
                    <td className="py-2 pr-3 text-white/80">{it.email}</td>
                    <td className="py-2 pr-3 text-white/60 font-mono text-xs">{it.ip}</td>
                    <td className="py-2 pr-3">
                      {it.passed ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-500/15 text-green-300 border border-green-500/30">
                          passed
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-500/15 text-red-300 border border-red-500/30">
                          failed
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/60">{it.failed_count ?? '—'}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-white/70">{it.issued_code || '—'}</td>
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
