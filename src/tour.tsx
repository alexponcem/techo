import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { activeCycle, viewsFor } from './logic'
import { getState, updateSettings, useAppState } from './store'
import { useT } from './useT'
import type { Screen, Sheet } from './types'

let tourTarget = ''
const tourListeners = new Set<() => void>()

export function setTourTarget(id: string) {
  if (tourTarget === id) return
  tourTarget = id
  tourListeners.forEach((fn) => fn())
}

export function useTourTarget(): string {
  return useSyncExternalStore(
    (fn) => {
      tourListeners.add(fn)
      return () => tourListeners.delete(fn)
    },
    () => tourTarget,
    () => tourTarget,
  )
}

/** La tarjeta va al lado donde queda sitio, para no tapar lo señalado. */
export function tourCardSide(top: number, bottom: number, viewH: number, cardH: number): 'top' | 'bottom' {
  const mid = (top + bottom) / 2
  const roomBelow = viewH - bottom
  const roomAbove = top
  if (mid <= viewH / 2 && roomBelow >= cardH + 24) return 'bottom'
  if (roomAbove >= cardH + 24) return 'top'
  if (roomBelow >= roomAbove) return 'bottom'
  return 'top'
}

/** Cuánto hay que desplazar la página para dejar el objetivo en el hueco libre. */
export function tourScrollDelta(
  rect: { top: number; bottom: number; height: number },
  freeTop: number,
  freeBottom: number,
): number {
  const freeH = freeBottom - freeTop
  if (freeH <= 0) return 0
  if (rect.height >= freeH) return rect.top - freeTop
  if (rect.top < freeTop) return rect.top - freeTop
  if (rect.bottom > freeBottom) return rect.bottom - freeBottom
  return 0
}

type Gate = 'spend' | 'erase'

type TourStep = {
  key: string
  title: string
  body: string
  target: string
  gate?: Gate
}

