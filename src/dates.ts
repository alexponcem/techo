import type { PayMode } from './types'

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function lastWeekdayOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 0, 12, 0, 0, 0)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1)
  }
  return d
}

export function formatDay(iso: string): string {
  const d = parseISODate(iso)
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export function formatRange(start: string, end: string): string {
  return `${formatDay(start)} → ${formatDay(end)}`
}

export function daysBetween(a: string, b: string): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function suggestedNextPay(startISO: string, mode: PayMode, fixedDay: number): string {
  const start = parseISODate(startISO)
  const y = start.getFullYear()
  const m = start.getMonth() + 1
  const day = start.getDate()

  if (mode === 'fixed-day') {
    const safeDay = Math.min(Math.max(fixedDay, 1), 28)
    const thisMonth = new Date(y, m - 1, safeDay, 12, 0, 0, 0)
    if (toISODate(thisMonth) > startISO) return toISODate(thisMonth)
    const next = addMonths(y, m, 1)
    return toISODate(new Date(next.year, next.month - 1, safeDay, 12, 0, 0, 0))
  }

  if (day <= 4) {
    const endThis = lastWeekdayOfMonth(y, m)
    if (toISODate(endThis) > startISO) return toISODate(endThis)
  }

  const next = addMonths(y, m, 1)
  return toISODate(lastWeekdayOfMonth(next.year, next.month))
}

/** 5 = viernes: el fin de semana (viernes+sábado) cuenta junto para comida y fútbol. */
export const FOOD_WEEK_START = 5

export function localDayFromStamp(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return toISODate(new Date(iso))
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function weekStartOn(today: string, weekStartsOn = FOOD_WEEK_START): string {
  const d = parseISODate(today)
  const delta = (d.getDay() - weekStartsOn + 7) % 7
  d.setDate(d.getDate() - delta)
  return toISODate(d)
}

export function lastPaydayGuess(): string {
  const now = new Date()
  const thisEnd = lastWeekdayOfMonth(now.getFullYear(), now.getMonth() + 1)
  if (toISODate(thisEnd) <= todayISO()) return toISODate(thisEnd)
  const prev = addMonths(now.getFullYear(), now.getMonth() + 1, -1)
  return toISODate(lastWeekdayOfMonth(prev.year, prev.month))
}
