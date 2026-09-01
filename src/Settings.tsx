import { euros } from './money'
import { exportJson, resetAll, undoLast, useAppState } from './store'

export function SettingsScreen({
  onBack,
  onIncome,
}: {
  onBack: () => void
  onIncome: () => void
}) {
  const state = useAppState()
  const cycle = [...state.cycles].reverse().find((c) => !c.closedAt)

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'techo-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        ← Inicio
      </button>
      <h2 className="serif" style={{ fontSize: 32 }}>
        Ajustes
      </h2>
      <div className="card stack">
        <p>
          <b>Cobro:</b>{' '}
          {state.settings.payMode === 'last-weekday'
            ? 'último día laborable'
            : state.settings.payMode === 'fixed-day'
              ? `día ${state.settings.fixedDay}`
              : 'manual'}
        </p>
        {cycle && (
          <p>
            <b>Este ciclo:</b> {euros(cycle.income)}
          </p>
        )}
        <p className="muted">
          Los datos viven en este navegador, no en la nube. Quitar el icono de
          inicio no suele borrar nada; borrar datos del sitio o desinstalar la
          PWA en Android sí puede. Antes de tocar eso, exporta una copia.
        </p>
      </div>
      <button className="btn secondary full" onClick={onIncome}>
        Registrar ingreso extra
      </button>
      <button className="btn secondary full" onClick={undoLast}>
        Deshacer último movimiento
      </button>
      <button className="btn secondary full" onClick={download}>
        Exportar copia (JSON)
      </button>
      <button
        className="btn danger full"
        onClick={() => {
          if (confirm('Se borra el plan y los movimientos de este dispositivo.')) resetAll()
        }}
      >
        Borrar todo y empezar de cero
      </button>
    </div>
  )
}
