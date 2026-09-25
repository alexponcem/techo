import {
  accountSnapshot,
  cycleTxs,
  homeGroupOf,
  homeGroups,
  inDailySplit,
  paceFor,
  spentOnDay,
  viewsFor,
  type EnvelopeView,
  type HomeGroupId,
} from './logic'
import { useState } from 'react'
import { clampWeekStart, formatRange, todayISO } from './dates'
import { weekdayName, type MsgKey } from './i18n'
import { euros } from './money'
import { kindLabel } from './template'
import { markPaid, updateSettings, useAppState } from './store'
import { useLocale, useT } from './useT'
import type { Sheet as SheetState } from './types'

function pillLabel(view: EnvelopeView, tr: (k: MsgKey, vars?: Record<string, string | number>) => string): string {
  if (view.paid) return tr('home.pillPaid')
  if (view.env.kind === 'savings') return view.used > 0 ? `${view.pct}%` : tr('home.pillOk')
  if (view.env.kind === 'fund') {
    return view.remaining > 0 ? tr('home.pillSet') : view.spent > 0 ? tr('home.pillFromSav') : tr('home.pillEmpty')
  }
  if (view.light === 'green') return tr('home.pillOk')
  if (view.light === 'idle') return '—'
  if (view.alert === 'limit') return tr('home.pillLimit')
  return `${Math.max(0, view.pct)}%`
}

function alertLine(
  alert: EnvelopeView['alert'],
  pct: number,
  tr: (k: MsgKey, vars?: Record<string, string | number>) => string,
): string {
  if (alert === 'half') return tr('home.alertHalf', { pct })
  if (alert === 'near') return tr('home.alertNear', { pct })
  if (alert === 'almost') return tr('home.alertAlmost', { pct })
  if (alert === 'limit') return tr('home.alertLimit')
  if (alert === 'over') return tr('home.alertOver')
  return ''
}

