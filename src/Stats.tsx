import { formatRange } from './dates'
import { reportFor, type CycleReport } from './logic'
import { useAppState } from './store'
import { useLocale, useMoney, useT } from './useT'

const COLORS = ['#2c5a43', '#4a7a5e', '#6b8aa8', '#c65a12', '#8d6110', '#b4452c', '#7a6b8a']

type Slice = { id: string; name: string; emoji: string; amount: number }

export function StatsScreen() {
  const t = useT()
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
        {t('stats.title')}
      </h2>

      {live && <LiveReport report={live} />}

      {closed.length > 0 && (
        <>
          <div className="section-title">
            <span>{t('stats.prev')}</span>
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
  const t = useT()
  const money = useMoney()
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
            name: t('stats.unspent'),
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
          {money(report.savedNet)}
        </div>
        <div className="sub">
          {report.savingsGoal > 0
            ? `${t('stats.netSav')} · ${money(report.savingsGoal)} · ${report.goalPct}%`
            : t('stats.netSav')}
        </div>
        <p className="stats-hero-copy">{report.detail}</p>
      </section>

      <section className="card stack">
        <strong>{t('stats.savedShape')}</strong>
        {report.contributions.some((c) => c.amount > 0) ? (
          <Pie slices={report.contributions.filter((c) => c.amount > 0)} />
        ) : (
          <p className="muted">{t('stats.noSav')}</p>
        )}
        {report.savingsUsed > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            {t('stats.usedSav', { used: money(report.savingsUsed), net: money(report.savedNet) })}
          </p>
        )}
      </section>

      <section className="card stack">
        <strong>{t('stats.variable')}</strong>
        {report.variableSpent <= 0 ? (
          <p className="muted">{t('stats.noVar')}</p>
        ) : (
          <>
            <p>{t('stats.spentOf', { spent: money(report.variableSpent), cap: money(report.variableCap) })}</p>
            <Pie slices={variableSlices} />
          </>
        )}
      </section>

      <section className="card stack">
        <strong>{t('stats.touched')}</strong>
        {report.savingsUsed <= 0 ? (
          <p className="muted">{t('stats.untouched')}</p>
        ) : (
          <>
            <p>{t('stats.leftSav', { amount: money(report.savingsUsed) })}</p>
            <Pie slices={report.savingsParts} />
          </>
        )}
      </section>
    </>
  )
}

function PastRow({ report }: { report: CycleReport }) {
  const t = useT()
  const money = useMoney()
  const locale = useLocale()
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <div className="row">
        <strong>{formatRange(report.cycle.startedAt, report.cycle.expectedEndAt, locale)}</strong>
        <span className={`pill ${tonePill(report.verdict)}`}>{report.title}</span>
      </div>
      <div className="row">
        <span className="muted">{t('stats.netSav')}</span>
        <b>{money(report.savedNet)}</b>
      </div>
      {report.savingsUsed > 0 && (
        <div className="muted" style={{ fontSize: 13 }}>
          {t('stats.fromSav', {
            list: report.savingsParts.map((p) => `${p.emoji} ${money(p.amount)}`).join(' · '),
          })}
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
  const t = useT()
  const money = useMoney()
  const total = slices.reduce((s, x) => s + x.amount, 0)
  if (total <= 0) return <p className="muted">{t('stats.noChart')}</p>
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
              {money(s.amount)} · {s.pct}%
            </b>
          </li>
        ))}
      </ul>
    </div>
  )
}
