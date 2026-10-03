import { useEffect, useState } from 'react'
import { t } from './i18n'
import { updateSettings, useAppState } from './store'
import type { Currency, Locale } from './types'

export function LanguageScreen() {
  const state = useAppState()
  const [locale, setLocale] = useState<Locale>('es')
  const [currency, setCurrency] = useState<Currency>('EUR')

  useEffect(() => {
    document.documentElement.lang = locale
    document.querySelector('meta[name="description"]')?.setAttribute('content', t(locale, 'app.desc'))
  }, [locale])

  function go() {
    updateSettings({ ...state.settings, locale, currency })
  }

  return (
    <div className="stack">
      <p className="tiny">Techo</p>
      <h2 className="serif" style={{ fontSize: 40, margin: 0 }}>
        Techo
      </h2>
      <p>{locale === 'en' ? t('en', 'lang.enSub') : t('es', 'lang.esSub')}</p>
      <button type="button" className={`choice ${locale === 'es' ? 'on' : ''}`} onClick={() => setLocale('es')}>
        <b>{t('es', 'lang.es')}</b>
        <span className="muted">{t('es', 'lang.esSub')}</span>
      </button>
      <button type="button" className={`choice ${locale === 'en' ? 'on' : ''}`} onClick={() => setLocale('en')}>
        <b>{t('en', 'lang.en')}</b>
        <span className="muted">{t('en', 'lang.enSub')}</span>
      </button>
      <button type="button" className={`choice ${currency === 'EUR' ? 'on' : ''}`} onClick={() => setCurrency('EUR')}>
        <b>{t(locale, 'currency.eur')}</b>
        <span className="muted">EUR</span>
      </button>
      <button type="button" className={`choice ${currency === 'USD' ? 'on' : ''}`} onClick={() => setCurrency('USD')}>
        <b>{t(locale, 'currency.usd')}</b>
        <span className="muted">USD</span>
      </button>
      <button type="button" className="btn full sage" onClick={go}>
        {t(locale, 'sheet.continue')}
      </button>
      <p className="muted" style={{ fontSize: 13 }}>
        {t(locale, 'lang.hint')}
      </p>
    </div>
  )
}
