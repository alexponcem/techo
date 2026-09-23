import { useState } from 'react'
import { activeCycle, cycleTxs, envelopeView, rhythmOf, weekStartOfEnv } from './logic'
import { WeekStartSelect } from './WeekStartSelect'
import { euros, parseEuros } from './money'
import { KIND_HINT, KIND_LABEL } from './template'
import {
  markPaid,
  removeExpense,
  removeTx,
  renameEnvelope,
  setEnvelopeWeekStart,
  setSplitDaily,
  updatePlanned,
  useAppState,
} from './store'
import type { Tx } from './types'

export function EnvelopeScreen({
  id,
  onBack,
  onAdd,
  onEdit,
}: {
  id: string
  onBack: () => void
  onAdd: () => void
  onEdit: (txId: string) => void
}) {
  const state = useAppState()
  const cycle = activeCycle(state)
  const env = state.envelopes.find((e) => e.id === id)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState<Tx | null>(null)

  if (!cycle || !env) {
    return (
      <div>
        <button className="back" onClick={onBack}>
          ← Inicio
        </button>
        <p>No está este sobre.</p>
      </div>
    )
  }
  const allTxs = cycleTxs(state, cycle.id)
  const txs = allTxs.filter((t) => t.envelopeId === id || t.toEnvelopeId === id)
  const view = envelopeView(env, allTxs, cycle, undefined, undefined, weekStartOfEnv(env, state))

  function saveTecho() {
    if (!env) return
    const cents = parseEuros(draft)
    if (cents === null || cents < 0) {
      setMsg('Pon un importe válido.')
      return
    }
    updatePlanned(env.id, cents)
    setEditing(false)
    setMsg('Techo actualizado. Libre se reajusta solo.')
  }

  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        ← Inicio
      </button>
      <div className="hero">
        <div className="label">
          {env.emoji} {KIND_LABEL[env.kind]}
        </div>
        <div className="amount">{euros(view.remaining)}</div>
        <div className="sub">
          {env.name}
          {env.kind === 'savings'
            ? ` · usado ${euros(view.used)} este mes (${view.pct}%)`
            : ` · quedan de ${euros(view.total)}`}
        </div>
      </div>
      {view.week && (
        <div className="hint">
          Consejo esta semana ({view.week.label}, {view.week.daysInCycle}{' '}
          {view.week.daysInCycle === 1 ? 'día' : 'días'} de este ciclo): ~{euros(view.week.target)}.
          Llevas {euros(view.week.spent)}. El techo duro es el del mes ({euros(view.total)}).
        </div>
      )}
      <p className="muted">
        {env.kind === 'fixed'
          ? 'Cuota: márcala pagada cuando salga de la cuenta. Hasta entonces sigue en el saldo del banco.'
          : rhythmOf(env) === 'weekly'
            ? 'Techo semanal: el límite duro es el del mes. La cifra de la semana es un consejo para que te dure. Tú eliges el día en que empieza esa semana.'
            : env.kind === 'fund'
              ? 'Fondo: si está vacío, el gasto sale del ahorro. Puedes apartar antes con Mover.'
              : env.kind === 'savings'
                ? 'Ahorro protegido. Se acumula. Fondos y imprevistos grandes salen de aquí.'
                : KIND_HINT[env.kind]}
      </p>
      <div className="actions">
        <button className="btn sage" onClick={onAdd}>
          {env.kind === 'savings' ? 'Usar ahorro' : '+ Gasto'}
        </button>
        {env.kind === 'fixed' && view.remaining > 0 && (
          <button className="btn secondary" onClick={() => markPaid(env.id, view.remaining)}>
            Marcar pagado
          </button>
        )}
      </div>
      {env.kind !== 'buffer' && (
        <div className="card stack">
          {editingName ? (
            <>
              <label className="field">
                Nombre
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn full"
                onClick={() => {
                  const next = nameDraft.trim()
                  if (!next) {
                    setMsg('Pon un nombre.')
                    return
                  }
                  renameEnvelope(env.id, next)
                  setEditingName(false)
                  setMsg('Nombre actualizado.')
                }}
              >
                Guardar nombre
              </button>
              <button type="button" className="btn ghost full" onClick={() => setEditingName(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn ghost full"
              onClick={() => {
                setNameDraft(env.name)
                setEditingName(true)
                setMsg('')
              }}
            >
              Cambiar nombre
            </button>
          )}
          <div className="row">
            <strong>Techo de este ciclo</strong>
            <span>{euros(env.planned)}</span>
          </div>
          {editing ? (
            <>
              <input
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nuevo techo"
              />
              <button type="button" className="btn full" onClick={saveTecho}>
                Guardar techo
              </button>
              <button type="button" className="btn ghost full" onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn ghost full"
              onClick={() => {
                setDraft(String(env.planned / 100))
                setEditing(true)
                setMsg('')
              }}
            >
              Editar techo
            </button>
          )}
          {msg ? <p className="muted">{msg}</p> : null}
          {env.kind === 'cap' && rhythmOf(env) === 'weekly' && !env.splitDaily && (
            <WeekStartSelect
              value={weekStartOfEnv(env, state)}
              onChange={(day) => setEnvelopeWeekStart(env.id, day)}
            />
          )}
          {env.kind === 'cap' && (
            <label className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <input
                type="checkbox"
                checked={Boolean(env.splitDaily)}
                onChange={(e) => setSplitDaily(env.id, e.target.checked)}
                style={{ marginTop: 4 }}
              />
              <span>
                <span style={{ fontWeight: 500 }}>Sumar al diario del mes</span>
                <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                  Se junta con Libre y se parte entre los días. El sobre pasa a Día a día
                  en Inicio.
                </span>
              </span>
            </label>
          )}
        </div>
      )}
      <div className="section-title">
        <span>Movimientos</span>
        <span className="muted">{txs.length}</span>
      </div>
      <div className="card">
        {txs.length === 0 && <p className="muted">Aún no hay movimientos en este ciclo.</p>}
        {txs
          .slice()
          .reverse()
          .map((t) => (
            <div className="tx" key={t.id}>
              <div>
                <div>{labelTx(t.type, t.envelopeId === id)}</div>
                <div className="muted">
                  {new Date(t.at).toLocaleString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {t.note ? ` · ${t.note}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{sign(t, id)}{euros(t.amount)}</div>
                {t.type === 'expense' && (
                  <button type="button" className="back" onClick={() => onEdit(t.id)}>
                    editar
                  </button>
                )}
                {' '}
                <button type="button" className="back" onClick={() => setPending(t)}>
                  borrar
                </button>
              </div>
            </div>
          ))}
      </div>
      {pending && (
        <div className="sheet-backdrop" onClick={() => setPending(null)}>
          <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
            <div className="handle" />
            <h2 className="serif" style={{ fontSize: 26 }}>
              ¿Borrar este movimiento?
            </h2>
            <p>
              {sign(pending, id)}
              {euros(pending.amount)}
              {pending.note ? ` · ${pending.note}` : ''}
            </p>
            <p className="muted">
              Si era un gasto cubierto con ahorro o libre, también se deshace ese
              traspaso. Esto no se puede deshacer después (salvo “deshacer último”
              en ajustes, si era el último).
            </p>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setPending(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  if (pending.type === 'expense') removeExpense(pending.id)
                  else removeTx(pending.id)
                  setPending(null)
                }}
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function labelTx(type: string, outgoing: boolean): string {
  if (type === 'expense') return 'Gasto'
  if (type === 'income') return 'Ingreso'
  return outgoing ? 'Salida a otro sobre' : 'Entrada de otro sobre'
}

function sign(t: { type: string; envelopeId: string; toEnvelopeId?: string }, id: string): string {
  if (t.type === 'income') return '+'
  if (t.type === 'expense') return '−'
  if (t.toEnvelopeId === id) return '+'
  return '−'
}
