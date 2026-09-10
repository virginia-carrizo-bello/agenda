import React, { useState, useEffect } from 'react'
import type { AgendaItem, ListItem } from '../../types/agenda'
import { ItemRow } from '../items/ItemRow'
import { RoutineCard } from '../items/RoutineCard'

interface TodayViewProps {
  items: AgendaItem[]
  lists: ListItem[]
  currentDate: string
  onToggleDone: (id: string) => void
  onToggleRoutineDate: (id: string, date: string) => void
  onEditItem: (item: AgendaItem) => void
  onDeleteItem: (id: string) => void
  onOpenNew: () => void
}

const QUOTES = [
  { text: 'El éxito es la suma de pequeños esfuerzos repetidos día tras día.', author: 'Robert Collier' },
  { text: 'Tu tiempo es limitado, así que no lo malgastes viviendo la vida de otro.', author: 'Steve Jobs' },
  { text: 'La disciplina es el puente entre las metas y los logros.', author: 'Jim Rohn' },
  { text: 'Organizar tu día es ganar tranquilidad para tu mente.', author: 'Tempo' },
]

export const TodayView: React.FC<TodayViewProps> = ({
  items,
  currentDate,
  onToggleDone,
  onToggleRoutineDate,
  onEditItem,
  onDeleteItem,
  onOpenNew,
}) => {
  // Clima en vivo con Open-Meteo
  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null)
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    const fetchWeather = async (lat = -34.6037, lon = -58.3816) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        )
        if (!res.ok) return
        const data = await res.json()
        const cw = data.current_weather
        if (cw) {
          let desc = 'Despejado'
          let icon = '☀️'
          if (cw.weathercode > 0 && cw.weathercode <= 3) {
            desc = 'Parcialmente nublado'
            icon = '⛅'
          } else if (cw.weathercode >= 45 && cw.weathercode <= 48) {
            desc = 'Niebla'
            icon = '🌫️'
          } else if (cw.weathercode >= 51 && cw.weathercode <= 67) {
            desc = 'Lluvia ligera'
            icon = '🌧️'
          } else if (cw.weathercode >= 80) {
            desc = 'Chubascos'
            icon = '🌦️'
          }
          setWeather({ temp: Math.round(cw.temperature), desc, icon })
        }
      } catch (e) {
        console.log('Weather offline fallback')
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather()
      )
    } else {
      fetchWeather()
    }
  }, [])

  // Helper para verificar si una rutina aplica al día de hoy
  const isRoutineActiveToday = (item: AgendaItem) => {
    if (!item.rrule || item.rrule.includes('FREQ=DAILY')) return true
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    const todayObj = new Date(currentDate + 'T00:00:00')
    const todayKey = dayMap[todayObj.getDay()]
    return item.rrule.includes(todayKey)
  }

  // Filtrar ítems de hoy
  const todayItems = items.filter(it => it.date === currentDate && it.kind !== 'routine')
  const todayRoutines = items.filter(it => it.kind === 'routine' && isRoutineActiveToday(it))

  // Clasificar eventos por franjas horarias
  const morningEvents = todayItems.filter(it => (it.time && it.time < '13:00') || it.all_day)
  const afternoonEvents = todayItems.filter(it => it.time && it.time >= '13:00' && it.time < '19:00')
  const eveningEvents = todayItems.filter(it => it.time && it.time >= '19:00')
  const noTimeItems = todayItems.filter(it => !it.time && !it.all_day)

  // Formatear fecha bonita
  const dateObj = new Date(currentDate + 'T00:00:00')
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Cabecera / Banner Superior */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--card), var(--bg3))',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hoy
          </span>
          <h2 style={{ fontSize: '26px', color: 'var(--label)', textTransform: 'capitalize', marginTop: '2px' }}>
            {formattedDate}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--label3)', fontStyle: 'italic', marginTop: '4px' }}>
            "{quote.text}" — <span style={{ fontWeight: 600 }}>{quote.author}</span>
          </p>
        </div>

        {weather && (
          <div
            style={{
              background: 'var(--card)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--sep)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '28px' }}>{weather.icon}</span>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--label)' }}>
                {weather.temp}°C
              </div>
              <div style={{ fontSize: '12px', color: 'var(--label2)' }}>{weather.desc}</div>
            </div>
          </div>
        )}
      </div>

      {/* Sección: Rutinas y Hábitos de Hoy */}
      {todayRoutines.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--label)' }}>🔁 Rutinas del Día</h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--label3)' }}>
              {todayRoutines.filter(r => (r.done_dates || '').includes(currentDate)).length}/{todayRoutines.length} completadas
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {todayRoutines.map(r => (
              <RoutineCard
                key={r.id}
                item={r}
                currentDate={currentDate}
                onToggleDate={onToggleRoutineDate}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sección: Eventos y Recordatorios de Hoy */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--label)' }}>📅 Agenda de Hoy</h3>
          <button
            type="button"
            onClick={onOpenNew}
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              gap: '4px',
            }}
          >
            + Añadir
          </button>
        </div>

        {todayItems.length === 0 ? (
          <div
            style={{
              background: 'var(--card)',
              padding: '36px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--sep)',
              textAlign: 'center',
              color: 'var(--label3)',
            }}
          >
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>☕</span>
            <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--label2)' }}>
              No tienes eventos programados para hoy
            </p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Disfruta tu día o presiona "+ Añadir" para agendar algo.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {morningEvents.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-event)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  🌅 Mañana / Todo el día
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {morningEvents.map(it => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      onToggleDone={onToggleDone}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {afternoonEvents.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  ☀️ Tarde
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {afternoonEvents.map(it => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      onToggleDone={onToggleDone}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {eveningEvents.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--k-wish)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  🌙 Noche
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {eveningEvents.map(it => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      onToggleDone={onToggleDone}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {noTimeItems.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--label3)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  📌 Otros
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {noTimeItems.map(it => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      onToggleDone={onToggleDone}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
