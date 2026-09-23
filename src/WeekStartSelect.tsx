import { clampWeekStart, weekSpanLabel } from './dates'
import { weekdayName } from './i18n'
import { useLocale, useT } from './useT'

export function WeekStartSelect({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (day: number) => void
  label?: string
}) {
  const t = useT()
  const locale = useLocale()
  const start = clampWeekStart(value)
  const endName = weekdayName(locale, (start + 6) % 7)
  return (
    <div className="stack" style={{ gap: 6 }}>
      <label className="field">
        {label ?? t('week.starts')}
        <select
          value={start}
          onChange={(e) => onChange(clampWeekStart(Number(e.target.value)))}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <option key={i} value={i}>
              {weekdayName(locale, i)}
            </option>
          ))}
        </select>
      </label>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        {t('week.span', { span: weekSpanLabel(start, locale), end: endName })}
      </p>
    </div>
  )
}
