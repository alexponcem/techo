import {
  addDays,
  clampWeekStart,
  daysBetween,
  daysInclusive,
  eachDay,
  formatDay,
  localDayFromStamp,
  todayISO,
  weekStartOn,
} from './dates'
import { t } from './i18n'
import { euros } from './money'
import type { AppState, Cycle, Envelope, EnvelopeKind, Light, Locale, Rhythm, Tx } from './types'

function loc(state: AppState): Locale {
  return state.settings.locale ?? 'es'
}

export function rhythmOf(env: Envelope): Rhythm {
  if (env.id === 'comida' || env.id === 'futbol') return 'weekly'
  if (env.rhythm === 'daily' || env.rhythm === 'weekly' || env.rhythm === 'none') return env.rhythm
  if (env.kind === 'cap' || env.kind === 'buffer') return 'daily'
  return 'none'
}

export function inDailySplit(env: Envelope): boolean {
  if (env.kind === 'buffer') return true
  if (env.kind !== 'cap') return false
  if (env.splitDaily === true) return true
  if (env.splitDaily === false) return false
  return rhythmOf(env) === 'daily'
}

export function ensureRhythm(env: Envelope): Envelope {
  let next: Envelope = env.id === 'futbol' ? { ...env, kind: 'cap', rhythm: 'weekly' } : { ...env, rhythm: rhythmOf(env) }
  if (next.kind === 'buffer') return { ...next, splitDaily: true, rhythm: 'daily' }
  if (next.splitDaily === true || next.splitDaily === false) return next
  return {
    ...next,
    splitDaily: next.kind === 'cap' && next.rhythm === 'daily',
  }
}

/** Cuotas, ahorro y techos se reservan al cobrar. Fondos salen del ahorro. */
export function takesFromPay(env: Envelope): boolean {
  return env.kind === 'savings' || env.kind === 'fixed' || env.kind === 'cap'
}

/** Días de gasto: del cobro al día anterior del siguiente sueldo. */
export function cycleSpendDays(cycle: Cycle): number {
  return Math.max(1, daysBetween(cycle.startedAt, cycle.expectedEndAt))
}

export function lastSpendDay(cycle: Cycle): string {
  const last = addDays(cycle.expectedEndAt, -1)
  return last < cycle.startedAt ? cycle.startedAt : last
}

export function splitPlanned(envelopes: Envelope[]): number {
  return envelopes.filter(inDailySplit).reduce((s, e) => s + Math.max(0, e.planned), 0)
}

/** Si el cobro ya pasó, el diario empieza el día que abres el ciclo. */
export function paceStartedAt(startedAt: string, today = todayISO()): string {
  return startedAt > today ? startedAt : today
}

export function openDailyPace(
  envelopes: Envelope[],
  startedAt: string,
  expectedEndAt: string,
  today = todayISO(),
): { fairDaily: number; paceStartedAt: string } {
  const origin = paceStartedAt(startedAt, today)
  const days = Math.max(1, daysBetween(origin, expectedEndAt))
  return { fairDaily: Math.round(splitPlanned(envelopes) / days), paceStartedAt: origin }
}

/** Ciclos viejos sin techo congelado: se tratan como “me uno hoy” con lo que queda. */
export function withFrozenDailyPace(state: AppState, today = todayISO()): AppState {
  const cycle = activeCycle(state)
  if (!cycle || cycle.fairDaily != null) return state
  const views = viewsFor(state, today)
  const remaining = spendableRemaining(views)
  const origin = paceStartedAt(cycle.startedAt, today)
  const days = Math.max(1, daysBetween(origin, cycle.expectedEndAt))
  return {
    ...state,
    cycles: state.cycles.map((c) =>
      c.id === cycle.id
        ? { ...c, fairDaily: Math.round(remaining / days), paceStartedAt: origin }
        : c,
    ),
  }
}

export function uid(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      // HTTP en la IP local no es contexto seguro en el móvil
    }
  }
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function activeCycle(state: AppState): Cycle | undefined {
  return [...state.cycles].reverse().find((c) => !c.closedAt)
}

export function cycleTxs(state: AppState, cycleId: string): Tx[] {
  return state.txs.filter((t) => t.cycleId === cycleId)
}

export function netFor(envId: string, txs: Tx[]): { spent: number; in: number; out: number } {
  let spent = 0
  let incoming = 0
  let outgoing = 0
  for (const t of txs) {
    if (t.type === 'expense' && t.envelopeId === envId) spent += t.amount
    if (t.type === 'income' && t.envelopeId === envId) incoming += t.amount
    if (t.type === 'transfer' && t.envelopeId === envId) outgoing += t.amount
    if (t.type === 'transfer' && t.toEnvelopeId === envId) incoming += t.amount
  }
  return { spent, in: incoming, out: outgoing }
}

export interface WeekSlice {
  start: string
  end: string
  spent: number
  target: number
  remaining: number
  label: string
  daysInCycle: number
  pace: 'ok' | 'fast' | 'over'
}

export type UsageAlert = 'half' | 'near' | 'almost' | 'limit' | 'over' | null

