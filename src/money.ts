import { intlTag } from './i18n'
import type { Locale } from './types'

export function euros(cents: number, locale: Locale = 'es'): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function eurosPlain(cents: number, locale: Locale = 'es'): string {
  return new Intl.NumberFormat(intlTag(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function parseEuros(raw: string): number | null {
  const n = raw.trim().replace(/\s/g, '').replace('€', '').replace(',', '.')
  if (!n) return null
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  return Math.round(v * 100)
}

export function clampCents(n: number): number {
  return Math.round(n)
}
