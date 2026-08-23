import { addDays, daysBetween, formatDay, localDayFromStamp, todayISO, weekStartOn } from './dates'
import type { AppState, Cycle, Envelope, EnvelopeKind, Light, Rhythm, Tx } from './types'

export function rhythmOf(env: Envelope): Rhythm {
  if (env.id === 'comida' || env.id === 'futbol') return 'weekly'
  if (env.rhythm === 'daily' || env.rhythm === 'weekly' || env.rhythm === 'none') return env.rhythm
  if (env.kind === 'cap' || env.kind === 'buffer') return 'daily'
  return 'none'
}

export function ensureRhythm(env: Envelope): Envelope {
  if (env.id === 'futbol') return { ...env, kind: 'cap', rhythm: 'weekly' }
  return { ...env, rhythm: rhythmOf(env) }
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
}

export type UsageAlert = 'half' | 'near' | 'almost' | 'limit' | 'over' | null

export interface EnvelopeView {
  env: Envelope
  spent: number
  remaining: number
  total: number
  pct: number
  light: Light
  paid: boolean
  alert: UsageAlert
  week?: WeekSlice
}

/** Un mes tiene ~4,5 semanas (30–31 días). De ahí el ~29 € de comida: 130 / 4,5. */
export const WEEKS_PER_MONTH = 4.5

export function weeklyTarget(env: Envelope, _cycle?: Cycle): number {
  if (env.planned <= 0) return 0
  return Math.round(env.planned / WEEKS_PER_MONTH)
}

export function weekSlice(env: Envelope, txs: Tx[], cycle: Cycle, today = todayISO()): WeekSlice | undefined {
  if (rhythmOf(env) !== 'weekly') return undefined
  const start = weekStartOn(today)
  const end = addDays(start, 6)
  let spent = 0
  for (const t of txs) {
    if (t.type !== 'expense' || t.envelopeId !== env.id) continue
    const day = localDayFromStamp(t.at)
    if (day >= start && day <= end) spent += t.amount
  }
  const target = weeklyTarget(env, cycle)
  return {
    start,
    end,
    spent,
    target,
    remaining: target - spent,
    label: `${formatDay(start)} → ${formatDay(end)}`,
  }
}

