import { useMemo, useState, type ReactNode } from 'react'
import {
  clampDay,
  formatDay,
  localDayFromStamp,
  stampAtNoon,
  todayISO,
  yesterdayISO,
} from './dates'
import { EMOJI_PICK } from './template'
import {
  accountSnapshot,
  activeCycle,
  coverPlan,
  fundSpendTarget,
  guideForEnvelope,
  inDailySplit,
  kindOrder,
  pocketSplit,
  saveReview,
  uid,
  verdictFor,
  viewsFor,
  type EnvelopeView,
} from './logic'
import { parseEuros } from './money'
import { kindLabel } from './template'
import { displayNote } from './i18n'
import { useCurrency, useLocale, useMoney, useT } from './useT'
import { WeekStartSelect } from './WeekStartSelect'
import {
  addEnvelope,
  addExpense,
  addIncome,
  coverAndSpend,
  getState,
  moveMoney,
  movePocket,
  payCard,
  updateExpense,
  useAppState,
} from './store'
import type { EnvelopeKind, Pocket, Rhythm } from './types'

const QUICK = [2, 5, 10, 15, 20, 25, 30, 50]

export function PocketChips({
  value,
  onChange,
}: {
  value: Pocket
  onChange: (next: Pocket) => void
}) {
  const t = useT()
  const options = [
    ['card', 'sheet.card'],
    ['cash', 'sheet.cash'],
    ['credit', 'sheet.credit'],
  ] as const
  return (
    <div className="chips">
      {options.map(([id, key]) => (
        <button
          key={id}
          type="button"
          className={`chip ${value === id ? 'on' : ''}`}
          onClick={() => onChange(id)}
        >
          {t(key)}
        </button>
      ))}
    </div>
  )
}

function amountInput(cents: number): string {
  const whole = Math.trunc(cents / 100)
  const frac = Math.abs(cents % 100)
  if (frac === 0) return String(whole)
  return `${whole}.${String(frac).padStart(2, '0')}`.replace(/0$/, '')
}

