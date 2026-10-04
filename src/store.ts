import { useSyncExternalStore } from 'react'
import { clampWeekStart, daysBetween, suggestedNextPay, todayISO } from './dates'
import {
  activeCycle,
  assigned,
  ensureRhythm,
  envelopeCash,
  envelopesAfterRemoval,
  envelopeTree,
  fundCarryGap,
  fundCloseSnap,
  fundLifeSnapshot,
  nextOpenings,
  accountSnapshot,
  openDailyPace,
  creditFloat,
  releaseUnmatchedCardPay,
  pocketSplit,
  reassignTxs,
  reportFor,
  splitPlanned,
  takesFromPay,
  uid,
  viewsFor,
  withBalancedBuffer,
  withFrozenDailyPace,
} from './logic'
import { t } from './i18n'
import { isCurrency } from './money'
import { alexPlan } from './template'
import type { AppState, Currency, Envelope, FundLife, Locale, Pocket, PocketMove, Settings, Tx } from './types'

function localeOf(s: AppState | Settings): Locale {
  if ('settings' in s) return s.settings.locale ?? 'es'
  return s.locale ?? 'es'
}

function currencyOf(value: unknown): Currency {
  return typeof value === 'string' && isCurrency(value) ? value : 'EUR'
}

/** Ids que solo trae el plan personal. Si aparecen, no se toca ese archivo. */
const PERSONAL_PLAN = new Set(['futbol', 'gym', 'transporte', 'ropa'])

function envelopeUsed(txs: Tx[], id: string): boolean {
  return txs.some((t) => t.envelopeId === id || t.toEnvelopeId === id)
}

function injectedSeguro(e: Envelope, txs: Tx[]): boolean {
  return (
    e.id === 'seguro' &&
    e.name === 'Seguro médico' &&
    e.planned === 945 &&
    (e.opening ?? 0) === 0 &&
    !e.parentId &&
    !envelopeUsed(txs, e.id)
  )
}

function injectedMedicina(e: Envelope, txs: Tx[], locale: Locale): boolean {
  return (
    locale === 'en' &&
    e.id === 'medicina' &&
    e.name === 'Medicina' &&
    e.planned === 0 &&
    (e.opening ?? 0) === 0 &&
    !e.parentId &&
    !envelopeUsed(txs, e.id)
  )
}

function dropInjectedRows(
  list: Envelope[],
  txs: Tx[],
  locale: Locale,
): { list: Envelope[]; restored: number } {
  let restored = 0
  const next = list.filter((e) => {
    if (injectedSeguro(e, txs)) {
      restored += e.planned
      return false
    }
    if (injectedMedicina(e, txs, locale)) return false
    return true
  })
  if (restored <= 0) return { list: next, restored: 0 }
  return {
    restored,
    list: next.map((e) => (e.kind === 'buffer' ? { ...e, planned: e.planned + restored } : e)),
  }
}

/** Esos dos sobres se habían copiado a cualquier plan que no los tuviera. */
function withoutInjectedPersonal(state: AppState): AppState {
  const rows = [...state.envelopes, ...(state.template ?? [])]
  if (rows.some((e) => PERSONAL_PLAN.has(e.id))) {
    return {
      ...state,
      envelopes: state.envelopes.map(ensureRhythm),
      template: (state.template ?? []).map(ensureRhythm),
    }
  }
  const locale = localeOf(state)
  const txs = state.txs ?? []
  const envelopes = dropInjectedRows(state.envelopes.map(ensureRhythm), txs, locale)
  const template = dropInjectedRows((state.template ?? []).map(ensureRhythm), txs, locale)
  if (
    envelopes.restored === 0 &&
    envelopes.list.length === state.envelopes.length &&
    template.list.length === (state.template ?? []).length
  ) {
    return { ...state, envelopes: envelopes.list, template: template.list }
  }
  let cycles = state.cycles
  const cycle = [...cycles].reverse().find((c) => !c.closedAt)
  if (cycle?.fairDaily != null && envelopes.restored > 0) {
    const origin = cycle.paceStartedAt || cycle.startedAt
    const days = Math.max(1, daysBetween(origin, cycle.expectedEndAt))
    const poisoned = Math.round(splitPlanned(state.envelopes) / days)
    if (cycle.fairDaily === poisoned) {
      const fixed = Math.round(splitPlanned(envelopes.list) / days)
      cycles = cycles.map((c) => (c.id === cycle.id ? { ...c, fairDaily: fixed } : c))
    }
  }
  return { ...state, envelopes: envelopes.list, template: template.list, cycles }
}

