import { useMemo, useState, type ReactNode } from 'react'
import { KIND_LABEL } from './template'
import { coverPlan, kindOrder, verdictFor, viewsFor, type EnvelopeView } from './logic'
import { euros, parseEuros } from './money'
import { addExpense, addIncome, coverAndSpend, moveMoney, useAppState } from './store'

const QUICK = [2, 5, 10, 15, 20, 25, 30, 50]

export function AddSheet({
  presetId,
  onClose,
}: {
  presetId?: string
  onClose: (saved?: boolean, envelopeId?: string) => void
}) {
  const state = useAppState()
  const views = viewsFor(state)
  const [amount, setAmount] = useState('')
  const [envelopeId, setEnvelopeId] = useState(presetId ?? '')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(false)
  const cents = parseEuros(amount) ?? 0
  const view = views.find((v) => v.env.id === envelopeId)
  const verdict = verdictFor(view, cents)
  const isSavings = view?.env.kind === 'savings'
  const reasonOk = (isSavings ? note : reason).trim().length >= 4
  const plan = envelopeId ? coverPlan(views, envelopeId, cents) : null

  function trySave() {
    if (!envelopeId || cents <= 0) return
    if (isSavings) {
      if (!reasonOk) return
      addExpense(envelopeId, cents, `AHORRO: ${note.trim()}`)
      onClose(true, envelopeId)
      return
    }
    if (plan) {
      setConfirm(true)
      return
    }
    addExpense(envelopeId, cents, note)
    onClose(true, envelopeId)
  }

  function acceptCover() {
    if (!envelopeId || !plan || !plan.possible) return
    if (plan.needsSavingsReason && reason.trim().length < 4) return
    coverAndSpend({
      envelopeId,
      amount: cents,
      note,
      fromLibre:
        plan.fromLibre > 0 && plan.libreId
          ? { id: plan.libreId, amount: plan.fromLibre }
          : undefined,
      fromSavings:
        plan.fromSavings > 0 && plan.savingsId
          ? {
              id: plan.savingsId,
              amount: plan.fromSavings,
              reason: plan.goalFromSavings
                ? note.trim() || view?.env.name || 'Fondo'
                : reason.trim(),
            }
          : undefined,
    })
    onClose(true, envelopeId)
  }

  return (
    <Sheet title={isSavings ? 'Usar ahorro' : '¿Me cabe?'} onClose={() => onClose()}>
      <label className="field">
        Importe
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setConfirm(false)
          }}
          placeholder="0,00"
        />
      </label>
      <div className="chips">
        {QUICK.map((n) => (
          <button key={n} className="chip" onClick={() => setAmount(String(n))}>
            {n} €
          </button>
        ))}
      </div>
      <p className="tiny">Sobre</p>
      <div className="chips">
        {views
          .slice()
          .sort((a, b) => kindOrder(a.env.kind) - kindOrder(b.env.kind))
          .map((v) => (
            <button
              key={v.env.id}
              className={`chip ${envelopeId === v.env.id ? 'on' : ''}`}
              onClick={() => {
                setEnvelopeId(v.env.id)
                setConfirm(false)
              }}
            >
              {v.env.kind === 'savings' ? '🔒 ' : ''}
              {v.env.emoji} {v.env.name}
            </button>
          ))}
      </div>
      <label className="field">
        {isSavings ? 'Motivo (obligatorio)' : 'Nota (opcional)'}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isSavings ? 'Ej. urgente médico, arreglo del piso…' : 'café, super, partido…'
          }
        />
      </label>
      {isSavings && (
        <div className="deficit">
          El ahorro está bloqueado a propósito. Solo se usa con un motivo concreto, no para un
          capricho. Ese motivo queda anotado.
        </div>
      )}
      <div className={`verdict ${verdict.status}`}>{verdict.message}</div>
      {confirm && plan && (
        <div className={plan.possible ? 'hint' : 'deficit'}>
          {plan.goalFromSavings ? (
            <p>
              {view?.env.name}: no hay dinero apartado en este fondo. Se descontarán{' '}
              <b>{euros(plan.fromSavings)}</b> del ahorro. ¿De acuerdo?
            </p>
          ) : (
            <>
              {view ? (
                <p>
                  En {view.env.name} caben {euros(Math.max(0, view.remaining))}. Este gasto se pasa
                  por {euros(plan.overflow)}.
                </p>
              ) : null}
              {plan.fromLibre > 0 && (
                <p style={{ marginTop: 8 }}>
                  Se descontarán <b>{euros(plan.fromLibre)}</b> de Libre. ¿De acuerdo?
                </p>
              )}
              {plan.fromSavings > 0 && (
                <p style={{ marginTop: 8 }}>
                  Libre no alcanza. El resto (<b>{euros(plan.fromSavings)}</b>) saldría del ahorro
                  bloqueado. Segunda advertencia: hay que poner un motivo.
                </p>
              )}
            </>
          )}
          {!plan.possible && (
            <p style={{ marginTop: 8 }}>
              {plan.goalFromSavings
                ? 'No hay suficiente ahorro para este gasto.'
                : 'No hay suficiente en Libre + Ahorro para cubrir el extra.'}
            </p>
          )}
          {plan.needsSavingsReason && plan.possible && (
            <label className="field" style={{ marginTop: 10 }}>
              Motivo para tocar el ahorro
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. urgente, arreglo, imprevisto…"
              />
            </label>
          )}
          <div className="actions" style={{ marginBottom: 0 }}>
            <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
              Denegar
            </button>
            <button
              type="button"
              className="btn sage"
              disabled={!plan.possible || (plan.needsSavingsReason && reason.trim().length < 4)}
              onClick={acceptCover}
            >
              Aceptar y descontar
            </button>
          </div>
        </div>
      )}
      {!confirm && (
        <button
          className="btn full sage"
          disabled={!envelopeId || cents <= 0 || (isSavings && !reasonOk)}
          onClick={trySave}
        >
          {isSavings
            ? 'Usar ahorro con este motivo'
            : plan?.goalFromSavings
              ? 'Continuar (sale del ahorro)'
              : plan
                ? 'Continuar (hay extra)'
                : 'Anotar gasto'}
        </button>
      )}
    </Sheet>
  )
}