export function AddSheet({
  presetId,
  onClose,
}: {
  presetId?: string
  onClose: (saved?: boolean, envelopeId?: string) => void
}) {
  const state = useAppState()
  const t = useT()
  const money = useMoney()
  const locale = useLocale()
  const currency = useCurrency()
  const views = viewsFor(state)
  const [amount, setAmount] = useState('')
  const [envelopeId, setEnvelopeId] = useState(presetId ?? '')
  const [folderId, setFolderId] = useState('')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [spendDay, setSpendDay] = useState(todayISO())
  const [pocket, setPocket] = useState<Pocket>('card')
  const [done, setDone] = useState<{ status: 'ok' | 'tight' | 'over'; title: string; body: string } | null>(
    null,
  )
  const cycle = activeCycle(state)
  const minDay = cycle?.startedAt ?? todayISO()
  const maxDay = todayISO()
  const cents = parseEuros(amount) ?? 0
  const route = fundSpendTarget(state.envelopes, envelopeId, folderId)
  const selectedEnv = state.envelopes.find((e) => e.id === envelopeId)
  const chargeId = route.id
  const view = views.find((v) => v.env.id === (chargeId || envelopeId))
  const chargeView = chargeId ? views.find((v) => v.env.id === chargeId) : undefined
  const plan = chargeId ? coverPlan(views, chargeId, cents, null) : null
  const onlyParent = Boolean(plan?.fromParent && plan.fromSavings <= 0 && plan.fromLibre <= 0)
  const parentName = plan?.parentId
    ? (views.find((v) => v.env.id === plan.parentId)?.env.name ?? '')
    : ''
  const verdict = route.needsChoice
    ? {
        status: 'empty' as const,
        message: cents > 0 ? t('fund.needFolder') : t('logic.needAmt'),
      }
    : onlyParent && plan?.fromParent
      ? {
          status: 'ok' as const,
          message: t('sheet.parentFits', {
            amount: money(plan.fromParent),
            parent: parentName,
            name: chargeView?.env.name ?? '',
          }),
        }
      : verdictFor(chargeView ?? view, cents, locale, currency)
  const isSavings = view?.env.kind === 'savings'
  const reasonOk = (isSavings ? note : reason).trim().length >= 4
  const guide = chargeId ? guideForEnvelope(state, chargeId) : null
  const isDaily = Boolean(chargeView && inDailySplit(chargeView.env))
  const paceOver =
    isDaily && guide && cents > guide.hoy && cents <= Math.max(0, chargeView?.remaining ?? 0) && !plan

  const at = stampAtNoon(clampDay(spendDay, minDay, maxDay))
  const cycleExpenses = cycle
    ? state.txs.filter((tx) => tx.cycleId === cycle.id && tx.type === 'expense')
    : []
  const lastExpense = cycleExpenses.length > 0 ? cycleExpenses[cycleExpenses.length - 1] : undefined
  const lastAmount = lastExpense?.amount ?? 0
  const recentEnvelopes: { id: string; label: string }[] = []
  for (let i = cycleExpenses.length - 1; i >= 0 && recentEnvelopes.length < 3; i--) {
    const env = state.envelopes.find((e) => e.id === cycleExpenses[i].envelopeId)
    if (!env) continue
    const target = env.parentId ? (state.envelopes.find((e) => e.id === env.parentId) ?? env) : env
    if (recentEnvelopes.some((row) => row.id === target.id)) continue
    recentEnvelopes.push({ id: target.id, label: `${target.emoji} ${target.name}` })
  }

  function parentCover() {
    if (!plan?.fromParent || !plan.parentId) return undefined
    return { id: plan.parentId, amount: plan.fromParent }
  }

  function finish() {
    setDone(saveReview(getState(), chargeId || envelopeId, cents, clampDay(spendDay, minDay, maxDay)))
  }

  function trySave() {
    if (!chargeId || cents <= 0 || route.needsChoice) return
    if (isSavings) {
      if (!reasonOk) return
      addExpense(chargeId, cents, t('store.savNote', { reason: note.trim() }), at, pocket)
      finish()
      return
    }
    if (onlyParent) {
      coverAndSpend({
        envelopeId: chargeId,
        amount: cents,
        note,
        at,
        fromParent: parentCover(),
        pocket,
      })
      finish()
      return
    }
    if (plan || paceOver) {
      setConfirm(true)
      return
    }
    addExpense(chargeId, cents, note, at, pocket)
    finish()
  }

  function acceptCover() {
    if (!chargeId) return
    if (!plan) {
      addExpense(chargeId, cents, note, at, pocket)
      finish()
      return
    }
    if (!plan.possible) return
    if (plan.needsSavingsReason && reason.trim().length < 4) return
    coverAndSpend({
      envelopeId: chargeId,
      amount: cents,
      note,
      at,
      fromParent: parentCover(),
      fromLibre:
        plan.fromLibre > 0 && plan.libreId
          ? { id: plan.libreId, amount: plan.fromLibre }
          : undefined,
      fromSavings:
        plan.fromSavings > 0 && plan.savingsId
          ? {
              id: plan.savingsId,
              amount: plan.fromSavings,
              reason: plan.goalFromSavings
                ? note.trim() || chargeView?.env.name || t('store.goalFallback')
                : reason.trim(),
            }
          : undefined,
      pocket,
    })
    finish()
  }

  if (done) {
    return (
      <Sheet title={t('logic.logged')} onClose={() => onClose(true, envelopeId)}>
        <div className={`verdict ${done.status}`}>
          <p>
            <b>{done.title}</b>
          </p>
          <p style={{ marginTop: 8, fontWeight: 500 }}>{done.body}</p>
        </div>
        <button type="button" className="btn full sage" onClick={() => onClose(true, envelopeId)}>
          {t('common.start')}
        </button>
      </Sheet>
    )
  }

  return (
    <Sheet title={isSavings ? t('env.useSav') : t('sheet.add')} onClose={() => onClose()}>
      <label className="field">
        {t('sheet.amount')}
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setConfirm(false)
          }}
          placeholder={t('common.amountPh')}
        />
      </label>
      <div className="chips">
        {lastAmount > 0 && (
          <button
            type="button"
            className="chip"
            onClick={() => {
              setAmount(amountInput(lastAmount))
              setConfirm(false)
            }}
          >
            {t('sheet.lastAmount', { amount: money(lastAmount) })}
          </button>
        )}
        {QUICK.map((n) => (
          <button key={n} className="chip" onClick={() => setAmount(String(n))}>
            {money(n * 100)}
          </button>
        ))}
      </div>
      <p className="tiny">{t('sheet.when')}</p>
      <div className="chips">
        <button
          type="button"
          className={`chip ${spendDay === todayISO() ? 'on' : ''}`}
          onClick={() => setSpendDay(todayISO())}
        >
          {t('sheet.today')}
        </button>
        {yesterdayISO() >= minDay && (
          <button
            type="button"
            className={`chip ${spendDay === yesterdayISO() ? 'on' : ''}`}
            onClick={() => setSpendDay(yesterdayISO())}
          >
            {t('sheet.yesterday')}
          </button>
        )}
      </div>
      <label className="field">
        {t('sheet.date')}
        <input
          type="date"
          min={minDay}
          max={maxDay}
          value={clampDay(spendDay, minDay, maxDay)}
          onChange={(e) => setSpendDay(clampDay(e.target.value || todayISO(), minDay, maxDay))}
        />
      </label>
      {spendDay !== todayISO() && (
        <p className="muted" style={{ fontSize: 13 }}>
          {t('sheet.pastDay', { day: formatDay(spendDay, locale) })}
        </p>
      )}
      <p className="tiny">{t('sheet.payWith')}</p>
      <PocketChips value={pocket} onChange={setPocket} />
      {pocket === 'credit' ? <p className="muted" style={{ fontSize: 13 }}>{t('sheet.creditHint')}</p> : null}
      {recentEnvelopes.length > 0 && (
        <>
          <p className="tiny">{t('sheet.recent')}</p>
          <div className="chips">
            {recentEnvelopes.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`chip ${envelopeId === row.id || selectedEnv?.parentId === row.id ? 'on' : ''}`}
                onClick={() => {
                  setEnvelopeId(row.id)
                  setFolderId('')
                  setConfirm(false)
                }}
              >
                {row.label}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="tiny">{t('sheet.envelope')}</p>
      <div className="chips">
        {views
          .filter((v) => !v.env.parentId)
          .slice()
          .sort((a, b) => kindOrder(a.env.kind) - kindOrder(b.env.kind))
          .map((v) => (
            <button
              key={v.env.id}
              className={`chip ${envelopeId === v.env.id || selectedEnv?.parentId === v.env.id ? 'on' : ''}`}
              onClick={() => {
                setEnvelopeId(v.env.id)
                setFolderId('')
                setConfirm(false)
              }}
            >
              {v.env.kind === 'savings' ? '🔒 ' : ''}
              {v.env.emoji} {v.env.name}
            </button>
          ))}
      </div>
      {route.choices.length > 1 && (
        <>
          <p className="tiny">{t('sheet.pickFolder')}</p>
          <div className="chips">
            {route.choices.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={`chip ${folderId === folder.id ? 'on' : ''}`}
                onClick={() => {
                  setFolderId(folder.id)
                  setConfirm(false)
                }}
              >
                {folder.emoji} {folder.name}
              </button>
            ))}
          </div>
        </>
      )}
      {route.choices.length === 1 && (
        <p className="muted" style={{ fontSize: 13 }}>
          {t('sheet.folderAuto', { name: route.choices[0].name })}
        </p>
      )}
      {selectedEnv?.parentId && (
        <p className="muted" style={{ fontSize: 13 }}>
          {t('sheet.folderAuto', { name: selectedEnv.name })}
        </p>
      )}
      <label className="field">
        {isSavings ? t('sheet.reasonSav') : t('sheet.note')}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isSavings ? t('sheet.phSav') : t('sheet.phSpend')}
        />
      </label>
      {isSavings && <p className="muted">{t('sheet.savLock')}</p>}
      <div className={`verdict ${verdict.status}`}>{verdict.message}</div>
      {confirm && !plan && paceOver && guide && (
        <div className="hint">
          <p>{t('sheet.dayOver', { amount: money(guide.referenceDaily) })}</p>
          <div className="actions" style={{ marginBottom: 0 }}>
            <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn sage" onClick={acceptCover}>
              {t('sheet.save')}
            </button>
          </div>
        </div>
      )}
      {confirm && plan && (
        <div className={plan.possible ? 'hint' : 'deficit'}>
          {plan.goalFromSavings ? (
            <p>
              {plan.fromParent && plan.parentId ? (
                <>
                  {t('sheet.fromFolder', {
                    amount: money(plan.fromParent),
                    parent: parentName,
                    name: chargeView?.env.name ?? '',
                  })}{' '}
                </>
              ) : null}
              {t('sheet.fromSavings', { amount: money(plan.fromSavings) })}
            </p>
          ) : (
            <>
              {view && plan.overflow > 0 ? (
                <p>{t('logic.noFit', { name: view.env.name, over: money(plan.overflow) })}</p>
              ) : null}
              {plan.fromLibre > 0 && <p>{t('sheet.fromFree', { amount: money(plan.fromLibre) })}</p>}
              {plan.fromSavings > 0 && <p>{t('sheet.freeShort', { amount: money(plan.fromSavings) })}</p>}
            </>
          )}
          {!plan.possible && <p>{t('sheet.notEnough')}</p>}
          {plan.needsSavingsReason && plan.possible && (
            <label className="field" style={{ marginTop: 10 }}>
              {t('sheet.reasonCover')}
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('sheet.phSav')}
              />
            </label>
          )}
          <div className="actions" style={{ marginBottom: 0 }}>
            <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn sage"
              disabled={!plan.possible || (plan.needsSavingsReason && reason.trim().length < 4)}
              onClick={acceptCover}
            >
              {t('sheet.agree')}
            </button>
          </div>
        </div>
      )}
      {!confirm && (
        <button
          className="btn full sage"
          disabled={!chargeId || route.needsChoice || cents <= 0 || (isSavings && !reasonOk)}
          onClick={trySave}
        >
          {isSavings
            ? t('env.useSav')
            : onlyParent
              ? t('sheet.save')
              : plan?.goalFromSavings
                ? t('sheet.continueSav')
                : plan || paceOver
                  ? t('sheet.continue')
                  : t('sheet.save')}
        </button>
      )}
    </Sheet>
  )
}

