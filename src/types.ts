export type EnvelopeKind = 'fixed' | 'cap' | 'fund' | 'savings' | 'buffer'
export type Rhythm = 'daily' | 'weekly' | 'none'
export type PayMode = 'last-weekday' | 'fixed-day' | 'manual'
export type TxType = 'expense' | 'income' | 'transfer'
export type Light = 'green' | 'yellow' | 'orange' | 'red' | 'idle'

export interface Envelope {
  id: string
  name: string
  kind: EnvelopeKind
  planned: number
  emoji: string
  opening: number
  rhythm: Rhythm
}

export interface Cycle {
  id: string
  startedAt: string
  expectedEndAt: string
  income: number
  closedAt?: string
  spent?: number
  savedNet?: number
  savingsUsed?: number
  savingsGoal?: number
}

export interface Tx {
  id: string
  cycleId: string
  type: TxType
  envelopeId: string
  toEnvelopeId?: string
  amount: number
  note: string
  at: string
}

export interface Settings {
  payMode: PayMode
  fixedDay: number
}

export interface AppState {
  version: 1
  onboarded: boolean
  settings: Settings
  template: Envelope[]
  envelopes: Envelope[]
  cycles: Cycle[]
  txs: Tx[]
}

export type Screen =
  | { name: 'setup' }
  | { name: 'home' }
  | { name: 'stats' }
  | { name: 'envelope'; id: string }
  | { name: 'settings' }
  | { name: 'cycle' }

export type Sheet =
  | { name: 'add'; envelopeId?: string }
  | { name: 'edit'; txId: string }
  | { name: 'move' }
  | { name: 'income' }
  | null
