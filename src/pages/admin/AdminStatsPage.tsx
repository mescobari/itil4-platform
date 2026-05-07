import { useState, useEffect, useCallback } from 'react';
import { adminGetStats, type AdminStats } from '../../lib/api';
import { useAuth } from '../../lib/authStore';

interface CardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}

function Card({ label, value, hint, tone = 'default' }: CardProps) {
  const toneCls =
    tone === 'good' ? 'border-green-500/40 bg-green-500/10' :
    tone === 'warn' ? 'border-yellow-500/40 bg-yellow-500/10' :
    tone === 'bad'  ? 'border-red-500/40 bg-red-500/10'  :
                      'border-white/10 bg-white/5';
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <div className="text-xs uppercase text-white/50 tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-white/50 mt-1">{hint}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{children}</div>
    </section>
  );
}

function fmt(n: number | null | undefined, d = 1): string {
  if (n == null) return '—';
  return n.toFixed(d);
}

export default function AdminStatsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await adminGetStats(token);
      setData(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error cargando.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">Resumen</h1>
        <button
          onClick={refresh}
          className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70 hover:bg-white/20"
        >
          ↻ Refrescar
        </button>
      </div>

      {err && (
        <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {loading || !data ? (
        <div className="text-white/50 text-sm">Cargando…</div>
      ) : (
        <div className="space-y-8">
          <Section title="Usuarios">
            <Card label="Total" value={data.users.total} />
            <Card label="Con acceso" value={data.users.withAccess} tone="good" />
            <Card label="Admins" value={data.users.admins} />
            <Card label="Sin acceso"
                  value={Math.max(0, data.users.total - data.users.withAccess)}
                  tone={data.users.total > data.users.withAccess ? 'warn' : 'default'} />
          </Section>

          <Section title="Pool de códigos">
            <Card label="Total" value={data.codes.total} />
            <Card label="Disponibles" value={data.codes.available}
                  tone={data.codes.available < 5 ? 'warn' : 'good'}
                  hint={data.codes.available < 5 ? '⚠ stock bajo' : undefined} />
            <Card label="Emitidos" value={data.codes.issued} />
            <Card label="Canjeados" value={data.codes.redeemed} />
          </Section>

          <Section title="Intentos del simulador">
            <Card label="Total" value={data.attempts.total} />
            <Card label="En curso" value={data.attempts.inProgress}
                  tone={data.attempts.inProgress > 0 ? 'warn' : 'default'} />
            <Card label="Completados" value={data.attempts.submitted} />
            <Card label="Expirados" value={data.attempts.expired}
                  tone={data.attempts.expired > 0 ? 'bad' : 'default'} />
            <Card label="Aprobados"
                  value={data.attempts.passed}
                  tone="good"
                  hint={data.attempts.passRate != null ? `${data.attempts.passRate}% de los completados` : undefined} />
            <Card label="Promedio (%)"
                  value={data.attempts.avgPct == null ? '—' : fmt(data.attempts.avgPct, 1) + '%'} />
            <Card label="Descartados" value={data.attempts.discarded} />
          </Section>

          <Section title="Solicitudes Get Code">
            <Card label="Total" value={data.codeRequests.total} />
            <Card label="Pasadas" value={data.codeRequests.passed} tone="good" />
            <Card label="Falladas" value={data.codeRequests.failed} />
            <Card label="Tasa éxito"
                  value={data.codeRequests.successRate == null ? '—' : `${data.codeRequests.successRate}%`}
                  tone={data.codeRequests.successRate != null && data.codeRequests.successRate < 30 ? 'warn' : 'default'}
                  hint={data.codeRequests.successRate != null && data.codeRequests.successRate < 30
                    ? '⚠ pool de challenges quizá demasiado difícil' : undefined} />
            <Card label="Últimas 24h" value={data.codeRequests.last24h} />
            <Card label="Últimos 7d"  value={data.codeRequests.last7d} />
          </Section>

          <Section title="Pool de challenges">
            <Card label="Total"  value={data.challenges.total} />
            <Card label="Activos"
                  value={data.challenges.active}
                  tone={data.challenges.active < 3 ? 'bad' : data.challenges.active < 10 ? 'warn' : 'good'}
                  hint={data.challenges.active < 3
                    ? '⚠ Get Code requiere al menos 3 activos'
                    : data.challenges.active < 10
                      ? 'Considera ampliar a 20+'
                      : undefined} />
          </Section>
        </div>
      )}
    </div>
  );
}