export function EditSheet({ txId, onClose }: { txId: string; onClose: () => void }) {
  const t = useT()
  const locale = useLocale()
  const state = useAppState()
  const tx = state.txs.find((t) => t.id === txId)
  const cycle = activeCycle(state)
  const minDay = cycle?.startedAt ?? todayISO()
  const maxDay = todayISO()
  const [amount, setAmount] = useState(tx ? String(tx.amount / 100) : '')
  const [note, setNote] = useState(tx?.note ? displayNote(tx.note, locale) : '')
  const [spendDay, setSpendDay] = useState(tx ? localDayFromStamp(tx.at) : todayISO())
  const [pocket, setPocket] = useState<Pocket>(
    tx?.pocket === 'cash' || tx?.pocket === 'credit' ? tx.pocket : 'card',
  )

  if (!tx || tx.type !== 'expense') {
    return (
      <Sheet title={t('sheet.edit')} onClose={onClose}>
        <p>{t('sheet.cantEdit')}</p>
        <button type="button" className="btn full" onClick={onClose}>
          {t('common.close')}
        </button>
      </Sheet>
    )
  }

  const cents = parseEuros(amount) ?? 0
  const day = clampDay(spendDay, minDay, maxDay)

  function save() {
    if (cents <= 0) return
    updateExpense(txId, { amount: cents, note, at: stampAtNoon(day), pocket })
    onClose()
  }

  return (
    <Sheet title={t('sheet.edit')} onClose={onClose}>
      <label className="field">
        {t('sheet.amount')}
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <p className="tiny">{t('sheet.payWith')}</p>
      <PocketChips value={pocket} onChange={setPocket} />
      {pocket === 'credit' ? <p className="muted" style={{ fontSize: 13 }}>{t('sheet.creditHint')}</p> : null}
      <p className="tiny">{t('sheet.when')}</p>
      <div className="chips">
        <button
          type="button"
          className={`chip ${day === todayISO() ? 'on' : ''}`}
          onClick={() => setSpendDay(todayISO())}
        >
          {t('sheet.today')}
        </button>
        {yesterdayISO() >= minDay && (
          <button
            type="button"
            className={`chip ${day === yesterdayISO() ? 'on' : ''}`}
            onClick={() => setSpendDay(yesterdayISO())}
          >
            {t('sheet.yesterday')}
          </button>
        )}
      </div>
      <label className="field">
        {t('sheet.date')}
        <input
          type="date"
          min={minDay}
          max={maxDay}
          value={day}
          onChange={(e) => setSpendDay(clampDay(e.target.value || todayISO(), minDay, maxDay))}
        />
      </label>
      <label className="field">
        {t('sheet.note')}
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button type="button" className="btn full sage" disabled={cents <= 0} onClick={save}>
        {t('sheet.saveEdit')}
      </button>
    </Sheet>
  )
}

