import {
  accountSnapshot,
  cycleTxs,
  inDailySplit,
  kindOrder,
  paceFor,
  rhythmOf,
  spentOnDay,
  viewsFor,
  weeklyViews,
  type EnvelopeView,
} from './logic'
import { useState } from 'react'
import { WEEKDAY_NAMES, clampWeekStart, formatRange, todayISO } from './dates'
import { euros } from './money'
import { KIND_LABEL } from './template'
import { markPaid, updateSettings, useAppState } from './store'
import type { Sheet as SheetState } from './types'

function pillLabel(view: EnvelopeView): string {
  if (view.paid) return 'Pagado'
  if (view.env.kind === 'savings') return view.used > 0 ? `${view.pct}%` : 'Bien'
  if (view.env.kind === 'fund') {
    return view.remaining > 0 ? 'Apartado' : view.spent > 0 ? 'Del ahorro' : 'Vacío'
  }
  if (view.light === 'green') return 'Bien'
  if (view.light === 'idle') return '—'
  if (view.alert === 'limit') return '100%'
  return `${Math.max(0, view.pct)}%`
}

function alertLine(alert: EnvelopeView['alert'], pct: number): string {
  if (alert === 'half') return `Pasó el 50% (${pct}%)`
  if (alert === 'near') return `Se acerca al límite (${pct}%)`
  if (alert === 'almost') return `Casi al límite (${pct}%)`
  if (alert === 'limit') return 'Al límite'
  if (alert === 'over') return 'Superó el techo'
  return ''
}

