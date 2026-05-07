import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  adminListChallenges,
  adminCreateChallenge,
  adminUpdateChallenge,
  adminDeleteChallenge,
  type ChallengeRow,
} from '../../lib/api';
import { useAuth } from '../../lib/authStore';

interface EditState {
  id: number;
  question: string;
  answer: string;
  page_ref: string;
}

export default function AdminChallengesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  // Form: create
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [newP, setNewP] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await adminListChallenges(token);
      setItems(r.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error cargando challenges.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setErr(null);
    try {
      await adminCreateChallenge(token, {
        question: newQ.trim(),
        answer:   newA.trim(),
        page_ref: newP.trim() || null,
      });
      setNewQ(''); setNewA(''); setNewP('');
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error creando challenge.');
    } finally {
      setCreating(false);
    }
  };

  const onToggleActive = async (row: ChallengeRow) => {
    if (!token) return;
    try {
      await adminUpdateChallenge(token, row.id, { active: !row.active });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error.');
    }
  };

  const onDelete = async (row: ChallengeRow) => {
    if (!token) return;
    if (!confirm(`¿Desactivar el challenge #${row.id}?\n"${row.question}"`)) return;
    try {
      await adminDeleteChallenge(token, row.id);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error.');
    }
  };

  const startEdit = (row: ChallengeRow) => {
    setEdit({
      id: row.id,
      question: row.question,
      answer: '',
      page_ref: row.page_ref || '',
    });
  };

  const saveEdit = async () => {
    if (!edit || !token) return;
    try {
      const patch: Parameters<typeof adminUpdateChallenge>[2] = {
        question: edit.question.trim(),
        page_ref: edit.page_ref.trim() || null,
      };
      if (edit.answer.trim()) patch.answer = edit.answer.trim();
      await adminUpdateChallenge(token, edit.id, patch);
      setEdit(null);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error guardando.');
    }
  };

  const activeCount = items.filter(i => i.active).length;

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">Pool de challenges</h1>
        <div className="text-sm text-white/60">
          {activeCount} activos · {items.length} total
        </div>
      </div>

      {err && (
        <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* Create */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-lg font-bold mb-3">Añadir nuevo</h2>
        <p className="text-xs text-white/50 mb-4">
          La respuesta se normaliza al guardarse (lowercase, sin acentos, sin puntuación). Usa
          palabras o frases cortas (1–3 palabras) para tolerar typos sin volverse ambiguo.
        </p>
        <form onSubmit={onCreate} className="space-y-3">
          <textarea
            required
            rows={2}
            value={newQ}
            onChange={e => setNewQ(e.target.value)}
            placeholder='Pregunta — ej. "¿Qué palabra está en negrita en la página 47?"'
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-[#FF6B35] focus:outline-none text-white"
          />
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              required
              value={newA}
              onChange={e => setNewA(e.target.value)}
              placeholder="Respuesta esperada"
              className="sm:col-span-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-[#FF6B35] focus:outline-none text-white"
            />
            <input
              value={newP}
              onChange={e => setNewP(e.target.value)}
              placeholder='Ref. (opc) — "p.47"'
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-[#FF6B35] focus:outline-none text-white"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newQ || !newA}
            className="px-5 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#e85a25] text-white font-semibold disabled:opacity-50"
          >
            {creating ? 'Creando…' : 'Añadir challenge'}
          </button>
        </form>
      </section>

      {/* List */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-lg font-bold mb-4">Pool actual</h2>
        {loading ? (
          <div className="text-white/50 text-sm">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-white/50 text-sm">El pool está vacío. Añade al menos 3 para que funcione el flujo Get Code.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 text-xs uppercase">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Pregunta</th>
                  <th className="py-2 pr-3">Respuesta normalizada</th>
                  <th className="py-2 pr-3">Ref</th>
                  <th className="py-2 pr-3">Activo</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-t border-white/5 align-top">
                    <td className="py-2 pr-3 text-white/60">{it.id}</td>
                    <td className="py-2 pr-3 max-w-[360px]">
                      {edit?.id === it.id ? (
                        <textarea
                          rows={2}
                          value={edit.question}
                          onChange={e => setEdit({ ...edit, question: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white/10 border border-white/20 text-white"
                        />
                      ) : (
                        <span>{it.question}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-white/70">
                      {edit?.id === it.id ? (
                        <input
                          value={edit.answer}
                          onChange={e => setEdit({ ...edit, answer: e.target.value })}
                          placeholder="(dejar vacío para mantener)"
                          className="w-full px-2 py-1 rounded bg-white/10 border border-white/20 text-white"
                        />
                      ) : (
                        it.answer_norm
                      )}
                    </td>
                    <td className="py-2 pr-3 text-white/60">
                      {edit?.id === it.id ? (
                        <input
                          value={edit.page_ref}
                          onChange={e => setEdit({ ...edit, page_ref: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white/10 border border-white/20 text-white"
                        />
                      ) : (
                        it.page_ref || '—'
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => onToggleActive(it)}
                        className={`px-2 py-0.5 rounded text-xs ${
                          it.active
                            ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                            : 'bg-white/10 text-white/40 border border-white/20'
                        }`}
                      >
                        {it.active ? 'sí' : 'no'}
                      </button>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap space-x-2">
                      {edit?.id === it.id ? (
                        <>
                          <button onClick={saveEdit} className="text-[#FF6B35] hover:underline text-xs">Guardar</button>
                          <button onClick={() => setEdit(null)} className="text-white/50 hover:underline text-xs">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(it)} className="text-white/70 hover:underline text-xs">Editar</button>
                          <button onClick={() => onDelete(it)} className="text-red-300 hover:underline text-xs">Desactivar</button>
                        </>
                      )}
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