export function MoveSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const money = useMoney()
  const state = useAppState()
  const views = viewsFor(state)
  const [from, setFrom] = useState(views.find((v) => v.env.kind === 'buffer')?.env.id ?? '')
  const [to, setTo] = useState(() => {
    const parent = views.find((v) => v.env.kind === 'fund' && !v.env.parentId)
    const child = parent ? views.find((v) => v.env.parentId === parent.env.id) : undefined
    return child?.env.id ?? parent?.env.id ?? ''
  })
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const cents = parseEuros(amount) ?? 0
  const fromView = views.find((v) => v.env.id === from)
  const fromSavings = fromView?.env.kind === 'savings'
  const reasonOk = reason.trim().length >= 4

  function save() {
    if (!from || !to || cents <= 0) return
    if (fromSavings && !reasonOk) return
    moveMoney(
      from,
      to,
      cents,
      fromSavings ? t('store.savNote', { reason: reason.trim() }) : t('store.moved'),
    )
    onClose()
  }

  return (
    <Sheet title={t('sheet.move')} onClose={onClose}>
      <p className="muted">{t('sheet.moveHint')}</p>
      <SelectEnv
        label={t('sheet.from')}
        value={from}
        views={views}
        onChange={(id) => {
          setFrom(id)
          const child = views.find((v) => v.env.parentId === id)
          if (child) setTo(child.env.id)
        }}
      />
      <SelectEnv label={t('sheet.to')} value={to} views={views} onChange={setTo} />
      <label className="field">
        {t('sheet.amount')}
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      {fromSavings && (
        <label className="field">
          {t('sheet.moveSavReason')}
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('sheet.movePh')}
          />
        </label>
      )}
      {fromView && fromView.remaining > 0 && (
        <button
          className="btn ghost full"
          onClick={() => setAmount((fromView.remaining / 100).toString())}
        >
          {t('sheet.moveAll', { amount: money(fromView.remaining) })}
        </button>
      )}
      <button
        className="btn full"
        disabled={!from || !to || from === to || cents <= 0 || (fromSavings && !reasonOk)}
        onClick={save}
      >
        {t('sheet.moveBtn')}
      </button>
    </Sheet>
  )
}

