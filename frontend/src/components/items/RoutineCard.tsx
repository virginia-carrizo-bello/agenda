import React from 'react'
import type { AgendaItem } from '../../types/agenda'

interface RoutineCardProps {
  item: AgendaItem
  currentDate: string // YYYY-MM-DD
  onToggleDate: (id: string, date: string) => void
  onEdit: (item: AgendaItem) => void
  onDelete: (id: string) => void
}

export const RoutineCard: React.FC<RoutineCardProps> = ({
  item,
  currentDate,
  onToggleDate,
  onEdit,
  onDelete,
}) => {
  const doneDates = (item.done_dates || '').split(',').map(s => s.trim()).filter(Boolean)
  const isDoneToday = doneDates.includes(currentDate)

  // Cálculo de racha (streak)
  const calculateStreak = () => {
    let streak = 0
    const today = new Date(currentDate + 'T00:00:00')
    let checkDate = new Date(today)

    // Si hoy no está marcado, verificar si ayer sí para mantener racha
    const todayStr = checkDate.toISOString().split('T')[0]
    if (!doneDates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (doneDates.includes(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const streak = calculateStreak()

  const getFrequencyLabel = () => {
    if (!item.rrule || item.rrule.includes('FREQ=DAILY')) {
      return 'Todos los días'
    }
    if (item.rrule.includes('BYDAY=')) {
      const match = item.rrule.match(/BYDAY=([A-Z,]+)/)
      if (match && match[1]) {
        const daysMap: Record<string, string> = {
          MO: 'L',
          TU: 'M',
          WE: 'X',
          TH: 'J',
          FR: 'V',
          SA: 'S',
          SU: 'D',
        }
        const shortDays = match[1].split(',').map(k => daysMap[k] || k).join(', ')
        return `Días: ${shortDays}`
      }
    }
    return 'Hábito'
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'var(--card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--sep)',
        boxShadow: 'var(--shadow-sm)',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onEdit(item)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{item.icon || '🔥'}</span>
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--label)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.title}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              background: 'var(--k-routine-soft)',
              color: 'var(--k-routine)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            🔁 {getFrequencyLabel()}
          </span>

          {streak > 0 && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--amber)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              🔥 {streak} {streak === 1 ? 'día' : 'días'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onToggleDate(item.id, currentDate)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isDoneToday ? 'var(--u-done)' : 'var(--bg3)',
            border: isDoneToday ? 'none' : '2px solid var(--chk-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: 800,
            transition: 'transform 0.15s var(--spring), background-color 0.2s',
            transform: isDoneToday ? 'scale(1.05)' : 'scale(1)',
          }}
          title={isDoneToday ? 'Completado hoy' : 'Marcar como completado'}
        >
          {isDoneToday ? '✓' : ''}
        </button>

        <button
          type="button"
          onClick={() => onDelete(item.id)}
          style={{
            padding: '8px',
            color: 'var(--label3)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