export function Home({
  onOpen,
  onEnvelope,
  onSettings,
  onCycle,
}: {
  onOpen: (sheet: NonNullable<SheetState>) => void
  onEnvelope: (id: string) => void
  onSettings: () => void
  onCycle: () => void
}) {
  const state = useAppState()
  const cycle = [...state.cycles].reverse().find((c) => !c.closedAt)
  const views = viewsFor(state)

  if (!cycle) return null

  const pace = paceFor(state)
  const splitViews = views.filter((v) => inDailySplit(v.env))
  const todayLogged = spentOnDay(
    cycleTxs(state, cycle.id),
    splitViews.map((v) => v.env.id),
    todayISO(),
  )
  const splitNames = splitViews.map((v) => v.env.name).join(' + ') || 'Libre'
  const hot = views.filter(
    (v) => v.alert === 'near' || v.alert === 'almost' || v.alert === 'limit' || v.alert === 'over',
  )
  const over = hot.filter((v) => v.alert === 'over')
  const atLimit = hot.filter((v) => v.alert === 'limit')
  const almost = hot.filter((v) => v.alert === 'almost')
  const near = hot.filter((v) => v.alert === 'near')
  const capLine = pace.caps
    .filter((c) => c.remaining > 0)
    .map((c) => `${c.name} ${euros(c.remaining)}`)
    .join(' · ')
  const weekly = weeklyViews(views)
  const snap = accountSnapshot(views)
  const unpaidNames = snap.unpaid.map((v) => v.env.name).join(', ')
  const groups: { title: string; items: EnvelopeView[] }[] = [
    { title: 'Ahorro (se acumula)', items: views.filter((v) => v.env.kind === 'savings') },
    { title: 'Cuotas', items: views.filter((v) => v.env.kind === 'fixed') },
    {
      title: 'Día a día',
      items: views.filter((v) => rhythmOf(v.env) === 'daily'),
    },
    {
      title: 'Fondos (salen del ahorro)',
      items: views.filter((v) => v.env.kind === 'fund'),
    },
  ]

  return (
    <div>
      <header className="topbar">
        <div className="brand">Techo</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="icon-btn" onClick={onCycle} aria-label="Ciclo">
            ↻
          </button>
          <button className="icon-btn" onClick={onSettings} aria-label="Ajustes">
            ⚙
          </button>
        </div>
      </header>

      <div className="actions">
        <button className="btn sage" onClick={() => onOpen({ name: 'add' })}>
          + Gasto
        </button>
        <button className="btn secondary" onClick={() => onOpen({ name: 'move' })}>
          Mover
        </button>
      </div>

      {hot.length > 0 && (
        <div className={`banner ${over.length + atLimit.length + almost.length > 0 ? 'red' : 'orange'}`}>
          {over.length === 1 && <div>{over[0].env.name} superó el techo.</div>}
          {over.length > 1 && <div>Superaron el techo: {over.map((v) => v.env.name).join(', ')}.</div>}
          {atLimit.length === 1 && <div>{atLimit[0].env.name} está al límite.</div>}
          {atLimit.length > 1 && <div>Al límite: {atLimit.map((v) => v.env.name).join(', ')}.</div>}
          {almost.length === 1 && (
            <div>
              {almost[0].env.name} está casi al límite ({almost[0].pct}%).
            </div>
          )}
          {almost.length > 1 && (
            <div>Casi al límite: {almost.map((v) => v.env.name).join(', ')}.</div>
          )}
          {near.length === 1 && (
            <div>
              {near[0].env.name} se acerca al límite ({near[0].pct}%).
            </div>
          )}
          {near.length > 1 && (
            <div>Cerca del límite: {near.map((v) => v.env.name).join(', ')}.</div>
          )}
        </div>
      )}

      <section className="hero">
        <div className="label">Hoy puedes gastar</div>
        <div className="amount">{euros(pace.daily)}</div>
        <div className="sub">
          {pace.daily <= 0 && pace.weekly > 0
            ? 'hoy cerrado · el resto de la semana se recalcula'
            : todayLogged > 0
              ? `hoy ya ${euros(todayLogged)}`
              : `${splitNames} · si te pasas, se cierra el día`}
        </div>
        <div className="hero-pills">
          <div className="hero-pill">
            <div className="k">Esta semana</div>
            <div className="v">{euros(pace.weekly)}</div>
            <div className="s">
              techo inicial {euros(pace.weekAssigned)} · {pace.days}{' '}
              {pace.days === 1 ? 'día' : 'días'}
            </div>
          </div>
          <div className="hero-pill">
            <div className="k">Al mes</div>
            <div className="v">{euros(pace.remaining)}</div>
            <div className="s">{splitNames}</div>
          </div>
        </div>
        <div className="hero-break">
          Semana {WEEKDAY_NAMES[clampWeekStart(state.settings.dailyWeekStartsOn ?? 1)]}–
          {WEEKDAY_NAMES[(clampWeekStart(state.settings.dailyWeekStartsOn ?? 1) + 6) % 7]}.
          Lo que no gastes esta semana no se suma a la siguiente; al cierre puede ir a
          ahorro.
          {capLine ? (
            <>
              <br />
              Ocio: {capLine}
            </>
          ) : null}
        </div>
        <div className="hero-meta">
          <span>{formatRange(cycle.startedAt, cycle.expectedEndAt)}</span>
          <span>Entraron {euros(cycle.income)}</span>
        </div>
      </section>

      <section className="saldo">
        <div className="tiny">En tu cuenta ahora</div>
        <div className="saldo-amount">{euros(snap.inAccount)}</div>
        <p className="muted" style={{ fontSize: 13 }}>
          Debería coincidir con el banco si anotaste todo (un solo bolsillo).
        </p>
        {snap.unpaidTotal > 0 ? (
          <div className="saldo-next">
            <div className="row">
              <span>Cuando salgan las cuotas pendientes</span>
              <b>{euros(snap.afterFixed)}</b>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Falta: {unpaidNames}. Eso que queda es ahorro + variables + fondos.
            </p>
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            Cuotas de este ciclo ya marcadas. Este es el saldo que te queda.
          </p>
        )}
        {snap.floor > 0 && snap.unpaidTotal > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            Si agotas comida, ocio, fútbol y libre, te quedarían {euros(snap.floor)}{' '}
            (ahorro + fondos).
          </p>
        )}
      </section>

      {weekly.length > 0 && (
        <section className="food-panel">
          {weekly.map((v) => (
            <button
              type="button"
              className="food-row"
              id={`sobre-${v.env.id}`}
              key={v.env.id}
              onClick={() => onEnvelope(v.env.id)}
            >
              <div className="row">
                <strong>
                  {v.env.emoji} {v.env.name} esta semana
                </strong>
                <span>
                  {euros(v.week?.spent ?? 0)} / ~{euros(v.week?.target ?? 0)}
                </span>
              </div>
              <div className={`bar ${v.light}`}>
                <span
                  style={{
                    width: `${Math.min(100, v.week && v.week.target > 0 ? Math.round(((v.week.spent) / v.week.target) * 100) : 0)}%`,
                  }}
                />
              </div>
              {v.alert && (
                <div className={`env-warn pill ${v.light}`} style={{ marginTop: 8, display: 'inline-flex' }}>
                  {alertLine(v.alert, v.pct)}
                </div>
              )}
              <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                {v.week?.label}
                {v.week && v.week.daysInCycle < 7
                  ? ` · ${v.week.daysInCycle} días de este ciclo`
                  : ''}
                . Consejo para que dure, no un techo. Mes {euros(v.spent)} / {euros(v.total)}.
                {v.week?.pace === 'fast' ? ' Esta semana vas un poco rápido.' : ''}
                {v.week?.pace === 'over' ? ' Esta semana por encima del consejo.' : ''}
              </p>
            </button>
          ))}
        </section>
      )}

      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.title} style={{ marginBottom: 18 }}>
            <div className="section-title">
              <span>{g.title}</span>
            </div>
            <div className="stack">
              {g.items
                .slice()
                .sort((a, b) => kindOrder(a.env.kind) - kindOrder(b.env.kind))
                .map((v) => (
                  <EnvelopeCard
                    key={v.env.id}
                    view={v}
                    onOpen={() => onEnvelope(v.env.id)}
                    onPay={() => markPaid(v.env.id, v.remaining)}
                    onSpend={() => onOpen({ name: 'add', envelopeId: v.env.id })}
                  />
                ))}
            </div>
          </section>
        ),
      )}
      {state.settings.seenHomeTour === false && (
        <HomeTour
          onSkip={() => updateSettings({ ...state.settings, seenHomeTour: true })}
        />
      )}
    </div>
  )
}