export function envelopeView(env: Envelope, txs: Tx[], cycle: Cycle, today = todayISO()): EnvelopeView {
  const n = netFor(env.id, txs)
  const total = env.opening + env.planned
  const remaining = total + n.in - n.out - n.spent
  const spent = n.spent
  const pct = total <= 0 ? (spent > 0 ? 100 : 0) : Math.round((spent / total) * 100)
  const paid = env.kind === 'fixed' && remaining <= 0 && total > 0
  const week = weekSlice(env, txs, cycle, today)
  const status = usageStatus(ensureRhythm(env), spent, total, remaining, week)
  return {
    env: ensureRhythm(env),
    spent,
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
  return state.envelopes.map((env) => envelopeView(env, txs, cycle, today))
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

  if (week && week.target > 0) {
    const wp = Math.round((week.spent / week.target) * 100)
    const weekly = band(wp)
    if (weekly.alert === 'over') return { light: 'red', alert: 'almost' }
    return weekly
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

export interface CoverPlan {
  overflow: number
  fromLibre: number
  fromSavings: number
  libreId?: string
  savingsId?: string
  possible: boolean
  needsSavingsReason: boolean
}

export function coverPlan(views: EnvelopeView[], envelopeId: string, amount: number): CoverPlan | null {
  const view = views.find((v) => v.env.id === envelopeId)
  if (!view || amount <= 0) return null
  if (view.env.kind === 'savings') return null
  const overflow = amount - Math.max(0, view.remaining)
  if (overflow <= 0) return null

  const libre = views.find((v) => v.env.kind === 'buffer')
  const savings = views.find((v) => v.env.kind === 'savings')
  let rest = overflow
  let fromLibre = 0
  if (view.env.kind !== 'buffer' && libre) {
    fromLibre = Math.min(rest, Math.max(0, libre.remaining))
    rest -= fromLibre
  }
  const fromSavings = rest
  const savingsLeft = Math.max(0, savings?.remaining ?? 0)
  return {
    overflow,
    fromLibre,
    fromSavings,
    libreId: libre?.env.id,
    savingsId: savings?.env.id,
    possible: fromSavings <= savingsLeft,
    needsSavingsReason: fromSavings > 0,
  }
}

export function spendableViews(views: EnvelopeView[]): EnvelopeView[] {
  return views.filter((v) => rhythmOf(v.env) === 'daily')
}

export function spendableRemaining(views: EnvelopeView[]): number {
  return spendableViews(views).reduce((s, v) => s + Math.max(0, v.remaining), 0)
}

export function dailyBudget(views: EnvelopeView[], cycle: Cycle, today = todayISO()): number {
  return paceFor(views, cycle, today).daily
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
  libre: number
  caps: { name: string; remaining: number }[]
}

export function paceFor(views: EnvelopeView[], cycle: Cycle, today = todayISO()): Pace {
  const remaining = spendableRemaining(views)
  const days = Math.max(1, daysBetween(today, cycle.expectedEndAt))
  const daily = Math.floor(remaining / days)
  const weekDays = Math.min(7, days)
  const weekly = Math.min(remaining, daily * weekDays)
  const libre = views.find((v) => v.env.kind === 'buffer')
  const caps = views
    .filter((v) => rhythmOf(v.env) === 'daily' && v.env.kind === 'cap')
    .map((v) => ({ name: v.env.name, remaining: Math.max(0, v.remaining) }))
  return {
    remaining,
    daily,
    weekly,
    days,
    weekDays,
    libre: Math.max(0, libre?.remaining ?? 0),
    caps,
  }
}

export function weeklyViews(views: EnvelopeView[]): EnvelopeView[] {
  return views.filter((v) => rhythmOf(v.env) === 'weekly')
}

export function assigned(envelopes: Envelope[]): number {
  return envelopes.reduce((s, e) => s + e.planned, 0)
}

export function withBalancedBuffer(envelopes: Envelope[], income: number): Envelope[] {
  const others = envelopes.filter((e) => e.kind !== 'buffer')
  const buffer = envelopes.find((e) => e.kind === 'buffer')
  const rest = income - others.reduce((s, e) => s + e.planned, 0)
  if (!buffer) {
    return [
      ...envelopes,
      {
        id: 'libre',
        name: 'Libre',
        kind: 'buffer',
        planned: rest,
        emoji: '💧',
        opening: 0,
        rhythm: 'daily',
      },
    ]
  }
  return envelopes.map((e) => (e.kind === 'buffer' ? { ...e, planned: rest } : e))
}

export function kindOrder(kind: EnvelopeKind): number {
  return { savings: 0, fixed: 1, cap: 2, buffer: 3, fund: 4 }[kind]
}

export interface Verdict {
  status: 'ok' | 'tight' | 'over' | 'empty'
  remainingAfter: number
  message: string
}

export function verdictFor(view: EnvelopeView | undefined, amount: number): Verdict {
  if (!view) {
    return { status: 'empty', remainingAfter: 0, message: 'Elige un sobre.' }
  }
  if (amount <= 0) {
    return { status: 'empty', remainingAfter: view.remaining, message: 'Pon un importe.' }
  }
  const remainingAfter = view.remaining - amount
  if (rhythmOf(view.env) === 'weekly' && view.week) {
    const weekAfter = view.week.spent + amount
    if (remainingAfter < 0) {
      return {
        status: 'over',
        remainingAfter,
        message: `No cabe en el techo del mes de ${view.env.name}. Te pasas por ${fmt(-remainingAfter)}.`,
      }
    }
    if (weekAfter > view.week.target) {
      return {
        status: 'tight',
        remainingAfter,
        message: `Cabe en el mes (${fmt(remainingAfter)}), pero esta semana te pasas del ritmo (~${fmt(view.week.target)}). Llevarías ${fmt(weekAfter)}.`,
      }
    }
    return {
      status: 'ok',
      remainingAfter,
      message: `Compra de la semana: ${fmt(weekAfter)} de ~${fmt(view.week.target)}. En el mes quedarían ${fmt(remainingAfter)}.`,
    }
  }
  if (view.env.kind === 'savings') {
    if (remainingAfter < 0) {
      return {
        status: 'over',
        remainingAfter,
        message: `Esto come el ahorro y lo deja en ${fmt(remainingAfter)}.`,
      }
    }
    return {
      status: 'tight',
      remainingAfter,
      message: `Sale del ahorro protegido. Quedarían ${fmt(remainingAfter)}.`,
    }
  }
  if (remainingAfter < 0) {
    return {
      status: 'over',
      remainingAfter,
      message: `No cabe en ${view.env.name}. Te pasas por ${fmt(-remainingAfter)}.`,
    }
  }
  if (view.env.kind === 'fund') {
    return {
      status: 'ok',
      remainingAfter,
      message: `Sale del fondo ${view.env.name}. Quedarían ${fmt(remainingAfter)}.`,
    }
  }
  if (remainingAfter <= view.total * 0.2 || view.pct >= 80) {
    return {
      status: 'tight',
      remainingAfter,
      message: `Cabe, pero ${view.env.name} queda justo: ${fmt(remainingAfter)}.`,
    }
  }
  return {
    status: 'ok',
    remainingAfter,
    message: `Cabe. En ${view.env.name} quedarían ${fmt(remainingAfter)}.`,
  }
}

function fmt(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function carryKinds(kind: EnvelopeKind): boolean {
  return kind === 'fund' || kind === 'savings'
}
