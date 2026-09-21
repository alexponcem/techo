import { useMemo, useRef, useState } from 'react'
import { WEEKDAY_NAMES, clampWeekStart, lastPaydayGuess, suggestedNextPay } from './dates'
import { HOW_IT_WORKS, KIND_EXPLAIN, TUTORIAL } from './guide'
import { assigned, withBalancedBuffer } from './logic'
import { euros, parseEuros } from './money'
import { importJson, startFirstCycle } from './store'
import { KIND_LABEL, blankPlan } from './template'
import type { Envelope, EnvelopeKind, PayMode, Rhythm } from './types'

type Step = 'welcome' | 'tutorial' | 'income' | 'envelopes' | 'review'

export function Setup() {
  const [step, setStep] = useState<Step>('welcome')
  const [tip, setTip] = useState(0)
  const [incomeText, setIncomeText] = useState('')
  const [startedAt, setStartedAt] = useState(lastPaydayGuess())
  const [payMode, setPayMode] = useState<PayMode>('last-weekday')
  const [fixedDay, setFixedDay] = useState(1)
  const [weekStartsOn, setWeekStartsOn] = useState(5)
  const [expectedEndAt, setExpectedEndAt] = useState(() =>
    suggestedNextPay(lastPaydayGuess(), 'last-weekday', 1),
  )
  const [envelopes, setEnvelopes] = useState<Envelope[]>(blankPlan())
  const [savedText, setSavedText] = useState('0')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const income = parseEuros(incomeText) ?? 0
  const savingsOpening = parseEuros(savedText) ?? 0
  const balanced = useMemo(() => withBalancedBuffer(envelopes, income), [envelopes, income])
  const plannedOthers = assigned(balanced.filter((e) => e.kind !== 'buffer'))
  const deficit = plannedOthers - income
  const buffer = balanced.find((e) => e.kind === 'buffer')

  function setPlanned(id: string, raw: string) {
    const cents = parseEuros(raw)
    if (cents === null && raw !== '') return
    setEnvelopes((prev) => prev.map((e) => (e.id === id ? { ...e, planned: cents ?? 0 } : e)))
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

  function removeRow(id: string) {
    setEnvelopes((prev) => prev.filter((e) => e.id !== id && e.kind !== 'buffer'))
  }

  function start() {
    setError('')
    if (income <= 0) {
      setError('Pon cuánto dinero entra o te queda.')
      return
    }
    if (deficit > 0) {
      setError(`El plan pide ${euros(deficit)} de más. Baja un techo o el ahorro.`)
      return
    }
    try {
      startFirstCycle({
        income,
        startedAt,
        expectedEndAt,
        settings: { payMode, fixedDay, weekStartsOn: clampWeekStart(weekStartsOn) },
        template: balanced,
        savingsOpening,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el ciclo.')
    }
  }

  if (step === 'welcome') {
    return (
      <div className="welcome stack">
        <p className="tiny">Control de dinero</p>
        <h1>Techo</h1>
        <p>
          App para <b>controlar tus gastos</b>. Hasta el último céntimo (euro, dólar
          o lo que uses) tiene un sitio.
        </p>
        <p className="muted">
          Antes de pagar, le dices cuánto y en qué sobre. Techo te dice si{' '}
          <b>cabe en esa cajita</b> o si te pasas.
        </p>
        <button className="choice" onClick={() => setStep('tutorial')}>
          <b>Crear mi plan</b>
          <span className="muted">Primero cómo se usa, luego tus números</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json,text/plain"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
              const text = typeof reader.result === 'string' ? reader.result : ''
              const result = importJson(text)
              if (!result.ok) setError(result.error)
            }
            reader.readAsText(file)
          }}
        />
        <button type="button" className="choice" onClick={() => fileRef.current?.click()}>
          <b>Restaurar una copia</b>
          <span className="muted">Si ya usabas Techo y tienes un techo-backup.json</span>
        </button>
        {error ? <p className="deficit">{error}</p> : null}
        <p className="muted" style={{ fontSize: 13 }}>
          No uses ventana de incógnito: ahí no se guarda nada.
        </p>
      </div>
    )
  }

  if (step === 'tutorial') {
    const page = TUTORIAL[tip]
    return (
      <div className="stack">
        <button
          className="back"
          onClick={() => {
            if (tip > 0) setTip(tip - 1)
            else setStep('welcome')
          }}
        >
          ← Atrás
        </button>
        <p className="tiny">
          {tip + 1} / {TUTORIAL.length}
        </p>
        <h2 className="serif" style={{ fontSize: 30 }}>
          {page.title}
        </h2>
        <p>{page.lead}</p>
        {page.items && page.items.length > 0 && (
          <ul className="guide-list">
            {page.items.map((it) => (
              <li key={it.k}>
                <b>{it.k}.</b> {it.v}
              </li>
            ))}
          </ul>
        )}
        {page.tip ? <div className="hint">{page.tip}</div> : null}
        <div className="dots">
          {TUTORIAL.map((_, i) => (
            <span key={i} className={i === tip ? 'dot on' : 'dot'} />
          ))}
        </div>
        <button
          type="button"
          className="btn full sage"
          onClick={() => {
            if (tip < TUTORIAL.length - 1) setTip(tip + 1)
            else setStep('income')
          }}
        >
          {tip < TUTORIAL.length - 1 ? 'Siguiente' : 'Poner mis números'}
        </button>
        {tip > 0 && (
          <button type="button" className="btn ghost full" onClick={() => setTip(tip - 1)}>
            Explicación anterior
          </button>
        )}
        <button type="button" className="btn ghost full" onClick={() => setStep('income')}>
          Saltar explicación
        </button>
      </div>
    )
  }

  if (step === 'income') {
    return (
      <div className="stack">
        <button className="back" onClick={() => setStep('tutorial')}>
          ← Atrás
        </button>
        <h2 className="serif" style={{ fontSize: 32 }}>
          Este ciclo
        </h2>
        <p className="muted">
          El ciclo empieza el día que cobras, no el 1 del mes. Si pagan un viernes
          porque el 31 es domingo, usa esa fecha.
        </p>
        <label className="field">
          ¿Cuánto ha entrado? (sueldo de este ciclo)
          <input
            inputMode="decimal"
            value={incomeText}
            onChange={(e) => setIncomeText(e.target.value)}
            placeholder="1500"
          />
        </label>
        <label className="field">
          ¿Ya traes ahorro de antes?
          <input
            inputMode="decimal"
            value={savedText}
            onChange={(e) => setSavedText(e.target.value)}
            placeholder="0"
          />
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          Eso se suma al sobre Ahorro y no se gasta en el mes. Si empiezas de cero,
          déjalo en 0.
        </p>
        <label className="field">
          ¿Qué día llegó (o el cobro anterior)?
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
          Próximo sueldo estimado
          <input type="date" value={expectedEndAt} onChange={(e) => setExpectedEndAt(e.target.value)} />
        </label>
        <label className="field">
          La semana de super / hobbies empieza el
          <select
            value={weekStartsOn}
            onChange={(e) => setWeekStartsOn(clampWeekStart(Number(e.target.value)))}
          >
            {WEEKDAY_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          Si compras el sábado, elige sábado o viernes. Luego lo puedes cambiar en
          Ajustes.
        </p>
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
        <ul className="guide-list">
          <li>
            <b>Cuota.</b> Alquiler, móvil. Márcala pagada cuando salga del banco.
          </li>
          <li>
            <b>Techo diario.</b> Ocio, café. Entra en “hoy puedes gastar”.
          </li>
          <li>
            <b>Techo semanal.</b> Super. Consejo por semana; el límite duro es el mes.
            Elige “Semanal” abajo y el día de inicio de semana (ya lo pedimos).
          </li>
          <li>
            <b>Fondo.</b> Viaje, medicina. Sin techo. Si está a 0, sale del ahorro.
          </li>
        </ul>
        <p className="muted">Quita lo que no uses y pon tus importes. Libre se calcula solo.</p>
        {balanced
          .filter((e) => e.kind !== 'buffer')
          .map((e) => (
            <div className="card stack" key={e.id} style={{ gap: 8 }}>
              <div className="row">
                <label className="field" style={{ flex: 1 }}>
                  Nombre
                  <input
                    value={e.name}
                    onChange={(ev) =>
                      setEnvelopes((prev) =>
                        prev.map((x) => (x.id === e.id ? { ...x, name: ev.target.value } : x)),
                      )
                    }
                  />
                </label>
                {e.kind !== 'savings' && (
                  <button type="button" className="back" onClick={() => removeRow(e.id)}>
                    quitar
                  </button>
                )}
              </div>
              <p className="muted" style={{ fontSize: 13 }}>
                {KIND_EXPLAIN[e.kind]?.hint ?? KIND_LABEL[e.kind]}
              </p>
              {e.kind !== 'savings' && (
                <label className="field">
                  Tipo
                  <select
                    value={e.kind}
                    onChange={(ev) => {
                      const kind = ev.target.value as EnvelopeKind
                      setEnvelopes((prev) =>
                        prev.map((x) =>
                          x.id === e.id
                            ? {
                                ...x,
                                kind,
                                rhythm:
                                  kind === 'cap'
                                    ? x.rhythm === 'weekly'
                                      ? 'weekly'
                                      : 'daily'
                                    : kind === 'buffer'
                                      ? 'daily'
                                      : 'none',
                              }
                            : x,
                        ),
                      )
                    }}
                  >
                    <option value="fixed">Cuota (marcar pagado)</option>
                    <option value="cap">Techo (límite del ciclo)</option>
                    <option value="fund">Fondo (sale del ahorro)</option>
                  </select>
                </label>
              )}
              {e.kind === 'cap' && (
                <label className="field">
                  ¿Diario o semanal?
                  <select
                    value={e.rhythm === 'weekly' ? 'weekly' : 'daily'}
                    onChange={(ev) =>
                      setEnvelopes((prev) =>
                        prev.map((x) =>
                          x.id === e.id ? { ...x, rhythm: ev.target.value as Rhythm } : x,
                        ),
                      )
                    }
                  >
                    <option value="daily">Diario — entra en “hoy puedes gastar” (ocio, café)</option>
                    <option value="weekly">Semanal — consejo por semana (super, un hobby)</option>
                  </select>
                </label>
              )}
              <label className="field">
                {e.kind === 'fund' ? 'Apartar este ciclo (puede ser 0)' : 'Importe de este ciclo'}
                <input
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  defaultValue={(e.planned / 100).toString()}
                  onChange={(ev) => setPlanned(e.id, ev.target.value)}
                  onBlur={(ev) => setPlanned(e.id, ev.target.value)}
                />
              </label>
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
        Cada euro tiene trabajo. Libre es lo que queda. Si no gastas un techo, al
        cerrar el ciclo puede ir al ahorro.
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
          El plan pide {euros(deficit)} más que el dinero. Baja un techo o el ahorro.
        </div>
      ) : (
        <div className="hint">
          {buffer && buffer.planned > 0
            ? `Libre: ${euros(buffer.planned)}. Imprevistos chicos. Si no lo usas, puede ir al ahorro.`
            : 'Todo el sueldo está asignado. Los fondos (viaje, medicina) salen del ahorro si están a 0.'}
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

export function HowItWorks() {
  return (
    <div className="stack">
      {HOW_IT_WORKS.map((b) => (
        <div className="card stack" key={b.title} style={{ gap: 8 }}>
          <strong>{b.title}</strong>
          <p style={{ fontSize: 14 }}>{b.lead}</p>
          {b.items && (
            <ul className="guide-list">
              {b.items.map((it) => (
                <li key={it.k}>
                  <b>{it.k}.</b> {it.v}
                </li>
              ))}
            </ul>
          )}
          {b.tip ? (
            <p className="muted" style={{ fontSize: 13 }}>
              {b.tip}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