export interface EnvelopeView {
  env: Envelope
  spent: number
  used: number
  remaining: number
  total: number
  pct: number
  light: Light
  paid: boolean
  alert: UsageAlert
  week?: WeekSlice
}

/** Un mes tiene ~4,5 semanas. Solo para textos de ayuda, no para el consejo vivo. */
export const WEEKS_PER_MONTH = 4.5

export function weeklyTarget(env: Envelope, _cycle?: Cycle): number {
  if (env.planned <= 0) return 0
  return Math.round(env.planned / WEEKS_PER_MONTH)
}

export function saveReview(
  state: AppState,
  envelopeId: string,
  _amount: number,
  day: string,
): { status: 'ok' | 'tight' | 'over'; title: string; body: string } {
  const cycle = activeCycle(state)
  const env = state.envelopes.find((e) => e.id === envelopeId)
  if (!cycle || !env) {
    const locale = loc(state)
    return { status: 'ok', title: t(locale, 'logic.logged'), body: t(locale, 'logic.loggedOk') }
  }
  const locale = loc(state)
  const txs = cycleTxs(state, cycle.id)
  const when = formatDay(day, locale)
  if (rhythmOf(env) === 'weekly') {
    const w = weekSlice(env, txs, cycle, day, remainingOf(env, txs), weekStartOfEnv(env, state), locale)
    if (!w) {
      return {
        status: 'ok',
        title: t(locale, 'logic.logged'),
        body: t(locale, 'logic.loggedIn', { name: env.name, when }),
      }
    }
    const ok = w.spent <= w.target
    return {
      status: ok ? (w.spent >= w.target * 0.85 ? 'tight' : 'ok') : 'over',
      title: ok ? t(locale, 'logic.loggedDay', { when }) : t(locale, 'logic.weekOverTitle'),
      body: t(locale, 'logic.weekBody', {
        label: w.label,
        spent: fmt(w.spent, locale),
        target: fmt(w.target, locale),
        name: env.name,
      }),
    }
  }
  const p = paceFor(state, day)
  const thatDay = spentOnDay(txs, [envelopeId], day)
  const over = p.fairDaily > 0 && thatDay > p.fairDaily
  return {
    status: over ? 'tight' : 'ok',
    title: t(locale, 'logic.loggedDay', { when }),
    body: over
      ? t(locale, 'logic.dayOver', { cap: fmt(p.fairDaily, locale), spent: fmt(thatDay, locale) })
      : t(locale, 'logic.dayOk', {
          name: env.name,
          spent: fmt(thatDay, locale),
          cap: fmt(p.fairDaily, locale),
        }),
  }
}

export function envelopeCash(env: Envelope, txs: Tx[]): number {
  const n = netFor(env.id, txs)
  return env.opening + env.planned + n.in - n.out - n.spent
}

function countsTowardDaily(env: Envelope, day: string, origin: string): boolean {
  if (env.kind === 'buffer') return true
  if (env.splitSettledOn && env.splitSettledThrough && day >= env.splitSettledOn && day <= env.splitSettledThrough) {
    return true
  }
  if (env.splitDaily !== true) return false
  if (env.splitJoinedOn) return day >= env.splitJoinedOn
  return day >= origin
}

function spentDailyBetween(
  txs: Tx[],
  envelopes: Envelope[],
  from: string,
  to: string,
  origin: string,
): number {
  if (!from || !to || from > to) return 0
  const byId = new Map(
    envelopes
      .filter((e) => inDailySplit(e) || e.splitSettledAmount != null)
      .map((e) => [e.id, e]),
  )
  let n = 0
  for (const t of txs) {
    if (t.type !== 'expense') continue
    const env = byId.get(t.envelopeId)
    if (!env) continue
    const day = localDayFromStamp(t.at)
    if (day < from || day > to) continue
    if (!countsTowardDaily(env, day, origin)) continue
    n += t.amount
  }
  return n
}

/** Importe de sobres unidos a mitad de ciclo que cae entre from y to. */
function lateDailyShare(envelopes: Envelope[], from: string, to: string, lastDay: string): number {
  if (!from || !to || from > to) return 0
  let sum = 0
  for (const env of envelopes) {
    if (env.kind === 'buffer' || env.splitDaily !== true) continue
    if (!env.splitJoinedOn || env.splitJoinedAmount == null) continue
    const start = env.splitJoinedOn
    const end = lastDay
    if (start > end) continue
    const total = daysInclusive(start, end)
    if (total <= 0) continue
    const a = from > start ? from : start
    const b = to < end ? to : end
    if (a > b) continue
    sum += Math.round((env.splitJoinedAmount * daysInclusive(a, b)) / total)
  }
  return sum
}

function settledShare(envelopes: Envelope[], from: string, to: string): number {
  if (!from || !to || from > to) return 0
  let sum = 0
  for (const env of envelopes) {
    if (env.splitSettledAmount == null || !env.splitSettledOn || !env.splitSettledThrough) continue
    const start = env.splitSettledOn
    const end = env.splitSettledThrough
    const total = daysInclusive(start, end)
    if (total <= 0) continue
    const a = from > start ? from : start
    const b = to < end ? to : end
    if (a > b) continue
    sum += Math.round((env.splitSettledAmount * daysInclusive(a, b)) / total)
  }
  return sum
}

