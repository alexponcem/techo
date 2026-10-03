export type EnvelopeKind = 'fixed' | 'cap' | 'fund' | 'savings' | 'buffer'
export type Rhythm = 'daily' | 'weekly' | 'none'
export type PayMode = 'last-weekday' | 'fixed-day' | 'manual'
export type TxType = 'expense' | 'income' | 'transfer' | 'pocket'
export type PocketMove = 'to-cash' | 'to-bank'
export type Light = 'green' | 'yellow' | 'orange' | 'red' | 'idle'

export interface Envelope {
  id: string
  name: string
  kind: EnvelopeKind
  planned: number
  emoji: string
  opening: number
  rhythm: Rhythm
  /** Si true, el dinero de este techo se parte entre los días. No se mezcla con Libre. */
  splitDaily?: boolean
  /** Si se marcó a mitad de ciclo: desde este día, y con este importe, entra al diario. */
  splitJoinedOn?: string
  splitJoinedAmount?: number
  /** Carpeta dentro de un fondo. Ej.: un viaje dentro de Viajes. */
  parentId?: string
  /** Día de inicio de la semana de este techo semanal. 0 = domingo … 6 = sábado. */
  weekStartsOn?: number
  /** Si el fondo se cerró, los ciclos anteriores a este id quedan en el archivo y no se suman. */
  fundEpoch?: string
  /** Si es mayor que 0, esta cifra sale del cobro en cada ciclo y se junta en el fondo. */
  cycleSetAside?: number
}

/** Saldo de un fondo al cerrar el ciclo, para poder recuperarlo. */
export interface FundSnap {
  id: string
  left: number
  spent: number
  /** false = se cerró y lo apartado pasó al destino del sobrante. */
  carried: boolean
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
  /** Efectivo que había al abrir el ciclo. El resto del dinero está en el banco. */
  openingCash?: number
  /** Fondos al cerrar. Los ciclos viejos no lo traen: esos se reconstruyen por los movimientos. */
  fundSnap?: FundSnap[]
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
  /** card = banco. cash = efectivo. Si falta, es tarjeta (movimientos antiguos). */
  pocket?: 'card' | 'cash'
  /** Solo type pocket: mueve entre banco y efectivo, sin tocar sobres. */
  pocketMove?: PocketMove
}

export type Locale = 'es' | 'en'
export const CURRENCIES = ['EUR', 'USD', 'GBP', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'BRL', 'CAD'] as const
export type Currency = (typeof CURRENCIES)[number]

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
  /** Divisa en la que se muestran los importes. */
  currency?: Currency
  /** Última copia descargada. Sirve para recordar que el plan vive en este aparato. */
  lastExportAt?: string
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
  | { name: 'activity' }
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
  | { name: 'cash' }
  | null
