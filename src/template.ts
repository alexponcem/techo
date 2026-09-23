import type { Envelope } from './types'

export const ALEX_INCOME = 139_100
export const ALEX_SAVINGS = 60_000

export function alexPlan(): Envelope[] {
  return [
    { id: 'ahorro', name: 'Ahorro', kind: 'savings', planned: 60_000, emoji: '🌱', opening: 0, rhythm: 'none' },
    { id: 'arriendo', name: 'Arriendo', kind: 'fixed', planned: 43_000, emoji: '🏠', opening: 0, rhythm: 'none' },
    { id: 'transporte', name: 'Transporte', kind: 'fixed', planned: 4_920, emoji: '🚇', opening: 0, rhythm: 'none' },
    { id: 'movil', name: 'Plan móvil', kind: 'fixed', planned: 1_600, emoji: '📱', opening: 0, rhythm: 'none' },
    { id: 'seguro', name: 'Seguro médico', kind: 'fixed', planned: 945, emoji: '🏥', opening: 0, rhythm: 'none' },
    { id: 'futbol', name: 'Fútbol', kind: 'cap', planned: 2_500, emoji: '⚽', opening: 0, rhythm: 'weekly' },
    { id: 'gym', name: 'GYM', kind: 'fixed', planned: 2_500, emoji: '🏋️', opening: 0, rhythm: 'none' },
    { id: 'comida', name: 'Comida', kind: 'cap', planned: 13_000, emoji: '🍽️', opening: 0, rhythm: 'weekly' },
    { id: 'ocio', name: 'Ocio', kind: 'cap', planned: 10_000, emoji: '🎬', opening: 0, rhythm: 'daily', splitDaily: true },
    { id: 'viajes', name: 'Viajes', kind: 'fund', planned: 0, emoji: '✈️', opening: 0, rhythm: 'none' },
    { id: 'ropa', name: 'Ropa', kind: 'fund', planned: 0, emoji: '👕', opening: 0, rhythm: 'none' },
    { id: 'medicina', name: 'Medicina', kind: 'fund', planned: 0, emoji: '💊', opening: 0, rhythm: 'none' },
    { id: 'libre', name: 'Libre', kind: 'buffer', planned: 635, emoji: '💧', opening: 0, rhythm: 'daily', splitDaily: true },
  ]
}

export function blankPlan(): Envelope[] {
  return [
    { id: 'ahorro', name: 'Ahorro', kind: 'savings', planned: 0, emoji: '🌱', opening: 0, rhythm: 'none' },
    { id: 'arriendo', name: 'Alquiler / arriendo', kind: 'fixed', planned: 0, emoji: '🏠', opening: 0, rhythm: 'none' },
    { id: 'movil', name: 'Móvil / internet', kind: 'fixed', planned: 0, emoji: '📱', opening: 0, rhythm: 'none' },
    { id: 'comida', name: 'Comida / super', kind: 'cap', planned: 0, emoji: '🍽️', opening: 0, rhythm: 'weekly' },
    { id: 'ocio', name: 'Ocio', kind: 'cap', planned: 0, emoji: '🎬', opening: 0, rhythm: 'daily', splitDaily: false },
    { id: 'viajes', name: 'Viajes', kind: 'fund', planned: 0, emoji: '✈️', opening: 0, rhythm: 'none' },
    { id: 'medicina', name: 'Medicina', kind: 'fund', planned: 0, emoji: '💊', opening: 0, rhythm: 'none' },
    { id: 'libre', name: 'Libre', kind: 'buffer', planned: 0, emoji: '💧', opening: 0, rhythm: 'daily', splitDaily: true },
  ]
}

export const KIND_LABEL: Record<Envelope['kind'], string> = {
  savings: 'Ahorro protegido',
  fixed: 'Cuota',
  cap: 'Techo',
  fund: 'Fondo (sale del ahorro)',
  buffer: 'Libre',
}

export const KIND_HINT: Record<Envelope['kind'], string> = {
  savings: 'Se reserva primero y se acumula. No es “lo que sobre”.',
  fixed: 'Importe conocido. Márcalo pagado cuando salga de la cuenta.',
  cap: 'Límite del ciclo. Márcalo “sumar al diario” si quieres que se parta con Libre entre los días.',
  fund: 'Sin techo mensual. No resta del sueldo: si está vacío, el gasto sale del ahorro.',
  buffer: 'Lo que queda del sueldo. Se reparte solo por los días del ciclo.',
}