function settledTotal(envelopes: Envelope[]): number {
  return envelopes.reduce((s, env) => s + (env.splitSettledAmount ?? 0), 0)
}

function lateDailyTotal(envelopes: Envelope[]): number {
  return envelopes.reduce(
    (s, env) =>
      env.kind !== 'buffer' && env.splitDaily === true && env.splitJoinedAmount != null
        ? s + env.splitJoinedAmount
        : s,
    0,
  )
}

/** Al quitar un sobre del diario, se queda solo la parte que el gasto de esos días ya usó. */
export function closeLateSplit(state: AppState, env: Envelope, today: string): Envelope {
  const next: Envelope = { ...env, splitDaily: false }
  delete next.splitJoinedOn
  delete next.splitJoinedAmount
  const cycle = activeCycle(state)
  if (!cycle || !env.splitJoinedOn || env.splitJoinedAmount == null) return next
  const origin = cycle.paceStartedAt ?? cycle.startedAt
  const last = lastSpendDay(cycle)
  const start = env.splitJoinedOn
  const end = today < last ? today : last
  const total = daysInclusive(start, last)
  if (total <= 0 || start > end) return next
  const txs = cycleTxs(state, cycle.id)
  const fair = cycle.fairDaily ?? 0
  let consumed = 0
  for (const day of eachDay(start, end)) {
    const extra = Math.round((env.splitJoinedAmount * 1) / total)
    const others = lateDailyShare(
      state.envelopes.filter((e) => e.id !== env.id),
      day,
      day,
      last,
    )
    const spent = spentDailyBetween(txs, state.envelopes, day, day, origin)
    const over = Math.max(0, spent - fair - others)
    consumed += Math.min(extra, over)
  }
  consumed = Math.min(consumed, env.splitJoinedAmount)
  if (consumed <= 0) {
    delete next.splitSettledOn
    delete next.splitSettledThrough
    delete next.splitSettledAmount
    return next
  }
  next.splitSettledOn = start
  next.splitSettledThrough = end
  next.splitSettledAmount = consumed
  return next
}

export function spentOnDay(txs: Tx[], envelopeIds: string[], day: string): number {
  let n = 0
  for (const t of txs) {
    if (t.type !== 'expense' || !envelopeIds.includes(t.envelopeId)) continue
    if (localDayFromStamp(t.at) === day) n += t.amount
  }
  return n
}

function remainingOf(env: Envelope, txs: Tx[]): number {
  const n = netFor(env.id, txs)
  return env.opening + env.planned + n.in - n.out - n.spent
}

function weekStartOf(state: AppState): number {
  return clampWeekStart(state.settings.weekStartsOn ?? 5)
}

export function weekStartOfEnv(env: Envelope, state: AppState): number {
  if (env.weekStartsOn != null) return clampWeekStart(env.weekStartsOn)
  return weekStartOf(state)
}

export function weekSlice(
  env: Envelope,
  txs: Tx[],
  cycle: Cycle,
  today = todayISO(),
  _remaining = 0,
  weekStartsOn = 5,
  locale: Locale = 'es',
): WeekSlice | undefined {
  if (rhythmOf(env) !== 'weekly') return undefined
  const w = weekWindow(cycle, today, weekStartsOn)
  if (w.daysInWeek <= 0) return undefined
  const cycleDays = cycleSpendDays(cycle)
  const target = Math.round((env.planned * w.daysInWeek) / cycleDays)
  const spent = spentInRange(txs, [env.id], w.sliceStart, w.sliceEnd)
  let pace: 'ok' | 'fast' | 'over' = 'ok'
  if (target > 0 && spent > target * 1.2) pace = 'over'
  else if (target > 0 && spent > target) pace = 'fast'
  return {
    start: w.start,
    end: w.end,
    spent,
    target,
    remaining: target - spent,
    label: `${formatDay(w.start, locale)} → ${formatDay(w.end, locale)}`,
    daysInCycle: w.daysInWeek,
    pace,
  }
}

export function weekWindow(cycle: Cycle, today: string, weekStartsOn: number) {
  const startOn = clampWeekStart(weekStartsOn)
  const start = weekStartOn(today, startOn)
  const end = addDays(start, 6)
  const last = lastSpendDay(cycle)
  const sliceStart = start > cycle.startedAt ? start : cycle.startedAt
  const sliceEnd = end < last ? end : last
  const daysInWeek = sliceStart <= sliceEnd ? daysInclusive(sliceStart, sliceEnd) : 0
  let daysBefore = 0
  let daysAfter = 0
  const days = eachDay(sliceStart, sliceEnd)
  for (const d of days) {
    if (d < today) daysBefore += 1
    else if (d > today) daysAfter += 1
  }
  const todayIn = today >= sliceStart && today <= sliceEnd
  return { start, end, sliceStart, sliceEnd, daysInWeek, daysBefore, daysAfter, todayIn }
}

