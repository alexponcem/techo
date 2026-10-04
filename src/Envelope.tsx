import { useState } from 'react'
import { formatRange } from './dates'
import {
  activeCycle,
  cycleTxs,
  envelopeTree,
  envelopeView,
  fundCarryGap,
  fundLifeTxs,
  fundPastCycles,
  fundSpentSince,
  rhythmOf,
  weekStartOfEnv,
} from './logic'
import { displayNote } from './i18n'
import { parseEuros } from './money'
import { useLocale, useMoney, useT } from './useT'
import { WeekStartSelect } from './WeekStartSelect'
import { EMOJI_PICK, kindLabel } from './template'
import {
  addSubfund,
  closeFund,
  markPaid,
  moveMoney,
  reopenFund,
  removeEnvelope,
  removeExpense,
  removeTx,
  renameEnvelope,
  restoreFundCarry,
  setCycleSetAside,
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
  const [removing, setRemoving] = useState(false)
  const [destId, setDestId] = useState('')
  const [moveTo, setMoveTo] = useState('')
  const [moveAmount, setMoveAmount] = useState('')

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
  const lifeSpent =
    env.kind === 'fund'
      ? fundSpentSince(state, env.id) +
        (env.parentId ? 0 : childViews.reduce((s, c) => s + fundSpentSince(state, c.env.id), 0))
      : view.spent
  const shownRemaining = env.kind === 'fund' && !env.parentId ? groupRemaining : view.remaining
  const past = fundPastCycles(state, env.id, locale)
  const gaps = (env.kind === 'fund' ? [env, ...state.envelopes.filter((e) => e.parentId === env.id)] : [])
    .map((e) => ({ env: e, gap: fundCarryGap(state, e.id) }))
    .filter((row) => row.gap > 0)
  const removeIds = new Set(envelopeTree(state.envelopes, env.id))
  const dests = state.envelopes.filter((e) => !removeIds.has(e.id))

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

  function passToFolder() {
    if (!env) return
    const target = childViews.length === 1 ? childViews[0].env.id : moveTo
    if (!target) {
      setMsg(tr('fund.needFolder'))
      return
    }
    const cents = parseEuros(moveAmount)
    if (cents === null || cents <= 0) {
      setMsg(tr('env.needAmount'))
      return
    }
    if (cents > view.remaining) {
      setMsg(tr('fund.tooMuch', { amount: money(view.remaining) }))
      return
    }
    moveMoney(env.id, target, cents, tr('store.toFolder'))
    setMoveAmount('')
    setMsg(tr('fund.moved'))
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
            : env.kind === 'fund'
              ? shownRemaining > 0 && lifeSpent > 0
                ? tr('fund.both', { set: money(shownRemaining), spent: money(lifeSpent) })
                : lifeSpent > 0
                  ? tr('fund.spentBit', { amount: money(lifeSpent) })
                  : tr('fund.setAside', { amount: money(shownRemaining) })
              : tr('env.leftOf', { total: money(view.total) })}
        </div>
      </div>
      {view.week && env.kind === 'cap' && (
        <div className="hint">
          {tr('env.weekHint', {
            label: view.week.label,
            target: money(view.week.target),
            spent: money(view.week.spent),
            total: money(view.total),
          })}
        </div>
      )}
      {env.kind === 'fund' && lifeSpent > view.spent + childViews.reduce((s, c) => s + c.spent, 0) && (
        <p className="muted" style={{ margin: 0 }}>
          {tr('fund.memory')}
        </p>
      )}
      {gaps.map(({ env: gapEnv, gap }) => (
        <div key={gapEnv.id} className="card stack">
          <p style={{ margin: 0 }}>
            {gapEnv.emoji} {tr('fund.gap', { name: gapEnv.name, amount: money(gap) })}
          </p>
          <button type="button" className="btn full sage" onClick={() => restoreFundCarry(gapEnv.id)}>
            {tr('fund.restore')}
          </button>
        </div>
      ))}
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
          {env.kind !== 'fund' && (
            <>
          <div className="row">
            <strong>
              {env.kind === 'fixed' ? tr('env.billAmount') : env.kind === 'savings' ? tr('env.savGoal') : tr('env.cycleCap')}
            </strong>
            <span>{money(env.planned)}</span>
          </div>
          {editing ? (
            <>
              <input
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={tr('env.newCap')}
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
              {env.kind === 'cap' ? tr('env.editCap') : tr('env.editAmount')}
            </button>
          )}
            </>
          )}
          {msg ? <p className="muted">{msg}</p> : null}
          {env.kind === 'fund' && !env.parentId && (
            <div className="stack" style={{ gap: 8 }}>
              <label className="field">
                {tr('fund.eachCycle')}
                <input
                  key={`${env.id}-${env.cycleSetAside ?? 0}`}
                  inputMode="decimal"
                  defaultValue={String((env.cycleSetAside ?? 0) / 100)}
                  onBlur={(e) => {
                    const cents = parseEuros(e.target.value)
                    if (cents == null || cents < 0) {
                      setMsg(tr('env.needAmount'))
                      return
                    }
                    const result = setCycleSetAside(env.id, cents)
                    setMsg(result.ok ? tr('fund.eachOk') : result.error)
                  }}
                />
              </label>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                {tr('fund.eachCycleHint')}
              </p>
              <button type="button" className="btn full" onClick={onAdd}>
                {tr('fund.payFromHere')}
              </button>
            </div>
          )}
          {env.kind === 'fund' && (
            <div className="stack" style={{ gap: 8 }}>
              {env.fundClosedInCycle === cycle.id ? (
                <>
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                    {tr('fund.closedNow')}
                  </p>
                  <button
                    type="button"
                    className="btn ghost full"
                    onClick={() => {
                      reopenFund(env.id)
                      setMsg(tr('fund.reopened'))
                    }}
                  >
                    {tr('fund.reopen')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn full"
                    onClick={() => {
                      const result = closeFund(env.id)
                      setMsg(result.ok ? tr('fund.closedOk') : result.error)
                    }}
                  >
                    {tr('fund.closeNow')}
                  </button>
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                    {tr('fund.closeHint')}
                  </p>
                </>
              )}
            </div>
          )}
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
                  {child.remaining > 0 && fundSpentSince(state, child.env.id) > 0
                    ? tr('fund.both', {
                        set: money(child.remaining),
                        spent: money(fundSpentSince(state, child.env.id)),
                      })
                    : fundSpentSince(state, child.env.id) > 0
                      ? tr('fund.spentBit', { amount: money(fundSpentSince(state, child.env.id)) })
                      : tr('fund.setAside', { amount: money(child.remaining) })}
                </button>
              ))}
              {childViews.length > 0 && view.remaining > 0 && (
                <div className="stack" style={{ gap: 8 }}>
                  <strong>{tr('fund.moveTitle')}</strong>
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                    {childViews.length === 1
                      ? tr('fund.moveOne', { name: childViews[0].env.name, amount: money(view.remaining) })
                      : tr('fund.moveHint', { name: env.name, amount: money(view.remaining) })}
                  </p>
                  {childViews.length > 1 && (
                    <div className="chips" style={{ flexWrap: 'wrap' }}>
                      {childViews.map((child) => (
                        <button
                          key={child.env.id}
                          type="button"
                          className={`chip ${moveTo === child.env.id ? 'on' : ''}`}
                          onClick={() => {
                            setMoveTo(child.env.id)
                            setMsg('')
                          }}
                        >
                          {child.env.emoji} {child.env.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    inputMode="decimal"
                    value={moveAmount}
                    onChange={(e) => setMoveAmount(e.target.value)}
                    placeholder={tr('common.amountPh')}
                  />
                  <button type="button" className="btn full" onClick={passToFolder}>
                    {tr('fund.moveBtn')}
                  </button>
                </div>
              )}
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
      {env.kind !== 'buffer' && env.kind !== 'savings' && (
        <button type="button" className="btn danger full" onClick={() => { setRemoving(true); setDestId(''); setMsg('') }}>
          {tr('env.remove')}
        </button>
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
                  {t.note ? ` · ${displayNote(t.note, locale)}` : ''}
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
      {(env.fundLives?.length ?? 0) > 0 && (
        <>
          <div className="section-title">
            <span>{tr('fund.lives')}</span>
            <span className="muted">{env.fundLives?.length}</span>
          </div>
          {[...(env.fundLives ?? [])].reverse().map((life) => {
            const rows = fundLifeTxs(state, env.id, life)
            return (
              <div className="card stack" key={`${life.from}-${life.to}-${life.spent}`}>
                <strong>{formatRange(life.from, life.to, locale)}</strong>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                  {tr('fund.lifeLine', { spent: money(life.spent), left: money(life.left) })}
                </p>
                {rows
                  .slice()
                  .reverse()
                  .map((t) => {
                    const owner = state.envelopes.find((e) => e.id === t.envelopeId)
                    const intoTree = Boolean(t.toEnvelopeId && removeIds.has(t.toEnvelopeId))
                    const fromTree = removeIds.has(t.envelopeId)
                    const prefix =
                      t.type === 'income' || (t.type === 'transfer' && intoTree && !fromTree)
                        ? '+'
                        : t.type === 'transfer' && intoTree && fromTree
                          ? ''
                          : '−'
                    return (
                      <div className="tx" key={t.id}>
                        <div>
                          <div>
                            {labelTx(t.type, fromTree, tr)}
                            {owner && owner.id !== id ? ` · ${owner.emoji} ${owner.name}` : ''}
                          </div>
                          <div className="muted">
                            {new Date(t.at).toLocaleString(locale === 'en' ? 'en-US' : 'es-ES', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {t.note ? ` · ${displayNote(t.note, locale)}` : ''}
                          </div>
                        </div>
                        <div>
                          {prefix}
                          {money(t.amount)}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </>
      )}
      {past.length > 0 && (env.fundLives?.length ?? 0) === 0 && (
        <>
          <div className="section-title">
            <span>{tr('fund.past')}</span>
            <span className="muted">{past.length}</span>
          </div>
          {past.map((block) => (
            <div className="card stack" key={block.cycleId}>
              <strong>
                {block.archived ? `${tr('fund.archive')} · ` : ''}
                {block.label}
              </strong>
              {block.rows.map((row) => {
                const bits = [
                  row.movedIn > 0 ? tr('fund.inBit', { amount: money(row.movedIn) }) : '',
                  row.movedOut > 0 ? tr('fund.outBit', { amount: money(row.movedOut) }) : '',
                  row.spent > 0 ? tr('fund.spentBit', { amount: money(row.spent) }) : '',
                ].filter(Boolean)
                return (
                  <p key={row.id} className="muted" style={{ margin: 0, fontSize: 13 }}>
                    {row.emoji} {row.name}
                    {bits.length > 0 ? ` · ${bits.join(' · ')}` : ''}
                  </p>
                )
              })}
              {block.txs
                .slice()
                .reverse()
                .map((t) => {
                  const owner = state.envelopes.find((e) => e.id === t.envelopeId)
                  const intoTree = Boolean(t.toEnvelopeId && removeIds.has(t.toEnvelopeId))
                  const fromTree = removeIds.has(t.envelopeId)
                  const prefix =
                    t.type === 'income' || (t.type === 'transfer' && intoTree && !fromTree)
                      ? '+'
                      : t.type === 'transfer' && intoTree && fromTree
                        ? ''
                        : '−'
                  return (
                    <div className="tx" key={t.id}>
                      <div>
                        <div>
                          {labelTx(t.type, fromTree, tr)}
                          {owner && owner.id !== id ? ` · ${owner.emoji} ${owner.name}` : ''}
                        </div>
                        <div className="muted">
                          {new Date(t.at).toLocaleString(locale === 'en' ? 'en-US' : 'es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {t.note ? ` · ${displayNote(t.note, locale)}` : ''}
                        </div>
                      </div>
                      <div>
                        {prefix}
                        {money(t.amount)}
                      </div>
                    </div>
                  )
                })}
            </div>
          ))}
        </>
      )}
      {removing && (
        <div className="sheet-backdrop" onClick={() => setRemoving(false)}>
          <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
            <div className="handle" />
            <h2 className="serif" style={{ fontSize: 26 }}>
              {tr('env.removeTitle', { name: env.name })}
            </h2>
            <p className="muted">{tr('env.removeBody')}</p>
            <p>
              {tr('fund.both', {
                set: money(shownRemaining),
                spent: money(view.spent + childViews.reduce((s, c) => s + c.spent, 0)),
              })}
            </p>
            {childViews.length > 0 && !env.parentId ? <p className="muted">{tr('env.removeFolders')}</p> : null}
            <p className="tiny">{tr('env.removeTo')}</p>
            <div className="chips">
              {dests.map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  className={`chip ${destId === dest.id ? 'on' : ''}`}
                  onClick={() => setDestId(dest.id)}
                >
                  {dest.emoji} {dest.name}
                </button>
              ))}
            </div>
            {msg ? <p className="muted">{msg}</p> : null}
            <div className="actions">
              <button type="button" className="btn ghost" onClick={() => setRemoving(false)}>
                {tr('common.cancel')}
              </button>
              <button
                type="button"
                className="btn danger"
                disabled={!destId}
                onClick={() => {
                  if (!destId) return
                  const result = removeEnvelope(env.id, destId)
                  if (!result.ok) {
                    setMsg(result.error)
                    return
                  }
                  onBack()
                }}
              >
                {tr('env.removeGo')}
              </button>
            </div>
          </div>
        </div>
      )}
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
              {pending.note ? ` · ${displayNote(pending.note, locale)}` : ''}
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
