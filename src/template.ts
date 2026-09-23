import { t, type MsgKey } from './i18n'
import type { Envelope, Locale } from './types'

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

export function blankPlan(locale: Locale = 'es'): Envelope[] {
  return [
    { id: 'ahorro', name: t(locale, 'names.savings'), kind: 'savings', planned: 0, emoji: '🌱', opening: 0, rhythm: 'none' },
    { id: 'arriendo', name: t(locale, 'names.rent'), kind: 'fixed', planned: 0, emoji: '🏠', opening: 0, rhythm: 'none' },
    { id: 'movil', name: t(locale, 'names.phone'), kind: 'fixed', planned: 0, emoji: '📱', opening: 0, rhythm: 'none' },
    { id: 'comida', name: t(locale, 'names.food'), kind: 'cap', planned: 0, emoji: '🍽️', opening: 0, rhythm: 'weekly' },
    { id: 'ocio', name: t(locale, 'names.leisure'), kind: 'cap', planned: 0, emoji: '🎬', opening: 0, rhythm: 'daily', splitDaily: false },
    { id: 'viajes', name: t(locale, 'names.travel'), kind: 'fund', planned: 0, emoji: '✈️', opening: 0, rhythm: 'none' },
    { id: 'medicina', name: t(locale, 'names.medicine'), kind: 'fund', planned: 0, emoji: '💊', opening: 0, rhythm: 'none' },
    { id: 'libre', name: t(locale, 'names.free'), kind: 'buffer', planned: 0, emoji: '💧', opening: 0, rhythm: 'daily', splitDaily: true },
  ]
}

export const EMOJI_PICK = [
  '✦',
  '🏠',
  '📱',
  '🍽️',
  '🎬',
  '⚽',
  '🏋️',
  '☕',
  '🚌',
  '✈️',
  '👕',
  '💊',
  '🎮',
  '🎁',
  '💧',
]

export function kindLabel(kind: Envelope['kind'], locale: Locale = 'es'): string {
  return t(locale, `kind.${kind}` as MsgKey)
}

export function kindHint(kind: Envelope['kind'], locale: Locale = 'es'): string {
  return t(locale, `kindHint.${kind}` as MsgKey)
}

/** @deprecated use kindLabel */
export const KIND_LABEL: Record<Envelope['kind'], string> = {
  savings: 'Ahorro protegido',
  fixed: 'Cuota',
  cap: 'Techo',
  fund: 'Fondo (sale del ahorro)',
  buffer: 'Libre',
}