/** Semana del diario: no cuenta días anteriores a cuando se abrió el ritmo. */
function dailyPaceWindow(cycle: Cycle, today: string, weekStartsOn: number) {
  const w = weekWindow(cycle, today, weekStartsOn)
  const origin = cycle.paceStartedAt && cycle.paceStartedAt > w.sliceStart ? cycle.paceStartedAt : w.sliceStart
  if (origin === w.sliceStart) return w
  const sliceEnd = w.sliceEnd
  if (origin > sliceEnd) {
    return { ...w, sliceStart: origin, daysInWeek: 0, daysBefore: 0, daysAfter: 0, todayIn: false }
  }
  let daysBefore = 0
  let daysAfter = 0
  for (const d of eachDay(origin, sliceEnd)) {
    if (d < today) daysBefore += 1
    else if (d > today) daysAfter += 1
  }
  return {
    ...w,
    sliceStart: origin,
    daysInWeek: daysInclusive(origin, sliceEnd),
    daysBefore,
    daysAfter,
    todayIn: today >= origin && today <= sliceEnd,
  }
}

export function spentInRange(txs: Tx[], envelopeIds: string[], from: string, to: string): number {
  if (!from || !to || from > to) return 0
  let n = 0
  for (const t of txs) {
    if (t.type !== 'expense' || !envelopeIds.includes(t.envelopeId)) continue
    const day = localDayFromStamp(t.at)
    if (day >= from && day <= to) n += t.amount
  }
  return n
}

export function envelopeView(
  env: Envelope,
  txs: Tx[],
  cycle: Cycle,
  today = todayISO(),
  remainingOverride?: number,
  weekStartsOn = 5,
  locale: Locale = 'es',
): EnvelopeView {
  const n = netFor(env.id, txs)
  const total = env.opening + env.planned
  const remaining = remainingOverride ?? total + n.in - n.out - n.spent
  const spent = n.spent
  const used = n.spent + n.out
  const base = env.kind === 'savings' ? env.opening + env.planned + n.in : total
  const pct =
    env.kind === 'savings'
      ? base <= 0
        ? used > 0
          ? 100
          : 0
        : Math.round((used / base) * 100)
      : total <= 0
        ? spent > 0
          ? 100
          : 0
        : Math.round((spent / total) * 100)
  const paid = env.kind === 'fixed' && remaining <= 0 && total > 0
  const week = weekSlice(env, txs, cycle, today, remaining, weekStartsOn, locale)
  const status = usageStatus(ensureRhythm(env), spent, total, remaining, week)
  return {
    env: ensureRhythm(env),
    spent,
    used,
    remaining,
    total,
    pct,
    light: status.light,
    paid,
    alert: status.alert,
    week,
  }
}

export function viewsFor(state: AppState, today = todayISO()): EnvelopeView[] {
  const cycle = activeCycle(state)
  if (!cycle) return []
  const txs = cycleTxs(state, cycle.id)
  const locale = loc(state)
  return state.envelopes.map((env) =>
    envelopeView(env, txs, cycle, today, undefined, weekStartOfEnv(env, state), locale),
  )
}

function usageStatus(
  env: Envelope,
  spent: number,
  total: number,
  remaining: number,
  week?: WeekSlice,
): { light: Light; alert: UsageAlert } {
  if (env.kind === 'fixed' || env.kind === 'savings' || env.kind === 'fund') {
    if (env.kind !== 'fixed' && remaining < 0) return { light: 'red', alert: 'over' }
    if (env.kind === 'fixed') return { light: 'green', alert: null }
    return { light: remaining > 0 ? 'green' : 'idle', alert: null }
  }
  if (remaining < 0 || (total > 0 && spent > total)) {
    return { light: 'red', alert: 'over' }
  }
  if (total <= 0) return { light: remaining < 0 ? 'red' : 'idle', alert: null }

  const pct = Math.round((spent / total) * 100)
  const fromPct = band(pct)
  if (fromPct.alert) return fromPct

  if (week && week.target > 0 && week.pace !== 'ok') {
    if (week.pace === 'over') return { light: 'orange', alert: 'near' }
    return { light: 'yellow', alert: 'half' }
  }
  return { light: 'green', alert: null }
}

function band(pct: number): { light: Light; alert: UsageAlert } {
  if (pct > 100) return { light: 'red', alert: 'over' }
  if (pct >= 100) return { light: 'red', alert: 'limit' }
  if (pct >= 90) return { light: 'red', alert: 'almost' }
  if (pct >= 80) return { light: 'orange', alert: 'near' }
  if (pct >= 50) return { light: 'yellow', alert: 'half' }
  return { light: 'green', alert: null }
}

export interface DailyWeekBudget {
  hoy: number
  weekLeft: number
  fairDaily: number
  referenceDaily: number
  originalMonth: number
  futureDaily: number
  daysAfter: number
  closedToday: boolean
  weekPool: number
  weekAssigned: number
  weekSpent: number
}

