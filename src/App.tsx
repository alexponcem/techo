import { useRef, useState } from 'react'
import { CycleScreen } from './Cycle'
import { EnvelopeScreen } from './Envelope'
import { Home } from './Home'
import { SettingsScreen } from './Settings'
import { Setup } from './Setup'
import { AddSheet, IncomeSheet, MoveSheet } from './Sheets'
import { useAppState } from './store'
import type { Screen, Sheet } from './types'

function restoreScroll(y: number, envelopeId?: string) {
  const apply = () => {
    if (envelopeId) {
      const el = document.getElementById(`sobre-${envelopeId}`)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
        return
      }
    }
    window.scrollTo(0, y)
  }
  requestAnimationFrame(() => {
    apply()
    requestAnimationFrame(apply)
  })
  window.setTimeout(apply, 80)
}

export default function App() {
  const state = useAppState()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [sheet, setSheet] = useState<Sheet>(null)
  const scrollY = useRef(0)

  function openSheet(next: NonNullable<Sheet>) {
    scrollY.current = window.scrollY
    setSheet(next)
  }

  function closeSheet(saved?: boolean, envelopeId?: string) {
    const y = scrollY.current
    const envId = envelopeId ?? (sheet?.name === 'add' ? sheet.envelopeId : undefined)
    setSheet(null)
    restoreScroll(y, saved && screen.name === 'home' ? envId : undefined)
  }

  if (!state.onboarded) {
    return (
      <div className="app">
        <Setup />
      </div>
    )
  }

  return (
    <div className="app">
      {screen.name === 'home' && (
        <Home
          onOpen={openSheet}
          onEnvelope={(id) => setScreen({ name: 'envelope', id })}
          onSettings={() => setScreen({ name: 'settings' })}
          onCycle={() => setScreen({ name: 'cycle' })}
        />
      )}
      {screen.name === 'envelope' && (
        <EnvelopeScreen
          id={screen.id}
          onBack={() => setScreen({ name: 'home' })}
          onAdd={() => openSheet({ name: 'add', envelopeId: screen.id })}
        />
      )}
      {screen.name === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen({ name: 'home' })}
          onIncome={() => openSheet({ name: 'income' })}
        />
      )}
      {screen.name === 'cycle' && <CycleScreen onBack={() => setScreen({ name: 'home' })} />}

      {sheet?.name === 'add' && (
        <AddSheet
          presetId={sheet.envelopeId}
          onClose={(saved, envelopeId) => closeSheet(saved, envelopeId)}
        />
      )}
      {sheet?.name === 'move' && <MoveSheet onClose={() => closeSheet()} />}
      {sheet?.name === 'income' && <IncomeSheet onClose={() => closeSheet()} />}
    </div>
  )
}
