import { useCallback } from 'react'
import { t, type MsgKey } from './i18n'
import { euros } from './money'
import { useAppState } from './store'
import type { Currency, Locale } from './types'

export function useLocale(): Locale {
  return useAppState().settings.locale ?? 'es'
}

export function useT() {
  const locale = useLocale()
  return useCallback((key: MsgKey, vars?: Record<string, string | number>) => t(locale, key, vars), [locale])
}

export function useCurrency(): Currency {
  return useAppState().settings.currency ?? 'EUR'
}

export function useMoney() {
  const locale = useLocale()
  const currency = useCurrency()
  return useCallback((cents: number) => euros(cents, locale, currency), [locale, currency])
}