export function dailyWeekBudget(state: AppState, today = todayISO()): DailyWeekBudget | null {
  const cycle = activeCycle(state)
  if (!cycle) return null
  const views = viewsFor(state, today)
  const remaining = spendableRemaining(views)
  const origin = cycle.paceStartedAt ?? paceStartedAt(cycle.startedAt, today)
  const paceDays = Math.max(1, daysBetween(origin, cycle.expectedEndAt))
  const fairDaily =
    cycle.fairDaily != null ? cycle.fairDaily : Math.round(splitPlanned(state.envelopes) / paceDays)
  const last = lastSpendDay(cycle)
  const envelopes = state.envelopes
  const originalMonth = fairDaily * paceDays + lateDailyTotal(envelopes) + settledTotal(envelopes)
  const weekStart = clampWeekStart(state.settings.dailyWeekStartsOn ?? 1)
  const w = dailyPaceWindow(cycle, today, weekStart)
  const txs = cycleTxs(state, cycle.id)
  const spentToday = spentDailyBetween(txs, envelopes, today, today, origin)
  const spentBefore = spentDailyBetween(txs, envelopes, w.sliceStart, addDays(today, -1), origin)
  const spentWeek = spentBefore + spentToday
  const settledInWeek = settledShare(envelopes, w.sliceStart, w.sliceEnd)
  const weekAssigned =
    fairDaily * Math.max(0, w.daysInWeek) +
    lateDailyShare(envelopes, w.sliceStart, w.sliceEnd, last) +
    settledInWeek
  const available = remaining + spentWeek + settledInWeek
  const weekPool = Math.min(weekAssigned, Math.max(0, available))
  const leftForRest = Math.max(0, weekPool - spentBefore)
  const daysLeft = w.todayIn
    ? Math.max(1, daysInclusive(today, w.sliceEnd))
    : Math.max(1, w.daysAfter || 1)
  const todayCap = daysLeft > 0 ? Math.round(leftForRest / daysLeft) : 0
  const closedToday = spentToday > todayCap
  const weekLeft = Math.max(0, weekPool - spentWeek)
  let hoy = 0
  let futureDaily = 0
  if (closedToday) {
    hoy = 0
    futureDaily = w.daysAfter > 0 ? Math.round(weekLeft / w.daysAfter) : 0
  } else {
    hoy = Math.max(0, todayCap - spentToday)
    futureDaily = w.daysAfter > 0 ? Math.round(Math.max(0, leftForRest - todayCap) / w.daysAfter) : 0
  }
  const referenceDaily = closedToday ? futureDaily : todayCap
  return {
    hoy,
    weekLeft,
    fairDaily,
    referenceDaily,
    originalMonth,
    futureDaily: Math.max(0, futureDaily),
    daysAfter: w.daysAfter,
    closedToday,
    weekPool,
    weekAssigned,
    weekSpent: spentWeek,
  }
}

export interface CoverPlan {
  overflow: number
  fromLibre: number
  fromSavings: number
  libreId?: string
  savingsId?: string
  possible: boolean
  needsSavingsReason: boolean
  goalFromSavings: boolean
  weekExhausted?: boolean
  dayOver?: boolean
}

export function coverPlan(
  views: EnvelopeView[],
  envelopeId: string,
  amount: number,
  week?: DailyWeekBudget | null,
): CoverPlan | null {
  const view = views.find((v) => v.env.id === envelopeId)
  if (!view || amount <= 0) return null
  if (view.env.kind === 'savings') return null
  const overflow = amount - Math.max(0, view.remaining)
  const weekExtra =
    week && inDailySplit(view.env) ? Math.max(0, amount - week.weekLeft) : 0
  if (overflow <= 0 && weekExtra <= 0) return null

  const libre = views.find((v) => v.env.kind === 'buffer')
  const savings = views.find((v) => v.env.kind === 'savings')
  const savingsLeft = Math.max(0, savings?.remaining ?? 0)

  if (view.env.kind === 'fund') {
    return {
      overflow,
      fromLibre: 0,
      fromSavings: overflow,
      libreId: libre?.env.id,
      savingsId: savings?.env.id,
      possible: overflow <= savingsLeft,
      needsSavingsReason: false,
      goalFromSavings: true,
    }
  }

  let rest = overflow
  let fromLibre = 0
  if (view.env.kind !== 'buffer' && libre) {
    fromLibre = Math.min(rest, Math.max(0, libre.remaining))
    rest -= fromLibre
  }
  const fromSavings = rest + weekExtra
  return {
    overflow: overflow + weekExtra,
    fromLibre,
    fromSavings,
    libreId: libre?.env.id,
    savingsId: savings?.env.id,
    possible: fromSavings <= savingsLeft,
    needsSavingsReason: fromSavings > 0,
    goalFromSavings: false,
    weekExhausted: weekExtra > 0,
    dayOver: Boolean(week && inDailySplit(view.env) && amount > week.hoy && weekExtra <= 0),
  }
}

export function spendableViews(views: EnvelopeView[]): EnvelopeView[] {
  return views.filter((v) => inDailySplit(v.env))
}

export function spendableRemaining(views: EnvelopeView[]): number {
  return spendableViews(views).reduce((s, v) => s + Math.max(0, v.remaining), 0)
}

export function dailyBudget(state: AppState, today = todayISO()): number {
  return paceFor(state, today).daily
}

export function daysLeft(cycle: Cycle, today = todayISO()): number {
  return Math.max(0, daysBetween(today, cycle.expectedEndAt))
}

