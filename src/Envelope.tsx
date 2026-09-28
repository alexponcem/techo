import { useState } from 'react'
import { activeCycle, cycleTxs, envelopeView, rhythmOf, weekStartOfEnv } from './logic'
import { parseEuros } from './money'
import { useLocale, useMoney, useT } from './useT'
import { WeekStartSelect } from './WeekStartSelect'
import { EMOJI_PICK, kindHint, kindLabel } from './template'
import {
  addSubfund,
  markPaid,
  removeExpense,
  removeTx,
  renameEnvelope,
  setEnvelopeWeekStart,
  setSplitDaily,
  updatePlanned,
  useAppState,
} from './store'
import type { Tx } from './types'

export function EnvelopeScreen({
  id,
  onBack,
  onAdd,
  onEdit,
  onOpen,
}: {
  id: string
  onBack: () => void
  onAdd: () => void
  onEdit: (txId: string) => void
  onOpen: (id: string) => void
}) {
  const state = useAppState()
  const tr = useT()
  const money = useMoney()
  const locale = useLocale()
  const cycle = activeCycle(state)
  const env = state.envelopes.find((e) => e.id === id)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState<Tx | null>(null)
  const [folderName, setFolderName] = useState('')
  const [folderEmoji, setFolderEmoji] = useState('✈️')

  if (!cycle || !env) {
    return (
      <div>
        <button className="back" onClick={onBack}>
          {tr('cycle.home')}
        </button>
        <p>{tr('env.missing')}</p>
      </div>
    )
  }
  const allTxs = cycleTxs(state, cycle.id)
  const txs = allTxs.filter((t) => t.envelopeId === id || t.toEnvelopeId === id)
  const view = envelopeView(env, allTxs, cycle, undefined, undefined, weekStartOfEnv(env, state), locale)
  const childViews = state.envelopes
    .filter((e) => e.parentId === env.id)
    .map((e) => envelopeView(e, allTxs, cycle, undefined, undefined, weekStartOfEnv(e, state), locale))
  const groupRemaining = view.remaining + childViews.reduce((s, c) => s + c.remaining, 0)
  const groupSpent = view.spent + childViews.reduce((s, c) => s + c.spent, 0)
  const shownRemaining = env.kind === 'fund' && !env.parentId ? groupRemaining : view.remaining

  function saveTecho() {
    if (!env) return
    const cents = parseEuros(draft)
    if (cents === null || cents < 0) {
      setMsg(tr('env.needAmount'))
      return
    }
    updatePlanned(env.id, cents)
    setEditing(false)
    setMsg(tr('env.capOk'))
  }

  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        {tr('cycle.home')}
      </button>
      <div className="hero">
        <div className="label">
          {env.emoji} {kindLabel(env.kind, locale)}
        </div>
        <div className="amount">{money(shownRemaining)}</div>
        <div className="sub">
          {env.name}
          {env.kind === 'savings'
            ? tr('env.savingsUsed', { amount: money(view.used), pct: view.pct })
            : env.kind === 'fund' && childViews.length > 0
              ? groupRemaining > 0 && groupSpent > 0
                ? tr('fund.both', { set: money(groupRemaining), spent: money(groupSpent) })
                : groupSpent > 0
                  ? tr('fund.spentBit', { amount: money(groupSpent) })
                  : tr('fund.setAside', { amount: money(groupRemaining) })
              : tr('env.leftOf', { total: money(view.total) })}
        </div>
      </div>
      {view.week && (
        <div className="hint">
          {tr('env.weekHint', {
            label: view.week.label,
            days: view.week.daysInCycle,
            dayWord: view.week.daysInCycle === 1 ? tr('common.day') : tr('common.days'),
            target: money(view.week.target),
            spent: money(view.week.spent),
            total: money(view.total),
          })}
        </div>
      )}
      <p className="muted">
        {env.kind === 'fixed'
          ? tr('env.hintBill')
          : rhythmOf(env) === 'weekly'
            ? tr('env.hintWeekly')
            : env.kind === 'fund'
              ? tr('env.hintGoal')
              : env.kind === 'savings'
                ? tr('env.hintSav')
                : kindHint(env.kind, locale)}
      </p>
      <div className="actions">
        <button className="btn sage" onClick={onAdd}>
          {env.kind === 'savings' ? tr('env.useSav') : tr('home.spend')}
        </button>
        {env.kind === 'fixed' && view.remaining > 0 && (
          <button className="btn secondary" onClick={() => markPaid(env.id, view.remaining)}>
            {tr('home.markPaid')}
          </button>
        )}
      </div>
      {env.kind !== 'buffer' && (
        <div className="card stack">
          {editingName ? (
            <>
              <label className="field">
                {tr('setup.name')}
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn full"
                onClick={() => {
                  const next = nameDraft.trim()
                  if (!next) {
                    setMsg(tr('env.needName'))
                    return
                  }
                  renameEnvelope(env.id, next)
                  setEditingName(false)
                  setMsg(tr('env.nameOk'))
                }}
              >
                {tr('env.saveName')}
              </button>
              <button type="button" className="btn ghost full" onClick={() => setEditingName(false)}>
                {tr('common.cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn ghost full"
              onClick={() => {
                setNameDraft(env.name)
                setEditingName(true)
                setMsg('')
              }}
            >
              {tr('env.changeName')}
            </button>
          )}
          <div className="row">
            <strong>{tr('env.cycleCap')}</strong>
            <span>{money(env.planned)}</span>
          </div>
          {editing ? (
            <>
              <input
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nuevo techo"
              />
              <button type="button" className="btn full" onClick={saveTecho}>
                {tr('common.save')}
              </button>
              <button type="button" className="btn ghost full" onClick={() => setEditing(false)}>
                {tr('common.cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn ghost full"
              onClick={() => {
                setDraft(String(env.planned / 100))
                setEditing(true)
                setMsg('')
              }}
            >
              {tr('env.editCap')}
            </button>
          )}
          {msg ? <p className="muted">{msg}</p> : null}
          {env.kind === 'fund' && !env.parentId && (
            <div className="stack" style={{ gap: 8 }}>
              <strong>{tr('fund.folders')}</strong>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                {tr('fund.hint')}
              </p>
              {childViews.map((child) => (
                <button
                  key={child.env.id}
                  type="button"
                  className="btn ghost full"
                  onClick={() => onOpen(child.env.id)}
                >
                  {child.env.emoji} {child.env.name} ·{' '}
                  {child.remaining > 0 && child.spent > 0
                    ? tr('fund.both', { set: money(child.remaining), spent: money(child.spent) })
                    : child.spent > 0
                      ? tr('fund.spentBit', { amount: money(child.spent) })
                      : tr('fund.setAside', { amount: money(child.remaining) })}
                </button>
              ))}
              <div className="chips" style={{ flexWrap: 'wrap' }}>
                {EMOJI_PICK.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`chip ${folderEmoji === e ? 'on' : ''}`}
                    onClick={() => setFolderEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder={tr('fund.ph')}
              />
              <button
                type="button"
                className="btn full"
                onClick={() => {
                  const result = addSubfund(env.id, folderName, folderEmoji)
                  if (!result.ok) {
                    setMsg(result.error)
                    return
                  }
                  setFolderName('')
                  setMsg('')
                }}
              >
                {tr('fund.add')}
              </button>
            </div>
          )}
          {env.parentId && (
            <p className="muted" style={{ fontSize: 13 }}>
              {tr('fund.inParent', {
                name: state.envelopes.find((e) => e.id === env.parentId)?.name ?? '',
              })}
            </p>
          )}
          {env.kind === 'cap' && rhythmOf(env) === 'weekly' && !env.splitDaily && (
            <WeekStartSelect
              value={weekStartOfEnv(env, state)}
              onChange={(day) => setEnvelopeWeekStart(env.id, day)}
            />
          )}
          {env.kind === 'cap' && (
            <label className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <input
                type="checkbox"
                checked={Boolean(env.splitDaily)}
                onChange={(e) => setSplitDaily(env.id, e.target.checked)}
                style={{ marginTop: 4 }}
              />
              <span>
                <span style={{ fontWeight: 500 }}>{tr('env.addDaily')}</span>
                <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                  {tr('env.addDailyHint')}
                </span>
              </span>
            </label>
          )}
        </div>
      )}
      <div className="section-title">
        <span>{tr('env.txs')}</span>
        <span className="muted">{txs.length}</span>
      </div>
      <div className="card">
        {txs.length === 0 && <p className="muted">{tr('env.noTx')}</p>}
        {txs
          .slice()
          .reverse()
          .map((t) => (
            <div className="tx" key={t.id}>
              <div>
                <div>{labelTx(t.type, t.envelopeId === id, tr)}</div>
                <div className="muted">
                  {new Date(t.at).toLocaleString(locale === 'en' ? 'en-US' : 'es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {t.note ? ` · ${t.note}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{sign(t, id)}{money(t.amount)}</div>
                {t.type === 'expense' && (
                  <button type="button" className="back" onClick={() => onEdit(t.id)}>
                    {tr('env.edit')}
                  </button>
                )}
                {' '}
                <button type="button" className="back" onClick={() => setPending(t)}>
                  {tr('env.delete')}
                </button>
              </div>
            </div>
          ))}
      </div>
      {pending && (
        <div className="sheet-backdrop" onClick={() => setPending(null)}>
          <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
            <div className="handle" />
            <h2 className="serif" style={{ fontSize: 26 }}>
              {tr('env.deleteTitle')}
            </h2>
            <p>
              {sign(pending, id)}
              {money(pending.amount)}
              {pending.note ? ` · ${pending.note}` : ''}
            </p>
            <p className="muted">
              {tr('env.deleteBody')}
            </p>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setPending(null)}>
                {tr('common.cancel')}
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
                {tr('common.yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function labelTx(
  type: string,
  outgoing: boolean,
  tr: (k: 'env.txExpense' | 'env.txIncome' | 'env.txOut' | 'env.txIn') => string,
): string {
  if (type === 'expense') return tr('env.txExpense')
  if (type === 'income') return tr('env.txIncome')
  return outgoing ? tr('env.txOut') : tr('env.txIn')
}

function sign(t: { type: string; envelopeId: string; toEnvelopeId?: string }, id: string): string {
  if (t.type === 'income') return '+'
  if (t.type === 'expense') return '−'
  if (t.toEnvelopeId === id) return '+'
  return '−'
}
