import { useState } from 'react'
import { formatDay, formatRange, formatStamp, localDayFromStamp, todayISO, yesterdayISO } from './dates'
import { displayNote } from './i18n'
import { cycleLines, cycleTxs, reportFor, type CycleLine, type CycleReport } from './logic'
import { PocketChips } from './Sheets'
import { removeExpense, removeTx, setTxPocket, useAppState } from './store'
import type { AppState, Pocket, Tx } from './types'
import { useLocale, useMoney, useT } from './useT'

export function StatsScreen() {
  const t = useT()
  const state = useAppState()
  const [openId, setOpenId] = useState<string | null>(null)
  const current = [...state.cycles].reverse().find((c) => !c.closedAt)
  const closed = state.cycles.filter((c) => c.closedAt).slice().reverse()
  const live = current ? reportFor(state, current) : null
  const prevSpent = closed[0] ? reportFor(state, closed[0]).spent : undefined

  function toggle(id: string) {
    setOpenId((cur) => (cur === id ? null : id))
  }

  return (
    <div className="stack">
      <header className="topbar">
        <div className="brand">Techo</div>
      </header>
      <h2 className="serif" style={{ fontSize: 28, marginTop: -8 }}>
        {t('stats.title')}
      </h2>

      {live && current && (
        <CycleCard
          report={live}
          lines={cycleLines(state, current.id, true)}
          open={openId === current.id}
          onToggle={() => toggle(current.id)}
          prevSpent={prevSpent}
        />
      )}

      {closed.length > 0 && (
        <>
          <div className="section-title">
            <span>{t('stats.prev')}</span>
          </div>
          {closed.map((c) => (
            <CycleCard
              key={c.id}
              report={reportFor(state, c)}
              lines={cycleLines(state, c.id, false)}
              open={openId === c.id}
              onToggle={() => toggle(c.id)}
              archived
            />
          ))}
        </>
      )}

      {!live && closed.length === 0 && <p className="muted">{t('stats.noSpend')}</p>}
    </div>
  )
}

function CycleCard({
  report,
  lines,
  open,
  onToggle,
  prevSpent,
  archived,
}: {
  report: CycleReport
  lines: { lines: CycleLine[]; olderCard: number }
  open: boolean
  onToggle: () => void
  prevSpent?: number
  archived?: boolean
}) {
  const t = useT()
  const money = useMoney()
  const locale = useLocale()
  const topEnv = lines.lines.find((row) => row.spent > 0)
  const top =
    lines.olderCard > (topEnv?.spent ?? 0)
      ? { name: t('stats.olderCard'), spent: lines.olderCard }
      : topEnv
  const left = report.income - report.spent
  return (
    <section className="card stack">
      <strong>{formatRange(report.cycle.startedAt, report.cycle.expectedEndAt, locale)}</strong>
      <div className="row">
        <span className="muted">{t('stats.cameIn')}</span>
        <b>{money(report.income)}</b>
      </div>
      <div className="row">
        <span className="muted">{t('stats.went')}</span>
        <b>{money(report.spent)}</b>
      </div>
      <div className="row">
        <span className="muted">{t('stats.remains')}</span>
        <b>{money(left)}</b>
      </div>
      {top ? <p className="muted" style={{ margin: 0 }}>{t('stats.top', { name: top.name, amount: money(top.spent) })}</p> : null}
      {!archived && report.spent <= 0 ? <p className="muted" style={{ margin: 0 }}>{t('stats.noSpend')}</p> : null}
      {prevSpent != null ? (
        <p className="muted" style={{ margin: 0 }}>
          {t('stats.vsPrev', { prev: money(prevSpent), now: money(report.spent) })}
        </p>
      ) : null}
      {archived ? <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t('stats.archived')}</p> : null}
      <button type="button" className="btn ghost full" onClick={onToggle}>
        {open ? t('stats.hide') : t('stats.detail')}
      </button>
      {open && (
        <div className="stack" style={{ gap: 8 }}>
          {lines.lines.map((row) => (
            <div className="row" key={row.id}>
              <span>
                {row.emoji} {row.name}
              </span>
              <span>
                {money(row.spent)}
                {row.remaining != null ? ` · ${t('stats.still', { amount: money(row.remaining) })}` : ''}
              </span>
            </div>
          ))}
          {lines.olderCard > 0 && (
            <div className="row">
              <span>{t('stats.olderCard')}</span>
              <b>{money(lines.olderCard)}</b>
            </div>
          )}
          {lines.lines.length === 0 && lines.olderCard <= 0 && (
            <p className="muted" style={{ margin: 0 }}>{t('stats.noSpend')}</p>
          )}
        </div>
      )}
    </section>
  )
}

export function ActivityScreen({ onEdit }: { onEdit: (txId: string) => void }) {
  const t = useT()
  const state = useAppState()
  const current = [...state.cycles].reverse().find((c) => !c.closedAt)
  return (
    <div className="stack">
      <header className="topbar">
        <div className="brand">Techo</div>
      </header>
      <h2 className="serif" style={{ fontSize: 28, marginTop: -8 }}>
        {t('nav.activity')}
      </h2>
      {current ? (
        <RecentList cycleId={current.id} onEdit={onEdit} />
      ) : (
        <p className="muted">{t('stats.noRecent')}</p>
      )}
    </div>
  )
}

type ActivityFilter = 'all' | 'cash' | 'credit'

