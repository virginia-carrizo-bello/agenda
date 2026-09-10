import React, { useState, useEffect } from 'react'
import type { AgendaItem, ListItem, ItemKind } from '../../types/agenda'
import { ModalSheet } from '../common/ModalSheet'
import { Switch } from '../common/Switch'
import { DayPickerGrid } from '../common/DayPickerGrid'

interface ComposerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Partial<AgendaItem>) => Promise<any>
  itemToEdit: AgendaItem | null
  initialDate: string
  lists: ListItem[]
  defaultListId?: string | null
}

const ALARM_OPTIONS = [
  { value: 0, label: 'En el momento' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
]

export const ComposerModal: React.FC<ComposerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  initialDate,
  lists,
  defaultListId,
}) => {
  const [kind, setKind] = useState<ItemKind>('event')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [alarm, setAlarm] = useState<number | null>(null)
  const [listId, setListId] = useState<string | null>(defaultListId || null)
  const [icon, setIcon] = useState('✨')

  // Estado para rutinas
  const [isDailyRoutine, setIsDailyRoutine] = useState(true)
  const [selectedRoutineDays, setSelectedRoutineDays] = useState<string[]>(['MO'])

  // Sincronizar formulario cuando se abre para editar o crear
  useEffect(() => {
    if (itemToEdit) {
      setKind(itemToEdit.kind)
      setTitle(
        itemToEdit.kind === 'birthday'
          ? itemToEdit.title.replace(/^cumpleaños\s*(de\s*)?/i, '').replace(/^🎂\s*/, '').trim()
          : itemToEdit.title
      )
      setNotes(itemToEdit.notes || '')
      setDate(itemToEdit.date || initialDate)
      setTime(itemToEdit.time || '')
      setTimeEnd(itemToEdit.time_end || '')
      setAllDay(!!itemToEdit.all_day)
      setLocation(itemToEdit.location || '')
      setAlarm(itemToEdit.alarm !== undefined ? itemToEdit.alarm : null)
      setListId(itemToEdit.list_id || defaultListId || null)
      setIcon(itemToEdit.icon || '✨')

      // Extraer rrule para rutinas
      if (itemToEdit.rrule && itemToEdit.rrule.includes('BYDAY=')) {
        setIsDailyRoutine(false)
        const match = itemToEdit.rrule.match(/BYDAY=([A-Z,]+)/)
        if (match && match[1]) {
          setSelectedRoutineDays(match[1].split(','))
        }
      } else {
        setIsDailyRoutine(true)
        setSelectedRoutineDays(['MO'])
      }
    } else {
      // Valores por defecto al crear
      setKind('event')
      setTitle('')
      setNotes('')
      setDate(initialDate)
      setTime('09:00')
      setTimeEnd('10:00')
      setAllDay(false)
      setLocation('')
      setAlarm(null)
      setListId(defaultListId || (lists.length > 0 ? lists[0].id : null))
      setIcon('🔥')
      setIsDailyRoutine(true)
      setSelectedRoutineDays(['MO'])
    }
  }, [itemToEdit, initialDate, isOpen, defaultListId, lists])

  const handleSave = async () => {
    if (!title.trim()) return

    let finalTitle = title.trim()
    let rrule: string | null = null

    if (kind === 'birthday') {
      finalTitle = `🎂 ${finalTitle.replace(/^cumpleaños\s*(de\s*)?/i, '').replace(/^🎂\s*/, '').trim()}`
    }

    if (kind === 'routine') {
      rrule = isDailyRoutine ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${selectedRoutineDays.join(',')}`
    }

    const payload: Partial<AgendaItem> = {
      ...(itemToEdit ? { id: itemToEdit.id } : {}),
      kind,
      title: finalTitle,
      notes: notes.trim() || null,
      date: kind === 'routine' ? null : date || null,
      time: kind === 'task' || kind === 'birthday' ? null : (allDay ? null : time || null),
      time_end: kind === 'task' || kind === 'birthday' ? null : (allDay ? null : timeEnd || null),
      all_day: allDay,
      location: location.trim() || null,
      alarm: kind === 'reminder' || kind === 'event' ? alarm : null,
      list_id: kind === 'task' ? listId : null,
      rrule,
      icon: kind === 'routine' ? icon : null,
    }

    await onSave(payload)
    onClose()
  }

  const getTitleHeader = () => {
    if (itemToEdit) return 'Editar Ítem'
    switch (kind) {
      case 'event': return 'Nuevo Evento'
      case 'routine': return 'Nueva Rutina'
      case 'reminder': return 'Nuevo Recordatorio'
      case 'birthday': return 'Nuevo Cumpleaños'
      default: return 'Nueva Tarea'
    }
  }

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={getTitleHeader()}
      onSave={handleSave}
      isSaveDisabled={!title.trim()}
      saveLabel={itemToEdit ? 'Guardar' : 'Añadir'}
    >
      {/* Selector de Tipo (Pestañas) */}
      {!itemToEdit && (
        <div
          style={{
            display: 'flex',
            background: 'var(--bg3)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            gap: '4px',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'event', label: 'Evento', icon: '📅' },
            { key: 'routine', label: 'Rutina', icon: '🔁' },
            { key: 'reminder', label: 'Recordatorio', icon: '🔔' },
            { key: 'birthday', label: 'Cumple', icon: '🎂' },
            { key: 'task', label: 'Tarea', icon: '✅' },
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setKind(t.key as ItemKind)}
              style={{
                flex: 1,
                padding: '8px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: kind === t.key ? 700 : 500,
                background: kind === t.key ? 'var(--card)' : 'transparent',
                color: kind === t.key ? 'var(--accent)' : 'var(--label2)',
                boxShadow: kind === t.key ? 'var(--shadow-sm)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Campo Título */}
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
          {kind === 'birthday' ? 'Nombre de la persona' : 'Título'}
        </label>
        <input
          type="text"
          placeholder={
            kind === 'birthday'
              ? 'Ej: Virginia'
              : kind === 'routine'
              ? 'Ej: Ejercicio matutino'
              : 'Ej: Reunión de proyecto'
          }
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          style={{ width: '100%', fontSize: '15px' }}
        />
      </div>

      {/* Formulario Específico por Tipo */}
      {kind === 'event' && (
        <>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Switch Todo el Día */}
          <div style={{ background: 'var(--bg3)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
            <Switch
              checked={allDay}
              onChange={setAllDay}
              label="Todo el día"
              id="allday-switch"
            />
          </div>

          {/* Desde y Hasta */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              opacity: allDay ? 0.4 : 1,
              pointerEvents: allDay ? 'none' : 'auto',
              transition: 'opacity 0.2s',
            }}
          >
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
                Desde
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                disabled={allDay}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
                Hasta
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={e => setTimeEnd(e.target.value)}
                disabled={allDay}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              📍 Ubicación (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Oficina Central, Zoom, etc."
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      {kind === 'routine' && (
        <>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              Frecuencia de Repetición
            </label>
            <DayPickerGrid
              isDaily={isDailyRoutine}
              onModeChange={setIsDailyRoutine}
              selectedDays={selectedRoutineDays}
              onChange={setSelectedRoutineDays}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              Icono / Emoji
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['🔥', '💧', '🏃', '📚', '🧘', '💊', '✨', '🎨'].map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: icon === e ? 'var(--tint)' : 'var(--bg3)',
                    border: icon === e ? '2px solid var(--accent)' : '1px solid var(--sep)',
                    fontSize: '18px',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {kind === 'reminder' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Alarma Previa */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              🔔 Alarma previa
            </label>
            <select
              value={alarm !== null ? alarm : ''}
              onChange={e => setAlarm(e.target.value === '' ? null : Number(e.target.value))}
              style={{ width: '100%' }}
            >
              <option value="">Sin alarma</option>
              {ALARM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ubicación */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              📍 Ubicación (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Farmacia, Casa, etc."
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      {kind === 'birthday' && (
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
            Fecha de Cumpleaños
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {kind === 'task' && (
        <>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              Lista de Destino
            </label>
            <select
              value={listId || ''}
              onChange={e => setListId(e.target.value || null)}
              style={{ width: '100%' }}
            >
              {lists.map(l => (
                <option key={l.id} value={l.id}>
                  {l.icon || '📝'} {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      {/* Notas Generales */}
      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
          Notas adicionales
        </label>
        <textarea
          rows={3}
          placeholder="Añade detalles, enlaces o notas..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', resize: 'none' }}
        />
      </div>
    </ModalSheet>
  )
}
