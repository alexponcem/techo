import { useMemo, useState } from 'react'
import { lastPaydayGuess, suggestedNextPay } from './dates'
import { assigned, withBalancedBuffer } from './logic'
import { euros, parseEuros } from './money'
import { startFirstCycle } from './store'
import { ALEX_INCOME, KIND_HINT, KIND_LABEL, alexPlan, blankPlan } from './template'
import type { Envelope, EnvelopeKind, PayMode } from './types'

type Step = 'welcome' | 'income' | 'envelopes' | 'review'

const KINDS: EnvelopeKind[] = ['savings', 'fixed', 'cap', 'fund', 'buffer']

export function Setup() {
  const [step, setStep] = useState<Step>('welcome')
  const [incomeText, setIncomeText] = useState('1391')
  const [startedAt, setStartedAt] = useState(lastPaydayGuess())
  const [payMode, setPayMode] = useState<PayMode>('last-weekday')
  const [fixedDay, setFixedDay] = useState(1)
  const [expectedEndAt, setExpectedEndAt] = useState(() =>
    suggestedNextPay(lastPaydayGuess(), 'last-weekday', 1),
  )
  const [envelopes, setEnvelopes] = useState<Envelope[]>(alexPlan())
  const [savedText, setSavedText] = useState('0')
  const [error, setError] = useState('')

  const income = parseEuros(incomeText) ?? 0
  const savingsOpening = parseEuros(savedText) ?? 0
  const balanced = useMemo(() => withBalancedBuffer(envelopes, income), [envelopes, income])
  const withoutBuffer = balanced.filter((e) => e.kind !== 'buffer')
  const plannedOthers = assigned(withoutBuffer)
  const deficit = plannedOthers - income
  const buffer = balanced.find((e) => e.kind === 'buffer')

  function useAlex() {
    setIncomeText('1391')
    setEnvelopes(alexPlan())
    setStep('income')
  }

  function useOwn() {
    setIncomeText('')
    setEnvelopes(blankPlan())
    setStep('income')
  }

  function setPlanned(id: string, raw: string) {
    const cents = parseEuros(raw)
    if (cents === null && raw !== '') return
    setEnvelopes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, planned: cents ?? 0 } : e)),
    )
  }

  function addRow() {
    const id = `sobre-${Date.now()}`
    setEnvelopes((prev) => [
      ...prev.filter((e) => e.kind !== 'buffer'),
      {
        id,
        name: 'Nuevo sobre',
        kind: 'cap',
        planned: 0,
        emoji: '✦',
        opening: 0,
        rhythm: 'daily',
      },
      ...prev.filter((e) => e.kind === 'buffer'),
    ])
  }

  function zeroPaidCuotas() {
    setEnvelopes((prev) =>
      prev.map((e) => (e.kind === 'fixed' || e.kind === 'savings' ? { ...e, planned: 0 } : e)),
    )
  }

  function start() {
    setError('')
    if (income <= 0) {
      setError('Pon cuánto dinero entra o te queda.')
      return
    }
    if (deficit > 0) {
      setError(
        `El plan pide ${euros(deficit)} de más. Baja ahorro o cuotas (pon 0 lo que ya pagaste).`,
      )
      return
    }
    try {
      startFirstCycle({
        income,
        startedAt,
        expectedEndAt,
        settings: { payMode, fixedDay },
        template: balanced,
        savingsOpening,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el ciclo. Prueba otra vez.')
    }
  }

  if (step === 'welcome') {
    return (
      <div className="welcome stack">
        <p className="tiny">Control de dinero</p>
        <h1>Techo</h1>
        <p className="muted">
          El sueldo entra, el ahorro se reserva primero, cada gasto tiene un sobre
          y la app te dice si cabe — antes de pagarlo.
        </p>
        <button className="choice" onClick={useAlex}>
          <b>Empezar con tu plan</b>
          <span className="muted">
            1.391 € · ahorro 600 € · arriendo, comida, ocio, viajes y ropa
          </span>
        </button>
        <button className="choice" onClick={useOwn}>
          <b>Crear otro plan</b>
          <span className="muted">Para ti o para alguien que vaya a probarla</span>
        </button>
      </div>
    )
  }

  if (step === 'income') {
    return (
      <div className="stack">
        <button className="back" onClick={() => setStep('welcome')}>
          ← Atrás
        </button>
        <h2 className="serif" style={{ fontSize: 32 }}>
          Este ciclo
        </h2>
        <p className="muted">
          El sueldo no es una fecha mágica. Lo registras cuando llega, aunque sea
          el viernes si el mes cae en domingo.
        </p>
        <label className="field">
          ¿Cuánto ha entrado? (sueldo de este ciclo)
          <input
            inputMode="decimal"
            value={incomeText}
            onChange={(e) => setIncomeText(e.target.value)}
            placeholder="1391"
          />
        </label>
        <label className="field">
          ¿Ya traes ahorro de meses anteriores?
          <input
            inputMode="decimal"
            value={savedText}
            onChange={(e) => setSavedText(e.target.value)}
            placeholder="0"
          />
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          Esto no se gasta en el mes: se suma al sobre Ahorro y sigue ahí cuando
          cobre el siguiente sueldo. Si estás probando agosto, déjalo en 0.
        </p>
        <label className="field">
          ¿Qué día llegó (o llegó el anterior)?
          <input
            type="date"
            value={startedAt}
            onChange={(e) => {
              const v = e.target.value
              setStartedAt(v)
              setExpectedEndAt(suggestedNextPay(v, payMode, fixedDay))
            }}
          />
        </label>
        <label className="field">
          ¿Cómo sueles cobrar?
          <select
            value={payMode}
            onChange={(e) => {
              const mode = e.target.value as PayMode
              setPayMode(mode)
              setExpectedEndAt(suggestedNextPay(startedAt, mode, fixedDay))
            }}
          >
            <option value="last-weekday">Último día laborable del mes</option>
            <option value="fixed-day">Un día fijo</option>
            <option value="manual">Lo marco yo cada vez</option>
          </select>
        </label>
        {payMode === 'fixed-day' && (
          <label className="field">
            Día del mes
            <input
              inputMode="numeric"
              value={fixedDay}
              onChange={(e) => {
                const day = Number(e.target.value) || 1
                setFixedDay(day)
                setExpectedEndAt(suggestedNextPay(startedAt, payMode, day))
              }}
            />
          </label>
        )}
        <label className="field">
          Próximo sueldo estimado (editable)
          <input type="date" value={expectedEndAt} onChange={(e) => setExpectedEndAt(e.target.value)} />
        </label>
        <div className="hint">
          Si el fin de mes cae en domingo y pagan el viernes, cambia estas fechas.
          El ritmo diario se calcula hasta el próximo sueldo.
        </div>
        <button className="btn full" onClick={() => setStep('envelopes')} disabled={income <= 0}>
          Seguir a los sobres
        </button>
      </div>
    )
  }

  if (step === 'envelopes') {
    return (
      <div className="stack">
        <button className="back" onClick={() => setStep('income')}>
          ← Atrás
        </button>
        <h2 className="serif" style={{ fontSize: 32 }}>
          Sobres
        </h2>
        <p className="muted">
          Comida y fútbol se anotan el día que ocurren. No entran en el “hoy
          puedes gastar”. Ocio y libre sí.
        </p>
        {balanced
          .filter((e) => e.kind !== 'buffer')
          .map((e) => (
            <div className="card stack" key={e.id} style={{ gap: 8 }}>
              <div className="row">
                <strong>
                  {e.emoji} {e.name}
                </strong>
                <span className="pill idle">{KIND_LABEL[e.kind]}</span>
              </div>
              <p className="tiny" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {e.id === 'comida'
                  ? 'Techo semanal, no diario. Super del sábado y extras. 130 € ÷ 4,5 semanas ≈ 29 €/semana.'
                  : e.id === 'futbol'
                    ? 'Un partido por semana (viernes o sábado). Anotas el día que juegas. 25 €/mes ≈ 6 €/semana. Si juegas de más, el extra sale de Libre.'
                    : KIND_HINT[e.kind]}
              </p>
              <label className="field">
                {e.kind === 'fund' ? 'Asignar este ciclo (puede ser 0)' : 'Importe'}
                <input
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  defaultValue={(e.planned / 100).toString()}
                  onChange={(ev) => setPlanned(e.id, ev.target.value)}
                  onBlur={(ev) => setPlanned(e.id, ev.target.value)}
                />
              </label>
              {e.kind !== 'savings' && e.kind !== 'buffer' && (
                <label className="field">
                  Tipo
                  <select
                    value={e.kind}
                    onChange={(ev) =>
                      setEnvelopes((prev) =>
                        prev.map((x) =>
                          x.id === e.id ? { ...x, kind: ev.target.value as EnvelopeKind } : x,
                        ),
                      )
                    }
                  >
                    {KINDS.filter((k) => k !== 'buffer' && k !== 'savings').map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ))}
        <button className="btn ghost full" onClick={addRow}>
          + Añadir sobre
        </button>
        <button className="btn full" onClick={() => setStep('review')}>
          Ver si el plan cierra
        </button>
      </div>
    )
  }

  return (
    <div className="stack">
      <button className="back" onClick={() => setStep('envelopes')}>
        ← Atrás
      </button>
      <h2 className="serif" style={{ fontSize: 32 }}>
        ¿Cierra?
      </h2>
      <p className="muted">
        Cada euro tiene trabajo. Libre es lo que queda para imprevistos, viajes o
        ropa.
      </p>
      <div className="math">
        <div className="math-row">
          <span>Entra (sueldo)</span>
          <span>{euros(income)}</span>
        </div>
        {savingsOpening > 0 ? (
          <div className="math-row">
            <span>Ahorro que ya traes</span>
            <span>{euros(savingsOpening)}</span>
          </div>
        ) : null}
        {balanced.map((e) => (
          <div className="math-row" key={e.id}>
            <span>
              {e.emoji} {e.name}
            </span>
            <span>{euros(e.planned)}</span>
          </div>
        ))}
      </div>
      {deficit > 0 ? (
        <div className="deficit">
          El plan pide {euros(deficit)} más que el dinero. Baja un techo o el
          ahorro. Si este mes ya pagaste las cuotas, ponlas a 0.
          <button type="button" className="btn full" style={{ marginTop: 10 }} onClick={zeroPaidCuotas}>
            Poner cuotas y ahorro a 0
          </button>
        </div>
      ) : (
        <div className="hint">
          {buffer && buffer.planned > 0
            ? `Libre: ${euros(buffer.planned)}. Eso es el residual. Si no lo gastas, al cerrar el ciclo puede ir a ahorro, viajes o ropa.`
            : 'Todo el sueldo está asignado. Viajes y ropa se alimentan con lo que no gastes o moviendo dinero a propósito.'}
          {income === ALEX_INCOME && (
            <>
              {' '}
              Con 600 € de ahorro, el margen es pequeño a propósito: el control está
              en comida, ocio y en no tocar el ahorro.
            </>
          )}
        </div>
      )}
      {error ? <div className="deficit">{error}</div> : null}
      <button type="button" className="btn full sage" onClick={start}>
        {deficit > 0 ? 'Aún no cierra — mira el aviso' : 'Abrir el ciclo'}
      </button>
      <p className="muted tiny" style={{ textTransform: 'none', letterSpacing: 0 }}>
        Empieza {startedAt} · próximo sueldo {expectedEndAt}
      </p>
    </div>
  )
}
