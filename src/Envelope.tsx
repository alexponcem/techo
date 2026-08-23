import { useState } from 'react'
import { activeCycle, cycleTxs, envelopeView, WEEKS_PER_MONTH } from './logic'
import { euros, parseEuros } from './money'
import { KIND_HINT, KIND_LABEL } from './template'
import { markPaid, removeTx, updatePlanned, useAppState } from './store'

export function EnvelopeScreen({ id, onBack, onAdd }: { id: string; onBack: () => void; onAdd: () => void }) {
  const state = useAppState()
  const cycle = activeCycle(state)
  const env = state.envelopes.find((e) => e.id === id)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState('')

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
  const view = envelopeView(env, allTxs, cycle)
  const weekHint =
    env.planned > 0
      ? `${euros(env.planned)} ÷ ${WEEKS_PER_MONTH} semanas ≈ ${euros(Math.round(env.planned / WEEKS_PER_MONTH))}`
      : ''

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
        <div className="sub">{env.name} · quedan de {euros(view.total)}</div>
      </div>
      {view.week && (
        <div className="hint">
          Esta semana ({view.week.label}): {euros(view.week.spent)} de ~{euros(view.week.target)}.
          {weekHint ? ` Ritmo: ${weekHint}.` : ''} Anota cada vez el día que lo gastas.
        </div>
      )}
      <p className="muted">
        {env.id === 'comida'
          ? 'No entra en el gasto diario. Compras del sábado (y extras). Techo mensual 130 € → 130 ÷ 4,5 semanas ≈ 29 €/semana.'
          : env.id === 'futbol'
            ? 'No se paga de golpe. Anotas cada partido (viernes o sábado). Techo 25 €/mes ≈ 6 €/semana. Si un mes juegas más, el extra sale de Libre.'
            : env.kind === 'savings'
              ? 'Bloqueado. Se acumula. Si lo necesitas de verdad, úsalo con un motivo escrito.'
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
                <button className="back" onClick={() => removeTx(t.id)}>
                  borrar
                </button>
              </div>
            </div>
          ))}
      </div>
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
