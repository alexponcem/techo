import { kindOrder, paceFor, rhythmOf, viewsFor, weeklyViews, type EnvelopeView } from './logic'
import { formatRange } from './dates'
import { euros } from './money'
import { KIND_LABEL } from './template'
import { markPaid, useAppState } from './store'
import type { Sheet as SheetState } from './types'

function pillLabel(view: EnvelopeView): string {
  if (view.paid) return 'Pagado'
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

  const pace = paceFor(views, cycle)
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
  const groups: { title: string; items: EnvelopeView[] }[] = [
    { title: 'Ahorro (se acumula)', items: views.filter((v) => v.env.kind === 'savings') },
    { title: 'Cuotas', items: views.filter((v) => v.env.kind === 'fixed') },
    {
      title: 'Día a día',
      items: views.filter((v) => rhythmOf(v.env) === 'daily'),
    },
    {
      title: 'Viajes y ropa (salen del ahorro)',
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
        <div className="label">Te queda para el día a día</div>
        <div className="amount">{euros(pace.remaining)}</div>
        <div className="sub">
          ocio + libre · {pace.days} {pace.days === 1 ? 'día' : 'días'} · la comida va aparte
        </div>
        <div className="hero-pills">
          <div className="hero-pill">
            <div className="k">Hoy</div>
            <div className="v">{euros(pace.daily)}</div>
            <div className="s">ritmo para que alcance</div>
          </div>
          <div className="hero-pill">
            <div className="k">{pace.weekDays < 7 ? 'Hasta el sueldo' : 'Esta semana'}</div>
            <div className="v">{euros(pace.weekly)}</div>
            <div className="s">
              {pace.weekDays < 7
                ? 'lo que queda del ciclo'
                : `máximo en 7 días`}
            </div>
          </div>
        </div>
        <div className="hero-break">
          <b>Libre {euros(pace.libre)}</b>
          {': si no lo gastas, al cerrar el ciclo puede ir a ahorro, viajes o ropa.'}
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
                  {euros(v.week?.spent ?? 0)} / {euros(v.week?.target ?? 0)}
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
                {v.week?.label ?? 'viernes → jueves'}
                {v.env.id === 'comida'
                  ? ` · 130 € ÷ 4,5 semanas ≈ 29 € · mes ${euros(v.spent)} / ${euros(v.total)}`
                  : v.env.id === 'futbol'
                    ? ` · 25 € ÷ 4,5 semanas ≈ 6 €/partido · mes ${euros(v.spent)} / ${euros(v.total)}`
                    : ` · mes ${euros(v.spent)} / ${euros(v.total)}`}
                . Anotas el día que lo gastas.
              </p>
            </button>
          ))}
        </section>
      )}

      <div className="actions">
        <button className="btn sage" onClick={() => onOpen({ name: 'add' })}>
          + Gasto
        </button>
        <button className="btn secondary" onClick={() => onOpen({ name: 'move' })}>
          Mover
        </button>
      </div>

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
          {env.kind === 'fund'
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