export interface Pace {
  remaining: number
  daily: number
  weekly: number
  days: number
  weekDays: number
  fairDaily: number
  referenceDaily: number
  originalMonth: number
  futureDaily: number
  weekPool: number
  weekAssigned: number
  weekSpent: number
  libre: number
  caps: { name: string; remaining: number }[]
}

export function paceFor(state: AppState, today = todayISO()): Pace {
  const cycle = activeCycle(state)
  const views = viewsFor(state, today)
  const remaining = spendableRemaining(views)
  const libre = views.find((v) => v.env.kind === 'buffer')
  const caps = views
    .filter((v) => rhythmOf(v.env) === 'daily' && v.env.kind === 'cap')
    .map((v) => ({ name: v.env.name, remaining: Math.max(0, v.remaining) }))
  const empty = {
    remaining,
    daily: 0,
    weekly: 0,
    days: 1,
    weekDays: 1,
    fairDaily: 0,
    referenceDaily: 0,
    originalMonth: 0,
    futureDaily: 0,
    weekPool: 0,
    weekAssigned: 0,
    weekSpent: 0,
    libre: Math.max(0, libre?.remaining ?? 0),
    caps,
  }
  if (!cycle) return empty
  const w = dailyWeekBudget(state, today)
  if (!w) return empty
  const daysFromToday = w.closedToday ? Math.max(1, w.daysAfter) : Math.max(1, w.daysAfter + 1)
  return {
    remaining,
    daily: w.hoy,
    weekly: w.weekLeft,
    days: daysFromToday,
    weekDays: daysFromToday,
    fairDaily: w.fairDaily,
    referenceDaily: w.referenceDaily,
    originalMonth: w.originalMonth,
    futureDaily: w.futureDaily,
    weekPool: w.weekPool,
    weekAssigned: w.weekAssigned,
    weekSpent: w.weekSpent,
    libre: Math.max(0, libre?.remaining ?? 0),
    caps,
  }
}

export function weeklyViews(views: EnvelopeView[]): EnvelopeView[] {
  return views.filter((v) => rhythmOf(v.env) === 'weekly')
}

export function accountSnapshot(views: EnvelopeView[]): {
  inAccount: number
  unpaid: EnvelopeView[]
  unpaidTotal: number
  afterFixed: number
  floor: number
} {
  const inAccount = views.reduce((s, v) => s + v.remaining, 0)
  const unpaid = views.filter((v) => v.env.kind === 'fixed' && !v.paid && v.remaining > 0)
  const unpaidTotal = unpaid.reduce((s, v) => s + v.remaining, 0)
  const floor = views
    .filter((v) => v.env.kind === 'savings' || v.env.kind === 'fund')
    .reduce((s, v) => s + Math.max(0, v.remaining), 0)
  return {
    inAccount,
    unpaid,
    unpaidTotal,
    afterFixed: inAccount - unpaidTotal,
    floor,
  }
}

export type MonthVerdict = 'good' | 'ok' | 'tight' | 'hard'

export interface SpendRow {
  id: string
  name: string
  emoji: string
  spent: number
  cap: number
  remaining: number
}

export interface CycleReport {
  cycle: Cycle
  income: number
  spent: number
  kept: number
  spendPct: number
  keepPct: number
  savingsGoal: number
  savingsUsed: number
  savingsStart: number
  savingsNow: number
  savedNet: number
  goalPct: number
  verdict: MonthVerdict
  title: string
  detail: string
  variable: SpendRow[]
  variableSpent: number
  variableCap: number
  savingsParts: { id: string; name: string; emoji: string; amount: number }[]
  contributions: { id: string; name: string; emoji: string; amount: number }[]
  fixedSpent: number
}

function envMeta(state: AppState, id: string): Envelope | undefined {
  return state.envelopes.find((e) => e.id === id) ?? state.template.find((e) => e.id === id)
}