const KEY = 'techo.v1'

const empty = (): AppState => ({
  version: 1,
  onboarded: false,
  settings: { payMode: 'last-weekday', fixedDay: 1, weekStartsOn: 5, dailyWeekStartsOn: 1 },
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
    const migrated = withoutInjectedPersonal({
      ...parsed,
      settings: {
        payMode: parsed.settings?.payMode ?? 'last-weekday',
        fixedDay: parsed.settings?.fixedDay ?? 1,
        weekStartsOn: parsed.settings?.weekStartsOn ?? 5,
        dailyWeekStartsOn: parsed.settings?.dailyWeekStartsOn ?? 1,
        seenHomeTour: parsed.settings?.seenHomeTour ?? true,
        locale: parsed.settings?.locale ?? (parsed.onboarded ? 'es' : undefined),
        currency: currencyOf(parsed.settings?.currency),
        lastExportAt: parsed.settings?.lastExportAt,
      },
    })
    const paced = withFrozenDailyPace(migrated)
    const txs = releaseUnmatchedCardPay(paced.txs)
    const next = txs === paced.txs ? paced : { ...paced, txs }
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  } catch {
    return empty()
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function emit(next: AppState) {
  const txs = releaseUnmatchedCardPay(next.txs)
  const settled = txs === next.txs ? next : { ...next, txs }
  state = settled
  localStorage.setItem(KEY, JSON.stringify(settled))
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
  openingCash?: number
}) {
  const saved = input.savingsOpening ?? 0
  const locale = input.settings.locale ?? 'es'
  const template = withBalancedBuffer(input.template, input.income, locale).map((e) => ({
    ...ensureRhythm(e),
    opening: e.kind === 'savings' ? saved : 0,
  }))
  const cycleId = uid()
  const pace = openDailyPace(template, input.startedAt, input.expectedEndAt)
  emit({
    version: 1,
    onboarded: true,
    settings: { ...input.settings, seenHomeTour: false },
    template: template.map((e) => ({ ...e, opening: 0 })),
    envelopes: template,
    cycles: [
      {
        id: cycleId,
        startedAt: input.startedAt,
        expectedEndAt: input.expectedEndAt,
        income: input.income,
        fairDaily: pace.fairDaily,
        paceStartedAt: pace.paceStartedAt,
        openingCash: input.openingCash ?? 0,
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
    pocket: tx.pocket,
    pocketMove: tx.pocketMove,
  }
  emit({ ...state, txs: [...state.txs, next] })
}

export function addExpense(
  envelopeId: string,
  amount: number,
  note: string,
  at?: string,
  pocket?: Pocket,
) {
  if (amount <= 0) return
  pushTx({ type: 'expense', envelopeId, amount, note, at, pocket: pocket ?? 'card' })
}

export function coverAndSpend(input: {
  envelopeId: string
  amount: number
  note: string
  at?: string
  fromLibre?: { id: string; amount: number }
  fromParent?: { id: string; amount: number }
  fromSavings?: { id: string; amount: number; reason: string }
  pocket?: Pocket
}) {
  const cycle = activeCycle(state)
  if (!cycle || input.amount <= 0) return
  const at = input.at ?? new Date().toISOString()
  const extra: Tx[] = []
  if (input.fromParent && input.fromParent.amount > 0) {
    extra.push({
      id: uid(),
      cycleId: cycle.id,
      at,
      type: 'transfer',
      envelopeId: input.fromParent.id,
      toEnvelopeId: input.envelopeId,
      amount: input.fromParent.amount,
      note: t(localeOf(state), 'store.toFolder'),
    })
  }
  if (input.fromLibre && input.fromLibre.amount > 0) {
    extra.push({
      id: uid(),
      cycleId: cycle.id,
      at,
      type: 'transfer',
      envelopeId: input.fromLibre.id,
      toEnvelopeId: input.envelopeId,
      amount: input.fromLibre.amount,
      note: t(localeOf(state), 'store.coveredFree'),
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
      note: t(localeOf(state), 'store.savNote', { reason: input.fromSavings.reason }),
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
    pocket: input.pocket ?? 'card',
  })
  emit({ ...state, txs: [...state.txs, ...extra] })
}

export function addIncome(
  envelopeId: string,
  amount: number,
  note: string,
  pocket?: Pocket,
) {
  if (amount <= 0) return
  pushTx({ type: 'income', envelopeId, amount, note, pocket: pocket ?? 'card' })
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
  patch: { amount: number; note: string; at: string; pocket?: Pocket },
) {
  const tx = state.txs.find((t) => t.id === id)
  if (!tx || tx.type !== 'expense' || patch.amount <= 0) return
  const siblings = coverSiblings(tx)
  const cover = siblings.reduce((s, t) => s + t.amount, 0)
  const fromOwn = Math.max(0, tx.amount - cover)
  const newCover = Math.max(0, patch.amount - fromOwn)
  let txs = state.txs.map((t) =>
    t.id === id
      ? { ...t, amount: patch.amount, note: patch.note, at: patch.at, pocket: patch.pocket ?? t.pocket }
      : t,
  )
  if (newCover === 0) {
    const drop = new Set(siblings.map((t) => t.id))
    txs = txs.filter((t) => !drop.has(t.id))
  } else if (siblings.length === 1) {
    const sid = siblings[0].id
    txs = txs.map((t) => (t.id === sid ? { ...t, amount: newCover, at: patch.at } : t))
  } else if (siblings.length > 1 && cover > 0) {
    let assigned = 0
    const amounts = siblings.map((s, i) => {
      if (i === siblings.length - 1) return Math.max(0, newCover - assigned)
      const part = Math.round((s.amount / cover) * newCover)
      assigned += part
      return part
    })
    const byId = new Map(siblings.map((s, i) => [s.id, amounts[i]]))
    txs = txs.flatMap((t) => {
      const amount = byId.get(t.id)
      if (amount == null) return [t]
      if (amount <= 0) return []
      return [{ ...t, amount, at: patch.at }]
    })
  }
  emit({ ...state, txs })
}

export function markPaid(envelopeId: string, remaining: number) {
  if (remaining <= 0) return
  pushTx({
    type: 'expense',
    envelopeId,
    amount: remaining,
    note: t(localeOf(state), 'store.paid'),
  })
}

export function updatePlanned(id: string, planned: number) {
  const cycle = activeCycle(state)
  if (!cycle) return
  const envelopes = withBalancedBuffer(
    state.envelopes.map((e) => (e.id === id ? { ...e, planned } : e)),
    cycle.income,
    localeOf(state),
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

export function setSplitDaily(id: string, splitDaily: boolean) {
  const cycle = activeCycle(state)
  const env = state.envelopes.find((e) => e.id === id)
  if (!env || env.kind === 'buffer') return
  const today = todayISO()
  const origin = cycle?.paceStartedAt ?? cycle?.startedAt
  const late = Boolean(cycle && cycle.fairDaily != null && origin && today >= origin)
  const patch = (e: Envelope): Envelope => {
    if (e.id !== id) return e
    if (!splitDaily) {
      const next = { ...e, splitDaily: false }
      delete next.splitJoinedOn
      delete next.splitJoinedAmount
      return next
    }
    if (!late || !cycle) {
      const next = { ...e, splitDaily: true }
      delete next.splitJoinedOn
      delete next.splitJoinedAmount
      return next
    }
    const txs = state.txs.filter((t) => t.cycleId === cycle.id)
    return {
      ...e,
      splitDaily: true,
      splitJoinedOn: today,
      splitJoinedAmount: Math.max(0, envelopeCash(e, txs)),
    }
  }
  emit({
    ...state,
    envelopes: state.envelopes.map(patch),
    template: state.template.map(patch),
  })
}

export function setEnvelopeWeekStart(id: string, weekStartsOn: number) {
  const day = clampWeekStart(weekStartsOn)
  emit({
    ...state,
    envelopes: state.envelopes.map((e) => (e.id === id ? { ...e, weekStartsOn: day } : e)),
    template: state.template.map((e) => (e.id === id ? { ...e, weekStartsOn: day } : e)),
  })
}

export function addSubfund(parentId: string, name: string, emoji = '📁'): { ok: true } | { ok: false; error: string } {
  const locale = localeOf(state)
  const parent = state.envelopes.find((e) => e.id === parentId && e.kind === 'fund' && !e.parentId)
  const trimmed = name.trim()
  if (!parent) return { ok: false, error: t(locale, 'store.noCycle') }
  if (!trimmed) return { ok: false, error: t(locale, 'store.needName') }
  const row = ensureRhythm({
    id: uid(),
    name: trimmed,
    kind: 'fund',
    planned: 0,
    emoji,
    opening: 0,
    rhythm: 'none',
    parentId,
  })
  emit({
    ...state,
    envelopes: [...state.envelopes, row],
    template: [...state.template, { ...row, opening: 0 }],
  })
  return { ok: true }
}

export function renameEnvelope(id: string, name: string) {
  emit({
    ...state,
    envelopes: state.envelopes.map((e) => (e.id === id ? { ...e, name } : e)),
    template: state.template.map((e) => (e.id === id ? { ...e, name } : e)),
  })
}

export function addEnvelope(env: Envelope): { ok: true } | { ok: false; error: string } {
  const cycle = activeCycle(state)
  const locale = localeOf(state)
  if (!cycle) return { ok: false, error: t(locale, 'store.noCycle') }
  const name = env.name.trim()
  if (!name) return { ok: false, error: t(locale, 'store.needName') }
  if (env.kind === 'savings' || env.kind === 'buffer') {
    return { ok: false, error: t(locale, 'store.unique') }
  }
  let row = ensureRhythm({ ...env, name, id: env.id || uid() })
  const origin = cycle.paceStartedAt ?? cycle.startedAt
  if (row.splitDaily && row.kind === 'cap' && cycle.fairDaily != null && todayISO() >= origin) {
    row = { ...row, splitJoinedOn: todayISO(), splitJoinedAmount: Math.max(0, row.planned) }
  }
  const envelopes = withBalancedBuffer([...state.envelopes, row], cycle.income, locale)
  const buffer = envelopes.find((e) => e.kind === 'buffer')
  if ((buffer?.planned ?? 0) < 0) {
    return { ok: false, error: t(locale, 'store.negFree') }
  }
  emit({
    ...state,
    envelopes,
    template: withBalancedBuffer([...state.template, { ...row, opening: 0 }], cycle.income, locale),
  })
  return { ok: true }
}

export function startNextCycle(
  income: number,
  startedAt: string,
  expectedEndAt?: string,
  leftoverToId?: string,
  openingCash = 0,
  fundChoice: Record<string, 'continue' | 'close'> = {},
) {
  const current = activeCycle(state)
  if (!current) return
  const end =
    expectedEndAt ??
    suggestedNextPay(startedAt, state.settings.payMode, state.settings.fixedDay)
  const locale = localeOf(state)
  const savingsId = state.envelopes.find((e) => e.kind === 'savings')?.id ?? 'ahorro'
  const destId = leftoverToId ?? savingsId
  const choice: Record<string, 'continue' | 'close'> = { ...fundChoice }
  for (const env of state.envelopes) {
    if (env.kind === 'fund' && env.fundClosedInCycle === current.id) choice[env.id] = 'close'
  }
  const openings = nextOpenings(state.envelopes, state.txs, current.id, destId)
  const fundSnap = fundCloseSnap(state.envelopes, state.txs, current.id)
  const cycleId = uid()
  const today = todayISO()
  const lives = new Map<string, FundLife>()
  for (const env of state.envelopes) {
    if (env.kind === 'fund' && choice[env.id] === 'close') lives.set(env.id, fundLifeSnapshot(state, env.id, today))
  }
  const template = withBalancedBuffer(
    state.template.map((e) => {
      const live = state.envelopes.find((row) => row.id === e.id)
      const fresh: Envelope = {
        ...e,
        opening: 0,
        fundEpoch: live?.fundEpoch ?? e.fundEpoch,
        fundLives: live?.fundLives ?? e.fundLives,
      }
      delete fresh.fundClosedInCycle
      if (fresh.kind !== 'fund' || choice[fresh.id] !== 'close') return fresh
      const life = lives.get(fresh.id)
      return {
        ...fresh,
        fundEpoch: cycleId,
        fundLives: life ? [...(fresh.fundLives ?? []), life] : fresh.fundLives,
      }
    }),
    income,
    locale,
  )
  const envelopes = template.map((e) => ({
    ...ensureRhythm(e),
    opening: openings.get(e.id) ?? 0,
  }))

  const snap = reportFor(state, current)
  const pace = openDailyPace(envelopes, startedAt, end)
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
              fundSnap,
            }
          : c,
      ),
      {
        id: cycleId,
        startedAt,
        expectedEndAt: end,
        income,
        fairDaily: pace.fairDaily,
        paceStartedAt: pace.paceStartedAt,
        openingCash,
      },
    ],
  })
}

export function removeEnvelope(id: string, toId: string): { ok: true } | { ok: false; error: string } {
  const cycle = activeCycle(state)
  const locale = localeOf(state)
  if (!cycle) return { ok: false, error: t(locale, 'store.noCycle') }
  const env = state.envelopes.find((e) => e.id === id)
  const dest = state.envelopes.find((e) => e.id === toId)
  if (!env || !dest) return { ok: false, error: t(locale, 'store.missing') }
  if (env.kind === 'buffer' || env.kind === 'savings') return { ok: false, error: t(locale, 'store.keepEnvelope') }
  const removeIds = envelopeTree(state.envelopes, id)
  if (removeIds.includes(toId)) return { ok: false, error: t(locale, 'store.badDest') }
  const envelopes = envelopesAfterRemoval(state.envelopes, removeIds, toId, cycle.income, locale)
  const template = withBalancedBuffer(
    envelopes.map((e) => ({ ...e, opening: 0 })),
    cycle.income,
    locale,
  )
  emit({
    ...state,
    txs: reassignTxs(state.txs, removeIds, toId),
    envelopes,
    template,
  })
  return { ok: true }
}

function mapFunds(ids: Set<string>, patch: (env: Envelope) => Envelope) {
  const apply = (env: Envelope) => (ids.has(env.id) && env.kind === 'fund' ? patch(env) : env)
  emit({
    ...state,
    envelopes: state.envelopes.map(apply),
    template: state.template.map(apply),
  })
}

/** Cierra el fondo hoy. El gasto sigue en Inicio hasta que acabe este ciclo de cobro. */
export function closeFund(id: string): { ok: true } | { ok: false; error: string } {
  const cycle = activeCycle(state)
  const locale = localeOf(state)
  const env = state.envelopes.find((e) => e.id === id)
  if (!cycle) return { ok: false, error: t(locale, 'store.noCycle') }
  if (!env || env.kind !== 'fund') return { ok: false, error: t(locale, 'store.missing') }
  const ids = new Set(envelopeTree(state.envelopes, id))
  mapFunds(ids, (row) => ({ ...row, fundClosedInCycle: cycle.id }))
  return { ok: true }
}

/** Deshace un cierre de este ciclo. Las carpetas y el fondo padre vuelven a seguir. */
export function reopenFund(id: string): { ok: true } | { ok: false; error: string } {
  const cycle = activeCycle(state)
  const locale = localeOf(state)
  const env = state.envelopes.find((e) => e.id === id)
  if (!cycle) return { ok: false, error: t(locale, 'store.noCycle') }
  if (!env || env.kind !== 'fund') return { ok: false, error: t(locale, 'store.missing') }
  const ids = new Set(envelopeTree(state.envelopes, id))
  let parent = env.parentId
  while (parent) {
    ids.add(parent)
    parent = state.envelopes.find((e) => e.id === parent)?.parentId
  }
  mapFunds(ids, (row) => {
    if (row.fundClosedInCycle !== cycle.id) return row
    const next = { ...row }
    delete next.fundClosedInCycle
    return next
  })
  return { ok: true }
}

/** Trae al ciclo abierto el apartado de un fondo que se quedó en un cierre anterior. */
export function restoreFundCarry(id: string): { ok: true; amount: number } | { ok: false; error: string } {
  const locale = localeOf(state)
  const env = state.envelopes.find((e) => e.id === id)
  if (!env || env.kind !== 'fund') return { ok: false, error: t(locale, 'store.missing') }
  const gap = fundCarryGap(state, id)
  if (gap <= 0) return { ok: false, error: t(locale, 'fund.nothing') }
  emit({
    ...state,
    envelopes: state.envelopes.map((e) => (e.id === id ? { ...e, opening: e.opening + gap } : e)),
  })
  return { ok: true, amount: gap }
}

export function setOpeningCash(cents: number) {
  const cycle = activeCycle(state)
  if (!cycle || cents < 0) return
  emit({
    ...state,
    cycles: state.cycles.map((c) => (c.id === cycle.id ? { ...c, openingCash: cents } : c)),
  })
}

export function updateSettings(settings: Settings) {
  emit({ ...state, settings })
}

export function exportJson(): string {
  return JSON.stringify(state, null, 2)
}

export function downloadBackup() {
  const stamped: AppState = {
    ...state,
    settings: { ...state.settings, lastExportAt: new Date().toISOString() },
  }
  emit(stamped)
  const blob = new Blob([JSON.stringify(stamped, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'techo-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function movePocket(
  amount: number,
  direction: PocketMove,
): { ok: true } | { ok: false; error: string } {
  const cycle = activeCycle(state)
  const locale = localeOf(state)
  if (!cycle) return { ok: false, error: t(locale, 'store.noCycle') }
  if (amount <= 0) return { ok: false, error: t(locale, 'logic.needAmt') }
  if (direction === 'to-bank') {
    const snap = accountSnapshot(viewsFor(state))
    const pockets = pocketSplit(state, snap.inAccount, snap.afterFixed)
    if (amount > pockets.cash) return { ok: false, error: t(locale, 'sheet.cashShort') }
  }
  pushTx({
    type: 'pocket',
    envelopeId: '',
    amount,
    note: t(locale, direction === 'to-cash' ? 'store.toCash' : 'store.toBank'),
    pocketMove: direction,
  })
  return { ok: true }
}

export function payCard(amount: number): { ok: true } | { ok: false; error: string } {
  const cycle = activeCycle(state)
  const locale = localeOf(state)
  if (!cycle) return { ok: false, error: t(locale, 'store.noCycle') }
  if (amount <= 0) return { ok: false, error: t(locale, 'logic.needAmt') }
  if (amount > creditFloat(state)) return { ok: false, error: t(locale, 'sheet.cardShort') }
  pushTx({
    type: 'cardpay',
    envelopeId: '',
    amount,
    note: t(locale, 'store.cardPay'),
  })
  return { ok: true }
}

export function setTxPocket(id: string, pocket: Pocket) {
  const tx = state.txs.find((row) => row.id === id)
  if (!tx || (tx.type !== 'expense' && tx.type !== 'income')) return
  emit({
    ...state,
    txs: state.txs.map((row) => (row.id === id ? { ...row, pocket } : row)),
  })
}

export function setCycleSetAside(
  id: string,
  cents: number,
): { ok: true } | { ok: false; error: string } {
  const cycle = activeCycle(state)
  const locale = localeOf(state)
  if (!cycle) return { ok: false, error: t(locale, 'store.noCycle') }
  const env = state.envelopes.find((e) => e.id === id)
  if (!env || env.kind !== 'fund' || env.parentId) return { ok: false, error: t(locale, 'store.missing') }
  const amount = Math.max(0, Math.round(cents))
  const patched = state.envelopes.map((e) => {
    if (e.id !== id) return e
    if (amount <= 0) {
      const rest = { ...e }
      delete rest.cycleSetAside
      return { ...rest, planned: 0 }
    }
    return { ...e, planned: amount, cycleSetAside: amount }
  })
  const envelopes = withBalancedBuffer(patched, cycle.income, locale)
  const buffer = envelopes.find((e) => e.kind === 'buffer')
  if ((buffer?.planned ?? 0) < 0) return { ok: false, error: t(locale, 'store.negFree') }
  emit({
    ...state,
    envelopes,
    template: state.template.map((row) => {
      const match = envelopes.find((e) => e.id === row.id)
      if (!match) return row
      if (match.cycleSetAside == null) {
        const rest = { ...row }
        delete rest.cycleSetAside
        return { ...rest, planned: match.planned, name: match.name }
      }
      return { ...row, planned: match.planned, cycleSetAside: match.cycleSetAside, name: match.name }
    }),
  })
  return { ok: true }
}

export function importJson(raw: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as AppState
    const ui = localeOf(state)
    if (!parsed || parsed.version !== 1) {
      return { ok: false, error: t(ui, 'store.badFile') }
    }
    if (!Array.isArray(parsed.envelopes) || !Array.isArray(parsed.cycles) || !Array.isArray(parsed.txs)) {
      return { ok: false, error: t(ui, 'store.incomplete') }
    }
    emit(
      withFrozenDailyPace(
        withoutInjectedPersonal({
          ...parsed,
          onboarded: parsed.onboarded || parsed.cycles.length > 0,
          settings: {
            payMode: parsed.settings?.payMode ?? 'last-weekday',
            fixedDay: parsed.settings?.fixedDay ?? 1,
            weekStartsOn: parsed.settings?.weekStartsOn ?? 5,
            dailyWeekStartsOn: parsed.settings?.dailyWeekStartsOn ?? 1,
            seenHomeTour: parsed.settings?.seenHomeTour ?? true,
            locale: parsed.settings?.locale ?? (parsed.onboarded ? 'es' : undefined),
            currency: currencyOf(parsed.settings?.currency),
            lastExportAt: parsed.settings?.lastExportAt,
          },
          template: parsed.template?.length ? parsed.template : parsed.envelopes,
        }),
      ),
    )
    return { ok: true }
  } catch {
    return { ok: false, error: t(localeOf(state), 'store.readFail') }
  }
}

export function planFits(envelopes: Envelope[], income: number): boolean {
  return assigned(envelopes.filter(takesFromPay)) <= income
}
