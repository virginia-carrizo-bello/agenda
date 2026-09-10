import React from 'react'
import type { AgendaItem } from '../../types/agenda'

export interface ItemRowProps {
  item: AgendaItem
  onToggleDone?: (id: string) => void
  onEdit?: (item: AgendaItem) => void
  onDelete?: (id: string) => void
  onDeleteItem?: (id: string) => void
}

export const cleanBirthdayDisplay = (title: string) => {
  const clean = title.replace(/^cumpleaños\s*(de\s*)?/i, '').replace(/^🎂\s*/, '').trim()
  return `🎂 ${clean}`
}

export const formatAlarmText = (minutes?: number | null) => {
  if (minutes === undefined || minutes === null) return null
  if (minutes === 0) return 'Al momento'
  if (minutes < 60) return `${minutes}m antes`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h antes`
  return `${Math.round(minutes / 1440)}d antes`
}

export const ItemRow: React.FC<ItemRowProps> = ({ item, onToggleDone, onEdit, onDelete, onDeleteItem }) => {
  const isDone = !!item.done
  const isBirthday = item.kind === 'birthday'

  const displayTitle = isBirthday ? cleanBirthdayDisplay(item.title) : item.title
  const deleteHandler = onDelete || onDeleteItem

  const getKindBadge = () => {
    switch (item.kind) {
      case 'event':
        return <span className="badge badge-event">Evento</span>
      case 'routine':
        return <span className="badge badge-routine">Rutina</span>
      case 'reminder':
        return <span className="badge badge-reminder">Recordatorio</span>
      case 'birthday':
        return <span className="badge badge-birthday">Cumpleaños</span>
      default:
        return <span className="badge badge-task">Tarea</span>
    }
  }

  const renderTimeOrMeta = () => {
    const parts: React.ReactNode[] = []

    if (item.all_day) {
      parts.push(<span key="allday" style={{ color: 'var(--label2)' }}>Todo el día</span>)
    } else if (item.time) {
      const timeStr = item.time_end ? `${item.time} — ${item.time_end}` : item.time
      parts.push(<span key="time" style={{ fontWeight: 600, color: 'var(--accent)' }}>{timeStr}</span>)
    }

    if (item.location) {
      parts.push(
        <span
          key="loc"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: 'var(--bg3)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--label2)',
          }}
          title={item.location}
        >
          📍 {item.location}
        </span>
      )
    }

    if (item.alarm !== undefined && item.alarm !== null) {
      parts.push(
        <span
          key="alarm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: 'var(--bg3)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            color: 'var(--label2)',
          }}
        >
          🔔 {formatAlarmText(item.alarm)}
        </span>
      )
    }

    return parts.length > 0 ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
        {parts}
      </div>
    ) : null
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        background: 'var(--card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--sep)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.15s var(--ease)',
        opacity: isDone ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      {onToggleDone && (
        <button
          type="button"
          onClick={() => onToggleDone(item.id)}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: `2px solid ${isDone ? 'var(--u-done)' : 'var(--chk-border)'}`,
            background: isDone ? 'var(--u-done)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {isDone && <span style={{ color: '#FFF', fontSize: '13px', fontWeight: 800 }}>✓</span>}
        </button>
      )}

      {/* Main Content */}
      <div
        style={{ flex: 1, minWidth: 0, cursor: onEdit ? 'pointer' : 'default' }}
        onClick={() => onEdit && onEdit(item)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {getKindBadge()}
          <span
            style={{
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--label)',
              textDecoration: isDone ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}
          >
            {displayTitle}
          </span>
        </div>

        {renderTimeOrMeta()}

        {item.notes && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--label3)',
              marginTop: '4px',
              whiteSpace: 'pre-line',
            }}
          >
            {item.notes}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            style={{
              padding: '6px',
              color: 'var(--label3)',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Editar"
          >
            ✏️
          </button>
        )}
        {deleteHandler && (
          <button
            type="button"
            onClick={() => deleteHandler(item.id)}
            style={{
              padding: '6px',
              color: 'var(--red)',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Eliminar"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}
