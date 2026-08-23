import { useState } from 'react'
import { CycleScreen } from './Cycle'
import { EnvelopeScreen } from './Envelope'
import { Home } from './Home'
import { SettingsScreen } from './Settings'
import { Setup } from './Setup'
import { AddSheet, IncomeSheet, MoveSheet } from './Sheets'
import { useAppState } from './store'
import type { Screen, Sheet } from './types'

export default function App() {
  const state = useAppState()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [sheet, setSheet] = useState<Sheet>(null)

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
          onOpen={setSheet}
          onEnvelope={(id) => setScreen({ name: 'envelope', id })}
          onSettings={() => setScreen({ name: 'settings' })}
          onCycle={() => setScreen({ name: 'cycle' })}
        />
      )}
      {screen.name === 'envelope' && (
        <EnvelopeScreen
          id={screen.id}
          onBack={() => setScreen({ name: 'home' })}
          onAdd={() => setSheet({ name: 'add', envelopeId: screen.id })}
        />
      )}
      {screen.name === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen({ name: 'home' })}
          onIncome={() => setSheet({ name: 'income' })}
        />
      )}
      {screen.name === 'cycle' && <CycleScreen onBack={() => setScreen({ name: 'home' })} />}

      {sheet?.name === 'add' && (
        <AddSheet presetId={sheet.envelopeId} onClose={() => setSheet(null)} />
      )}
      {sheet?.name === 'move' && <MoveSheet onClose={() => setSheet(null)} />}
      {sheet?.name === 'income' && <IncomeSheet onClose={() => setSheet(null)} />}
    </div>
  )
}
