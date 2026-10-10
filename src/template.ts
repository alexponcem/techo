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
    { id: 'libre', name: t(locale, 'names.free'), kind: 'buffer', planned: 0, emoji: '💧', opening: 0, rhythm: 'daily', splitDaily: true },
  ]
}

export type GuidedAmount = { name: string; amount: number }

function namedRows(
  items: GuidedAmount[] | undefined,
  kind: Envelope['kind'],
  idBase: string,
  emoji: string,
  rhythm: Envelope['rhythm'],
  splitDaily?: boolean,
): Envelope[] {
  const out: Envelope[] = []
  for (const item of items ?? []) {
    const name = item.name.trim()
    if (!name || item.amount <= 0) continue
    const n = out.length + 1
    out.push({
      id: n === 1 ? idBase : `${idBase}-${n}`,
      name,
      kind,
      planned: item.amount,
      emoji,
      opening: 0,
      rhythm,
      ...(splitDaily === undefined ? {} : { splitDaily }),
    })
  }
  return out
}

/** Ahorro, las cuotas y los techos que la persona nombró, y Libre. */
export function guidedPlan(
  locale: Locale,
  input: { savings: number; bills?: GuidedAmount[]; caps?: GuidedAmount[] },
): Envelope[] {
  const base = blankPlan(locale)
  const rows: Envelope[] = base
    .filter((e) => e.kind === 'savings')
    .map((e) => ({ ...e, planned: Math.max(0, input.savings) }))
  rows.push(...namedRows(input.bills, 'fixed', 'cuota', '🏠', 'none'))
  rows.push(...namedRows(input.caps, 'cap', 'techo', '✦', 'daily', false))
  const libre = base.find((e) => e.kind === 'buffer')
  return libre ? [...rows, libre] : rows
}

export type ExampleId = 'arriendo' | 'movil' | 'comida' | 'ocio' | 'viajes'

export function exampleEnvelope(locale: Locale, id: ExampleId): Envelope {
  if (id === 'arriendo') {
    return { id, name: t(locale, 'names.rent'), kind: 'fixed', planned: 0, emoji: '🏠', opening: 0, rhythm: 'none' }
  }
  if (id === 'movil') {
    return { id, name: t(locale, 'names.phone'), kind: 'fixed', planned: 0, emoji: '📱', opening: 0, rhythm: 'none' }
  }
  if (id === 'comida') {
    return { id, name: t(locale, 'names.food'), kind: 'cap', planned: 0, emoji: '🍽️', opening: 0, rhythm: 'weekly' }
  }
  if (id === 'ocio') {
    return { id, name: t(locale, 'names.leisure'), kind: 'cap', planned: 0, emoji: '🎬', opening: 0, rhythm: 'daily', splitDaily: false }
  }
  return { id, name: t(locale, 'names.travel'), kind: 'fund', planned: 0, emoji: '✈️', opening: 0, rhythm: 'none' }
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
