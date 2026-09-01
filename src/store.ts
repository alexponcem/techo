import { useSyncExternalStore } from 'react'
import { suggestedNextPay, todayISO } from './dates'
import {
  activeCycle,
  assigned,
  carryKinds,
  ensureRhythm,
  reportFor,
  uid,
  withBalancedBuffer,
} from './logic'
import { alexPlan } from './template'
import type { AppState, Envelope, Settings, Tx } from './types'

const SEGURO: Envelope = {
  id: 'seguro',
  name: 'Seguro médico',
  kind: 'fixed',
  planned: 945,
  emoji: '🏥',
  opening: 0,
  rhythm: 'none',
}

const MEDICINA: Envelope = {
  id: 'medicina',
  name: 'Medicina',
  kind: 'fund',
  planned: 0,
  emoji: '💊',
  opening: 0,
  rhythm: 'none',
}

function insertAfter(list: Envelope[], afterId: string, row: Envelope): Envelope[] {
  const i = list.findIndex((e) => e.id === afterId)
  if (i < 0) return [...list, row]
  return [...list.slice(0, i + 1), row, ...list.slice(i + 1)]
}

function withMissingEnvelopes(list: Envelope[], income: number): Envelope[] {
  let next = list.map(ensureRhythm)
  let added = false
  if (!next.some((e) => e.id === 'seguro')) {
    next = insertAfter(next, 'movil', { ...SEGURO })
    added = true
  }
  if (!next.some((e) => e.id === 'medicina')) {
    next = insertAfter(next, 'ropa', { ...MEDICINA })
    added = true
  }
  return added ? withBalancedBuffer(next, income) : next
}

const KEY = 'techo.v1'