const TOUR = [
  {
    title: 'En tu cuenta ahora',
    body: 'Ese total es lo que debería verse en el banco: ahorro + lo no gastado + alquiler u otras cuotas que aún no hayas marcado pagadas.',
  },
  {
    title: 'Hoy puedes gastar',
    body: 'Cuenta Libre y los techos que marques para el diario. El super u otros techos semanales van en la tarjeta de “esta semana”, no aquí.',
  },
  {
    title: '+ Gasto',
    body: 'Cuánto, en qué sobre, anotar. La app te dice si cabe en ESE sobre. Las cuotas: “Marcar pagado” cuando salgan.',
  },
]

function HomeTour({ onSkip }: { onSkip: () => void }) {
  const [i, setI] = useState(0)
  const page = TOUR[i]
  return (
    <div className="tour">
      <div className="tour-card stack">
        <p className="tiny">
          {i + 1} / {TOUR.length}
        </p>
        <h3 className="serif" style={{ fontSize: 24, margin: 0 }}>
          {page.title}
        </h3>
        <p>{page.body}</p>
        <button
          type="button"
          className="btn full sage"
          onClick={() => {
            if (i < TOUR.length - 1) setI(i + 1)
            else onSkip()
          }}
        >
          {i < TOUR.length - 1 ? 'Siguiente' : 'Empezar'}
        </button>
        <button type="button" className="btn ghost full" onClick={onSkip}>
          Saltar
        </button>
      </div>
    </div>
  )
}

function EnvelopeCard({
  view,
  onOpen,
  onPay,
  onSpend,
}: {
  view: EnvelopeView
  onOpen: () => void
  onPay: () => void
  onSpend: () => void
}) {
  const { env, remaining, total, pct, light, paid } = view
  return (
    <button className="env" id={`sobre-${env.id}`} onClick={onOpen}>
      <div className="emoji">{env.emoji}</div>
      <div>
        <div className="name">{env.name}</div>
        <div className="meta">
          {env.kind === 'savings'
            ? `Usado ${euros(view.used)} este mes`
            : env.kind === 'fund'
            ? `Fondo · gastado ${euros(view.spent)} este ciclo`
            : rhythmOf(env) === 'weekly'
              ? `Semanal · mes ${euros(view.spent)} / ${euros(total)}`
              : KIND_LABEL[env.kind]}
          {env.kind !== 'fund' && rhythmOf(env) !== 'weekly' && total > 0 ? ` · ${pct}% usado` : ''}
          {env.opening > 0 ? ` · traes ${euros(env.opening)}` : ''}
        </div>
      </div>
      <div className="right">
        <div className="remain">{euros(remaining)}</div>
        <span className={`pill ${light}`}>{pillLabel(view)}</span>
      </div>
      <div className={`bar ${light}`}>
        <span style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      {view.alert && (
        <div className={`env-warn pill ${light}`} style={{ justifySelf: 'start' }}>
          {alertLine(view.alert, pct)}
        </div>
      )}
      {env.kind === 'fixed' && !paid && remaining > 0 && (
        <div className="row" style={{ gridColumn: '1 / -1' }}>
          <span className="muted tiny" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Reservado, aún no marcado
          </span>
          <span
            className="paid-btn"
            onClick={(e) => {
              e.stopPropagation()
              onPay()
            }}
          >
            Marcar pagado
          </span>
        </div>
      )}
      {(env.kind === 'cap' || env.kind === 'buffer' || env.kind === 'fund') && (
        <div className="row" style={{ gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
          <span
            className="paid-btn"
            onClick={(e) => {
              e.stopPropagation()
              onSpend()
            }}
          >
            Anotar
          </span>
        </div>
      )}
    </button>
  )
}