export function Home({
  onOpen,
  onEnvelope,
  onSettings,
  onCycle,
}: {
  onOpen: (sheet: NonNullable<SheetState>) => void
  onEnvelope: (id: string) => void
  onSettings: () => void
  onCycle: () => void
}) {
  const state = useAppState()
  const t = useT()
  const locale = useLocale()
  const cycle = [...state.cycles].reverse().find((c) => !c.closedAt)
  const views = viewsFor(state)

  if (!cycle) return null

  const pace = paceFor(state)
  const splitViews = views.filter((v) => inDailySplit(v.env))
  const todayLogged = spentOnDay(
    cycleTxs(state, cycle.id),
    splitViews.map((v) => v.env.id),
    todayISO(),
  )
  const splitNames = splitViews.map((v) => v.env.name).join(' + ') || t('names.free')
  const hot = views.filter(
    (v) => v.alert === 'near' || v.alert === 'almost' || v.alert === 'limit' || v.alert === 'over',
  )
  const over = hot.filter((v) => v.alert === 'over')
  const atLimit = hot.filter((v) => v.alert === 'limit')
  const almost = hot.filter((v) => v.alert === 'almost')
  const near = hot.filter((v) => v.alert === 'near')
  const capLine = pace.caps
    .filter((c) => c.remaining > 0)
    .map((c) => `${c.name} ${euros(c.remaining, locale)}`)
    .join(' · ')
  const snap = accountSnapshot(views)
  const unpaidNames = snap.unpaid.map((v) => v.env.name).join(', ')
  const groups = homeGroups(locale).map((g) => ({
    ...g,
    items: views.filter((v) => homeGroupOf(v.env) === g.id),
  }))

  return (
    <div>
      <header className="topbar">
        <div className="brand">Techo</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="icon-btn" onClick={onCycle} aria-label={t('nav.cycle')}>
            ↻
          </button>
          <button className="icon-btn" onClick={onSettings} aria-label={t('nav.settings')}>
            ⚙
          </button>
        </div>
      </header>

      <div className="actions">
        <button className="btn sage" onClick={() => onOpen({ name: 'add' })}>
          {t('home.spend')}
        </button>
        <button className="btn secondary" onClick={() => onOpen({ name: 'move' })}>
          {t('home.move')}
        </button>
      </div>

      {hot.length > 0 && (
        <div className={`banner ${over.length + atLimit.length + almost.length > 0 ? 'red' : 'orange'}`}>
          {over.length === 1 && <div>{t('home.overOne', { name: over[0].env.name })}</div>}
          {over.length > 1 && <div>{t('home.overMany', { names: over.map((v) => v.env.name).join(', ') })}</div>}
          {atLimit.length === 1 && <div>{t('home.atLimitOne', { name: atLimit[0].env.name })}</div>}
          {atLimit.length > 1 && (
            <div>{t('home.atLimitMany', { names: atLimit.map((v) => v.env.name).join(', ') })}</div>
          )}
          {almost.length === 1 && (
            <div>{t('home.almostOne', { name: almost[0].env.name, pct: almost[0].pct })}</div>
          )}
          {almost.length > 1 && (
            <div>{t('home.almostMany', { names: almost.map((v) => v.env.name).join(', ') })}</div>
          )}
          {near.length === 1 && (
            <div>{t('home.nearOne', { name: near[0].env.name, pct: near[0].pct })}</div>
          )}
          {near.length > 1 && (
            <div>{t('home.nearMany', { names: near.map((v) => v.env.name).join(', ') })}</div>
          )}
        </div>
      )}

      <section className="hero">
        <div className="label">{t('home.today')}</div>
        <div className="amount">{euros(pace.daily, locale)}</div>
        <div className="sub">
          {pace.daily <= 0 && pace.weekly > 0
            ? t('home.todayClosed')
            : todayLogged > 0
              ? t('home.todayLogged', { amount: euros(todayLogged, locale) })
              : t('home.todayHint', { names: splitNames })}
        </div>
        <div className="hero-pills">
          <div className="hero-pill">
            <div className="k">{t('home.thisWeek')}</div>
            <div className="v">{euros(pace.weekly, locale)}</div>
            <div className="s">
              {t('home.weekMeta', {
                daily: euros(pace.fairDaily, locale),
                cap: euros(pace.weekAssigned, locale),
                days: pace.days,
                dayWord: pace.days === 1 ? t('common.day') : t('common.days'),
              })}
            </div>
          </div>
          <div className="hero-pill">
            <div className="k">{t('home.month')}</div>
            <div className="v">{euros(pace.remaining, locale)}</div>
            <div className="s">
              {t('home.monthMeta', {
                original: euros(pace.originalMonth, locale),
                daily: euros(pace.fairDaily, locale),
              })}
              {splitNames ? ` · ${splitNames}` : ''}
            </div>
          </div>
        </div>
        <div className="hero-break">
          {t('home.weekBreak', {
            from: weekdayName(locale, clampWeekStart(state.settings.dailyWeekStartsOn ?? 1)),
            to: weekdayName(locale, (clampWeekStart(state.settings.dailyWeekStartsOn ?? 1) + 6) % 7),
          })}
          {capLine ? (
            <>
              <br />
              {capLine}
            </>
          ) : null}
        </div>
        <div className="hero-meta">
          <span>{formatRange(cycle.startedAt, cycle.expectedEndAt, locale)}</span>
          <span>{t('home.cameIn', { amount: euros(cycle.income, locale) })}</span>
        </div>
      </section>

      <section className="saldo">
        <div className="tiny">{t('home.inAccount')}</div>
        <div className="saldo-amount">{euros(snap.inAccount, locale)}</div>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('home.inAccountHint')}
        </p>
        {snap.unpaidTotal > 0 ? (
          <div className="saldo-next">
            <div className="row">
              <span>{t('home.whenBillsLeave')}</span>
              <b>{euros(snap.afterFixed, locale)}</b>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {t('home.billsLeft', { names: unpaidNames })}
            </p>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            {t('home.billsDone')}
          </p>
        )}
        {snap.floor > 0 && snap.unpaidTotal > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            {t('home.floor', { amount: euros(snap.floor, locale) })}
          </p>
        )}
      </section>

      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.id} style={{ marginBottom: 18 }}>
            <div className="section-title">
              <span>{g.title}</span>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: '-4px 2px 10px' }}>
              {g.hint}
            </p>
            <div className="stack">
              {g.items.map((v) => (
                <EnvelopeCard
                  key={v.env.id}
                  view={v}
                  group={g.id}
                  onOpen={() => onEnvelope(v.env.id)}
                  onPay={() => markPaid(v.env.id, v.remaining)}
                  onSpend={() => onOpen({ name: 'add', envelopeId: v.env.id })}
                />
              ))}
            </div>
          </section>
        ),
      )}
      <button
        type="button"
        className="btn ghost full"
        style={{ margin: '4px 0 24px' }}
        onClick={() => onOpen({ name: 'new-envelope' })}
      >
        {t('home.newEnvelope')}
      </button>
      {state.settings.seenHomeTour === false && (
        <HomeTour
          onSkip={() => updateSettings({ ...state.settings, seenHomeTour: true })}
        />
      )}
    </div>
  )
}

