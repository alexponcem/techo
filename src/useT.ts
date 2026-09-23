import { useCallback } from 'react'
import { t, type MsgKey } from './i18n'
import { useAppState } from './store'
import type { Locale } from './types'

export function useLocale(): Locale {
  return useAppState().settings.locale ?? 'es'
}

export function useT() {
  const locale = useLocale()
  return useCallback((key: MsgKey, vars?: Record<string, string | number>) => t(locale, key, vars), [locale])
}