export function MoveSheet({ onClose }: { onClose: () => void }) {
  const state = useAppState()
  const views = viewsFor(state)
  const [from, setFrom] = useState(views.find((v) => v.env.kind === 'buffer')?.env.id ?? '')
  const [to, setTo] = useState(views.find((v) => v.env.kind === 'fund')?.env.id ?? '')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const cents = parseEuros(amount) ?? 0
  const fromView = views.find((v) => v.env.id === from)
  const fromSavings = fromView?.env.kind === 'savings'
  const reasonOk = reason.trim().length >= 4

  function save() {
    if (!from || !to || cents <= 0) return
    if (fromSavings && !reasonOk) return
    moveMoney(
      from,
      to,
      cents,
      fromSavings ? `AHORRO: ${reason.trim()}` : 'Reasignado',
    )
    onClose()
  }

  return (
    <Sheet title="Mover dinero" onClose={onClose}>
      <p className="muted">
        Para un viaje, una prenda o para reforzar el ahorro. El dinero no
        desaparece: cambia de sobre.
      </p>
      <SelectEnv label="De" value={from} views={views} onChange={setFrom} />
      <SelectEnv label="A" value={to} views={views} onChange={setTo} />
      <label className="field">
        Importe
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      {fromSavings && (
        <label className="field">
          Motivo (obligatorio: sales del ahorro)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. viaje urgente, reparación…"
          />
        </label>
      )}
      {fromView && fromView.remaining > 0 && (
        <button
          className="btn ghost full"
          onClick={() => setAmount((fromView.remaining / 100).toString())}
        >
          Mover todo lo que queda ({euros(fromView.remaining)})
        </button>
      )}
      <button
        className="btn full"
        disabled={!from || !to || from === to || cents <= 0 || (fromSavings && !reasonOk)}
        onClick={save}
      >
        Mover
      </button>
    </Sheet>
  )
}

export function IncomeSheet({ onClose }: { onClose: () => void }) {
  const state = useAppState()
  const views = viewsFor(state)
  const [amount, setAmount] = useState('')
  const [envelopeId, setEnvelopeId] = useState(
    views.find((v) => v.env.kind === 'savings')?.env.id ?? '',
  )
  const cents = parseEuros(amount) ?? 0

  function save() {
    if (!envelopeId || cents <= 0) return
    addIncome(envelopeId, cents, 'Ingreso extra')
    onClose()
  }

  return (
    <Sheet title="Dinero extra" onClose={onClose}>
      <p className="muted">Un extra, un Bizum, una venta. Elige a qué sobre entra.</p>
      <label className="field">
        Importe
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <SelectEnv label="Sobre" value={envelopeId} views={views} onChange={setEnvelopeId} />
      <button className="btn full sage" disabled={!envelopeId || cents <= 0} onClick={save}>
        Añadir ingreso
      </button>
    </Sheet>
  )
}

function SelectEnv({
  label,
  value,
  views,
  onChange,
}: {
  label: string
  value: string
  views: EnvelopeView[]
  onChange: (id: string) => void
}) {
  const ordered = useMemo(
    () => views.slice().sort((a, b) => kindOrder(a.env.kind) - kindOrder(b.env.kind)),
    [views],
  )
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Elegir…</option>
        {ordered.map((v) => (
          <option key={v.env.id} value={v.env.id}>
            {v.env.emoji} {v.env.name} · {euros(v.remaining)} · {KIND_LABEL[v.env.kind]}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <div className="row">
          <h2 className="serif" style={{ fontSize: 28 }}>
            {title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
