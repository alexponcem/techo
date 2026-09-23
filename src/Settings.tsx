import { useRef, useState } from 'react'
import { clampWeekStart } from './dates'
import { weekdayName } from './i18n'
import { euros } from './money'
import { HowItWorks } from './Setup'
import { exportJson, importJson, resetAll, undoLast, updateSettings, useAppState } from './store'
import { useLocale, useT } from './useT'
import type { Locale } from './types'

export function SettingsScreen({
  onBack,
  onIncome,
}: {
  onBack: () => void
  onIncome: () => void
}) {
  const state = useAppState()
  const t = useT()
  const locale = useLocale()
  const cycle = [...state.cycles].reverse().find((c) => !c.closedAt)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'techo-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function onFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const result = importJson(text)
      if (result.ok) setMsg(t('settings.restored'))
      else setMsg(result.error)
    }
    reader.onerror = () => setMsg(t('settings.fileFail'))
    reader.readAsText(file)
  }

  return (
    <div className="stack">
      <button className="back" onClick={onBack}>
        {t('cycle.home')}
      </button>
      <h2 className="serif" style={{ fontSize: 32 }}>
        {t('settings.title')}
      </h2>
      <div className="section-title">
        <span>{t('setup.how')}</span>
      </div>
      <HowItWorks />
      <div className="card stack">
        <p>
          <b>{t('settings.pay')}</b>{' '}
          {state.settings.payMode === 'last-weekday'
            ? t('setup.payLast')
            : state.settings.payMode === 'fixed-day'
              ? `${t('setup.dayOfMonth')} ${state.settings.fixedDay}`
              : t('setup.payManual')}
        </p>
        {cycle && (
          <p>
            <b>{t('settings.thisCycle')}</b> {euros(cycle.income, locale)}
          </p>
        )}
        <p className="muted">
          {t('settings.safari')}
        </p>
        <label className="field">
          {t('settings.language')}
          <select
            value={locale}
            onChange={(e) =>
              updateSettings({ ...state.settings, locale: e.target.value as Locale })
            }
          >
            <option value="es">{t('lang.es')}</option>
            <option value="en">{t('lang.en')}</option>
          </select>
        </label>
        <label className="field">
          {t('settings.dailyWeek')}
          <select
            value={clampWeekStart(state.settings.dailyWeekStartsOn ?? 1)}
            onChange={(e) =>
              updateSettings({
                ...state.settings,
                dailyWeekStartsOn: clampWeekStart(Number(e.target.value)),
              })
            }
          >
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <option key={i} value={i}>
                {weekdayName(locale, i)}
              </option>
            ))}
          </select>
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('settings.dailyWeekHint')}
        </p>
        <label className="field">
          {t('settings.weeklyDefault')}
          <select
            value={clampWeekStart(state.settings.weekStartsOn ?? 5)}
            onChange={(e) =>
              updateSettings({
                ...state.settings,
                weekStartsOn: clampWeekStart(Number(e.target.value)),
              })
            }
          >
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <option key={i} value={i}>
                {weekdayName(locale, i)}
              </option>
            ))}
          </select>
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('settings.weeklyDefaultHint')}
        </p>
      </div>
      <button className="btn secondary full" onClick={onIncome}>
        {t('settings.extraIncome')}
      </button>
      <button className="btn secondary full" onClick={undoLast}>
        {t('settings.undo')}
      </button>
      <button className="btn secondary full" onClick={download}>
        {t('settings.export')}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json,text/plain"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button
        className="btn sage full"
        onClick={() => {
          if (state.onboarded && !confirm(t('settings.restoreConfirm'))) return
          fileRef.current?.click()
        }}
      >
        {t('settings.restore')}
      </button>
      {msg ? <p className={msg === t('settings.restored') ? 'hint' : 'deficit'}>{msg}</p> : null}
      <button
        className="btn danger full"
        onClick={() => {
          if (confirm(t('settings.wipeConfirm'))) resetAll()
        }}
      >
        {t('settings.wipe')}
      </button>
    </div>
  )
}
