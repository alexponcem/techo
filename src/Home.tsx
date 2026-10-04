import {
  accountSnapshot,
  pocketSplit,
  cycleTxs,
  fundCarryGap,
  fundSpentSince,
  homeGroupOf,
  homeGroups,
  guideForEnvelope,
  paceFor,
  spentOnDay,
  viewsFor,
  type EnvelopeView,
  type HomeGroupId,
} from './logic'
import { useState } from 'react'
import { clampWeekStart, daysBetween, formatRange, localDayFromStamp, todayISO } from './dates'
import { weekdayName, type MsgKey } from './i18n'
import { kindLabel } from './template'
import { downloadBackup, markPaid, restoreFundCarry, updateSettings, useAppState } from './store'
import { useLocale, useMoney, useT } from './useT'
import type { Sheet as SheetState } from './types'

function backupDue(lastExportAt: string | undefined, startedAt: string): boolean {
  const today = todayISO()
  if (!lastExportAt) return daysBetween(startedAt, today) >= 7
  return daysBetween(localDayFromStamp(lastExportAt), today) >= 21
}

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
  const money = useMoney()
  const locale = useLocale()
  const cycle = [...state.cycles].reverse().find((c) => !c.closedAt)
  const views = viewsFor(state)

  if (!cycle) return null

  const pace = paceFor(state)
  const libreEnv = views.find((v) => v.env.kind === 'buffer')?.env
  const libreGuide = libreEnv ? guideForEnvelope(state, libreEnv.id) : null
  const libreId = views.find((v) => v.env.kind === 'buffer')?.env.id
  const todayLogged = spentOnDay(
    cycleTxs(state, cycle.id),
    libreId ? [libreId] : [],
    todayISO(),
  )
  const over = views.filter((v) => v.alert === 'over')
  const atLimit = views.filter((v) => v.alert === 'limit')
  const snap = accountSnapshot(views)
  const pockets = pocketSplit(state, snap.inAccount, snap.afterFixed)
  const onHand = pockets.bank + pockets.cash
  const onHandAfterBills = pockets.afterBank + pockets.afterCash
  const unpaidNames = snap.unpaid.map((v) => v.env.name).join(', ')
  const groups = homeGroups(locale).map((g) => ({
    ...g,
    items: views.filter((v) => homeGroupOf(v.env) === g.id && !v.env.parentId),
  }))
  const fundGaps = state.envelopes
    .filter((e) => e.kind === 'fund')
    .map((e) => ({ env: e, gap: fundCarryGap(state, e.id) }))
    .filter((row) => row.gap > 0)

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

      {todayISO() >= cycle.expectedEndAt && (
        <div className="banner orange">
          <div>{t('home.paydayDue')}</div>
          <button type="button" className="btn full" style={{ marginTop: 10 }} onClick={onCycle}>
            {t('home.paydayGo')}
          </button>
        </div>
      )}
      {backupDue(state.settings.lastExportAt, cycle.startedAt) && (
        <div className="hint" style={{ marginBottom: 14 }}>
          <div>{t('home.backup')}</div>
          <button type="button" className="btn full sage" style={{ marginTop: 10 }} onClick={() => downloadBackup()}>
            {t('home.backupBtn')}
          </button>
        </div>
      )}

      {fundGaps.length > 0 && (
        <div className="card stack" style={{ marginBottom: 14 }}>
          {fundGaps.map(({ env, gap }) => (
            <div key={env.id} className="stack" style={{ gap: 8 }}>
              <p style={{ margin: 0 }}>
                {env.emoji} {t('fund.gap', { name: env.name, amount: money(gap) })}
              </p>
              <button type="button" className="btn full sage" onClick={() => restoreFundCarry(env.id)}>
                {t('fund.restore')}
              </button>
            </div>
          ))}
        </div>
      )}

      {(over.length > 0 || atLimit.length > 0) && (
        <div className="banner red">
          {over.length === 1 && <div>{t('home.overOne', { name: over[0].env.name })}</div>}
          {over.length > 1 && <div>{t('home.overMany', { names: over.map((v) => v.env.name).join(', ') })}</div>}
          {atLimit.length === 1 && <div>{t('home.atLimitOne', { name: atLimit[0].env.name })}</div>}
          {atLimit.length > 1 && (
            <div>{t('home.atLimitMany', { names: atLimit.map((v) => v.env.name).join(', ') })}</div>
          )}
        </div>
      )}

      <section className="hero">
        <div className="label">{t('home.today')}</div>
        <div className="amount">{money(libreGuide?.hoy ?? 0)}</div>
        <div className="sub">
          {(libreGuide?.hoy ?? 0) <= 0 && (libreGuide?.weekLeft ?? 0) > 0
            ? t('home.todayClosed', { daily: money(libreGuide?.referenceDaily ?? 0) })
            : todayLogged > 0
              ? t('home.todayLogged', { amount: money(todayLogged) })
              : t('home.todayHint', { names: libreEnv?.name ?? t('names.free') })}
        </div>
        <div className="hero-pills">
          <div className="hero-pill">
            <div className="k">{t('home.thisWeek')}</div>
            <div className="v">{money(libreGuide?.weekLeft ?? 0)}</div>
            <div className="s">
              {t('home.weekMeta', {
                daily: money(libreGuide?.fairDaily ?? 0),
                cap: money(libreGuide?.weekAssigned ?? 0),
                days: libreGuide?.daysLeft ?? pace.days,
                dayWord: (libreGuide?.daysLeft ?? pace.days) === 1 ? t('common.day') : t('common.days'),
              })}
            </div>
          </div>
          <div className="hero-pill">
            <div className="k">{t('home.month')}</div>
            <div className="v">{money(libreGuide?.remaining ?? 0)}</div>
            <div className="s">
              {t('home.monthMeta', {
                original: money(libreGuide?.originalMonth ?? 0),
              })}
              {libreEnv ? ` · ${libreEnv.name}` : ''}
            </div>
          </div>
        </div>
        <div className="hero-break">
          {t('home.weekBreak', {
            from: weekdayName(locale, clampWeekStart(state.settings.dailyWeekStartsOn ?? 1)),
            to: weekdayName(locale, (clampWeekStart(state.settings.dailyWeekStartsOn ?? 1) + 6) % 7),
          })}
        </div>
        <div className="hero-meta">
          <span>{formatRange(cycle.startedAt, cycle.expectedEndAt, locale)}</span>
          <span>{t('home.cameIn', { amount: money(cycle.income) })}</span>
        </div>
      </section>

      <section className="saldo">
        <div className="tiny">{t('home.inAccount')}</div>
        <div className="saldo-amount">{money(onHand)}</div>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('home.inAccountHint', { bank: money(pockets.bank), cash: money(pockets.cash) })}
        </p>
        {snap.unpaidTotal > 0 ? (
          <div className="saldo-next">
            <div className="row">
              <span>{t('home.whenBillsLeave')}</span>
              <b>{money(onHandAfterBills)}</b>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {t('home.afterPockets', { bank: money(pockets.afterBank), cash: money(pockets.afterCash) })}
            </p>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {t('home.billsLeft', { names: unpaidNames })}
            </p>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            {t('home.billsDone')}
          </p>
        )}
        {pockets.credit > 0 && (
          <>
            <p className="muted" style={{ fontSize: 13 }}>
              {t('home.creditOwed', { amount: money(pockets.credit) })}
            </p>
            <button type="button" className="btn ghost full" onClick={() => onOpen({ name: 'card-pay' })}>
              {t('home.payCard')}
            </button>
          </>
        )}
        <button type="button" className="btn ghost full" onClick={() => onOpen({ name: 'cash' })}>
          {t('home.cashMove')}
        </button>
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
                  folders={views.filter((c) => c.env.parentId === v.env.id)}
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

