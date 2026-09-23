import { WEEKDAY_NAMES, clampWeekStart, weekSpanLabel } from './dates'

export function WeekStartSelect({
  value,
  onChange,
  label = 'La semana empieza el',
}: {
  value: number
  onChange: (day: number) => void
  label?: string
}) {
  const start = clampWeekStart(value)
  const endName = WEEKDAY_NAMES[(start + 6) % 7]
  return (
    <div className="stack" style={{ gap: 6 }}>
      <label className="field">
        {label}
        <select
          value={start}
          onChange={(e) => onChange(clampWeekStart(Number(e.target.value)))}
        >
          {WEEKDAY_NAMES.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Semana {weekSpanLabel(start)} (termina el {endName}).
      </p>
    </div>
  )
}
