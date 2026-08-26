import { formatRange } from './dates'
import { reportFor, type CycleReport } from './logic'
import { euros } from './money'
import { useAppState } from './store'

const COLORS = ['#2c5a43', '#4a7a5e', '#6b8aa8', '#c65a12', '#8d6110', '#b4452c', '#7a6b8a']

type Slice = { id: string; name: string; emoji: string; amount: number }

export function StatsScreen() {
  const state = useAppState()
  const current = [...state.cycles].reverse().find((c) => !c.closedAt)
  const closed = state.cycles.filter((c) => c.closedAt).slice().reverse()
  const live = current ? reportFor(state, current) : null

  return (
    <div className="stack">
      <header className="topbar">
        <div className="brand">Techo</div>
      </header>
      <h2 className="serif" style={{ fontSize: 28, marginTop: -8 }}>
        Estadísticas
      </h2>

      {live && <LiveReport report={live} />}

      {closed.length > 0 && (
        <>
          <div className="section-title">
            <span>Meses anteriores</span>
          </div>
          {closed.map((c) => (
            <PastRow key={c.id} report={reportFor(state, c)} />
          ))}
        </>
      )}
    </div>
  )
}

function LiveReport({ report }: { report: CycleReport }) {
  const sign = report.savedNet >= 0 ? '+' : ''
  const heroClass =
    report.verdict === 'good'
      ? 'stats-hero good'
      : report.verdict === 'hard'
        ? 'stats-hero hard'
        : report.verdict === 'tight'
          ? 'stats-hero tight'
          : 'stats-hero ok'

  const variableSlices: Slice[] = [
    ...report.variable
      .filter((r) => r.spent > 0)
      .map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, amount: r.spent })),
    ...(report.variableCap - report.variableSpent > 0
      ? [
          {
            id: 'sin-gastar',
            name: 'Aún sin gastar',
            emoji: '🫧',
            amount: report.variableCap - report.variableSpent,
          },
        ]
      : []),
  ]

  return (
    <>
      <section className={heroClass}>
        <div className="label">{report.title}</div>
        <div className="amount">
          {sign}
          {euros(report.savedNet)}
        </div>
        <div className="sub">
          {report.savingsGoal > 0
            ? `ahorro neto · meta ${euros(report.savingsGoal)} · ${report.goalPct}%`
            : 'ahorro neto de este ciclo'}
        </div>
        <p className="stats-hero-copy">{report.detail}</p>
      </section>

      <section className="card stack">
        <div>
          <strong>Qué forma este ahorro</strong>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Lo que apartaste más lo que no gastaste en variables. Las cuotas no
            entran: son las mismas cada mes.
          </p>
        </div>
        {report.contributions.some((c) => c.amount > 0) ? (
          <Pie slices={report.contributions.filter((c) => c.amount > 0)} />
        ) : (
          <p className="muted">Aún no hay ahorro que mostrar en este ciclo.</p>
        )}
        {report.savingsUsed > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            De esa suma hay que restar {euros(report.savingsUsed)} que salieron del
            colchón → neto {euros(report.savedNet)}.
          </p>
        )}
      </section>

      <section className="card stack">
        <div>
          <strong>Variables: en qué se fue el techo</strong>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Comida, ocio, fútbol y libre. Si no gastaste nada, no hay gráfico.
          </p>
        </div>
        {report.variableSpent <= 0 ? (
          <p className="muted">Todavía no hay gastos variables.</p>
        ) : (
          <>
            <p>
              Gastaste <b>{euros(report.variableSpent)}</b> de{' '}
              <b>{euros(report.variableCap)}</b> en lo que sí cambia.
            </p>
            <Pie slices={variableSlices} />
          </>
        )}
      </section>

      <section className="card stack">
        <div>
          <strong>Si tocaste el ahorro</strong>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Viajes, ropa y medicina. Aquí ves cuánto salió y a qué se fue.
          </p>
        </div>
        {report.savingsUsed <= 0 ? (
          <div className="hint" style={{ margin: 0 }}>
            Este ciclo no tocaste el ahorro. El colchón sigue quieto.
          </div>
        ) : (
          <>
            <p>
              Salieron <b>{euros(report.savingsUsed)}</b> del colchón.
            </p>
            <Pie slices={report.savingsParts} />
          </>
        )}
      </section>
    </>
  )
}

function PastRow({ report }: { report: CycleReport }) {
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <div className="row">
        <strong>{formatRange(report.cycle.startedAt, report.cycle.expectedEndAt)}</strong>
        <span className={`pill ${tonePill(report.verdict)}`}>{report.title}</span>
      </div>
      <div className="row">
        <span className="muted">Ahorro neto</span>
        <b>{euros(report.savedNet)}</b>
      </div>
      {report.savingsUsed > 0 && (
        <div className="muted" style={{ fontSize: 13 }}>
          Del ahorro: {report.savingsParts.map((p) => `${p.emoji} ${euros(p.amount)}`).join(' · ')}
        </div>
      )}
    </div>
  )
}

function tonePill(v: CycleReport['verdict']): string {
  if (v === 'good') return 'green'
  if (v === 'hard') return 'red'
  if (v === 'tight') return 'orange'
  return 'yellow'
}

function Pie({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((s, x) => s + x.amount, 0)
  if (total <= 0) return <p className="muted">Nada que graficar aún.</p>
  let deg = 0
  const parts: string[] = []
  const colored = slices.map((s, i) => {
    const start = deg
    const span = (s.amount / total) * 360
    deg += span
    const color = COLORS[i % COLORS.length]
    parts.push(`${color} ${start}deg ${deg}deg`)
    return { ...s, color, pct: Math.round((s.amount / total) * 100) }
  })

  return (
    <div className="pie-wrap">
      <div
        className="donut"
        style={{ background: `conic-gradient(${parts.join(', ')})` }}
        aria-hidden
      />
      <ul className="pie-legend">
        {colored.map((s) => (
          <li key={s.id}>
            <span className="swatch" style={{ background: s.color }} />
            <span>
              {s.emoji} {s.name}
            </span>
            <b>
              {euros(s.amount)} · {s.pct}%
            </b>
          </li>
        ))}
      </ul>
    </div>
  )
}