function folderLine(
  t: (k: MsgKey, vars?: Record<string, string | number>) => string,
  money: (cents: number) => string,
  remaining: number,
  spent: number,
): string {
  if (remaining > 0 && spent > 0) return t('fund.both', { set: money(remaining), spent: money(spent) })
  if (spent > 0) return t('fund.spentBit', { amount: money(spent) })
  return t('fund.setAside', { amount: money(remaining) })
}

function EnvelopeCard({
  view,
  group,
  folders = [],
  onOpen,
  onPay,
  onSpend,
}: {
  view: EnvelopeView
  group: HomeGroupId
  folders?: EnvelopeView[]
  onOpen: () => void
  onPay: () => void
  onSpend: () => void
}) {
  const t = useT()
  const money = useMoney()
  const locale = useLocale()
  const app = useAppState()
  const { env, total, pct, light, paid } = view
  const openCycle = [...app.cycles].reverse().find((c) => !c.closedAt)
  const closedHere = Boolean(openCycle && env.fundClosedInCycle === openCycle.id)
  const ownPace = group === 'daily' ? guideForEnvelope(app, view.env.id) : null
  const folderRemaining = folders.reduce((s, c) => s + c.remaining, 0)
  const spentLife =
    env.kind === 'fund'
      ? fundSpentSince(app, env.id) + folders.reduce((s, c) => s + fundSpentSince(app, c.env.id), 0)
      : view.spent
  const remaining = view.remaining + folderRemaining
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
            ? t('home.ownPace', { hoy: money(ownPace?.hoy ?? 0) })
            : env.kind === 'savings'
              ? t('home.savingsUsed', { amount: money(view.used) })
              : env.kind === 'fund'
                ? `${
                    remaining > 0 && spentLife > 0
                      ? t('fund.both', { set: money(remaining), spent: money(spentLife) })
                      : spentLife > 0
                        ? t('fund.spentBit', { amount: money(spentLife) })
                        : t('fund.setAside', { amount: money(remaining) })
                  }${
                    (env.cycleSetAside ?? 0) > 0
                      ? t('fund.eachBit', { amount: money(env.cycleSetAside ?? 0) })
                      : ''
                  }${closedHere ? t('fund.closedBit') : ''}`
                : week
                  ? `${t('home.weekLine', {
                      spent: money(week.spent),
                      target: money(week.target),
                      monthSpent: money(view.spent),
                      total: money(total),
                    })}${week.pace === 'fast' ? t('home.paceFast') : week.pace === 'over' ? t('home.paceOver') : ''}`
                  : kindLabel(env.kind, locale)}
          {env.kind !== 'fund' && !week && total > 0 ? t('home.usedPct', { pct }) : ''}
          {env.opening > 0 ? t('home.brought', { amount: money(env.opening) }) : ''}
        </div>
      </div>
      <div className="right">
        <div className="remain">{money(remaining)}</div>
        <span className={`pill ${env.kind === 'fund' ? (remaining > 0 ? 'green' : light) : light}`}>
          {env.kind === 'fund'
            ? remaining > 0
              ? t('home.pillSet')
              : spentLife > 0
                ? t('home.pillFromSav')
                : t('home.pillEmpty')
            : pillLabel(view, t)}
        </span>
      </div>
      <div className={`bar ${light}`}>
        <span style={{ width: `${barPct}%` }} />
      </div>
      {folders.length > 0 &&
        folders.map((c) => (
          <span key={c.env.id} className="muted" style={{ fontSize: 12, gridColumn: '1 / -1' }}>
            {c.env.emoji} {c.env.name} · {folderLine(t, money, c.remaining, fundSpentSince(app, c.env.id))}
            {openCycle && c.env.fundClosedInCycle === openCycle.id ? t('fund.closedBit') : ''}
          </span>
        ))}
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
