import { useState } from 'react'
import { updateSettings, useAppState } from './store'
import type { Currency, Locale } from './types'

export function LanguageScreen() {
  const state = useAppState()
  const [locale, setLocale] = useState<Locale>('es')
  const [currency, setCurrency] = useState<Currency>('EUR')

  function go() {
    updateSettings({ ...state.settings, locale, currency })
  }

  return (
    <div className="stack">
      <p className="tiny">Techo</p>
      <h2 className="serif" style={{ fontSize: 40, margin: 0 }}>
        Techo
      </h2>
      <p>
        Tu dinero, con un techo.
        <br />
        <span className="muted">Techo means cap — a ceiling on spending.</span>
      </p>
      <button type="button" className={`choice ${locale === 'es' ? 'on' : ''}`} onClick={() => setLocale('es')}>
        <b>Español</b>
        <span className="muted">Tu dinero, con un techo.</span>
      </button>
      <button type="button" className={`choice ${locale === 'en' ? 'on' : ''}`} onClick={() => setLocale('en')}>
        <b>English</b>
        <span className="muted">Techo means cap — a ceiling on spending.</span>
      </button>
      <button type="button" className={`choice ${currency === 'EUR' ? 'on' : ''}`} onClick={() => setCurrency('EUR')}>
        <b>Euro (€)</b>
        <span className="muted">EUR</span>
      </button>
      <button type="button" className={`choice ${currency === 'USD' ? 'on' : ''}`} onClick={() => setCurrency('USD')}>
        <b>Dólar ($) · US dollar</b>
        <span className="muted">USD</span>
      </button>
      <button type="button" className="btn full sage" onClick={go}>
        {locale === 'en' ? 'Continue' : 'Continuar'}
      </button>
      <p className="muted" style={{ fontSize: 13 }}>
        Luego lo puedes cambiar en Ajustes.
        <br />
        You can change this later in Settings.
      </p>
    </div>
  )
}
