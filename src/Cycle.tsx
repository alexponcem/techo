import { useState } from 'react'
import { suggestedNextPay, todayISO } from './dates'
import { activeCycle, viewsFor } from './logic'
import { euros, parseEuros } from './money'
import { startNextCycle, useAppState } from './store'
import { useLocale, useT } from './useT'

export function CycleScreen({ onBack }: { onBack: () => void }) {
  const state = useAppState()
  const t = useT()
  const locale = useLocale()
  const cycle = activeCycle(state)
  const views = viewsFor(state)
  const [income, setIncome] = useState(cycle ? String(cycle.income / 100) : '')
  const [startedAt, setStartedAt] = useState(todayISO())
  const [expectedEndAt, setExpectedEndAt] = useState(() =>
    suggestedNextPay(todayISO(), state.settings.payMode, state.settings.fixedDay),
  )
  const [leftoverTo, setLeftoverTo] = useState(
    () => viewsFor(state).find((v) => v.env.kind === 'savings')?.env.id ?? 'ahorro',
  )

  if (!cycle) return null

  const cents = parseEuros(income) ?? 0
  const leftover = views
    .filter((v) => v.env.kind !== 'fund' && v.env.kind !== 'savings')
    .reduce((s, v) => s + Math.max(0, v.remaining), 0)
  const savings = views.find((v) => v.env.kind === 'savings')
  const funds = views.filter((v) => v.env.kind === 'fund')
  const leftoverTargets = [
    ...(savings
      ? [{ id: savings.env.id, label: `${savings.env.emoji} ${savings.env.name}` }]
      : []),
    ...funds.map((f) => ({ id: f.env.id, label: `${f.env.emoji} ${f.env.name}` })),
  ]
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
        {t('cycle.home')}
      </button>
      <h2 className="serif" style={{ fontSize: 32 }}>
        {t('cycle.title')}
      </h2>
      <p className="muted">
        {t('cycle.lead')}
      </p>
      <div className="math">
        {views.map((v) => (
          <div className="math-row" key={v.env.id}>
            <span>
              {v.env.emoji} {v.env.name}
            </span>
            <span>{euros(v.remaining, locale)}</span>
          </div>
        ))}
      </div>
      <div className="hint">
        {t('cycle.savNow', { amount: euros(savingsNow, locale) })}
        {t('cycle.left', { amount: euros(leftover, locale) })}
        {funds.some((f) => f.remaining > 0)
          ? ` Fondos se quedan como están: ${funds
              .filter((f) => f.remaining > 0)
              .map((f) => `${f.env.name} ${euros(f.remaining, locale)}`)
              .join(', ')}.`
          : ''}
        <br />
        <b>
          {t('cycle.bring', { carried: euros(carried, locale) })}
          {cents > 0 ? t('cycle.plusPay', { pay: euros(cents, locale), pot: euros(pot, locale) }) : ''}.
        </b>{' '}
        De ese total se asigna el mes nuevo. El ahorro no se reinicia.
      </div>
      <p className="tiny">¿A dónde va lo que sobró?</p>
      <div className="chips">
        {leftoverTargets.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${leftoverTo === t.id ? 'on' : ''}`}
            onClick={() => setLeftoverTo(t.id)}
          >
            {t.label}
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
        {t('cycle.close')}
      </button>
    </div>
  )
}
