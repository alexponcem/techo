import { useState } from 'react'
import { suggestedNextPay, todayISO } from './dates'
import { activeCycle, fundSpentSince, viewsFor } from './logic'
import { parseEuros } from './money'
import { startNextCycle, useAppState } from './store'
import { useMoney, useT } from './useT'
import type { EnvelopeView } from './logic'

export function CycleScreen({ onBack }: { onBack: () => void }) {
  const state = useAppState()
  const t = useT()
  const money = useMoney()
  const cycle = activeCycle(state)
  const views = viewsFor(state)
  const [income, setIncome] = useState(cycle ? String(cycle.income / 100) : '')
  const [cashText, setCashText] = useState('0')
  const [startedAt, setStartedAt] = useState(todayISO())
  const [expectedEndAt, setExpectedEndAt] = useState(() =>
    suggestedNextPay(todayISO(), state.settings.payMode, state.settings.fixedDay),
  )
  const [leftoverTo, setLeftoverTo] = useState(
    () => viewsFor(state).find((v) => v.env.kind === 'savings')?.env.id ?? 'ahorro',
  )
  const [fundChoice, setFundChoice] = useState<Record<string, 'continue' | 'close'>>({})

  if (!cycle) return null

  const cents = parseEuros(income) ?? 0
  const savings = views.find((v) => v.env.kind === 'savings')
  const funds = views.filter((v) => v.env.kind === 'fund')
  const choice = (id: string) => fundChoice[id] ?? 'continue'
  const closing = funds.filter((v) => choice(v.env.id) === 'close')
  const keeping = funds.filter((v) => choice(v.env.id) !== 'close' && v.remaining > 0)
  const loose = views
    .filter((v) => v.env.kind !== 'fund' && v.env.kind !== 'savings')
    .reduce((s, v) => s + Math.max(0, v.remaining), 0)
  const closingLeft = closing.reduce((s, v) => s + Math.max(0, v.remaining), 0)
  const leftover = loose + closingLeft
  const savingsId = savings?.env.id ?? 'ahorro'
  const destClosed = choice(leftoverTo) === 'close' && funds.some((f) => f.env.id === leftoverTo)
  const actualDest = destClosed ? savingsId : leftoverTo
  const leftoverTargets = [
    ...(savings ? [{ id: savings.env.id, label: `${savings.env.emoji} ${savings.env.name}` }] : []),
    ...funds.map((f) => ({ id: f.env.id, label: `${f.env.emoji} ${f.env.name}` })),
  ]
  const savingsNow = savings?.remaining ?? 0
  const carried = savingsNow + leftover
  const pot = carried + cents
  const parents = funds.filter((v) => !v.env.parentId)
  const orphans = funds.filter((v) => v.env.parentId && !funds.some((p) => p.env.id === v.env.parentId))

  function onStartChange(value: string) {
    setStartedAt(value)
    setExpectedEndAt(suggestedNextPay(value, state.settings.payMode, state.settings.fixedDay))
  }

  function close() {
    if (cents <= 0) return
    startNextCycle(cents, startedAt, expectedEndAt, actualDest, parseEuros(cashText) ?? 0, fundChoice)
    onBack()
  }

  function renderFund(v: EnvelopeView, nested: boolean) {
    const picked = choice(v.env.id)
    return (
      <div key={v.env.id} className="stack" style={{ gap: 6, paddingLeft: nested ? 12 : 0 }}>
        <div className="row">
          <strong>
            {v.env.emoji} {v.env.name}
          </strong>
          <span className="muted" style={{ fontSize: 13 }}>
            {v.remaining > 0 && fundSpentSince(state, v.env.id) > 0
              ? t('fund.both', { set: money(v.remaining), spent: money(fundSpentSince(state, v.env.id)) })
              : fundSpentSince(state, v.env.id) > 0
                ? t('fund.spentBit', { amount: money(fundSpentSince(state, v.env.id)) })
                : t('fund.setAside', { amount: money(v.remaining) })}
          </span>
        </div>
        <div className="chips">
          <button
            type="button"
            className={`chip ${picked === 'continue' ? 'on' : ''}`}
            onClick={() => setFundChoice((prev) => ({ ...prev, [v.env.id]: 'continue' }))}
          >
            {t('fund.continue')}
          </button>
          <button
            type="button"
            className={`chip ${picked === 'close' ? 'on' : ''}`}
            onClick={() => setFundChoice((prev) => ({ ...prev, [v.env.id]: 'close' }))}
          >
            {t('fund.closed')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        {t('cycle.home')}
      </button>
      <h2 className="serif" style={{ fontSize: 32 }}>
        {t('cycle.title')}
      </h2>
      <p className="muted">{t('cycle.lead')}</p>
      <div className="math">
        {views.map((v) => (
          <div className="math-row" key={v.env.id}>
            <span>
              {v.env.emoji} {v.env.name}
            </span>
            <span>{money(v.remaining)}</span>
          </div>
        ))}
      </div>
      <div className="hint">
        {t('cycle.savNow', { amount: money(savingsNow) })}
        {t('cycle.left', { amount: money(loose) })}
        {closingLeft > 0 ? t('cycle.closedJoin', { amount: money(closingLeft) }) : ''}
        {keeping.length > 0
          ? t('cycle.fundsStay', {
              list: keeping.map((f) => `${f.env.name} ${money(f.remaining)}`).join(', '),
            })
          : ''}
        <br />
        <b>
          {t('cycle.bring', { carried: money(carried) })}
          {cents > 0 ? t('cycle.plusPay', { pay: money(cents), pot: money(pot) }) : ''}.
        </b>{' '}
        {t('cycle.assign')}
      </div>
      <p className="tiny">{t('cycle.where')}</p>
      <div className="chips">
        {leftoverTargets.map((target) => (
          <button
            key={target.id}
            type="button"
            className={`chip ${actualDest === target.id ? 'on' : ''}`}
            onClick={() => setLeftoverTo(target.id)}
          >
            {target.label}
          </button>
        ))}
      </div>
      {destClosed ? <p className="muted">{t('fund.destMoved')}</p> : null}
      {funds.length > 0 && (
        <div className="card stack">
          <strong>{t('fund.askTitle')}</strong>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            {t('fund.askHint')}
          </p>
          {parents.map((parent) => (
            <div key={parent.env.id} className="stack" style={{ gap: 8 }}>
              {renderFund(parent, false)}
              {funds.filter((v) => v.env.parentId === parent.env.id).map((child) => renderFund(child, true))}
            </div>
          ))}
          {orphans.map((v) => renderFund(v, false))}
        </div>
      )}
      <label className="field">
        {t('cycle.pay')}
        <input inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} />
      </label>
      <label className="field">
        {t('setup.cash')}
        <input inputMode="decimal" value={cashText} onChange={(e) => setCashText(e.target.value)} placeholder="0" />
      </label>
      <p className="muted" style={{ fontSize: 13 }}>
        {t('setup.cashHint')}
      </p>
      <label className="field">
        {t('cycle.when')}
        <input type="date" value={startedAt} onChange={(e) => onStartChange(e.target.value)} />
      </label>
      <label className="field">
        {t('cycle.next')}
        <input type="date" value={expectedEndAt} onChange={(e) => setExpectedEndAt(e.target.value)} />
      </label>
      <button className="btn full sage" disabled={cents <= 0} onClick={close}>
        {t('cycle.close')}
      </button>
    </div>
  )
}
