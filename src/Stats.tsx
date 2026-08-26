import { formatRange } from './dates'
import { reportFor } from './logic'
import { euros } from './money'
import { useAppState } from './store'

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
      <p className="muted">
        Un mes es bueno si respetas tu meta de ahorro. Gastar el 50% del sueldo en
        arriendo y comida no es “malo”: es vivir. Lo que cuenta es el colchón.
      </p>

      {live && <ReportCard report={live} live />}

      {closed.length > 0 && (
        <>
          <div className="section-title">
            <span>Ciclos anteriores</span>
          </div>
          {closed.map((c) => (
            <ReportCard key={c.id} report={reportFor(state, c)} />
          ))}
        </>
      )}
      {closed.length === 0 && (
        <p className="muted">
          Cuando cierres el primer ciclo (↻), aquí verás si fue un mes bueno, justo
          o difícil.
        </p>
      )}
    </div>
  )
}

function ReportCard({
  report,
  live,
}: {
  report: ReturnType<typeof reportFor>
  live?: boolean
}) {
  const spentDeg = Math.min(360, (report.spendPct / 100) * 360)
  const tone =
    report.verdict === 'good'
      ? 'hint'
      : report.verdict === 'hard'
        ? 'deficit'
        : report.verdict === 'tight'
          ? 'banner orange'
          : 'hint'

  return (
    <div className="card stack">
      <div className="row">
        <strong>{live ? 'Este ciclo' : formatRange(report.cycle.startedAt, report.cycle.expectedEndAt)}</strong>
        <span className="muted" style={{ fontSize: 13 }}>
          {live ? 'en curso' : 'cerrado'}
        </span>
      </div>
      <div className="chart-row">
        <div
          className="donut"
          style={{
            background: `conic-gradient(var(--terra) 0deg ${spentDeg}deg, var(--sage) ${spentDeg}deg 360deg)`,
          }}
          aria-hidden
        />
        <div className="stack" style={{ gap: 6 }}>
          <div className="row">
            <span>Gastado</span>
            <span>
              {euros(report.spent)} · {report.spendPct}%
            </span>
          </div>
          <div className="row">
            <span>Sin gastar</span>
            <span>
              {euros(report.kept)} · {report.keepPct}%
            </span>
          </div>
          <div className="row">
            <span>Ahorro neto</span>
            <b>{euros(report.savedNet)}</b>
          </div>
          {report.savingsGoal > 0 && (
            <div className="row muted" style={{ fontSize: 13 }}>
              <span>vs meta {euros(report.savingsGoal)}</span>
              <span>{report.goalPct}%</span>
            </div>
          )}
        </div>
      </div>
      {report.savingsUsed > 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          Salieron {euros(report.savingsUsed)} del ahorro este ciclo (viajes, medicina
          u otros).
        </p>
      )}
      <div className={tone} style={{ margin: 0 }}>
        <b>{report.title}.</b> {report.detail}
      </div>
    </div>
  )
}