function RecentList({ cycleId, onEdit }: { cycleId: string; onEdit: (txId: string) => void }) {
  const state = useAppState()
  const t = useT()
  const money = useMoney()
  const locale = useLocale()
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [pending, setPending] = useState<Tx | null>(null)
  const rows = cycleTxs(state, cycleId)
    .filter((tx) => matchesFilter(tx, filter))
    .slice()
    .reverse()
  const groups = groupByDay(rows)

  return (
    <div className="stack">
      <div className="chips">
        {(['all', 'cash', 'credit'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${filter === key ? 'on' : ''}`}
            onClick={() => setFilter(key)}
          >
            {t(key === 'all' ? 'activity.all' : key === 'cash' ? 'activity.cash' : 'activity.credit')}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="muted">{filter === 'all' ? t('stats.noRecent') : t('activity.none')}</p>
      ) : (
        groups.map((group) => (
          <section className="card stack" key={group.day}>
            <strong>{dayLabel(group.day, t, locale)}</strong>
            {group.rows.map((tx) => (
              <ActivityRow key={tx.id} tx={tx} state={state} onEdit={onEdit} onDelete={() => setPending(tx)} />
            ))}
          </section>
        ))
      )}
      {pending && (
        <div className="sheet-backdrop" onClick={() => setPending(null)}>
          <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
            <div className="handle" />
            <h2 className="serif" style={{ fontSize: 26 }}>
              {t('env.deleteTitle')}
            </h2>
            <p>
              {money(pending.amount)}
              {pending.note ? ` · ${displayNote(pending.note, locale)}` : ''}
            </p>
            <p className="muted">{t('env.deleteBody')}</p>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setPending(null)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  if (pending.type === 'expense') removeExpense(pending.id)
                  else removeTx(pending.id)
                  setPending(null)
                }}
              >
                {t('common.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityRow({
  tx,
  state,
  onEdit,
  onDelete,
}: {
  tx: Tx
  state: AppState
  onEdit: (txId: string) => void
  onDelete: () => void
}) {
  const t = useT()
  const money = useMoney()
  const locale = useLocale()
  const env = state.envelopes.find((e) => e.id === tx.envelopeId)
  const dest = tx.toEnvelopeId ? state.envelopes.find((e) => e.id === tx.toEnvelopeId) : undefined
  const sign = tx.type === 'expense' ? '−' : tx.type === 'income' ? '+' : ''
  const title =
    tx.type === 'transfer'
      ? t('stats.moved', {
          from: env ? `${env.emoji} ${env.name}` : t('env.txOut'),
          to: dest ? `${dest.emoji} ${dest.name}` : t('env.txIn'),
        })
      : tx.type === 'pocket' || tx.type === 'cardpay'
        ? tx.note
        : env
          ? `${env.emoji} ${env.name}`
          : tx.type === 'income'
            ? t('env.txIncome')
            : t('env.txExpense')
  const paidWith: Pocket = tx.pocket === 'cash' || tx.pocket === 'credit' ? tx.pocket : 'card'
  return (
    <div className="tx">
      <div>
        <div>{title}</div>
        <div className="muted">
          {formatStamp(tx.at, locale)}
          {tx.type !== 'pocket' && tx.type !== 'cardpay' && tx.note ? ` · ${displayNote(tx.note, locale)}` : ''}
        </div>
        {(tx.type === 'expense' || tx.type === 'income') && (
          <PocketChips value={paidWith} onChange={(next) => setTxPocket(tx.id, next)} />
        )}
        {tx.type === 'expense' && tx.pocket === 'credit' && (tx.parkedOnSavings ?? 0) > 0 ? (
          <div className="muted">{t('tx.creditFundWaits', { amount: money(tx.parkedOnSavings ?? 0) })}</div>
        ) : tx.type === 'expense' &&
          tx.pocket === 'credit' &&
          env?.kind !== 'fund' &&
          tx.counted != null &&
          tx.counted < tx.amount ? (
          <div className="muted">{t('tx.creditWaits', { amount: money(tx.amount - tx.counted) })}</div>
        ) : null}
        <div style={{ marginTop: 6 }}>
          {tx.type === 'expense' && (
            <button type="button" className="back" onClick={() => onEdit(tx.id)}>
              {t('env.edit')}
            </button>
          )}{' '}
          <button type="button" className="back" onClick={onDelete}>
            {t('env.delete')}
          </button>
        </div>
      </div>
      <div>
        {sign}
        {money(tx.amount)}
      </div>
    </div>
  )
}

function matchesFilter(tx: Tx, filter: ActivityFilter): boolean {
  if (filter === 'all') {
    return (
      tx.type === 'expense' ||
      tx.type === 'income' ||
      tx.type === 'transfer' ||
      tx.type === 'pocket' ||
      tx.type === 'cardpay'
    )
  }
  if (filter === 'cash') return tx.pocket === 'cash'
  return tx.pocket === 'credit' || tx.type === 'cardpay'
}

function groupByDay(rows: Tx[]): { day: string; rows: Tx[] }[] {
  const groups: { day: string; rows: Tx[] }[] = []
  const index = new Map<string, number>()
  for (const tx of rows) {
    const day = localDayFromStamp(tx.at)
    const at = index.get(day)
    if (at == null) {
      index.set(day, groups.length)
      groups.push({ day, rows: [tx] })
    } else groups[at].rows.push(tx)
  }
  return groups
}

function dayLabel(
  day: string,
  t: (key: 'activity.today' | 'activity.yesterday', vars?: Record<string, string | number>) => string,
  locale: ReturnType<typeof useLocale>,
): string {
  if (day === todayISO()) return t('activity.today')
  if (day === yesterdayISO()) return t('activity.yesterday')
  return formatDay(day, locale)
}