export function IncomeSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const state = useAppState()
  const views = viewsFor(state)
  const [amount, setAmount] = useState('')
  const [envelopeId, setEnvelopeId] = useState(
    views.find((v) => v.env.kind === 'savings')?.env.id ?? '',
  )
  const cents = parseEuros(amount) ?? 0
  const [pocket, setPocket] = useState<Pocket>('card')

  function save() {
    if (!envelopeId || cents <= 0) return
    addIncome(envelopeId, cents, t('sheet.income'), pocket)
    onClose()
  }

  return (
    <Sheet title={t('sheet.income')} onClose={onClose}>
      <p className="muted">{t('sheet.incomeHint')}</p>
      <label className="field">
        {t('sheet.amount')}
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <p className="tiny">{t('sheet.payWith')}</p>
      <PocketChips value={pocket} onChange={setPocket} />
      {pocket === 'credit' ? <p className="muted" style={{ fontSize: 13 }}>{t('sheet.creditHint')}</p> : null}
      <SelectEnv label={t('sheet.envelope')} value={envelopeId} views={views} onChange={setEnvelopeId} />
      <button className="btn full sage" disabled={!envelopeId || cents <= 0} onClick={save}>
        {t('sheet.incomeBtn')}
      </button>
    </Sheet>
  )
}

