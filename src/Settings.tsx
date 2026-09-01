import { useRef, useState } from 'react'
import { euros } from './money'
import { exportJson, importJson, resetAll, undoLast, useAppState } from './store'

export function SettingsScreen({
  onBack,
  onIncome,
}: {
  onBack: () => void
  onIncome: () => void
}) {
  const state = useAppState()
  const cycle = [...state.cycles].reverse().find((c) => !c.closedAt)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'techo-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function onFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const result = importJson(text)
      if (result.ok) setMsg('Copia restaurada. Ya deberías ver tu ciclo en Inicio.')
      else setMsg(result.error)
    }
    reader.onerror = () => setMsg('No pude abrir ese archivo.')
    reader.readAsText(file)
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
          Abre Techo siempre en Safari normal, no en incógnito: ahí no se guarda
          nada. Quitar el icono no suele borrar datos; una ventana privada sí.
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
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json,text/plain"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button
        className="btn sage full"
        onClick={() => {
          if (state.onboarded && !confirm('Esto sustituye lo que hay ahora por la copia.')) return
          fileRef.current?.click()
        }}
      >
        Restaurar copia (JSON)
      </button>
      {msg ? <p className={msg.startsWith('Copia') ? 'hint' : 'deficit'}>{msg}</p> : null}
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
