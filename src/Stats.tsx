import { formatRange } from './dates'
import { reportFor, type CycleReport, type SpendRow } from './logic'
import { euros } from './money'
import { useAppState } from './store'

const BAR = ['#2c5a43', '#4a7a5e', '#c65a12', '#8d6110', '#6b8aa8', '#b4452c']

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
            ? `hacia tu meta de ${euros(report.savingsGoal)} · ${report.goalPct}%`
            : 'ahorro neto de este ciclo'}
        </div>
        <p className="stats-hero-copy">{report.detail}</p>
      </section>

      <section className="card stack">
        <div>
          <strong>Lo que sí cambia</strong>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Variables: comida, ocio, fútbol, libre. Las cuotas no están aquí porque
            cada mes son las mismas.
          </p>
        </div>
        {report.variable.length === 0 || report.variableSpent === 0 ? (
          <p className="muted">Aún no hay gastos variables en este ciclo.</p>
        ) : (
          <Bars
            rows={report.variable.map((r) => ({
              ...r,
              value: r.spent,
              total: r.cap > 0 ? r.cap : r.spent,
            }))}
          />
        )}
        {report.variableCap > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            Llevas {euros(report.variableSpent)} de {euros(report.variableCap)} en
            variables.
          </p>
        )}
      </section>

      <section className="card stack">
        <div>
          <strong>El ahorro</strong>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Viajes, ropa y medicina salen de aquí. Si el colchón no se tocó, el mes
            va bien.
          </p>
        </div>
        {report.savingsUsed <= 0 ? (
          <div className="hint" style={{ margin: 0 }}>
            Este ciclo no tocaste el ahorro. El colchón sigue quieto.
          </div>
        ) : (
          <>
            <div className="row">
              <span>Salieron del colchón</span>
              <b>{euros(report.savingsUsed)}</b>
            </div>
            <Bars
              rows={report.savingsParts.map((p) => ({
                id: p.id,
                name: p.name,
                emoji: p.emoji,
                spent: p.amount,
                cap: report.savingsUsed,
                remaining: 0,
                value: p.amount,
                total: report.savingsUsed,
              }))}
              mode="share"
            />
          </>
        )}
      </section>

      {report.fixedSpent > 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          Cuotas ya marcadas: {euros(report.fixedSpent)} (no entran en las gráficas:
          se repiten cada mes).
        </p>
      )}
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

function Bars({
  rows,
  mode = 'techo',
}: {
  rows: (SpendRow & { value: number; total: number })[]
  mode?: 'techo' | 'share'
}) {
  const max = Math.max(...rows.map((r) => r.total), 1)
  return (
    <div className="stats-bars">
      {rows.map((r, i) => {
        const pct = r.total > 0 ? Math.min(100, Math.round((r.value / r.total) * 100)) : 0
        const width = mode === 'share' ? pct : Math.min(100, Math.round((r.value / max) * 100))
        return (
          <div key={r.id} className="stats-bar">
            <div className="row">
              <span>
                {r.emoji} {r.name}
              </span>
              <span>
                {euros(r.value)}
                {mode === 'techo' && r.cap > 0 ? ` / ${euros(r.cap)}` : ''}
                {mode === 'share' ? ` · ${pct}%` : ''}
              </span>
            </div>
            <div className="bar idle">
              <span
                style={{
                  width: `${width}%`,
                  background: BAR[i % BAR.length],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
