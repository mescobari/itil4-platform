import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  listCodes,
  generateCodes,
  issueCodeToEmail,
  type CodeRow,
  type CodeCounts,
  type CodeStatus,
} from '../../lib/api';
import { useAuth } from '../../lib/authStore';

type FilterStatus = CodeStatus | 'all';

const STATUS_LABELS: Record<CodeStatus, { label: string; cls: string }> = {
  available: { label: 'Disponible', cls: 'bg-green-500/15 text-green-300 border border-green-500/30' },
  issued:    { label: 'Emitido',    cls: 'bg-blue-500/15  text-blue-300  border border-blue-500/30' },
  redeemed:  { label: 'Canjeado',   cls: 'bg-purple-500/15 text-purple-300 border border-purple-500/30' },
  expired:   { label: 'Expirado',   cls: 'bg-red-500/15   text-red-300   border border-red-500/30' },
};

function formatDate(s: string | null): string {
  if (!s) return '—';
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

export default function AdminCodesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<CodeRow[]>([]);
  const [counts, setCounts] = useState<CodeCounts | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form: generate batch
  const [genCount, setGenCount] = useState(10);
  const [genNotes, setGenNotes] = useState('');
  const [genBusy, setGenBusy] = useState(false);
  const [genResult, setGenResult] = useState<string[] | null>(null);

  // Form: issue manual
  const [issueEmail, setIssueEmail] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [issueBusy, setIssueBusy] = useState(false);
  const [issueMsg, setIssueMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await listCodes(token, { status: filter, limit: 200 });
      setItems(r.items);
      setCounts(r.counts);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error cargando códigos.');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setGenBusy(true);
    setGenResult(null);
    setErr(null);
    try {
      const r = await generateCodes(token, genCount, genNotes || undefined);
      setGenResult(r.codes.map(c => c.code));
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al generar.');
    } finally {
      setGenBusy(false);
    }
  };

  const onIssue = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIssueBusy(true);
    setIssueMsg(null);
    setErr(null);
    try {
      const r = await issueCodeToEmail(token, issueEmail.trim(), issueNotes || undefined);
      setIssueMsg(`✓ Código ${r.code} emitido a ${r.email}. Email enviado.`);
      setIssueEmail('');
      setIssueNotes('');
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al emitir.');
    } finally {
      setIssueBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold">Gestión de códigos</h1>

      {/* Counts */}
      {counts && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['total', 'available', 'issued', 'redeemed', 'expired'] as const).map(k => (
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

      {/* Generate batch */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-lg font-bold mb-3">Generar lote</h2>
        <form onSubmit={onGenerate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-white/60 mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={genCount}
              onChange={e => setGenCount(parseInt(e.target.value, 10) || 0)}
              className="w-28 px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-[#FF6B35] focus:outline-none text-white"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-white/60 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={genNotes}
              onChange={e => setGenNotes(e.target.value)}
              placeholder='ej. "lote enero 2026"'
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-[#FF6B35] focus:outline-none text-white"
            />
          </div>
          <button
            type="submit"
            disabled={genBusy || genCount < 1}
            className="px-5 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#e85a25] text-white font-semibold disabled:opacity-50"
          >
            {genBusy ? 'Generando…' : `Generar ${genCount}`}
          </button>
        </form>
        {genResult && (
          <div className="mt-4 rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-xs text-white/80 max-h-40 overflow-auto">
            {genResult.map(c => <div key={c}>{c}</div>)}
          </div>
        )}
      </section>

      {/* Issue manual */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-lg font-bold mb-1">Emisión manual</h2>
        <p className="text-sm text-white/60 mb-3">
          Asigna un código del pool a un email y se lo envía automáticamente. Útil para soporte
          (cuando un usuario perdió su código o el flujo Get Code falló).
        </p>
        <form onSubmit={onIssue} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-white/60 mb-1">Email</label>
            <input
              type="email"
              required
              value={issueEmail}
              onChange={e => setIssueEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-[#FF6B35] focus:outline-none text-white"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-white/60 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={issueNotes}
              onChange={e => setIssueNotes(e.target.value)}
              placeholder='ej. "Soporte ticket #42"'
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-[#FF6B35] focus:outline-none text-white"
            />
          </div>
          <button
            type="submit"
            disabled={issueBusy || !issueEmail}
            className="px-5 py-2 rounded-lg bg-[#6B2D91] hover:bg-[#561d75] text-white font-semibold disabled:opacity-50"
          >
            {issueBusy ? 'Emitiendo…' : 'Emitir'}
          </button>
        </form>
        {issueMsg && (
          <div className="mt-3 rounded-lg bg-green-900/30 border border-green-500/40 px-3 py-2 text-sm text-green-200">
            {issueMsg}
          </div>
        )}
      </section>

      {/* Listing */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <h2 className="text-lg font-bold mr-auto">Listado</h2>
          {(['all', 'available', 'issued', 'redeemed', 'expired'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                filter === f
                  ? 'bg-white text-[#1a0033]'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f}
            </button>
          ))}
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
          <div className="text-white/50 text-sm">No hay códigos en este filtro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 text-xs uppercase">
                  <th className="py-2 pr-3">Código</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Emitido</th>
                  <th className="py-2 pr-3">Expira</th>
                  <th className="py-2 pr-3">Canjeado</th>
                  <th className="py-2 pr-3">Notas</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-t border-white/5">
                    <td className="py-2 pr-3 font-mono">{it.code}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_LABELS[it.status].cls}`}>
                        {STATUS_LABELS[it.status].label}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-white/70">{it.issued_to_email || '—'}</td>
                    <td className="py-2 pr-3 text-white/60">{formatDate(it.issued_at)}</td>
                    <td className="py-2 pr-3 text-white/60">{formatDate(it.expires_at)}</td>
                    <td className="py-2 pr-3 text-white/60">{formatDate(it.redeemed_at)}</td>
                    <td className="py-2 pr-3 text-white/50 truncate max-w-[200px]">{it.notes || '—'}</td>
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
