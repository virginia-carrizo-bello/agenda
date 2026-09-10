import React, { useState } from 'react'
import type { AgendaItem } from '../../types/agenda'
import { ItemRow, cleanBirthdayDisplay } from '../items/ItemRow'

interface CalendarViewProps {
  items: AgendaItem[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onToggleDone: (id: string) => void
  onEditItem: (item: AgendaItem) => void
  onDeleteItem: (id: string) => void
  onOpenNew: (date?: string) => void
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

export const CalendarView: React.FC<CalendarViewProps> = ({
  items,
  selectedDate,
  onSelectDate,
  onToggleDone,
  onEditItem,
  onDeleteItem,
  onOpenNew,
}) => {
  const currentDateObj = new Date(selectedDate + 'T00:00:00')
  const [currentYear, setCurrentYear] = useState(currentDateObj.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(currentDateObj.getMonth())

  const todayStr = new Date().toISOString().split('T')[0]

  // Navegación de mes
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const handleGoToday = () => {
    const today = new Date()
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    onSelectDate(todayStr)
  }

  // Generar días del mes (grilla 7 columnas comenzando en Lunes)
  const generateMonthDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)

    // Ajustar a Lunes = 0, Domingo = 6
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6

    const totalDays = lastDay.getDate()
    const days: { date: string; dayNum: number; isCurrentMonth: boolean; dayOfWeekIndex: number }[] = []

    // Días del mes anterior
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        date: dateStr,
        dayNum: d,
        isCurrentMonth: false,
        dayOfWeekIndex: new Date(dateStr + 'T00:00:00').getDay(),
      })
    }

    // Días del mes actual
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        date: dateStr,
        dayNum: d,
        isCurrentMonth: true,
        dayOfWeekIndex: new Date(dateStr + 'T00:00:00').getDay(),
      })
    }

    // Días del siguiente mes para completar grilla (múltiplo de 7)
    const remaining = (7 - (days.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        date: dateStr,
        dayNum: d,
        isCurrentMonth: false,
        dayOfWeekIndex: new Date(dateStr + 'T00:00:00').getDay(),
      })
    }

    return days
  }

  // Verificar si una rutina aplica a una fecha dada
  const isRoutineOnDate = (routine: AgendaItem, dateStr: string) => {
    if (!routine.rrule || routine.rrule.includes('FREQ=DAILY')) return true
    const dayObj = new Date(dateStr + 'T00:00:00')
    const jsDay = dayObj.getDay() // 0=Dom, 1=Lun, ...
    const code = jsDay === 0 ? 'SU' : DAY_CODES[jsDay - 1]
    return routine.rrule.includes(code)
  }

  const getItemsForDate = (dateStr: string) => {
    const directItems = items.filter(it => it.date === dateStr && it.kind !== 'routine')
    const activeRoutines = items.filter(it => it.kind === 'routine' && isRoutineOnDate(it, dateStr))
    return { directItems, activeRoutines }
  }

  const monthDays = generateMonthDays()
  const { directItems: selectedDirect, activeRoutines: selectedRoutines } = getItemsForDate(selectedDate)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra Superior del Calendario */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--card)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '22px', color: 'var(--label)' }}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button
            type="button"
            onClick={handleGoToday}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg3)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            Hoy
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg3)',
              fontSize: '16px',
            }}
            title="Mes anterior"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg3)',
              fontSize: '16px',
            }}
            title="Mes siguiente"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Grilla Mensual */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          padding: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Nombres de los días de la semana */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '13px',
            color: 'var(--label3)',
            marginBottom: '10px',
          }}
        >
          {DAY_NAMES.map(d => (
            <div key={d} style={{ padding: '4px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Celdas de los días */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
          }}
        >
          {monthDays.map(cell => {
            const isSelected = cell.date === selectedDate
            const isToday = cell.date === todayStr
            const { directItems, activeRoutines } = getItemsForDate(cell.date)
            const totalCount = directItems.length + activeRoutines.length

            return (
              <div
                key={cell.date}
                onClick={() => onSelectDate(cell.date)}
                style={{
                  minHeight: '80px',
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected
                    ? 'var(--tint)'
                    : cell.isCurrentMonth
                    ? 'var(--card)'
                    : 'var(--bg3)',
                  border: isSelected
                    ? '2px solid var(--accent)'
                    : isToday
                    ? '1.5px solid var(--accent)'
                    : '1px solid var(--sep)',
                  cursor: 'pointer',
                  opacity: cell.isCurrentMonth ? 1 : 0.45,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s var(--ease)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: isToday || isSelected ? 800 : 600,
                      color: isToday ? 'var(--accent)' : 'var(--label)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isToday ? 'var(--tint)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {cell.dayNum}
                  </span>

                  {totalCount > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--label3)' }}>
                      {totalCount}
                    </span>
                  )}
                </div>

                {/* Badges / Chips en la celda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                  {directItems.slice(0, 2).map(it => {
                    const isBday = it.kind === 'birthday'
                    const text = isBday ? cleanBirthdayDisplay(it.title) : it.title
                    return (
                      <div
                        key={it.id}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '1px 4px',
                          borderRadius: '4px',
                          background: isBday ? 'var(--k-birthday-soft)' : 'var(--k-event-soft)',
                          color: isBday ? 'var(--k-birthday)' : 'var(--k-event)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {text}
                      </div>
                    )
                  })}

                  {activeRoutines.length > 0 && directItems.length < 2 && (
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        background: 'var(--k-routine-soft)',
                        color: 'var(--k-routine)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      🔁 {activeRoutines[0].title}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Panel Detalle de la Fecha Seleccionada */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: 'var(--label)', textTransform: 'capitalize' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--label3)' }}>
              {selectedDirect.length + selectedRoutines.length} actividades programadas
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenNew(selectedDate)}
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            + Añadir en este día
          </button>
        </div>

        {selectedDirect.length === 0 && selectedRoutines.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--label3)', fontStyle: 'italic', textAlign: 'center', padding: '16px' }}>
            No hay eventos ni rutinas para esta fecha.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedDirect.map(it => (
              <ItemRow
                key={it.id}
                item={it}
                onToggleDone={onToggleDone}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}

            {selectedRoutines.map(r => (
              <ItemRow
                key={r.id}
                item={r}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
