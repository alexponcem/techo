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
  /** Si true, este techo se suma a Libre y se reparte en el “hoy”. Libre siempre cuenta. */
  splitDaily?: boolean
  /** Día de inicio de la semana de este techo semanal. 0 = domingo … 6 = sábado. */
  weekStartsOn?: number
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
  /** Día desde el que se parte el diario (hoy si te unes a mitad de ciclo). */
  paceStartedAt?: string
  /** Techo diario original, congelado al abrir: (Libre + techos marcados) / días que quedaban. */
  fairDaily?: number
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

export type Locale = 'es' | 'en'

export interface Settings {
  payMode: PayMode
  fixedDay: number
  /** Día por defecto de los techos semanales, si el sobre no trae el suyo. 0 = domingo … 6 = sábado. */
  weekStartsOn: number
  /** Semana del gasto diario (Libre y techos marcados). Por defecto 1 = lunes. */
  dailyWeekStartsOn: number
  seenHomeTour?: boolean
  /** Idioma de la interfaz. Los nombres de sobres que crea la persona no se traducen. */
  locale?: Locale
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
  | { name: 'new-envelope' }
  | null