export function CashSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const money = useMoney()
  const state = useAppState()
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const cents = parseEuros(amount) ?? 0
  const snap = accountSnapshot(viewsFor(state))
  const pockets = pocketSplit(state, snap.inAccount, snap.afterFixed)

  function go(direction: 'to-cash' | 'to-bank') {
    setError('')
    setMsg('')
    const result = movePocket(cents, direction)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMsg(t('sheet.cashOk'))
    setAmount('')
  }

  return (
    <Sheet title={t('sheet.cashTitle')} onClose={onClose}>
      <p className="muted">{t('sheet.cashHint')}</p>
      <p className="muted" style={{ fontSize: 13 }}>
        {t('home.inAccountHint', { bank: money(pockets.bank), cash: money(pockets.cash) })}
      </p>
      <label className="field">
        {t('sheet.amount')}
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setError('')
            setMsg('')
          }}
          placeholder={t('common.amountPh')}
        />
      </label>
      {error ? <p className="deficit">{error}</p> : null}
      {msg ? <p className="hint">{msg}</p> : null}
      <button type="button" className="btn full sage" disabled={cents <= 0} onClick={() => go('to-cash')}>
        {t('sheet.toCash')}
      </button>
      <button type="button" className="btn full secondary" disabled={cents <= 0} onClick={() => go('to-bank')}>
        {t('sheet.toBank')}
      </button>
    </Sheet>
  )
}

export function CardPaySheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const money = useMoney()
  const state = useAppState()
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const cents = parseEuros(amount) ?? 0
  const snap = accountSnapshot(viewsFor(state))
  const pockets = pocketSplit(state, snap.inAccount, snap.afterFixed)

  function pay() {
    setError('')
    setMsg('')
    const result = payCard(cents)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMsg(t('sheet.cardOk'))
    setAmount('')
  }

  return (
    <Sheet title={t('sheet.cardTitle')} onClose={onClose}>
      <p className="muted">{t('sheet.cardHint')}</p>
      <p className="muted" style={{ fontSize: 13 }}>
        {t('home.creditOwed', { amount: money(Math.max(0, pockets.credit)) })}
      </p>
      <label className="field">
        {t('sheet.amount')}
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setError('')
            setMsg('')
          }}
          placeholder={t('common.amountPh')}
        />
      </label>
      {error ? <p className="deficit">{error}</p> : null}
      {msg ? <p className="hint">{msg}</p> : null}
      <button type="button" className="btn full sage" disabled={cents <= 0} onClick={pay}>
        {t('home.payCard')}
      </button>
    </Sheet>
  )
}