const empty = (): AppState => ({
  version: 1,
  onboarded: false,
  settings: { payMode: 'last-weekday', fixedDay: 1 },
  template: alexPlan(),
  envelopes: [],
  cycles: [],
  txs: [],
})

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as AppState
    if (parsed.version !== 1) return empty()
    const cycle = [...parsed.cycles].reverse().find((c) => !c.closedAt)
    const income = cycle?.income ?? parsed.cycles[0]?.income ?? 139_100
    const migrated = {
      ...parsed,
      envelopes: withMissingEnvelopes(parsed.envelopes, income),
      template: withMissingEnvelopes(parsed.template, income),
    }
    localStorage.setItem(KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    return empty()
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function emit(next: AppState) {
  state = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
}

export function getState(): AppState {
  return state
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function resetAll() {
  localStorage.removeItem(KEY)
  emit(empty())
}

export function startFirstCycle(input: {
  income: number
  startedAt: string
  expectedEndAt: string
  settings: Settings
  template: Envelope[]
  savingsOpening?: number
}) {
  const saved = input.savingsOpening ?? 0
  const template = withBalancedBuffer(input.template, input.income).map((e) => ({
    ...ensureRhythm(e),
    opening: e.kind === 'savings' ? saved : 0,
  }))
  const cycleId = uid()
  emit({
    version: 1,
    onboarded: true,
    settings: input.settings,
    template: template.map((e) => ({ ...e, opening: 0 })),
    envelopes: template,
    cycles: [
      {
        id: cycleId,
        startedAt: input.startedAt,
        expectedEndAt: input.expectedEndAt,
        income: input.income,
      },
    ],
    txs: [],
  })
}

function pushTx(tx: Omit<Tx, 'id' | 'cycleId' | 'at'> & { at?: string }) {
  const cycle = activeCycle(state)
  if (!cycle) return
  const next: Tx = {
    id: uid(),
    cycleId: cycle.id,
    at: tx.at ?? new Date().toISOString(),
    type: tx.type,
    envelopeId: tx.envelopeId,
    toEnvelopeId: tx.toEnvelopeId,
    amount: tx.amount,
    note: tx.note,
  }
  emit({ ...state, txs: [...state.txs, next] })
}

export function addExpense(envelopeId: string, amount: number, note: string, at?: string) {
  if (amount <= 0) return
  pushTx({ type: 'expense', envelopeId, amount, note, at })
}

export function coverAndSpend(input: {
  envelopeId: string
  amount: number
  note: string
  at?: string
  fromLibre?: { id: string; amount: number }
  fromSavings?: { id: string; amount: number; reason: string }
}) {
  const cycle = activeCycle(state)
  if (!cycle || input.amount <= 0) return
  const at = input.at ?? new Date().toISOString()
  const extra: Tx[] = []
  if (input.fromLibre && input.fromLibre.amount > 0) {
    extra.push({
      id: uid(),
      cycleId: cycle.id,
      at,
      type: 'transfer',
      envelopeId: input.fromLibre.id,
      toEnvelopeId: input.envelopeId,
      amount: input.fromLibre.amount,
      note: 'Extra cubierto con Libre',
    })
  }
  if (input.fromSavings && input.fromSavings.amount > 0) {
    extra.push({
      id: uid(),
      cycleId: cycle.id,
      at,
      type: 'transfer',
      envelopeId: input.fromSavings.id,
      toEnvelopeId: input.envelopeId,
      amount: input.fromSavings.amount,
      note: `AHORRO: ${input.fromSavings.reason}`,
    })
  }
  extra.push({
    id: uid(),
    cycleId: cycle.id,
    at,
    type: 'expense',
    envelopeId: input.envelopeId,
    amount: input.amount,
    note: input.note,
  })
  emit({ ...state, txs: [...state.txs, ...extra] })
}

export function addIncome(envelopeId: string, amount: number, note: string) {
  if (amount <= 0) return
  pushTx({ type: 'income', envelopeId, amount, note })
}

export function moveMoney(fromId: string, toId: string, amount: number, note: string) {
  if (amount <= 0 || fromId === toId) return
  pushTx({
    type: 'transfer',
    envelopeId: fromId,
    toEnvelopeId: toId,
    amount,
    note,
  })
}

export function undoLast() {
  if (state.txs.length === 0) return
  emit({ ...state, txs: state.txs.slice(0, -1) })
}

export function removeTx(id: string) {
  emit({ ...state, txs: state.txs.filter((t) => t.id !== id) })
}

function coverSiblings(expense: Tx): Tx[] {
  return state.txs.filter(
    (t) =>
      t.type === 'transfer' &&
      t.cycleId === expense.cycleId &&
      t.at === expense.at &&
      t.toEnvelopeId === expense.envelopeId,
  )
}

export function removeExpense(id: string) {
  const tx = state.txs.find((t) => t.id === id)
  if (!tx) return
  if (tx.type !== 'expense') {
    removeTx(id)
    return
  }
  const drop = new Set([id, ...coverSiblings(tx).map((t) => t.id)])
  emit({ ...state, txs: state.txs.filter((t) => !drop.has(t.id)) })
}

export function updateExpense(
  id: string,
  patch: { amount: number; note: string; at: string },
) {
  const tx = state.txs.find((t) => t.id === id)
  if (!tx || tx.type !== 'expense' || patch.amount <= 0) return
  const siblings = coverSiblings(tx)
  const cover = siblings.reduce((s, t) => s + t.amount, 0)
  const fromOwn = Math.max(0, tx.amount - cover)
  const newCover = Math.max(0, patch.amount - fromOwn)
  let txs = state.txs.map((t) =>
    t.id === id ? { ...t, amount: patch.amount, note: patch.note, at: patch.at } : t,
  )
  if (siblings.length === 1) {
    const sid = siblings[0].id
    if (newCover === 0) txs = txs.filter((t) => t.id !== sid)
    else {
      txs = txs.map((t) =>
        t.id === sid ? { ...t, amount: newCover, at: patch.at } : t,
      )
    }
  }
  emit({ ...state, txs })
}

export function markPaid(envelopeId: string, remaining: number) {
  if (remaining <= 0) return
  pushTx({
    type: 'expense',
    envelopeId,
    amount: remaining,
    note: 'Pagado',
  })
}

export function updatePlanned(id: string, planned: number) {
  const cycle = activeCycle(state)
  if (!cycle) return
  const envelopes = withBalancedBuffer(
    state.envelopes.map((e) => (e.id === id ? { ...e, planned } : e)),
    cycle.income,
  )
  emit({
    ...state,
    envelopes,
    template: state.template.map((t) => {
      const match = envelopes.find((e) => e.id === t.id)
      return match ? { ...t, planned: match.planned, name: match.name } : t
    }),
  })
}

export function renameEnvelope(id: string, name: string) {
  emit({
    ...state,
    envelopes: state.envelopes.map((e) => (e.id === id ? { ...e, name } : e)),
    template: state.template.map((e) => (e.id === id ? { ...e, name } : e)),
  })
}

export function addEnvelope(env: Envelope) {
  const cycle = activeCycle(state)
  if (!cycle) return
  const row = ensureRhythm(env)
  const envelopes = withBalancedBuffer([...state.envelopes, row], cycle.income)
  emit({
    ...state,
    envelopes,
    template: withBalancedBuffer([...state.template, { ...row, opening: 0 }], cycle.income),
  })
}

export function startNextCycle(
  income: number,
  startedAt: string,
  expectedEndAt?: string,
  leftoverToId?: string,
) {
  const current = activeCycle(state)
  if (!current) return
  const end =
    expectedEndAt ??
    suggestedNextPay(startedAt, state.settings.payMode, state.settings.fixedDay)

  const leftoverById = new Map<string, number>()
  for (const env of state.envelopes) {
    leftoverById.set(env.id, env.opening + env.planned)
  }
  for (const t of state.txs.filter((x) => x.cycleId === current.id)) {
    if (t.type === 'expense') {
      leftoverById.set(t.envelopeId, (leftoverById.get(t.envelopeId) ?? 0) - t.amount)
    }
    if (t.type === 'income') {
      leftoverById.set(t.envelopeId, (leftoverById.get(t.envelopeId) ?? 0) + t.amount)
    }
    if (t.type === 'transfer') {
      leftoverById.set(t.envelopeId, (leftoverById.get(t.envelopeId) ?? 0) - t.amount)
      if (t.toEnvelopeId) {
        leftoverById.set(t.toEnvelopeId, (leftoverById.get(t.toEnvelopeId) ?? 0) + t.amount)
      }
    }
  }

  const savingsId = state.envelopes.find((e) => e.kind === 'savings')?.id ?? 'ahorro'
  const destId = leftoverToId ?? savingsId
  let extra = 0
  const openings = new Map<string, number>()
  for (const env of state.envelopes) {
    const left = leftoverById.get(env.id) ?? 0
    if (carryKinds(env.kind)) {
      openings.set(env.id, Math.max(0, left))
    } else {
      extra += Math.max(0, left)
    }
  }
  openings.set(destId, (openings.get(destId) ?? 0) + extra)

  const template = withBalancedBuffer(
    state.template.map((e) => ({ ...e, opening: 0 })),
    income,
  )
  const envelopes = template.map((e) => ({
    ...ensureRhythm(e),
    opening: openings.get(e.id) ?? 0,
  }))

  const snap = reportFor(state, current)
  const cycleId = uid()
  emit({
    ...state,
    template,
    envelopes,
    cycles: [
      ...state.cycles.map((c) =>
        c.id === current.id
          ? {
              ...c,
              closedAt: todayISO(),
              spent: snap.spent,
              savedNet: snap.savedNet,
              savingsUsed: snap.savingsUsed,
              savingsGoal: snap.savingsGoal,
            }
          : c,
      ),
      { id: cycleId, startedAt, expectedEndAt: end, income },
    ],
  })
}

export function updateSettings(settings: Settings) {
  emit({ ...state, settings })
}

export function exportJson(): string {
  return JSON.stringify(state, null, 2)
}

export function planFits(envelopes: Envelope[], income: number): boolean {
  return assigned(envelopes.filter((e) => e.kind !== 'buffer')) <= income
}
