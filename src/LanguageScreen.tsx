import { updateSettings, useAppState } from './store'

export function LanguageScreen() {
  const state = useAppState()

  function pick(locale: 'es' | 'en') {
    updateSettings({ ...state.settings, locale })
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
      <button type="button" className="choice" onClick={() => pick('es')}>
        <b>Español</b>
        <span className="muted">Tu dinero, con un techo.</span>
      </button>
      <button type="button" className="choice" onClick={() => pick('en')}>
        <b>English</b>
        <span className="muted">Techo means cap — a ceiling on spending.</span>
      </button>
      <p className="muted" style={{ fontSize: 13 }}>
        Luego lo puedes cambiar en Ajustes.
        <br />
        You can change this later in Settings.
      </p>
    </div>
  )
}