function HomeTour({ onSkip }: { onSkip: () => void }) {
  const t = useT()
  const [i, setI] = useState(0)
  const pages = [
    { title: t('tour.account'), body: t('tour.accountBody') },
    { title: t('tour.today'), body: t('tour.todayBody') },
    { title: t('tour.add'), body: t('tour.addBody') },
  ]
  const page = pages[i]
  return (
    <div className="tour">
      <div className="tour-card stack">
        <p className="tiny">
          {i + 1} / {pages.length}
        </p>
        <h3 className="serif" style={{ fontSize: 24, margin: 0 }}>
          {page.title}
        </h3>
        <p>{page.body}</p>
        <button
          type="button"
          className="btn full sage"
          onClick={() => {
            if (i < pages.length - 1) setI(i + 1)
            else onSkip()
          }}
        >
          {i < pages.length - 1 ? t('common.next') : t('common.start')}
        </button>
        <button type="button" className="btn ghost full" onClick={onSkip}>
          {t('common.skipTour')}
        </button>
      </div>
    </div>
  )
}

function EnvelopeCard({
  view,
  group,
  onOpen,
  onPay,
  onSpend,
}: {
  view: EnvelopeView
  group: HomeGroupId
  onOpen: () => void
  onPay: () => void
  onSpend: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const { env, remaining, total, pct, light, paid } = view
  const week = view.week
  const weekPct =
    week && week.target > 0 ? Math.min(100, Math.round((week.spent / week.target) * 100)) : 0
  const barPct = group === 'cap' && week ? weekPct : Math.min(100, pct)
  return (
    <button className="env" id={`sobre-${env.id}`} onClick={onOpen}>
      <div className="emoji">{env.emoji}</div>
      <div>
        <div className="name">{env.name}</div>
        <div className="meta">
          {group === 'daily'
            ? t('home.inDaily')
            : env.kind === 'savings'
              ? t('home.savingsUsed', { amount: euros(view.used, locale) })
              : env.kind === 'fund'
                ? t('home.fundSpent', { amount: euros(view.spent, locale) })
                : week
                  ? t('home.weekLine', {
                      spent: euros(week.spent, locale),
                      target: euros(week.target, locale),
                      monthSpent: euros(view.spent, locale),
                      total: euros(total, locale),
                    })
                  : kindLabel(env.kind, locale)}
          {env.kind !== 'fund' && !week && total > 0 ? t('home.usedPct', { pct }) : ''}
          {env.opening > 0 ? t('home.brought', { amount: euros(env.opening, locale) }) : ''}
        </div>
      </div>
      <div className="right">
        <div className="remain">{euros(remaining, locale)}</div>
        <span className={`pill ${light}`}>{pillLabel(view, t)}</span>
      </div>
      <div className={`bar ${light}`}>
        <span style={{ width: `${barPct}%` }} />
      </div>
      {week && group === 'cap' && (
        <p className="muted" style={{ fontSize: 13, gridColumn: '1 / -1', margin: 0 }}>
          {t('home.weekAdvice', {
            label: week.label,
            clip: week.daysInCycle < 7 ? t('home.weekClip', { n: week.daysInCycle }) : '',
            pace: week.pace === 'fast' ? t('home.paceFast') : week.pace === 'over' ? t('home.paceOver') : '',
          })}
        </p>
      )}
      {view.alert && (
        <div className={`env-warn pill ${light}`} style={{ justifySelf: 'start' }}>
          {alertLine(view.alert, pct, t)}
        </div>
      )}
      {env.kind === 'fixed' && !paid && remaining > 0 && (
        <div className="row" style={{ gridColumn: '1 / -1' }}>
          <span className="muted tiny" style={{ textTransform: 'none', letterSpacing: 0 }}>
            {t('home.reserved')}
          </span>
          <span
            className="paid-btn"
            onClick={(e) => {
              e.stopPropagation()
              onPay()
            }}
          >
            {t('home.markPaid')}
          </span>
        </div>
      )}
      {(env.kind === 'cap' || env.kind === 'buffer' || env.kind === 'fund') && (
        <div className="row" style={{ gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
          <span
            className="paid-btn"
            onClick={(e) => {
              e.stopPropagation()
              onSpend()
            }}
          >
            {t('home.log')}
          </span>
        </div>
      )}
    </button>
  )
}
