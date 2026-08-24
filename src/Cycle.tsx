import { useState } from 'react'
import { suggestedNextPay, todayISO } from './dates'
import { activeCycle, viewsFor } from './logic'
import { euros, parseEuros } from './money'
import { startNextCycle, useAppState } from './store'

export function CycleScreen({ onBack }: { onBack: () => void }) {
  const state = useAppState()
  const cycle = activeCycle(state)
  const views = viewsFor(state)
  const [income, setIncome] = useState(cycle ? String(cycle.income / 100) : '')
  const [startedAt, setStartedAt] = useState(todayISO())
  const [expectedEndAt, setExpectedEndAt] = useState(() =>
    suggestedNextPay(todayISO(), state.settings.payMode, state.settings.fixedDay),
  )
  const [leftoverTo, setLeftoverTo] = useState('ahorro')

  if (!cycle) return null

  const cents = parseEuros(income) ?? 0
  const leftover = views
    .filter((v) => v.env.kind !== 'fund' && v.env.kind !== 'savings')
    .reduce((s, v) => s + Math.max(0, v.remaining), 0)
  const savings = views.find((v) => v.env.kind === 'savings')
  const funds = views.filter((v) => v.env.kind === 'fund' && v.remaining > 0)
  const savingsNow = savings?.remaining ?? 0
  const carried = savingsNow + leftover
  const pot = carried + cents

  function onStartChange(value: string) {
    setStartedAt(value)
    setExpectedEndAt(
      suggestedNextPay(value, state.settings.payMode, state.settings.fixedDay),
    )
  }

  function close() {
    if (cents <= 0) return
    startNextCycle(cents, startedAt, expectedEndAt, leftoverTo)
    onBack()
  }

  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        ← Inicio
      </button>
      <h2 className="serif" style={{ fontSize: 32 }}>
        Cerrar ciclo
      </h2>
      <p className="muted">
        Si no llegas al techo de comida, fútbol u ocio, ese dinero no se pierde: al
        cerrar el ciclo pasa al ahorro (o a viajes/ropa, si lo eliges). Viajes y
        ropa, si están vacíos, los gastos ya salieron del ahorro.
      </p>
      <div className="math">
        {views.map((v) => (
          <div className="math-row" key={v.env.id}>
            <span>
              {v.env.emoji} {v.env.name}
            </span>
            <span>{euros(v.remaining)}</span>
          </div>
        ))}
      </div>
      <div className="hint">
        Ahorro ahora: {euros(savingsNow)}.
        Residual de techos/cuotas/libre: {euros(leftover)}.
        {funds.length > 0
          ? ` Fondos (viajes/ropa) se quedan como están: ${funds.map((f) => `${f.env.name} ${euros(f.remaining)}`).join(', ')}.`
          : ''}
        <br />
        <b>
          Traes {euros(carried)}
          {cents > 0 ? ` + sueldo ${euros(cents)} = ${euros(pot)}` : ''}.
        </b>{' '}
        De ese total se asigna el mes nuevo. El ahorro no se reinicia.
      </div>
      <p className="tiny">¿A dónde va lo que sobró?</p>
      <div className="chips">
        {['ahorro', 'viajes', 'ropa'].map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${leftoverTo === id ? 'on' : ''}`}
            onClick={() => setLeftoverTo(id)}
          >
            {id === 'ahorro' ? '🌱 Ahorro' : id === 'viajes' ? '✈️ Viajes' : '👕 Ropa'}
          </button>
        ))}
      </div>
      <label className="field">
        Sueldo que acaba de entrar
        <input inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} />
      </label>
      <label className="field">
        Fecha en que llegó
        <input type="date" value={startedAt} onChange={(e) => onStartChange(e.target.value)} />
      </label>
      <label className="field">
        Próximo sueldo estimado
        <input
          type="date"
          value={expectedEndAt}
          onChange={(e) => setExpectedEndAt(e.target.value)}
        />
      </label>
      <button className="btn full sage" disabled={cents <= 0} onClick={close}>
        Cerrar y abrir el siguiente
      </button>
    </div>
  )
}