export function HomeTour({
  screen,
  sheet,
  onOpenAdd,
  onOpenEnvelope,
}: {
  screen: Screen
  sheet: Sheet
  onOpenAdd: (envelopeId: string) => void
  onOpenEnvelope: (id: string) => void
}) {
  const state = useAppState()
  const t = useT()
  const [i, setI] = useState(0)
  const snap = useRef<Set<string> | null>(null)
  const advanced = useRef(false)
  const [practiceId, setPracticeId] = useState('')
  const cycle = activeCycle(state)
  const views = viewsFor(state)
  const libre = views.find((v) => v.env.kind === 'buffer')
  const cap = views.find((v) => v.env.kind === 'cap' && !v.env.parentId)
  const bill = views.find((v) => v.env.kind === 'fixed')
  const fund = views.find((v) => v.env.kind === 'fund' && !v.env.parentId)
  const savings = views.find((v) => v.env.kind === 'savings')
  const practice = practiceId ? state.txs.find((tx) => tx.id === practiceId) : undefined

  const steps: TourStep[] = [
    { key: 'add', title: t('tour.add'), body: t('tour.addBody'), target: 'tour-gasto' },
    { key: 'today', title: t('tour.today'), body: t('tour.todayBody'), target: 'tour-hoy' },
    { key: 'bank', title: t('tour.account'), body: t('tour.accountBody'), target: 'tour-bank' },
  ]
  if (libre) {
    steps.push({
      key: 'libre',
      title: t('tour.libre'),
      body: t('tour.libreBody', { name: libre.env.name }),
      target: `sobre-${libre.env.id}`,
    })
  }
  steps.push({
    key: 'cap',
    title: t('tour.cap'),
    body: cap ? t('tour.capBody', { name: cap.env.name }) : t('tour.capLater'),
    target: cap ? `sobre-${cap.env.id}` : 'tour-new',
  })
  steps.push({
    key: 'bill',
    title: t('tour.bill'),
    body: bill ? t('tour.billBody', { name: bill.env.name }) : t('tour.billLater'),
    target: bill ? `sobre-${bill.env.id}` : 'tour-new',
  })
  steps.push({
    key: 'fund',
    title: t('tour.fund'),
    body: fund ? t('tour.fundBody', { name: fund.env.name }) : t('tour.fundLater'),
    target: fund ? `sobre-${fund.env.id}` : 'tour-new',
  })
  if (savings) {
    steps.push({
      key: 'savings',
      title: t('tour.savings'),
      body: t('tour.savingsBody', { name: savings.env.name }),
      target: `sobre-${savings.env.id}`,
    })
  }
  steps.push({ key: 'more', title: t('tour.more'), body: t('tour.moreBody'), target: 'tour-new' })
  if (libre) {
    steps.push({
      key: 'try',
      title: t('tour.try'),
      body: t('tour.tryBody', { name: libre.env.name }),
      target: 'tour-gasto',
      gate: 'spend',
    })
    steps.push({
      key: 'erase',
      title: t('tour.erase'),
      body: t('tour.eraseBody'),
      target: `sobre-${libre.env.id}`,
      gate: 'erase',
    })
  }

  const page = steps[i]
  const onPractice =
    page?.gate === 'erase' && practice && screen.name === 'envelope' && screen.id === practice.envelopeId
  const target = onPractice && practice ? `mov-${practice.id}` : (page?.target ?? '')

  function finish() {
    setTourTarget('')
    updateSettings({ ...getState().settings, seenHomeTour: true })
  }

  useEffect(() => {
    if (!page || page.gate !== 'spend' || !cycle) return
    if (!snap.current) {
      snap.current = new Set(
        state.txs.filter((tx) => tx.cycleId === cycle.id && tx.type === 'expense').map((tx) => tx.id),
      )
    }
    const fresh = state.txs.filter(
      (tx) => tx.cycleId === cycle.id && tx.type === 'expense' && !snap.current?.has(tx.id),
    )
    const last = fresh[fresh.length - 1]
    if (!last || advanced.current) return
    advanced.current = true
    setPracticeId(last.id)
    setI((n) => n + 1)
  }, [page, cycle, state.txs])

  useEffect(() => {
    if (!page || page.gate !== 'erase' || !practiceId) return
    if (state.txs.some((tx) => tx.id === practiceId)) return
    finish()
  }, [page, practiceId, state.txs])

  useEffect(() => {
    if (!page || page.gate !== 'erase' || !practice || sheet) return
    if (screen.name === 'envelope' && screen.id === practice.envelopeId) return
    onOpenEnvelope(practice.envelopeId)
  }, [page, practice, sheet, screen, onOpenEnvelope])

  useEffect(() => {
    setTourTarget(target)
    if (!target) return
    let cancelled = false
    const run = () => {
      if (cancelled) return
      const el = document.getElementById(target)
      const card = document.getElementById('tour-card')
      if (!el || !card) return
      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight
      const cardH = card.offsetHeight
      const side = tourCardSide(rect.top, rect.bottom, viewH, cardH)
      card.dataset.side = side
      card.style.top = side === 'top' ? '12px' : 'auto'
      card.style.bottom = side === 'bottom' ? 'calc(88px + var(--safe-bottom))' : 'auto'
      const bottomInset = 88
      const freeTop = side === 'top' ? cardH + 24 : 12
      const freeBottom = side === 'top' ? viewH - bottomInset : viewH - bottomInset - cardH - 12
      const delta = tourScrollDelta(
        { top: rect.top, bottom: rect.bottom, height: rect.height },
        freeTop,
        freeBottom,
      )
      if (delta !== 0) window.scrollBy(0, delta)
    }
    run()
    const frame = requestAnimationFrame(run)
    const t1 = window.setTimeout(run, 120)
    const t2 = window.setTimeout(run, 240)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [target])

  useEffect(() => () => setTourTarget(''), [])

  if (!page) return null

  return (
    <>
      <div className="tour-dim" />
      <div id="tour-card" className="tour-card stack">
        <p className="tiny">
          {i + 1} / {steps.length}
        </p>
        <h3 className="serif" style={{ fontSize: 24, margin: 0 }}>
          {page.title}
        </h3>
        <p>{page.gate === 'erase' && screen.name === 'envelope' ? t('tour.eraseWait') : page.body}</p>
        {page.gate === 'spend' && libre ? (
          <button type="button" className="btn full sage" onClick={() => onOpenAdd(libre.env.id)}>
            {t('tour.tryGo')}
          </button>
        ) : page.gate === 'erase' && practice && !(screen.name === 'envelope' && screen.id === practice.envelopeId) ? (
          <button type="button" className="btn full sage" onClick={() => onOpenEnvelope(practice.envelopeId)}>
            {t('tour.eraseGo')}
          </button>
        ) : page.gate === 'erase' ? null : (
          <button
            type="button"
            className="btn full sage"
            onClick={() => {
              if (i < steps.length - 1) setI(i + 1)
              else finish()
            }}
          >
            {i < steps.length - 1 ? t('common.next') : t('common.start')}
          </button>
        )}
        <button type="button" className="btn ghost full" onClick={finish}>
          {t('common.skipTour')}
        </button>
      </div>
    </>
  )
}
