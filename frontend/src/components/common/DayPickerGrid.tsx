import React from 'react'

const DAYS = [
  { key: 'MO', short: 'L', label: 'Lunes' },
  { key: 'TU', short: 'M', label: 'Martes' },
  { key: 'WE', short: 'X', label: 'Miércoles' },
  { key: 'TH', short: 'J', label: 'Jueves' },
  { key: 'FR', short: 'V', label: 'Viernes' },
  { key: 'SA', short: 'S', label: 'Sábado' },
  { key: 'SU', short: 'D', label: 'Domingo' },
]

interface DayPickerGridProps {
  selectedDays: string[] // array of 'MO', 'TU', etc.
  onChange: (days: string[]) => void
  isDaily: boolean
  onModeChange: (isDaily: boolean) => void
}

export const DayPickerGrid: React.FC<DayPickerGridProps> = ({
  selectedDays,
  onChange,
  isDaily,
  onModeChange,
}) => {
  const toggleDay = (dayKey: string) => {
    if (selectedDays.includes(dayKey)) {
      const next = selectedDays.filter(d => d !== dayKey)
      // Mantener al menos un día seleccionado si estamos en modo específico
      if (next.length > 0) onChange(next)
    } else {
      onChange([...selectedDays, dayKey])
    }
  }

  const getSelectionText = () => {
    if (isDaily) return 'Se repite todos los días'
    if (selectedDays.length === 0) return 'Selecciona al menos un día'
    if (selectedDays.length === 1) {
      const d = DAYS.find(day => day.key === selectedDays[0])
      return `Cada ${d?.label.toLowerCase()}`
    }
    if (selectedDays.length === 7) return 'Todos los días'
    const names = selectedDays.map(k => DAYS.find(d => d.key === k)?.short).join(', ')
    return `Días: ${names}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Segmented Control para Modo */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bg3)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => onModeChange(true)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: isDaily ? 700 : 500,
            background: isDaily ? 'var(--card)' : 'transparent',
            color: isDaily ? 'var(--accent)' : 'var(--label2)',
            boxShadow: isDaily ? 'var(--shadow-sm)' : 'none',
          }}
        >
          🔁 Todos los días
        </button>
        <button
          type="button"
          onClick={() => onModeChange(false)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: !isDaily ? 700 : 500,
            background: !isDaily ? 'var(--card)' : 'transparent',
            color: !isDaily ? 'var(--accent)' : 'var(--label2)',
            boxShadow: !isDaily ? 'var(--shadow-sm)' : 'none',
          }}
        >
          📅 Día específico
        </button>
      </div>

      {/* Grilla de 7 días (L, M, X, J, V, S, D) */}
      {!isDaily && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="animate-fade-in">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px',
            }}
          >
            {DAYS.map(d => {
              const selected = selectedDays.includes(d.key)
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  title={d.label}
                  style={{
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: selected ? 'var(--k-routine)' : 'var(--bg3)',
                    color: selected ? '#FFFFFF' : 'var(--label2)',
                    border: selected ? 'none' : '1px solid var(--sep)',
                    transform: selected ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.15s var(--ease)',
                  }}
                >
                  {d.short}
                </button>
              )
            })}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--label3)', textAlign: 'center', fontStyle: 'italic' }}>
            {getSelectionText()}
          </span>
        </div>
      )}
    </div>
  )
}
