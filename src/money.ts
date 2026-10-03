import { intlTag } from './i18n'
import { CURRENCIES, type Currency, type Locale } from './types'

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value)
}

export function currencyLabel(locale: Locale, code: Currency): string {
  try {
    const name = new Intl.DisplayNames([intlTag(locale)], { type: 'currency' }).of(code)
    return name ? `${name} (${code})` : code
  } catch {
    return code
  }
}

export function euros(cents: number, locale: Locale = 'es', currency: Currency = 'EUR'): string {
  return new Intl.NumberFormat(intlTag(locale), {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function eurosPlain(cents: number, locale: Locale = 'es'): string {
  return new Intl.NumberFormat(intlTag(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function parseEuros(raw: string): number | null {
  const n = raw.trim().replace(/\s/g, '').replace('€', '').replace('$', '').replace(',', '.')
  if (!n) return null
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  return Math.round(v * 100)
}

export function clampCents(n: number): number {
  return Math.round(n)
}