export function NewEnvelopeSheet({ onClose }: { onClose: () => void }) {
  const t = useT()
  const state = useAppState()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<EnvelopeKind>('cap')
  const [rhythm, setRhythm] = useState<Rhythm>('weekly')
  const [splitDaily, setSplit] = useState(false)
  const [eachCycle, setEachCycle] = useState(false)
  const [weekStartsOn, setWeekStartsOn] = useState(() => state.settings.weekStartsOn ?? 5)
  const [amount, setAmount] = useState('')
  const [emoji, setEmoji] = useState('✦')
  const [error, setError] = useState('')
  const cents = parseEuros(amount) ?? 0

  function save() {
    setError('')
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('env.needName'))
      return
    }
    if (amount.trim() && parseEuros(amount) === null) {
      setError(t('env.needAmount'))
      return
    }
    const result = addEnvelope({
      id: uid(),
      name: trimmed,
      kind,
      planned: cents,
      emoji,
      opening: 0,
      rhythm: kind === 'cap' ? (splitDaily ? 'daily' : rhythm) : 'none',
      splitDaily: kind === 'cap' && splitDaily,
      weekStartsOn: kind === 'cap' && !splitDaily && rhythm === 'weekly' ? weekStartsOn : undefined,
      ...(kind === 'fund' && eachCycle && cents > 0 ? { cycleSetAside: cents } : {}),
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <Sheet title={t('sheet.new')} onClose={onClose}>
      <p className="muted">{t('sheet.newHint')}</p>
      <label className="field">
        {t('setup.name')}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('sheet.newPh')} />
      </label>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {EMOJI_PICK.map((e) => (
          <button
            key={e}
            type="button"
            className={`chip ${emoji === e ? 'on' : ''}`}
            onClick={() => setEmoji(e)}
          >
            {e}
          </button>
        ))}
      </div>
      <label className="field">
        {t('setup.type')}
        <select
          value={kind}
          onChange={(e) => {
            const next = e.target.value as EnvelopeKind
            setKind(next)
            if (next !== 'cap') setSplit(false)
          }}
        >
          <option value="cap">{t('setup.typeCap')}</option>
          <option value="fixed">{t('setup.typeBill')}</option>
          <option value="fund">{t('setup.typeGoal')}</option>
        </select>
      </label>
      {kind === 'fund' && (
        <label className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <input
            type="checkbox"
            checked={eachCycle}
            onChange={(e) => setEachCycle(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span>
            <span style={{ fontWeight: 500 }}>{t('fund.eachCycle')}</span>
            <span className="muted" style={{ display: 'block', fontSize: 13 }}>
              {t('fund.eachCycleHint')}
            </span>
          </span>
        </label>
      )}
      {kind === 'cap' && (
        <>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <input
              type="checkbox"
              checked={splitDaily}
              onChange={(e) => setSplit(e.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span>
              <span style={{ fontWeight: 500 }}>{t('env.addDaily')}</span>
              <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                {t('env.addDailyHint')}
              </span>
            </span>
          </label>
          {!splitDaily && (
            <label className="field">
              {t('sheet.rhythm')}
              <select value={rhythm === 'weekly' ? 'weekly' : 'daily'} onChange={(e) => setRhythm(e.target.value as Rhythm)}>
                <option value="weekly">{t('sheet.weekly')}</option>
                <option value="daily">{t('sheet.wholeCycle')}</option>
              </select>
            </label>
          )}
          {kind === 'cap' && !splitDaily && rhythm === 'weekly' && (
            <WeekStartSelect value={weekStartsOn} onChange={setWeekStartsOn} />
          )}
        </>
      )}
      <label className="field">
        {t('sheet.amount')}
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={kind === 'fund' ? '0' : '0'}
        />
      </label>
      {error ? <p className="deficit">{error}</p> : null}
      <button type="button" className="btn full sage" onClick={save}>
        {t('sheet.create')}
      </button>
    </Sheet>
  )
}

function SelectEnv({
  label,
  value,
  views,
  onChange,
}: {
  label: string
  value: string
  views: EnvelopeView[]
  onChange: (id: string) => void
}) {
  const locale = useLocale()
  const t = useT()
  const money = useMoney()
  const ordered = useMemo(
    () => views.slice().sort((a, b) => kindOrder(a.env.kind) - kindOrder(b.env.kind)),
    [views],
  )
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('sheet.pick')}</option>
        {ordered.map((v) => {
          const parent = v.env.parentId
            ? ordered.find((p) => p.env.id === v.env.parentId)
            : undefined
          const name = parent ? `${parent.env.name} / ${v.env.name}` : v.env.name
          return (
            <option key={v.env.id} value={v.env.id}>
              {v.env.emoji} {name} · {money(v.remaining)} · {kindLabel(v.env.kind, locale)}
            </option>
          )
        })}
      </select>
    </label>
  )
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const t = useT()
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <div className="row">
          <h2 className="serif" style={{ fontSize: 28 }}>
            {title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
