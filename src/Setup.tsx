import { useMemo, useRef, useState } from 'react'
import { clampWeekStart, lastPaydayGuess, suggestedNextPay } from './dates'
import { weekdayName } from './i18n'
import { WeekStartSelect } from './WeekStartSelect'
import { kindExplain, tutorialFor } from './guide'
import { assigned, takesFromPay, withBalancedBuffer } from './logic'
import { euros, parseEuros } from './money'
import { importJson, startFirstCycle } from './store'
import { kindLabel, blankPlan } from './template'
import { useLocale, useT } from './useT'
import type { Envelope, EnvelopeKind, PayMode, Rhythm } from './types'

type Step = 'welcome' | 'tutorial' | 'income' | 'envelopes' | 'review'

export function Setup() {
  const t = useT()
  const locale = useLocale()
  const pages = tutorialFor(locale)
  const explain = kindExplain(locale)
  const [step, setStep] = useState<Step>('welcome')
  const [tip, setTip] = useState(0)
  const [incomeText, setIncomeText] = useState('')
  const [startedAt, setStartedAt] = useState(lastPaydayGuess())
  const [payMode, setPayMode] = useState<PayMode>('last-weekday')
  const [fixedDay, setFixedDay] = useState(1)
  const [weekStartsOn, setWeekStartsOn] = useState(5)
  const [expectedEndAt, setExpectedEndAt] = useState(() =>
    suggestedNextPay(lastPaydayGuess(), 'last-weekday', 1),
  )
  const [envelopes, setEnvelopes] = useState<Envelope[]>(() => blankPlan(locale))
  const [savedText, setSavedText] = useState('0')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const income = parseEuros(incomeText) ?? 0
  const savingsOpening = parseEuros(savedText) ?? 0
  const balanced = useMemo(() => withBalancedBuffer(envelopes, income, locale), [envelopes, income, locale])
  const plannedOthers = assigned(balanced.filter((e) => takesFromPay(e)))
  const deficit = plannedOthers - income
  const buffer = balanced.find((e) => e.kind === 'buffer')

  function setPlanned(id: string, raw: string) {
    const cents = parseEuros(raw)
    if (cents === null && raw !== '') return
    setEnvelopes((prev) => prev.map((e) => (e.id === id ? { ...e, planned: cents ?? 0 } : e)))
  }

  function addRow() {
    const id = `sobre-${Date.now()}`
    setEnvelopes((prev) => [
      ...prev.filter((e) => e.kind !== 'buffer'),
      {
        id,
        name: t('names.newEnvelope'),
        kind: 'cap',
        planned: 0,
        emoji: '✦',
        opening: 0,
        rhythm: 'daily',
        splitDaily: false,
      },
      ...prev.filter((e) => e.kind === 'buffer'),
    ])
  }

  function removeRow(id: string) {
    setEnvelopes((prev) => prev.filter((e) => e.id !== id && e.kind !== 'buffer'))
  }

  function start() {
    setError('')
    if (income <= 0) {
      setError(t('setup.needIncome'))
      return
    }
    if (deficit > 0) {
      setError(t('setup.overPlan', { amount: euros(deficit, locale) }))
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
          weekStartsOn: clampWeekStart(weekStartsOn),
          dailyWeekStartsOn: 1,
          locale,
        },
        template: balanced,
        savingsOpening,
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
        <button className="choice" onClick={() => setStep('tutorial')}>
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

  if (step === 'tutorial') {
    const page = pages[tip]
    return (
      <div className="stack">
        <button
          className="back"
          onClick={() => {
            if (tip > 0) setTip(tip - 1)
            else setStep('welcome')
          }}
        >
          {t('common.back')}
        </button>
        <p className="tiny">
          {tip + 1} / {pages.length} · {page.screen}
        </p>
        <h2 className="serif" style={{ fontSize: 28 }}>
          {page.title}
        </h2>
        {page.lead ? <p>{page.lead}</p> : null}
        {page.items && page.items.length > 0 && (
          <ul className="guide-list">
            {page.items.map((it) => (
              <li key={it.k}>
                <b>{it.k}.</b> {it.v}
              </li>
            ))}
          </ul>
        )}
        {page.tip ? <div className="hint">{page.tip}</div> : null}
        <div className="dots">
          {pages.map((_, i) => (
            <span key={i} className={i === tip ? 'dot on' : 'dot'} />
          ))}
        </div>
        <button
          type="button"
          className="btn full sage"
          onClick={() => {
            if (tip < pages.length - 1) setTip(tip + 1)
            else setStep('income')
          }}
        >
          {tip < pages.length - 1 ? t('common.next') : t('setup.myNumbers')}
        </button>
        {tip > 0 && (
          <button type="button" className="btn ghost full" onClick={() => setTip(tip - 1)}>
            {t('setup.prev')}
          </button>
        )}
        <button type="button" className="btn ghost full" onClick={() => setStep('income')}>
          {t('common.skipGuide')}
        </button>
      </div>
    )
  }

  if (step === 'income') {
    return (
      <div className="stack">
        <button className="back" onClick={() => setStep('tutorial')}>
          {t('common.back')}
        </button>
        <h2 className="serif" style={{ fontSize: 32 }}>
          {t('setup.cycle')}
        </h2>
        <p className="muted">
          {t('setup.cycleHint')}
        </p>
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
        <label className="field">
          {t('setup.weekDefault')}
          <select
            value={weekStartsOn}
            onChange={(e) => setWeekStartsOn(clampWeekStart(Number(e.target.value)))}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <option key={i} value={i}>
                {weekdayName(locale, i)}
              </option>
            ))}
          </select>
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('setup.weekDefaultHint')}
        </p>
        <button className="btn full" onClick={() => setStep('envelopes')} disabled={income <= 0}>
          {t('setup.toEnvelopes')}
        </button>
      </div>
    )
  }

  if (step === 'envelopes') {
    return (
      <div className="stack">
        <button className="back" onClick={() => setStep('income')}>
          {t('common.back')}
        </button>
        <h2 className="serif" style={{ fontSize: 32 }}>
          {t('setup.envelopes')}
        </h2>
        <ul className="guide-list">
          <li>{t('setup.liBill')}</li>
          <li>{t('setup.liDaily')}</li>
          <li>{t('setup.liWeekly')}</li>
          <li>{t('setup.liGoal')}</li>
        </ul>
        <p className="muted">
          {t('setup.envHint')}
        </p>
        {balanced
          .filter((e) => e.kind !== 'buffer')
          .map((e) => (
            <div className="card stack" key={e.id} style={{ gap: 8 }}>
              <div className="row">
                <label className="field" style={{ flex: 1 }}>
                  {t('setup.name')}
                  <input
                    value={e.name}
                    onChange={(ev) =>
                      setEnvelopes((prev) =>
                        prev.map((x) => (x.id === e.id ? { ...x, name: ev.target.value } : x)),
                      )
                    }
                  />
                </label>
                {e.kind !== 'savings' && (
                  <button type="button" className="back" onClick={() => removeRow(e.id)}>
                    {t('setup.remove')}
                  </button>
                )}
              </div>
              <p className="muted" style={{ fontSize: 13 }}>
                {explain[e.kind]?.hint ?? kindLabel(e.kind, locale)}
              </p>
              {e.kind !== 'savings' && (
                <label className="field">
                  {t('setup.type')}
                  <select
                    value={e.kind}
                    onChange={(ev) => {
                      const kind = ev.target.value as EnvelopeKind
                      setEnvelopes((prev) =>
                        prev.map((x) =>
                          x.id === e.id
                            ? {
                                ...x,
                                kind,
                                rhythm:
                                  kind === 'cap'
                                    ? x.rhythm === 'weekly'
                                      ? 'weekly'
                                      : 'daily'
                                    : kind === 'buffer'
                                      ? 'daily'
                                      : 'none',
                              }
                            : x,
                        ),
                      )
                    }}
                  >
                    <option value="fixed">{t('setup.typeBill')}</option>
                    <option value="cap">{t('setup.typeCap')}</option>
                    <option value="fund">{t('setup.typeGoal')}</option>
                  </select>
                </label>
              )}
              {e.kind === 'cap' && (
                <>
                  <label className="field">
                    {t('setup.dailyOrWeekly')}
                    <select
                      value={e.rhythm === 'weekly' ? 'weekly' : 'daily'}
                      onChange={(ev) => {
                        const rhythm = ev.target.value as Rhythm
                        setEnvelopes((prev) =>
                          prev.map((x) =>
                            x.id === e.id
                              ? {
                                  ...x,
                                  rhythm,
                                  weekStartsOn:
                                    rhythm === 'weekly'
                                      ? (x.weekStartsOn ?? weekStartsOn)
                                      : x.weekStartsOn,
                                }
                              : x,
                          ),
                        )
                      }}
                    >
                      <option value="weekly">{t('setup.optWeekly')}</option>
                      <option value="daily">{t('setup.optDaily')}</option>
                    </select>
                  </label>
                  {e.rhythm === 'weekly' && !e.splitDaily && (
                    <WeekStartSelect
                      value={e.weekStartsOn ?? weekStartsOn}
                      onChange={(day) =>
                        setEnvelopes((prev) =>
                          prev.map((x) => (x.id === e.id ? { ...x, weekStartsOn: day } : x)),
                        )
                      }
                    />
                  )}
                  <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(e.splitDaily)}
                      onChange={(ev) =>
                        setEnvelopes((prev) =>
                          prev.map((x) => (x.id === e.id ? { ...x, splitDaily: ev.target.checked } : x)),
                        )
                      }
                    />
                    <span style={{ fontWeight: 500 }}>
                      {t('setup.addDaily')}
                    </span>
                  </label>
                </>
              )}
              <label className="field">
                {e.kind === 'fund' ? t('setup.amountGoal') : t('setup.amount')}
                <input
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  defaultValue={(e.planned / 100).toString()}
                  onChange={(ev) => setPlanned(e.id, ev.target.value)}
                  onBlur={(ev) => setPlanned(e.id, ev.target.value)}
                />
              </label>
            </div>
          ))}
        {buffer ? (
          <div className="card stack" style={{ gap: 8 }}>
            <div className="row">
              <strong>
                {buffer.emoji} {buffer.name}
              </strong>
              <span>{euros(buffer.planned, locale)}</span>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              {t('setup.freeCard', {
                extra: balanced.some((e) => e.kind === 'cap' && e.splitDaily)
                  ? t('setup.freeCardExtra')
                  : '',
              })}
            </p>
          </div>
        ) : null}
        <button className="btn ghost full" onClick={addRow}>
          {t('setup.addRow')}
        </button>
        <button className="btn full" onClick={() => setStep('review')}>
          {t('setup.review')}
        </button>
      </div>
    )
  }

  return (
    <div className="stack">
      <button className="back" onClick={() => setStep('envelopes')}>
        {t('common.back')}
      </button>
      <h2 className="serif" style={{ fontSize: 32 }}>
        {t('setup.closes')}
      </h2>
      <p className="muted">
        {t('setup.closesHint')}
      </p>
      <div className="math">
        <div className="math-row">
          <span>{t('setup.incomeRow')}</span>
          <span>{euros(income, locale)}</span>
        </div>
        {savingsOpening > 0 ? (
          <div className="math-row">
            <span>{t('setup.savedRow')}</span>
            <span>{euros(savingsOpening, locale)}</span>
          </div>
        ) : null}
        {balanced.map((e) => (
          <div className="math-row" key={e.id}>
            <span>
              {e.emoji} {e.name}
            </span>
            <span>{euros(e.planned, locale)}</span>
          </div>
        ))}
      </div>
      {deficit > 0 ? (
        <div className="deficit">
          {t('setup.deficit', { amount: euros(deficit, locale) })}
        </div>
      ) : (
        <div className="hint">
          {buffer && buffer.planned > 0
            ? t('setup.freeHint', {
                amount: euros(buffer.planned, locale),
                extra: balanced.some((e) => e.kind === 'cap' && e.splitDaily)
                  ? t('setup.freeHintExtra')
                  : '',
              })
            : t('setup.allAssigned')}
        </div>
      )}
      {error ? <div className="deficit">{error}</div> : null}
      <button type="button" className="btn full sage" onClick={start}>
        {deficit > 0 ? t('setup.openBlocked') : t('setup.open')}
      </button>
      <p className="muted tiny" style={{ textTransform: 'none', letterSpacing: 0 }}>
        {t('setup.starts', { start: startedAt, end: expectedEndAt })}
      </p>
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
