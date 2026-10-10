import { useMemo, useRef, useState, type ReactNode } from 'react'
import { suggestedNextPay, lastPaydayGuess } from './dates'
import { tutorialFor } from './guide'
import { assigned, takesFromPay, withBalancedBuffer } from './logic'
import { parseEuros } from './money'
import { importJson, startFirstCycle } from './store'
import { guidedPlan } from './template'
import { useLocale, useMoney, useT } from './useT'
import type { PayMode } from './types'

type Step = 'welcome' | 'pay' | 'save' | 'bill' | 'cap' | 'libre'
type NamedDraft = { name: string; amount: string }

const ORDER: Step[] = ['pay', 'save', 'bill', 'cap', 'libre']

function draftAmount(row: NamedDraft): { name: string; amount: number } {
  return { name: row.name.trim(), amount: parseEuros(row.amount) ?? 0 }
}

function rowCents(rows: NamedDraft[]): number {
  return rows.reduce((sum, row) => sum + (parseEuros(row.amount) ?? 0), 0)
}

/** Vacío sigue igual. A medias avisa. Completo se suma a la lista. */
function commitDraft(
  rows: NamedDraft[],
  name: string,
  amount: string,
): { rows: NamedDraft[]; partial: boolean } {
  const trimmed = name.trim()
  const cents = parseEuros(amount) ?? 0
  if (!trimmed && !amount.trim()) return { rows, partial: false }
  if (!trimmed || cents <= 0) return { rows, partial: true }
  return { rows: [...rows, { name: trimmed, amount }], partial: false }
}