export function reportFor(state: AppState, cycle: Cycle): CycleReport {
  const locale = loc(state)
  const txs = cycleTxs(state, cycle.id)
  const spent = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const live = !cycle.closedAt
  const views = live ? viewsFor(state) : []
  const savings = views.find((v) => v.env.kind === 'savings')
  const leftoverRowsLive = views
    .filter((v) => v.env.kind === 'cap' || v.env.kind === 'buffer')
    .map((v) => ({
      id: v.env.id,
      name: v.env.name,
      emoji: v.env.emoji,
      amount: Math.max(0, v.remaining),
    }))
  const leftover = leftoverRowsLive.reduce((s, r) => s + r.amount, 0)

  const savingsGoal = live ? (savings?.env.planned ?? 0) : (cycle.savingsGoal ?? 0)
  const savingsId =
    savings?.env.id ??
    state.envelopes.find((e) => e.kind === 'savings')?.id ??
    state.template.find((e) => e.kind === 'savings')?.id ??
    'ahorro'

  const variable: SpendRow[] = live
    ? views
        .filter((v) => v.env.kind === 'cap' || v.env.kind === 'buffer')
        .map((v) => ({
          id: v.env.id,
          name: v.env.name,
          emoji: v.env.emoji,
          spent: v.spent,
          cap: v.total,
          remaining: Math.max(0, v.remaining),
        }))
    : state.template.filter((e) => e.kind === 'cap' || e.kind === 'buffer').map((e) => {
        const s = txs
          .filter((t) => t.type === 'expense' && t.envelopeId === e.id)
          .reduce((n, t) => n + t.amount, 0)
        return {
          id: e.id,
          name: e.name,
          emoji: e.emoji,
          spent: s,
          cap: e.planned,
          remaining: Math.max(0, e.planned - s),
        }
      })

  const partsMap = new Map<string, number>()
  for (const t of txs) {
    if (t.type === 'transfer' && t.envelopeId === savingsId && t.toEnvelopeId) {
      partsMap.set(t.toEnvelopeId, (partsMap.get(t.toEnvelopeId) ?? 0) + t.amount)
    }
    if (t.type === 'expense' && t.envelopeId === savingsId) {
      partsMap.set('otros', (partsMap.get('otros') ?? 0) + t.amount)
    }
  }
  const savingsParts = [...partsMap.entries()]
    .map(([id, amount]) => {
      if (id === 'otros') return { id, name: t(locale, 'logic.other'), emoji: '🌱', amount }
      const meta = envMeta(state, id)
      return {
        id,
        name: meta?.name ?? id,
        emoji: meta?.emoji ?? '✦',
        amount,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const savingsUsed = live
    ? (savings?.used ?? 0)
    : (cycle.savingsUsed ?? savingsParts.reduce((s, p) => s + p.amount, 0))
  const savingsNow = savings?.remaining ?? 0
  const savingsStart = savings ? savings.env.opening : 0
  const savedNet = live
    ? savingsNow - savingsStart + leftover
    : (cycle.savedNet ?? Math.max(0, cycle.income - spent))
  const spentFinal = live ? spent : (cycle.spent ?? spent)
  const income = cycle.income
  const kept = Math.max(0, income - spentFinal)
  const spendPct = income > 0 ? Math.round((spentFinal / income) * 100) : 0
  const keepPct = income > 0 ? Math.round((kept / income) * 100) : 0
  const goalPct = savingsGoal > 0 ? Math.round((savedNet / savingsGoal) * 100) : keepPct
  const pileDown = live && savingsNow + leftover < savingsStart
  const variableSpent = variable.reduce((s, r) => s + r.spent, 0)
  const variableCap = variable.reduce((s, r) => s + r.cap, 0)
  const leftoverParts = (live ? leftoverRowsLive : variable.map((v) => ({
    id: v.id,
    name: v.name,
    emoji: v.emoji,
    amount: v.remaining,
  }))).filter((r) => r.amount > 0)
  const contributions = [
    ...(savingsGoal > 0
      ? [{ id: 'ahorro-meta', name: t(locale, 'logic.savSet'), emoji: '🌱', amount: savingsGoal }]
      : []),
    ...leftoverParts.map((r) => ({
      id: r.id,
      name: t(locale, 'logic.leftoverOf', { name: r.name }),
      emoji: r.emoji,
      amount: r.amount,
    })),
  ]
  const fixedSpent = txs
    .filter((t) => {
      if (t.type !== 'expense') return false
      const k = envMeta(state, t.envelopeId)?.kind
      return k === 'fixed'
    })
    .reduce((s, t) => s + t.amount, 0)

  let verdict: MonthVerdict = 'ok'
  let title = t(locale, 'logic.monthOk')
  let detail = t(locale, 'logic.monthOkDetail', { pct: goalPct })
  if (pileDown || goalPct < 40) {
    verdict = 'hard'
    title = t(locale, 'logic.monthHard')
    detail = pileDown ? t(locale, 'logic.monthHardDown') : t(locale, 'logic.monthHardLow')
  } else if (goalPct >= 100 && savingsUsed === 0) {
    verdict = 'good'
    title = t(locale, 'logic.monthGood')
    detail = t(locale, 'logic.monthGoodClean')
  } else if (goalPct >= 100) {
    verdict = 'good'
    title = t(locale, 'logic.monthGood')
    detail = t(locale, 'logic.monthGoodUsed')
  } else if (goalPct >= 70) {
    verdict = 'ok'
    title = t(locale, 'logic.monthOk')
    detail = t(locale, 'logic.monthOkDetail', { pct: goalPct })
  } else {
    verdict = 'tight'
    title = t(locale, 'logic.monthTight')
    detail = t(locale, 'logic.monthTightDetail')
  }

  return {
    cycle,
    income,
    spent: spentFinal,
    kept,
    spendPct,
    keepPct,
    savingsGoal,
    savingsUsed,
    savingsStart,
    savingsNow,
    savedNet,
    goalPct,
    verdict,
    title,
    detail,
    variable,
    variableSpent,
    variableCap,
    savingsParts,
    contributions,
    fixedSpent,
  }
}

export function assigned(envelopes: Envelope[]): number {
  return envelopes.reduce((s, e) => s + e.planned, 0)
}

export function withBalancedBuffer(envelopes: Envelope[], income: number, locale: Locale = 'es'): Envelope[] {
  const charged = envelopes.filter((e) => e.kind !== 'buffer' && takesFromPay(e)).reduce((s, e) => s + e.planned, 0)
  const rest = income - charged
  const buffer = envelopes.find((e) => e.kind === 'buffer')
  if (!buffer) {
    return [
      ...envelopes,
      {
        id: 'libre',
        name: t(locale, 'names.free'),
        kind: 'buffer',
        planned: rest,
        emoji: '💧',
        opening: 0,
        rhythm: 'daily',
        splitDaily: true,
      },
    ]
  }
  return envelopes.map((e) =>
    e.kind === 'buffer' ? { ...e, planned: rest, rhythm: 'daily', splitDaily: true } : e,
  )
}

export function kindOrder(kind: EnvelopeKind): number {
  return { savings: 0, fixed: 1, cap: 2, buffer: 3, fund: 4 }[kind]
}

export type HomeGroupId = 'daily' | 'cap' | 'fixed' | 'fund' | 'savings'

export function homeGroups(locale: Locale): { id: HomeGroupId; title: string; hint: string }[] {
  return [
    { id: 'daily', title: t(locale, 'group.daily'), hint: t(locale, 'group.dailyHint') },
    { id: 'cap', title: t(locale, 'group.cap'), hint: t(locale, 'group.capHint') },
    { id: 'fixed', title: t(locale, 'group.fixed'), hint: t(locale, 'group.fixedHint') },
    { id: 'fund', title: t(locale, 'group.fund'), hint: t(locale, 'group.fundHint') },
    { id: 'savings', title: t(locale, 'group.savings'), hint: t(locale, 'group.savingsHint') },
  ]
}

export function homeGroupOf(env: Envelope): HomeGroupId {
  if (inDailySplit(env)) return 'daily'
  if (env.kind === 'fixed') return 'fixed'
  if (env.kind === 'fund') return 'fund'
  if (env.kind === 'savings') return 'savings'
  return 'cap'
}

export interface Verdict {
  status: 'ok' | 'tight' | 'over' | 'empty'
  remainingAfter: number
  message: string
}

export function verdictFor(view: EnvelopeView | undefined, amount: number, locale: Locale = 'es'): Verdict {
  if (!view) {
    return { status: 'empty', remainingAfter: 0, message: t(locale, 'logic.pickEnv') }
  }
  if (amount <= 0) {
    return { status: 'empty', remainingAfter: view.remaining, message: t(locale, 'logic.needAmt') }
  }
  const remainingAfter = view.remaining - amount
  if (rhythmOf(view.env) === 'weekly' && view.week) {
    const weekAfter = view.week.spent + amount
    if (remainingAfter < 0) {
      return {
        status: 'over',
        remainingAfter,
        message: t(locale, 'logic.weekMonthOver', { name: view.env.name, over: fmt(-remainingAfter, locale) }),
      }
    }
    if (weekAfter > view.week.target) {
      return {
        status: 'tight',
        remainingAfter,
        message: t(locale, 'logic.weekTight', {
          left: fmt(remainingAfter, locale),
          target: fmt(view.week.target, locale),
          after: fmt(weekAfter, locale),
        }),
      }
    }
    return {
      status: 'ok',
      remainingAfter,
      message: t(locale, 'logic.weekOk', {
        target: fmt(view.week.target, locale),
        after: fmt(weekAfter, locale),
        left: fmt(remainingAfter, locale),
      }),
    }
  }
  if (view.env.kind === 'savings') {
    if (remainingAfter < 0) {
      return {
        status: 'over',
        remainingAfter,
        message: t(locale, 'logic.savOver', { left: fmt(remainingAfter, locale) }),
      }
    }
    return {
      status: 'tight',
      remainingAfter,
      message: t(locale, 'logic.savTight', { left: fmt(remainingAfter, locale) }),
    }
  }
  if (remainingAfter < 0) {
    return {
      status: 'over',
      remainingAfter,
      message: t(locale, 'logic.noFit', { name: view.env.name, over: fmt(-remainingAfter, locale) }),
    }
  }
  if (view.env.kind === 'fund') {
    if (remainingAfter >= 0) {
      return {
        status: 'ok',
        remainingAfter,
        message: t(locale, 'logic.goalOk', { name: view.env.name, left: fmt(remainingAfter, locale) }),
      }
    }
    return {
      status: 'tight',
      remainingAfter,
      message: t(locale, 'logic.goalEmpty', { name: view.env.name }),
    }
  }
  if (remainingAfter <= view.total * 0.2 || view.pct >= 80) {
    return {
      status: 'tight',
      remainingAfter,
      message: t(locale, 'logic.tightFit', { name: view.env.name, left: fmt(remainingAfter, locale) }),
    }
  }
  return {
    status: 'ok',
    remainingAfter,
    message: t(locale, 'logic.fits', { name: view.env.name, left: fmt(remainingAfter, locale) }),
  }
}

function fmt(cents: number, locale: Locale = 'es'): string {
  return euros(cents, locale)
}

export function carryKinds(kind: EnvelopeKind): boolean {
  return kind === 'fund' || kind === 'savings'
}
