import type { Envelope } from './types'

export const ALEX_INCOME = 139_100
export const ALEX_SAVINGS = 60_000

export function alexPlan(): Envelope[] {
  return [
    { id: 'ahorro', name: 'Ahorro', kind: 'savings', planned: 60_000, emoji: '🌱', opening: 0, rhythm: 'none' },
    { id: 'arriendo', name: 'Arriendo', kind: 'fixed', planned: 43_000, emoji: '🏠', opening: 0, rhythm: 'none' },
    { id: 'transporte', name: 'Transporte', kind: 'fixed', planned: 4_920, emoji: '🚇', opening: 0, rhythm: 'none' },
    { id: 'movil', name: 'Plan móvil', kind: 'fixed', planned: 1_600, emoji: '📱', opening: 0, rhythm: 'none' },
    { id: 'futbol', name: 'Fútbol', kind: 'cap', planned: 2_500, emoji: '⚽', opening: 0, rhythm: 'weekly' },
    { id: 'gym', name: 'GYM', kind: 'fixed', planned: 2_500, emoji: '🏋️', opening: 0, rhythm: 'none' },
    { id: 'comida', name: 'Comida', kind: 'cap', planned: 13_000, emoji: '🍽️', opening: 0, rhythm: 'weekly' },
    { id: 'ocio', name: 'Ocio', kind: 'cap', planned: 10_000, emoji: '🎬', opening: 0, rhythm: 'daily' },
    { id: 'viajes', name: 'Viajes', kind: 'fund', planned: 0, emoji: '✈️', opening: 0, rhythm: 'none' },
    { id: 'ropa', name: 'Ropa', kind: 'fund', planned: 0, emoji: '👕', opening: 0, rhythm: 'none' },
    { id: 'libre', name: 'Libre', kind: 'buffer', planned: 1_580, emoji: '💧', opening: 0, rhythm: 'daily' },
  ]
}

export function blankPlan(): Envelope[] {
  return [
    { id: 'ahorro', name: 'Ahorro', kind: 'savings', planned: 0, emoji: '🌱', opening: 0, rhythm: 'none' },
    { id: 'arriendo', name: 'Arriendo', kind: 'fixed', planned: 0, emoji: '🏠', opening: 0, rhythm: 'none' },
    { id: 'transporte', name: 'Transporte', kind: 'fixed', planned: 0, emoji: '🚇', opening: 0, rhythm: 'none' },
    { id: 'movil', name: 'Plan móvil', kind: 'fixed', planned: 0, emoji: '📱', opening: 0, rhythm: 'none' },
    { id: 'comida', name: 'Comida', kind: 'cap', planned: 0, emoji: '🍽️', opening: 0, rhythm: 'weekly' },
    { id: 'ocio', name: 'Ocio', kind: 'cap', planned: 0, emoji: '🎬', opening: 0, rhythm: 'daily' },
    { id: 'viajes', name: 'Viajes', kind: 'fund', planned: 0, emoji: '✈️', opening: 0, rhythm: 'none' },
    { id: 'ropa', name: 'Ropa', kind: 'fund', planned: 0, emoji: '👕', opening: 0, rhythm: 'none' },
    { id: 'libre', name: 'Libre', kind: 'buffer', planned: 0, emoji: '💧', opening: 0, rhythm: 'daily' },
  ]
}

export const KIND_LABEL: Record<Envelope['kind'], string> = {
  savings: 'Ahorro protegido',
  fixed: 'Cuota',
  cap: 'Techo',
  fund: 'Fondo',
  buffer: 'Residual / libre',
}

export const KIND_HINT: Record<Envelope['kind'], string> = {
  savings: 'Se reserva primero y se acumula ciclo a ciclo. No se reinicia al cobrar.',
  fixed: 'Importe conocido. Márcalo pagado cuando salga.',
  cap: 'Límite del ciclo. Si no lo gastas, sobra.',
  fund: 'No hace falta techo cada mes. Crece con lo que muevas y se guarda.',
  buffer: 'Lo que queda después de ahorro, cuotas y techos. Si no lo gastas, pasa a ahorro o a fondos.',
}