export function Setup() {
  const t = useT()
  const money = useMoney()
  const locale = useLocale()
  const [step, setStep] = useState<Step>('welcome')
  const [incomeText, setIncomeText] = useState('')
  const [startedAt, setStartedAt] = useState(lastPaydayGuess())
  const [payMode, setPayMode] = useState<PayMode>('last-weekday')
  const [fixedDay, setFixedDay] = useState(1)
  const [expectedEndAt, setExpectedEndAt] = useState(() =>
    suggestedNextPay(lastPaydayGuess(), 'last-weekday', 1),
  )
  const [saveText, setSaveText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [bills, setBills] = useState<NamedDraft[]>([])
  const [billName, setBillName] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [caps, setCaps] = useState<NamedDraft[]>([])
  const [capName, setCapName] = useState('')
  const [capAmount, setCapAmount] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const income = parseEuros(incomeText) ?? 0
  const savings = parseEuros(saveText) ?? 0
  const savingsOpening = parseEuros(savedText) ?? 0
  const plan = useMemo(
    () =>
      guidedPlan(locale, {
        savings,
        bills: bills.map(draftAmount),
        caps: caps.map(draftAmount),
      }),
    [locale, savings, bills, caps],
  )
  const balanced = useMemo(() => withBalancedBuffer(plan, income, locale), [plan, income, locale])
  const plannedOthers = assigned(balanced.filter((e) => takesFromPay(e)))
  const deficit = plannedOthers - income
  const buffer = balanced.find((e) => e.kind === 'buffer')

  function go(next: Step) {
    setError('')
    setStep(next)
  }

  function overBy(used: number): boolean {
    if (used <= income) return false
    setError(t('setup.overPlan', { amount: money(used - income) }))
    return true
  }

  function start() {
    setError('')
    if (income <= 0) {
      setError(t('setup.needIncome'))
      return
    }
    if (deficit > 0) {
      setError(t('setup.overPlan', { amount: money(deficit) }))
      return
    }
    try {
      startFirstCycle({
        income,
        startedAt,
        expectedEndAt,
        settings: {
          payMode,
          fixedDay,
          weekStartsOn: 5,
          dailyWeekStartsOn: 1,
          locale,
        },
        template: balanced,
        savingsOpening,
        openingCash: 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.openFail'))
    }
  }

  if (step === 'welcome') {
    return (
      <div className="welcome stack">
        <p className="tiny">{t('welcome.kicker')}</p>
        <h1>Techo</h1>
        <p>{t('welcome.p1')}</p>
        <p className="muted">{t('welcome.p2')}</p>
        <button className="choice" onClick={() => go('pay')}>
          <b>{t('welcome.create')}</b>
          <span className="muted">{t('welcome.createSub')}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json,text/plain"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
              const text = typeof reader.result === 'string' ? reader.result : ''
              const result = importJson(text)
              if (!result.ok) setError(result.error)
            }
            reader.readAsText(file)
          }}
        />
        <button type="button" className="choice" onClick={() => fileRef.current?.click()}>
          <b>{t('welcome.restore')}</b>
          <span className="muted">{t('welcome.restoreSub')}</span>
        </button>
        {error ? <p className="deficit">{error}</p> : null}
        <p className="muted" style={{ fontSize: 13 }}>
          {t('welcome.incognito')}
        </p>
      </div>
    )
  }

  const n = ORDER.indexOf(step) + 1

  if (step === 'pay') {
    return (
      <Frame
        n={n}
        title={t('guide.payTitle')}
        lead={t('guide.payLead')}
        onBack={() => go('welcome')}
        primary={t('common.next')}
        onPrimary={() => {
          if (income <= 0) {
            setError(t('setup.needIncome'))
            return
          }
          if (!(expectedEndAt > startedAt)) {
            setError(t('guide.badDates'))
            return
          }
          go('save')
        }}
        error={error}
      >
        <label className="field">
          {t('setup.income')}
          <input
            inputMode="decimal"
            value={incomeText}
            onChange={(e) => setIncomeText(e.target.value)}
            placeholder="1500"
          />
        </label>
        <label className="field">
          {t('setup.payday')}
          <input
            type="date"
            value={startedAt}
            onChange={(e) => {
              const v = e.target.value
              setStartedAt(v)
              setExpectedEndAt(suggestedNextPay(v, payMode, fixedDay))
            }}
          />
        </label>
        <label className="field">
          {t('setup.howPay')}
          <select
            value={payMode}
            onChange={(e) => {
              const mode = e.target.value as PayMode
              setPayMode(mode)
              setExpectedEndAt(suggestedNextPay(startedAt, mode, fixedDay))
            }}
          >
            <option value="last-weekday">{t('setup.payLast')}</option>
            <option value="fixed-day">{t('setup.payFixed')}</option>
            <option value="manual">{t('setup.payManual')}</option>
          </select>
        </label>
        {payMode === 'fixed-day' && (
          <label className="field">
            {t('setup.dayOfMonth')}
            <input
              inputMode="numeric"
              value={fixedDay}
              onChange={(e) => {
                const day = Number(e.target.value) || 1
                setFixedDay(day)
                setExpectedEndAt(suggestedNextPay(startedAt, payMode, day))
              }}
            />
          </label>
        )}
        <label className="field">
          {t('setup.nextPay')}
          <input type="date" value={expectedEndAt} onChange={(e) => setExpectedEndAt(e.target.value)} />
        </label>
      </Frame>
    )
  }

  if (step === 'save') {
    return (
      <Frame
        n={n}
        title={t('guide.saveTitle')}
        lead={t('guide.saveLead')}
        onBack={() => go('pay')}
        primary={t('common.next')}
        onPrimary={() => {
          if (overBy(savings)) return
          go('bill')
        }}
        error={error}
      >
        <label className="field">
          {t('guide.saveAmount')}
          <input
            inputMode="decimal"
            value={saveText}
            onChange={(e) => setSaveText(e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="field">
          {t('setup.saved')}
          <input
            inputMode="decimal"
            value={savedText}
            onChange={(e) => setSavedText(e.target.value)}
            placeholder="0"
          />
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('setup.savedHint')}
        </p>
      </Frame>
    )
  }

  if (step === 'bill') {
    return (
      <Frame
        n={n}
        title={t('guide.billTitle')}
        lead={t('guide.billLead')}
        onBack={() => go('save')}
        primary={t('common.next')}
        onPrimary={() => {
          const next = commitDraft(bills, billName, billAmount)
          if (next.partial) {
            setError(!billName.trim() ? t('guide.needName') : t('guide.needAmount'))
            return
          }
          if (overBy(savings + rowCents(next.rows))) return
          setBills(next.rows)
          setBillName('')
          setBillAmount('')
          go('cap')
        }}
        skip={bills.length === 0 ? t('guide.skip') : undefined}
        onSkip={
          bills.length === 0
            ? () => {
                setBillName('')
                setBillAmount('')
                go('cap')
              }
            : undefined
        }
        error={error}
      >
        <p className="hint">{t('guide.billExample')}</p>
        <NamedList
          rows={bills}
          onRemove={(index) => setBills(bills.filter((_, i) => i !== index))}
          money={money}
          removeLabel={t('guide.remove')}
        />
        <label className="field">
          {t('setup.name')}
          <input
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            placeholder={t('guide.billPh')}
          />
        </label>
        <label className="field">
          {t('setup.amount')}
          <input
            inputMode="decimal"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            placeholder="0"
          />
        </label>
        <button
          type="button"
          className="btn full"
          onClick={() => {
            const next = commitDraft(bills, billName, billAmount)
            if (next.partial) {
              setError(!billName.trim() ? t('guide.needName') : t('guide.needAmount'))
              return
            }
            if (next.rows === bills) return
            if (overBy(savings + rowCents(next.rows))) return
            setError('')
            setBills(next.rows)
            setBillName('')
            setBillAmount('')
          }}
        >
          {t('guide.add')}
        </button>
      </Frame>
    )
  }

  if (step === 'cap') {
    const already = savings + rowCents(bills)
    return (
      <Frame
        n={n}
        title={t('guide.capTitle')}
        lead={t('guide.capLead')}
        onBack={() => go('bill')}
        primary={t('common.next')}
        onPrimary={() => {
          const next = commitDraft(caps, capName, capAmount)
          if (next.partial) {
            setError(!capName.trim() ? t('guide.needName') : t('guide.needAmount'))
            return
          }
          if (overBy(already + rowCents(next.rows))) return
          setCaps(next.rows)
          setCapName('')
          setCapAmount('')
          go('libre')
        }}
        skip={caps.length === 0 ? t('guide.skip') : undefined}
        onSkip={
          caps.length === 0
            ? () => {
                setCapName('')
                setCapAmount('')
                go('libre')
              }
            : undefined
        }
        error={error}
      >
        <p className="hint">{t('guide.capExample')}</p>
        <NamedList
          rows={caps}
          onRemove={(index) => setCaps(caps.filter((_, i) => i !== index))}
          money={money}
          removeLabel={t('guide.remove')}
        />
        <label className="field">
          {t('setup.name')}
          <input value={capName} onChange={(e) => setCapName(e.target.value)} placeholder={t('guide.capPh')} />
        </label>
        <label className="field">
          {t('setup.amount')}
          <input
            inputMode="decimal"
            value={capAmount}
            onChange={(e) => setCapAmount(e.target.value)}
            placeholder="0"
          />
        </label>
        <button
          type="button"
          className="btn full"
          onClick={() => {
            const next = commitDraft(caps, capName, capAmount)
            if (next.partial) {
              setError(!capName.trim() ? t('guide.needName') : t('guide.needAmount'))
              return
            }
            if (next.rows === caps) return
            if (overBy(already + rowCents(next.rows))) return
            setError('')
            setCaps(next.rows)
            setCapName('')
            setCapAmount('')
          }}
        >
          {t('guide.add')}
        </button>
      </Frame>
    )
  }

  return (
    <Frame
      n={n}
      title={t('guide.libreTitle')}
      lead={t('guide.libreLead')}
      onBack={() => go('cap')}
      primary={deficit > 0 ? t('setup.openBlocked') : t('guide.enter')}
      onPrimary={start}
      error={error}
    >
      <section className="hero">
        <div className="label">{buffer?.name}</div>
        <div className="amount">{money(Math.max(0, buffer?.planned ?? 0))}</div>
      </section>
      <div className="math">
        <div className="math-row">
          <span>{t('setup.incomeRow')}</span>
          <span>{money(income)}</span>
        </div>
        {balanced
          .filter((e) => e.kind !== 'buffer')
          .map((e) => (
            <div className="math-row" key={e.id}>
              <span>
                {e.emoji} {e.name}
              </span>
              <span>{money(e.planned)}</span>
            </div>
          ))}
      </div>
      {deficit > 0 ? (
        <div className="deficit">{t('setup.deficit', { amount: money(deficit) })}</div>
      ) : (
        <p className="muted" style={{ fontSize: 13 }}>
          {t('guide.later')}
        </p>
      )}
    </Frame>
  )
}

function NamedList({
  rows,
  onRemove,
  money,
  removeLabel,
}: {
  rows: NamedDraft[]
  onRemove: (index: number) => void
  money: (cents: number) => string
  removeLabel: string
}) {
  if (rows.length === 0) return null
  return (
    <div className="stack">
      {rows.map((row, index) => (
        <div className="row" key={`${row.name}-${index}`}>
          <span>
            {row.name} · {money(parseEuros(row.amount) ?? 0)}
          </span>
          <button type="button" className="back" onClick={() => onRemove(index)}>
            {removeLabel}
          </button>
        </div>
      ))}
    </div>
  )
}

function Frame({
  n,
  title,
  lead,
  onBack,
  children,
  primary,
  onPrimary,
  skip,
  onSkip,
  error,
}: {
  n: number
  title: string
  lead: string
  onBack: () => void
  children: ReactNode
  primary: string
  onPrimary: () => void
  skip?: string
  onSkip?: () => void
  error?: string
}) {
  const t = useT()
  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        {t('common.back')}
      </button>
      <p className="tiny">
        {n} / {ORDER.length}
      </p>
      <div className="dots">
        {ORDER.map((id, i) => (
          <span key={id} className={i === n - 1 ? 'dot on' : 'dot'} />
        ))}
      </div>
      <h2 className="serif" style={{ fontSize: 32 }}>
        {title}
      </h2>
      <p>{lead}</p>
      {children}
      {error ? <div className="deficit">{error}</div> : null}
      <button type="button" className="btn full sage" onClick={onPrimary}>
        {primary}
      </button>
      {skip && onSkip ? (
        <button type="button" className="btn ghost full" onClick={onSkip}>
          {skip}
        </button>
      ) : null}
    </div>
  )
}

export function HowItWorks() {
  const locale = useLocale()
  const pages = tutorialFor(locale)
  return (
    <div className="stack">
      {pages.map((b) => (
        <div className="card stack" key={b.screen} style={{ gap: 8 }}>
          <p className="tiny">{b.screen}</p>
          <strong>{b.title}</strong>
          {b.lead ? <p style={{ fontSize: 14 }}>{b.lead}</p> : null}
          {b.items && (
            <ul className="guide-list">
              {b.items.map((it) => (
                <li key={it.k}>
                  <b>{it.k}.</b> {it.v}
                </li>
              ))}
            </ul>
          )}
          {b.tip ? (
            <p className="muted" style={{ fontSize: 13 }}>
              {b.tip}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
