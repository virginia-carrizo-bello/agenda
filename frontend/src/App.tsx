import React, { useState, useEffect, useMemo } from 'react'
import type { AgendaItem, ListItem, ItemKind, ThemeMode } from './types/agenda'
import { api } from './api/client'
import { getArgHoliday } from './utils/holidays'

// Helper: Formato de fechas YYYY-MM-DD
const ymd = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addDays = (d: Date, n: number): Date => {
  const res = new Date(d)
  res.setDate(res.getDate() + n)
  return res
}

// Limpiar prefijo redundante en cumpleaños
const cleanBirthdayName = (title: string): string => {
  if (!title) return ''
  return title.replace(/^cumpleaños\s*(de\s*)?/i, '').replace(/^🎂\s*/, '').trim()
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const QUOTES = [
  { text: 'Haz de cada día tu obra maestra.', author: 'John Wooden' },
  { text: 'El secreto para salir adelante es empezar.', author: 'Mark Twain' },
  { text: 'Tu tiempo es limitado, no lo malgastes viviendo la vida de otro.', author: 'Steve Jobs' },
  { text: 'La disciplina es el puente entre metas y logros.', author: 'Jim Rohn' },
  { text: 'Pequeños hábitos diarios construyen grandes resultados.', author: 'James Clear' },
]

const ALARM_OPTIONS = [
  { value: 0, label: 'Al momento del evento' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
]

export const App: React.FC = () => {
  // Estado de Datos
  const [items, setItems] = useState<AgendaItem[]>([])
  const [lists, setLists] = useState<ListItem[]>([])

  // Navegación
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'lists' | 'settings'>('today')
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => ymd(new Date()))

  // Vista de Calendario
  const [calYear, setCalYear] = useState<number>(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState<number>(() => new Date().getMonth())

  // Modal Sheet (Crear / Editar)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetEditingItem, setSheetEditingItem] = useState<AgendaItem | null>(null)
  const [sheetKind, setSheetKind] = useState<ItemKind>('event')

  // Formulario del Sheet
  const [fTitle, setFTitle] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fDate, setFDate] = useState(ymd(new Date()))
  const [fTime, setFTime] = useState('09:00')
  const [fTimeEnd, setFTimeEnd] = useState('10:00')
  const [fAllDay, setFAllDay] = useState(false)
  const [fLocation, setFLocation] = useState('')
  const [fAlarm, setFAlarm] = useState<number | null>(null)
  const [fListId, setFListId] = useState<string | null>(null)
  const [fIcon, setFIcon] = useState('🔥')
  const [fRoutineIsDaily, setFRoutineIsDaily] = useState(true)
  const [fRoutineDays, setFRoutineDays] = useState<string[]>(['MO'])

  // Búsqueda
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState('all')

  // Clima
  const [weatherData, setWeatherData] = useState<{
    city: string
    temp: number
    desc: string
    icon: string
    hourly: { time: string; temp: number; icon: string }[]
  } | null>(null)
  const [weatherPopoverOpen, setWeatherPopoverOpen] = useState(false)

  // Tema y Modo de Vista
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('tempo_theme') as ThemeMode
    return saved === 'dark' ? 'dark' : 'light'
  })
  const [viewMode, setViewMode] = useState<'mobile' | 'pc'>('pc')
  const [phoneWidth, setPhoneWidth] = useState<number>(420)

  // Toasts
  const [toast, setToast] = useState<{ id: string; message: string; actionLabel?: string; onAction?: () => void } | null>(null)

  // Cita del día fija por sesión
  const [todayQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  // Aplicar tema y clases a body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('tempo_theme', theme)
  }, [theme])

  useEffect(() => {
    if (viewMode === 'mobile') {
      document.body.classList.add('preview-mobile')
    } else {
      document.body.classList.remove('preview-mobile')
    }
  }, [viewMode])

  // Cargar estado inicial desde FastAPI backend
  const loadState = async () => {
    try {
      const state = await api.getState()
      setItems(state.items || [])
      setLists(state.lists || [])
    } catch (e) {
      console.error('Error al conectar con backend FastAPI:', e)
    }
  }

  useEffect(() => {
    loadState()
  }, [])

  // Obtener clima en vivo (Open-Meteo)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto'
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

          const nowHour = new Date().getHours()
          const hourly: { time: string; temp: number; icon: string }[] = []
          for (let i = nowHour; i < nowHour + 6 && i < (data.hourly?.time?.length || 0); i++) {
            const hTime = data.hourly.time[i]?.split('T')[1]?.substring(0, 5) || `${i}:00`
            const hTemp = Math.round(data.hourly.temperature_2m[i] || cw.temperature)
            hourly.push({ time: hTime, temp: hTemp, icon })
          }

          setWeatherData({
            city: 'Buenos Aires',
            temp: Math.round(cw.temperature),
            desc,
            icon,
            hourly,
          })
        }
      } catch (err) {
        console.log('Open-Meteo offline fallback')
      }
    }
    fetchWeather()
  }, [])

  // Mostrar Toast con Deshacer
  const showToast = (message: string, actionLabel?: string, onAction?: () => void) => {
    const id = Date.now().toString()
    setToast({ id, message, actionLabel, onAction })
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr))
    }, 4500)
  }

  // Atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT'

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      if (e.key === 'Escape') {
        if (sheetOpen) setSheetOpen(false)
        if (searchOpen) setSearchOpen(false)
        if (weatherPopoverOpen) setWeatherPopoverOpen(false)
        return
      }

      if (!isInput && !sheetOpen && !searchOpen) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault()
          handleOpenAdd()
        } else if (e.key === '1') {
          setActiveTab('today')
          setActiveListId(null)
        } else if (e.key === '2') {
          setActiveTab('calendar')
          setActiveListId(null)
        } else if (e.key === '3') {
          setActiveTab('lists')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sheetOpen, searchOpen, weatherPopoverOpen])

  // Abrir Sheet para Crear
  const handleOpenAdd = (date?: string, defaultKind: ItemKind = 'event') => {
    setSheetEditingItem(null)
    setSheetKind(defaultKind)
    setFTitle('')
    setFNotes('')
    setFDate(date || selectedDate)
    setFTime('09:00')
    setFTimeEnd('10:00')
    setFAllDay(false)
    setFLocation('')
    setFAlarm(null)
    setFListId(activeListId || (lists.length > 0 ? lists[0].id : null))
    setFIcon('🔥')
    setFRoutineIsDaily(true)
    setFRoutineDays(['MO'])
    setSheetOpen(true)
  }

  // Abrir Sheet para Editar
  const handleOpenEdit = (item: AgendaItem) => {
    setSheetEditingItem(item)
    setSheetKind(item.kind)
    setFTitle(item.kind === 'birthday' ? cleanBirthdayName(item.title) : item.title)
    setFNotes(item.notes || '')
    setFDate(item.date || selectedDate)
    setFTime(item.time || '09:00')
    setFTimeEnd(item.time_end || '10:00')
    setFAllDay(!!item.all_day)
    setFLocation(item.location || '')
    setFAlarm(item.alarm !== undefined ? item.alarm : null)
    setFListId(item.list_id || null)
    setFIcon(item.icon || '🔥')

    if (item.rrule && item.rrule.includes('BYDAY=')) {
      setFRoutineIsDaily(false)
      const m = item.rrule.match(/BYDAY=([A-Z,]+)/)
      if (m && m[1]) setFRoutineDays(m[1].split(','))
    } else {
      setFRoutineIsDaily(true)
      setFRoutineDays(['MO'])
    }
    setSheetOpen(true)
  }

  // Guardar Ítem desde el Sheet
  const handleSaveSheet = async () => {
    if (!fTitle.trim()) return

    let finalTitle = fTitle.trim()
    let rrule: string | null = null

    if (sheetKind === 'birthday') {
      finalTitle = `🎂 ${cleanBirthdayName(finalTitle)}`
    }

    if (sheetKind === 'routine') {
      rrule = fRoutineIsDaily ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${fRoutineDays.join(',')}`
    }

    const payload: Partial<AgendaItem> = {
      ...(sheetEditingItem ? { id: sheetEditingItem.id } : {}),
      kind: sheetKind,
      title: finalTitle,
      notes: fNotes.trim() || null,
      date: sheetKind === 'routine' ? null : fDate || null,
      time: sheetKind === 'task' || sheetKind === 'birthday' ? null : (fAllDay ? null : fTime || null),
      time_end: sheetKind === 'task' || sheetKind === 'birthday' ? null : (fAllDay ? null : fTimeEnd || null),
      all_day: fAllDay,
      location: fLocation.trim() || null,
      alarm: sheetKind === 'reminder' || sheetKind === 'event' ? fAlarm : null,
      list_id: sheetKind === 'task' ? fListId : null,
      rrule,
      icon: sheetKind === 'routine' ? fIcon : null,
    }

    try {
      if (sheetEditingItem) {
        const updated = await api.updateItem(sheetEditingItem.id, payload)
        setItems(prev => prev.map(it => (it.id === updated.id ? updated : it)))
        showToast('Guardado correctamente')
      } else {
        const created = await api.createItem({
          ...payload,
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          created_at: new Date().toISOString(),
        })
        setItems(prev => [created, ...prev])
        showToast('Añadido a tu agenda')
      }
      setSheetOpen(false)
    } catch (err) {
      showToast('Error al guardar')
    }
  }

  // Eliminar Ítem
  const handleDeleteItem = async (id: string) => {
    const itemToDelete = items.find(it => it.id === id)
    if (!itemToDelete) return
    setItems(prev => prev.filter(it => it.id !== id))
    setSheetOpen(false)

    try {
      await api.deleteItem(id)
      showToast(`Eliminado: ${itemToDelete.title}`, 'Deshacer', async () => {
        await api.createItem(itemToDelete)
        setItems(prev => [itemToDelete, ...prev])
      })
    } catch (e) {
      setItems(prev => [...prev, itemToDelete])
      showToast('Error al eliminar')
    }
  }

  // Alternar completado
  const handleToggleDone = async (id: string, dateForRoutine?: string) => {
    const item = items.find(it => it.id === id)
    if (!item) return

    if (item.kind === 'routine' && dateForRoutine) {
      const dates = (item.done_dates || '').split(',').map(s => s.trim()).filter(Boolean)
      const has = dates.includes(dateForRoutine)
      const nextDates = has ? dates.filter(d => d !== dateForRoutine) : [...dates, dateForRoutine]
      const nextStr = nextDates.join(',')

      setItems(prev => prev.map(it => (it.id === id ? { ...it, done_dates: nextStr } : it)))
      try {
        await api.patchItem(id, { done_dates: nextStr })
      } catch (e) {
        console.error(e)
      }
      return
    }

    const nextDone = !item.done
    setItems(prev => prev.map(it => (it.id === id ? { ...it, done: nextDone } : it)))
    try {
      await api.toggleDone(id)
    } catch (e) {
      setItems(prev => prev.map(it => (it.id === id ? { ...it, done: item.done } : it)))
    }
  }

  // Rutina activa en fecha dada
  const isRoutineOnDay = (routine: AgendaItem, dateStr: string): boolean => {
    if (!routine.rrule || routine.rrule.includes('FREQ=DAILY')) return true
    const d = new Date(dateStr + 'T00:00:00')
    const dayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    const code = dayCodes[d.getDay()]
    return routine.rrule.includes(code)
  }

  // Cálculo de racha de rutina
  const calcStreak = (routine: AgendaItem, curDate: string): number => {
    const dates = (routine.done_dates || '').split(',').map(s => s.trim()).filter(Boolean)
    let streak = 0
    let check = new Date(curDate + 'T00:00:00')

    const todayYmd = ymd(check)
    if (!dates.includes(todayYmd)) {
      check = addDays(check, -1)
    }

    while (true) {
      const dStr = ymd(check)
      if (dates.includes(dStr)) {
        streak++
        check = addDays(check, -1)
      } else {
        break
      }
    }
    return streak
  }

  // Crear Lista
  const handleCreateList = async () => {
    const name = prompt('Nombre de la nueva lista:')
    if (!name || !name.trim()) return
    const id = `list_${Date.now()}`
    const newList: ListItem = { id, name: name.trim(), icon: '📝', color: '#8B5FA8' }
    setLists(prev => [...prev, newList])
    try {
      await api.createList(newList)
      setActiveListId(id)
      showToast(`Lista "${name}" creada`)
    } catch (e) {
      setLists(prev => prev.filter(l => l.id !== id))
    }
  }

  // Limpiar Tareas Completadas de una Lista
  const handleCleanListDone = async (listId: string) => {
    const doneTasks = items.filter(it => it.list_id === listId && it.done)
    if (!doneTasks.length) return

    setItems(prev => prev.filter(it => !(it.list_id === listId && it.done)))
    try {
      await api.cleanListDone(listId)
      showToast(`${doneTasks.length} completados eliminados`, 'Deshacer', async () => {
        await api.batchInsert(doneTasks)
        setItems(prev => [...prev, ...doneTasks])
      })
    } catch (e) {
      setItems(prev => [...prev, ...doneTasks])
    }
  }

  // Reset / Reseed Database
  const handleReseed = async () => {
    if (confirm('¿Restaurar los datos semilla iniciales de Tempo?')) {
      try {
        const state = await api.reseed()
        setItems(state.items || [])
        setLists(state.lists || [])
        showToast('Datos reiniciados con éxito')
      } catch (e) {
        showToast('Error al reiniciar')
      }
    }
  }

  // Datos para Vista Hoy
  const todayYmd = ymd(new Date())
  const todayItems = items.filter(it => it.date === todayYmd && it.kind !== 'routine')
  const todayRoutines = items.filter(it => it.kind === 'routine' && isRoutineOnDay(it, todayYmd))
  const todayTotalCount = todayItems.length + todayRoutines.length
  const todayDoneCount =
    todayItems.filter(it => it.done).length +
    todayRoutines.filter(r => (r.done_dates || '').includes(todayYmd)).length
  const todayPercent = todayTotalCount > 0 ? Math.round((todayDoneCount / todayTotalCount) * 100) : 0

  // Datos para Vista Calendario
  const monthDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1)
    const lastDay = new Date(calYear, calMonth + 1, 0)

    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6

    const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = []

    const prevMonthLastDay = new Date(calYear, calMonth, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i
      const prevM = calMonth === 0 ? 11 : calMonth - 1
      const prevY = calMonth === 0 ? calYear - 1 : calYear
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: false })
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: true })
    }

    const remaining = (7 - (days.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      const nextM = calMonth === 11 ? 0 : calMonth + 1
      const nextY = calMonth === 11 ? calYear + 1 : calYear
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: false })
    }

    return days
  }, [calYear, calMonth])

  // Días seleccionados en el Calendario
  const selectedDateDirect = items.filter(it => it.date === selectedDate && it.kind !== 'routine')
  const selectedDateRoutines = items.filter(it => it.kind === 'routine' && isRoutineOnDay(it, selectedDate))
  const selectedDateHoliday = getArgHoliday(selectedDate)

  // Búsqueda Filtrada
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && searchFilter === 'all') return []
    const q = searchQuery.toLowerCase().trim()
    return items.filter(it => {
      if (searchFilter !== 'all' && it.kind !== searchFilter) return false
      if (!q) return true
      const matchTitle = it.title.toLowerCase().includes(q)
      const matchNotes = (it.notes || '').toLowerCase().includes(q)
      const matchLoc = (it.location || '').toLowerCase().includes(q)
      return matchTitle || matchNotes || matchLoc
    })
  }, [items, searchQuery, searchFilter])

  // Badge contador de hoy para el sidebar
  const pendingTodayCount = todayTotalCount - todayDoneCount

  return (
    <>
      {/* 1. Barra superior flotante de control de vista en navegador PC */}
      <header className="view-mode-bar" id="viewModeBar" aria-label="Selector de visualización">
        <div className="vmb-group">
          <button
            type="button"
            className={`vmb-btn ${viewMode === 'mobile' ? 'on' : ''}`}
            id="vmbBtnMobile"
            onClick={() => setViewMode('mobile')}
            title="Ver con marco de teléfono móvil"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="6" y="2" width="12" height="20" rx="3" />
              <path d="M12 18h.01" />
            </svg>
            <span>Vista Móvil</span>
          </button>
          <button
            type="button"
            className={`vmb-btn ${viewMode === 'pc' ? 'on' : ''}`}
            id="vmbBtnPc"
            onClick={() => setViewMode('pc')}
            title="Ver como aplicación de escritorio expandida"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <span>Vista PC</span>
          </button>
        </div>

        {viewMode === 'mobile' && (
          <div className="vmb-sizes" id="vmbSizes">
            <span className="vmb-label">Ancho:</span>
            {[420, 450, 390].map(w => (
              <button
                key={w}
                type="button"
                className={`vmb-pill ${phoneWidth === w ? 'on' : ''}`}
                onClick={() => setPhoneWidth(w)}
                title={`Ancho (${w}px)`}
              >
                {w}px
              </button>
            ))}
          </div>
        )}

        <div className="vmb-right">
          <button
            type="button"
            className="vmb-icon-btn"
            id="vmbBtnTheme"
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            title="Alternar tema claro/oscuro"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
            </svg>
          </button>
        </div>
      </header>

      {/* 2. Escenario con dispositivo de simulación */}
      <div className="stage">
        <div className="device" style={{ width: viewMode === 'mobile' ? `${phoneWidth}px` : undefined }}>
          <div id="phone">
            {/* Dynamic Island y Status Bar */}
            <div className="island" aria-hidden="true" />
            <div className="statusbar" aria-hidden="true">
              <span className="sb-time" id="sbClock">
                {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="sb-icons">
                <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor">
                  <rect x="0" y="7.5" width="3.4" height="4.5" rx="1" />
                  <rect x="5" y="5" width="3.4" height="7" rx="1" />
                  <rect x="10" y="2.5" width="3.4" height="9.5" rx="1" />
                  <rect x="15" y="0" width="3.4" height="12" rx="1" />
                </svg>
                <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M1.5 4.2a10.5 10.5 0 0 1 14 0" />
                  <path d="M4 7a7 7 0 0 1 9 0" />
                  <circle cx="8.5" cy="10" r="1.4" fill="currentColor" stroke="none" />
                </svg>
                <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
                  <rect x=".8" y=".8" width="21" height="10.4" rx="3.2" stroke="currentColor" opacity=".4" strokeWidth="1" />
                  <rect x="2.5" y="2.5" width="14" height="7" rx="1.8" fill="currentColor" />
                  <path d="M23.6 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity=".4" />
                </svg>
              </span>
            </div>

            {/* Aplicación Principal */}
            <div className="app">
              {/* Sidebar para PC */}
              <aside className="pc-sidebar" id="pcSidebar">
                <div className="pc-brand">
                  <div className="pc-logo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
                    </svg>
                  </div>
                  <div className="pc-brand-text">
                    <span className="pc-title">Tempo</span>
                    <span className="pc-subtitle">Organizador</span>
                  </div>
                </div>

                <div className="pc-actions">
                  <button type="button" className="pc-btn-add" id="pcBtnAdd" onClick={() => handleOpenAdd()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Nueva entrada</span>
                    <kbd>N</kbd>
                  </button>
                  <button type="button" className="pc-btn-search" id="pcBtnSearch" onClick={() => setSearchOpen(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20.3 20.3l-3.8-3.8" />
                    </svg>
                    <span>Buscar...</span>
                    <kbd>Ctrl+K</kbd>
                  </button>
                </div>

                <nav className="pc-nav" role="tablist" aria-label="Navegación principal">
                  <button
                    type="button"
                    className={`pc-nav-item ${activeTab === 'today' && !activeListId ? 'on' : ''}`}
                    onClick={() => { setActiveTab('today'); setActiveListId(null) }}
                  >
                    <span className="pc-nav-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
                      </svg>
                    </span>
                    <span className="pc-nav-label">Hoy</span>
                    <span className="pc-badge" id="pcBadgeToday">{pendingTodayCount}</span>
                  </button>

                  <button
                    type="button"
                    className={`pc-nav-item ${activeTab === 'calendar' ? 'on' : ''}`}
                    onClick={() => { setActiveTab('calendar'); setActiveListId(null) }}
                  >
                    <span className="pc-nav-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3.2" y="4.8" width="17.6" height="16" rx="3" />
                        <path d="M3.2 9.8h17.6M8 2.8v4M16 2.8v4" />
                      </svg>
                    </span>
                    <span className="pc-nav-label">Calendario</span>
                  </button>

                  <button
                    type="button"
                    className={`pc-nav-item ${activeTab === 'lists' ? 'on' : ''}`}
                    onClick={() => setActiveTab('lists')}
                  >
                    <span className="pc-nav-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.5 6h12M8.5 12h12M8.5 18h12" />
                        <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.8" />
                      </svg>
                    </span>
                    <span className="pc-nav-label">Listas</span>
                  </button>
                </nav>

                <div className="pc-sec">
                  <div className="pc-sec-head">
                    <span>Colecciones</span>
                    <button type="button" className="pc-btn-plus" onClick={handleCreateList} title="Crear nueva lista">+</button>
                  </div>
                  <div className="pc-sub-nav" id="pcSidebarLists">
                    {lists.map(l => {
                      const count = items.filter(it => it.list_id === l.id && !it.done).length
                      const isSel = activeTab === 'lists' && activeListId === l.id
                      return (
                        <button
                          key={l.id}
                          type="button"
                          className="pc-sub-item"
                          style={{ background: isSel ? 'var(--bg3)' : undefined }}
                          onClick={() => { setActiveTab('lists'); setActiveListId(l.id) }}
                        >
                          <span className="pc-sub-dot" style={{ background: l.color || 'var(--accent)' }} />
                          <span>{l.name}</span>
                          {count > 0 && <span className="pc-sub-count">{count}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pc-sidebar-footer">
                  <div className="pc-status">
                    <span className="status-dot" />
                    <span>Backend SQLite conectado</span>
                  </div>
                  <div className="pc-footer-btns">
                    <button type="button" className="pc-fbtn" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} title="Alternar tema">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
                      </svg>
                      <span>Tema</span>
                    </button>
                    <button type="button" className="pc-fbtn" onClick={handleReseed} title="Restaurar datos semilla">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3.5 4.5v5.5h5.5" />
                        <path d="M4.6 14.5a8 8 0 1 0 1.5-7.6L3.5 10" />
                      </svg>
                      <span>Reset</span>
                    </button>
                    <button
                      type="button"
                      className="pc-fbtn"
                      onClick={() => setViewMode(v => (v === 'pc' ? 'mobile' : 'pc'))}
                      title="Alternar marco móvil"
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="3" />
                        <path d="M12 18h.01" />
                      </svg>
                      <span>{viewMode === 'pc' ? 'Móvil' : 'PC'}</span>
                    </button>
                  </div>
                </div>
              </aside>

              {/* Área Principal de la Aplicación */}
              <div className="app-main">
                {/* Cabecera Nav (Topbar) */}
                <header className="nav" id="nav">
                  <div className="nav-l">
                    {activeListId && activeTab === 'lists' && (
                      <button type="button" className="nav-back" onClick={() => setActiveListId(null)} aria-label="Volver">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                        <span>Atrás</span>
                      </button>
                    )}
                  </div>
                  <div className="nav-c" id="navTitle" />
                  <div className="nav-r">
                    <button type="button" className="nav-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M20.3 20.3l-3.8-3.8" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="nav-btn"
                      onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                      aria-label="Cambiar tema"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
                      </svg>
                    </button>
                    <button type="button" className="nav-btn" onClick={() => handleOpenAdd()} aria-label="Añadir">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </header>

                {/* Vistas de Contenido */}
                <div className="views" id="views">
                  {/* Vista 1: HOY */}
                  <section className={`view ${activeTab === 'today' ? 'on' : ''}`} id="v-today" role="tabpanel">
                    <div className="pad" id="c-today">
                      {/* Cabecera Principal del Día y Clima */}
                      <div className="today-header">
                        <div className="today-header-left">
                          <div className="today-date-eyebrow">
                            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                          </div>
                          <h2 className="large-day">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                          </h2>
                        </div>

                        {/* Widget de Clima */}
                        {weatherData && (
                          <div className={`weather-widget-wrap ${weatherPopoverOpen ? 'open' : ''}`}>
                            <div
                              className="weather-card-btn"
                              onClick={() => setWeatherPopoverOpen(o => !o)}
                              title="Ver pronóstico por hora"
                            >
                              <div className="wc-location">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
                                  <circle cx="12" cy="9" r="2.5" />
                                </svg>
                                <span>{weatherData.city}</span>
                              </div>
                              <div className="wc-condition">
                                <span className="wc-icon">{weatherData.icon}</span>
                                <span className="wc-temp">{weatherData.temp}°</span>
                                <span className="wc-desc">{weatherData.desc}</span>
                                <span className="wc-chevron">
                                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4">
                                    <path d="M6 9l6 6 6-6" />
                                  </svg>
                                </span>
                              </div>
                            </div>

                            {/* Popover Horario */}
                            <div className="weather-popover">
                              <div className="wp-head">
                                <div className="wp-loc">
                                  <span>📍 {weatherData.city}</span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--label3)' }}>Hoy</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                                {weatherData.hourly.map((h, idx) => (
                                  <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '11px', color: 'var(--label3)' }}>{h.time}</div>
                                    <div style={{ fontSize: '16px', margin: '3px 0' }}>{h.icon}</div>
                                    <div style={{ fontSize: '12px', fontWeight: 700 }}>{h.temp}°</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hero Card con Cita y Circular Progress */}
                      <div className="hero card" style={{ marginTop: '8px' }}>
                        <div className="hero-l">
                          <div className="hi">"{todayQuote.text}"</div>
                          <div className="hd">— {todayQuote.author}</div>
                          <div className="hstats">
                            <div className="hs">
                              <b>{todayTotalCount - todayDoneCount}</b>
                              <span>Pendientes</span>
                            </div>
                            <div className="hs">
                              <b>{todayDoneCount}</b>
                              <span>Completadas</span>
                            </div>
                          </div>
                        </div>
                        <div className="hero-r">
                          <svg className="ring" viewBox="0 0 92 92">
                            <circle cx="46" cy="46" r="38" stroke="var(--bg3)" strokeWidth="7" fill="none" />
                            <circle
                              cx="46"
                              cy="46"
                              r="38"
                              stroke="var(--accent)"
                              strokeWidth="7"
                              fill="none"
                              strokeDasharray="238.76"
                              strokeDashoffset={238.76 - (238.76 * todayPercent) / 100}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.34, 1.35, 0.45, 1)' }}
                            />
                          </svg>
                          <div className="rtxt" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '17px', fontWeight: 800 }}>{todayPercent}%</span>
                            <span style={{ fontSize: '10px', color: 'var(--label3)', textTransform: 'uppercase', fontWeight: 600 }}>hoy</span>
                          </div>
                        </div>
                      </div>

                      {/* Rutinas de Hoy */}
                      {todayRoutines.length > 0 && (
                        <div className="sec" style={{ marginTop: '22px' }}>
                          <div className="sec-head">
                            <span className="sec-t" style={{ color: 'var(--k-routine)' }}>🔁 Rutinas Diarias</span>
                            <span className="sec-m">{todayRoutines.filter(r => (r.done_dates || '').includes(todayYmd)).length}/{todayRoutines.length}</span>
                          </div>
                          <div className="list">
                            {todayRoutines.map(r => {
                              const isDone = (r.done_dates || '').includes(todayYmd)
                              const streak = calcStreak(r, todayYmd)
                              return (
                                <div key={r.id} className={`row ${isDone ? 'done' : ''}`} style={{ '--kc': 'var(--k-routine)', '--kcs': 'var(--k-routine-soft)' } as any}>
                                  <div className="fg" onClick={() => handleOpenEdit(r)}>
                                    <button
                                      type="button"
                                      className="chk"
                                      onClick={e => { e.stopPropagation(); handleToggleDone(r.id, todayYmd) }}
                                    >
                                      <svg viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3" /></svg>
                                    </button>
                                    <div className="tx">
                                      <span className="t1">{r.title}</span>
                                      <span className="t2">
                                        {r.rrule && r.rrule.includes('BYDAY=') ? 'Día específico' : 'Todos los días'}
                                        {streak > 0 && ` · 🔥 ${streak} día${streak > 1 ? 's' : ''}`}
                                      </span>
                                    </div>
                                    <span className="meta">{r.time || ''}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Eventos, Recordatorios y Tareas de Hoy */}
                      <div className="sec" style={{ marginTop: '22px' }}>
                        <div className="sec-head">
                          <span className="sec-t" style={{ color: 'var(--k-event)' }}>📅 Actividades de Hoy</span>
                          <button type="button" className="sec-act" onClick={() => handleOpenAdd(todayYmd)}>+ Añadir</button>
                        </div>
                        {todayItems.length === 0 ? (
                          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--label3)', marginTop: '6px' }}>
                            <p style={{ fontWeight: 600, color: 'var(--label2)' }}>No tienes eventos agendados para hoy</p>
                            <p style={{ fontSize: '13px', marginTop: '4px' }}>Presiona "+ Añadir" para crear uno.</p>
                          </div>
                        ) : (
                          <div className="list">
                            {todayItems.map(it => {
                              const isBday = it.kind === 'birthday'
                              const displayTitle = isBday ? `🎂 ${cleanBirthdayName(it.title)}` : it.title
                              const timeStr = it.all_day ? 'Todo el día' : it.time_end ? `${it.time} - ${it.time_end}` : it.time || ''

                              return (
                                <div key={it.id} className={`row ${it.done ? 'done' : ''}`} style={{ '--kc': 'var(--k-event)', '--kcs': 'var(--k-event-soft)' } as any}>
                                  <div className="fg" onClick={() => handleOpenEdit(it)}>
                                    <button
                                      type="button"
                                      className="chk"
                                      onClick={e => { e.stopPropagation(); handleToggleDone(it.id) }}
                                    >
                                      <svg viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3" /></svg>
                                    </button>
                                    <div className="tx">
                                      <span className="t1">{displayTitle}</span>
                                      <span className="t2">
                                        {it.location && `📍 ${it.location}  `}
                                        {it.alarm !== undefined && it.alarm !== null && `🔔 ${it.alarm === 0 ? 'Al momento' : it.alarm + 'm antes'}  `}
                                        {it.notes || ''}
                                      </span>
                                    </div>
                                    <span className="meta">{timeStr}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Vista 2: CALENDARIO */}
                  <section className={`view ${activeTab === 'calendar' ? 'on' : ''}`} id="v-calendar" role="tabpanel">
                    <div className="pad" id="c-calendar">
                      {/* Cabecera de Navegación del Calendario */}
                      <div className="cal-header-bar">
                        <div className="cal-header-left">
                          <h2 className="cal-title-main">
                            {MONTHS[calMonth]} {calYear}
                          </h2>
                          <button
                            type="button"
                            className="cal-today-pill"
                            onClick={() => {
                              const now = new Date()
                              setCalYear(now.getFullYear())
                              setCalMonth(now.getMonth())
                              setSelectedDate(ymd(now))
                            }}
                          >
                            Hoy
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="cal-nav-btn"
                            onClick={() => {
                              if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
                              else { setCalMonth(m => m - 1) }
                            }}
                            title="Mes anterior"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            className="cal-nav-btn"
                            onClick={() => {
                              if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
                              else { setCalMonth(m => m + 1) }
                            }}
                            title="Mes siguiente"
                          >
                            ▶
                          </button>
                        </div>
                      </div>

                      {/* Grilla Mensual */}
                      <div className="cal-grid" style={{ marginTop: '8px' }}>
                        {/* Cabecera Días */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--label3)', paddingBottom: '6px' }}>
                          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <span key={d}>{d}</span>
                          ))}
                        </div>

                        {/* Celdas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                          {monthDays.map(cell => {
                            const isSel = cell.date === selectedDate
                            const isToday = cell.date === todayYmd
                            const cellDirect = items.filter(it => it.date === cell.date && it.kind !== 'routine')
                            const cellRoutines = items.filter(it => it.kind === 'routine' && isRoutineOnDay(it, cell.date))
                            const holiday = getArgHoliday(cell.date)

                            return (
                              <div
                                key={cell.date}
                                className={`cal-c ${isSel ? 'is-sel' : ''} ${isToday ? 'is-today' : ''} ${!cell.isCurrentMonth ? 'empty' : ''}`}
                                onClick={() => setSelectedDate(cell.date)}
                                style={{ minHeight: '68px', padding: '4px 3px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', border: isSel ? '1.5px solid var(--accent)' : '1px solid var(--sep)' }}
                              >
                                <div className="cal-top">
                                  <span className="cal-n">{cell.dayNum}</span>
                                </div>
                                <div className="cal-events-list">
                                  {holiday && (
                                    <div className="cal-ev-chip cal-holiday-chip" title={holiday.name}>
                                      <span className="ev-title">🇦🇷 {holiday.name}</span>
                                    </div>
                                  )}
                                  {cellDirect.slice(0, 2).map(it => {
                                    const isBday = it.kind === 'birthday'
                                    return (
                                      <div
                                        key={it.id}
                                        className="cal-ev-chip"
                                        style={{
                                          background: isBday ? 'var(--k-birthday-soft)' : 'var(--k-event-soft)',
                                          color: isBday ? 'var(--k-birthday)' : 'var(--k-event)',
                                        }}
                                      >
                                        <span className="ev-title">{isBday ? `🎂 ${cleanBirthdayName(it.title)}` : it.title}</span>
                                      </div>
                                    )
                                  })}
                                  {cellRoutines.length > 0 && cellDirect.length < 2 && (
                                    <div className="cal-ev-chip" style={{ background: 'var(--k-routine-soft)', color: 'var(--k-routine)' }}>
                                      <span className="ev-title">🔁 {cellRoutines[0].title}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Detalle de la Fecha Seleccionada */}
                      <div className="cal-day-header">
                        <span style={{ fontSize: '15px', fontWeight: 700, textTransform: 'capitalize' }}>
                          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <button type="button" className="cal-add-btn" onClick={() => handleOpenAdd(selectedDate)}>
                          + Añadir en este día
                        </button>
                      </div>

                      {selectedDateHoliday && (
                        <div style={{ background: 'color-mix(in srgb, var(--red) 12%, var(--card))', padding: '10px 14px', borderRadius: '12px', border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)', marginBottom: '10px' }}>
                          <b style={{ color: 'var(--red)', fontSize: '13px' }}>🇦🇷 Feriado Nacional: {selectedDateHoliday.name}</b>
                          {selectedDateHoliday.desc && <p style={{ fontSize: '12px', color: 'var(--label2)', marginTop: '2px' }}>{selectedDateHoliday.desc}</p>}
                        </div>
                      )}

                      {selectedDateDirect.length === 0 && selectedDateRoutines.length === 0 ? (
                        <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--label3)' }}>
                          No hay eventos agendados para este día.
                        </div>
                      ) : (
                        <div className="list">
                          {selectedDateDirect.map(it => (
                            <div key={it.id} className={`row ${it.done ? 'done' : ''}`} style={{ '--kc': 'var(--k-event)', '--kcs': 'var(--k-event-soft)' } as any}>
                              <div className="fg" onClick={() => handleOpenEdit(it)}>
                                <button type="button" className="chk" onClick={e => { e.stopPropagation(); handleToggleDone(it.id) }}>
                                  <svg viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3" /></svg>
                                </button>
                                <div className="tx">
                                  <span className="t1">{it.kind === 'birthday' ? `🎂 ${cleanBirthdayName(it.title)}` : it.title}</span>
                                  <span className="t2">
                                    {it.location && `📍 ${it.location}  `}
                                    {it.alarm !== undefined && it.alarm !== null && `🔔 ${it.alarm === 0 ? 'Al momento' : it.alarm + 'm antes'}  `}
                                    {it.notes || ''}
                                  </span>
                                </div>
                                <span className="meta">{it.all_day ? 'Todo el día' : it.time || ''}</span>
                              </div>
                            </div>
                          ))}

                          {selectedDateRoutines.map(r => (
                            <div key={r.id} className="row" style={{ '--kc': 'var(--k-routine)', '--kcs': 'var(--k-routine-soft)' } as any}>
                              <div className="fg" onClick={() => handleOpenEdit(r)}>
                                <div className="bav" style={{ background: 'var(--k-routine-soft)', color: 'var(--k-routine)' }}>🔁</div>
                                <div className="tx">
                                  <span className="t1">{r.title}</span>
                                  <span className="t2">Rutina diaria</span>
                                </div>
                                <span className="meta">{r.time || ''}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Vista 3: LISTAS */}
                  <section className={`view ${activeTab === 'lists' ? 'on' : ''}`} id="v-lists" role="tabpanel">
                    <div className="pad" id="c-lists">
                      {/* Selector de Listas / Colecciones */}
                      <div className="sec-head">
                        <span className="sec-t">Tus Colecciones</span>
                        <button type="button" className="sec-act" onClick={handleCreateList}>+ Nueva Lista</button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {lists.map(l => {
                          const isSel = activeListId === l.id
                          const count = items.filter(it => it.list_id === l.id && !it.done).length
                          return (
                            <button
                              key={l.id}
                              type="button"
                              className={`s-chip ${isSel ? 'on' : ''}`}
                              onClick={() => setActiveListId(isSel ? null : l.id)}
                            >
                              <span>{l.icon || '📝'} {l.name}</span>
                              {count > 0 && <span style={{ marginLeft: '6px', opacity: 0.8 }}>({count})</span>}
                            </button>
                          )
                        })}
                      </div>

                      {/* Tareas de la Lista Activa */}
                      {activeListId && (
                        <div style={{ marginTop: '16px' }}>
                          <div className="sec-head">
                            <span className="sec-t">Tareas de {lists.find(l => l.id === activeListId)?.name}</span>
                            <button
                              type="button"
                              className="sec-act"
                              onClick={() => handleCleanListDone(activeListId)}
                            >
                              🧹 Limpiar completadas
                            </button>
                          </div>

                          <div className="list">
                            {items
                              .filter(it => it.list_id === activeListId)
                              .map(it => (
                                <div key={it.id} className={`row ${it.done ? 'done' : ''}`} style={{ '--kc': 'var(--k-task)', '--kcs': 'var(--k-task-soft)' } as any}>
                                  <div className="fg" onClick={() => handleOpenEdit(it)}>
                                    <button type="button" className="chk" onClick={e => { e.stopPropagation(); handleToggleDone(it.id) }}>
                                      <svg viewBox="0 0 14 14"><path d="M2 7l3.5 3.5L12 3" /></svg>
                                    </button>
                                    <div className="tx">
                                      <span className="t1">{it.title}</span>
                                      <span className="t2">{it.notes || ''}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Tabbar Inferior para Móvil */}
                <nav className="tabbar" id="tabbar" role="tablist" aria-label="Secciones">
                  <button
                    type="button"
                    className={activeTab === 'today' ? 'on' : ''}
                    onClick={() => { setActiveTab('today'); setActiveListId(null) }}
                    role="tab"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
                    </svg>
                    <span>Hoy</span>
                  </button>

                  <button
                    type="button"
                    className={activeTab === 'calendar' ? 'on' : ''}
                    onClick={() => { setActiveTab('calendar'); setActiveListId(null) }}
                    role="tab"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                      <rect x="3.2" y="4.8" width="17.6" height="16" rx="3" />
                      <path d="M3.2 9.8h17.6M8 2.8v4M16 2.8v4" />
                    </svg>
                    <span>Calendario</span>
                  </button>

                  <button
                    type="button"
                    className={activeTab === 'lists' ? 'on' : ''}
                    onClick={() => setActiveTab('lists')}
                    role="tab"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                      <path d="M8.5 6h12M8.5 12h12M8.5 18h12" />
                      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="2.8" />
                    </svg>
                    <span>Listas</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Pantalla Flotante de Búsqueda Instantánea */}
            <div className={`searchscreen ${searchOpen ? 'open' : ''}`} id="searchScreen" role="dialog" aria-modal="true">
              <div className="shead">
                <div className="sfield">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20.3 20.3l-3.8-3.8" />
                  </svg>
                  <input
                    id="sInput"
                    placeholder="Eventos, tareas, rutinas, notas..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus={searchOpen}
                  />
                </div>
                <button type="button" className="scancel" onClick={() => setSearchOpen(false)}>Cancelar</button>
              </div>

              <div className="s-filters" id="sFilters">
                {['all', 'event', 'routine', 'task', 'reminder', 'birthday'].map(f => (
                  <button
                    key={f}
                    type="button"
                    className={`s-chip ${searchFilter === f ? 'on' : ''}`}
                    onClick={() => setSearchFilter(f)}
                  >
                    {f === 'all' ? 'Todo' : f === 'event' ? 'Eventos' : f === 'routine' ? 'Rutinas' : f === 'task' ? 'Tareas' : f === 'reminder' ? 'Recordatorios' : 'Cumpleaños'}
                  </button>
                ))}
              </div>

              <div className="sres pad" id="sRes">
                {searchResults.map(it => (
                  <div key={it.id} className="row" onClick={() => { setSearchOpen(false); handleOpenEdit(it) }}>
                    <div className="fg">
                      <div className="tx">
                        <span className="t1">{it.title}</span>
                        <span className="t2">{it.notes || it.location || it.date || ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Sheet (Formularios de Creación / Edición) */}
            <div className={`sheetwrap ${sheetOpen ? 'open' : ''}`} id="sheetwrap">
              <div className="scrim" id="scrim" onClick={() => setSheetOpen(false)} />
              <div className="sheet" id="sheet" role="dialog">
                <div className="grabber" id="grabber" aria-hidden="true" />
                <header className="sheet-head" id="sheetHead">
                  <button type="button" className="sh-cancel" id="shCancel" onClick={() => setSheetOpen(false)}>
                    Cancelar
                  </button>
                  <div className="sh-title" id="shTitle">
                    {sheetEditingItem ? 'Editar' : 'Nueva entrada'}
                  </div>
                  <button type="button" className="sh-done" id="shDone" onClick={handleSaveSheet}>
                    {sheetEditingItem ? 'Guardar' : 'Añadir'}
                  </button>
                </header>

                <div className="sheet-body" id="sheetBody" style={{ overflowY: 'auto', paddingBottom: '30px' }}>
                  {/* Selector de Pestañas Segmented Control */}
                  {!sheetEditingItem && (
                    <div className="seg" id="shSeg">
                      {[
                        { k: 'event', label: 'Evento' },
                        { k: 'routine', label: 'Rutina' },
                        { k: 'reminder', label: 'Recordatorio' },
                        { k: 'task', label: 'Tarea' },
                        { k: 'birthday', label: 'Cumple' },
                      ].map(tab => (
                        <button
                          key={tab.k}
                          type="button"
                          className={sheetKind === tab.k ? 'on' : ''}
                          onClick={() => setSheetKind(tab.k as ItemKind)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Campo Título */}
                  <div className="form card" style={{ marginTop: '12px' }}>
                    <div className="frow">
                      <label>{sheetKind === 'birthday' ? 'Nombre' : 'Título'}</label>
                      <input
                        type="text"
                        placeholder={sheetKind === 'birthday' ? 'Nombre de la persona' : 'Título'}
                        value={fTitle}
                        onChange={e => setFTitle(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Campos para EVENTO */}
                  {sheetKind === 'event' && (
                    <div className="form card" style={{ marginTop: '12px' }}>
                      <div className="frow">
                        <label>Fecha</label>
                        <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
                      </div>

                      <div className="frow">
                        <label>Todo el día</label>
                        <label className="switch-wrap">
                          <input type="checkbox" checked={fAllDay} onChange={e => setFAllDay(e.target.checked)} />
                          <span className="switch-slider" />
                        </label>
                      </div>

                      <div className={`frow ${fAllDay ? 'is-disabled' : ''}`}>
                        <label>Desde</label>
                        <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} disabled={fAllDay} />
                      </div>

                      <div className={`frow ${fAllDay ? 'is-disabled' : ''}`}>
                        <label>Hasta</label>
                        <input type="time" value={fTimeEnd} onChange={e => setFTimeEnd(e.target.value)} disabled={fAllDay} />
                      </div>

                      <div className="frow">
                        <label>📍 Ubicación</label>
                        <input type="text" placeholder="Opcional" value={fLocation} onChange={e => setFLocation(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* Campos para RUTINA */}
                  {sheetKind === 'routine' && (
                    <div className="routine-freq-wrap" style={{ marginTop: '12px' }}>
                      <div className="routine-mode-seg">
                        <button
                          type="button"
                          className={`r-mode-btn ${fRoutineIsDaily ? 'on' : ''}`}
                          onClick={() => setFRoutineIsDaily(true)}
                        >
                          🔁 Todos los días
                        </button>
                        <button
                          type="button"
                          className={`r-mode-btn ${!fRoutineIsDaily ? 'on' : ''}`}
                          onClick={() => setFRoutineIsDaily(false)}
                        >
                          📅 Día específico
                        </button>
                      </div>

                      {!fRoutineIsDaily && (
                        <div className="routine-days-container">
                          <div className="routine-days-label">Selecciona los días:</div>
                          <div className="routine-days-grid">
                            {[
                              { k: 'MO', l: 'L', name: 'Lunes' },
                              { k: 'TU', l: 'M', name: 'Martes' },
                              { k: 'WE', l: 'X', name: 'Miércoles' },
                              { k: 'TH', l: 'J', name: 'Jueves' },
                              { k: 'FR', l: 'V', name: 'Viernes' },
                              { k: 'SA', l: 'S', name: 'Sábado' },
                              { k: 'SU', l: 'D', name: 'Domingo' },
                            ].map(d => {
                              const sel = fRoutineDays.includes(d.k)
                              return (
                                <button
                                  key={d.k}
                                  type="button"
                                  className={`r-day-chip ${sel ? 'on' : ''}`}
                                  onClick={() => {
                                    if (sel) {
                                      if (fRoutineDays.length > 1) setFRoutineDays(fRoutineDays.filter(k => k !== d.k))
                                    } else {
                                      setFRoutineDays([...fRoutineDays, d.k])
                                    }
                                  }}
                                >
                                  <span className="r-day-letter">{d.l}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campos para RECORDATORIO */}
                  {sheetKind === 'reminder' && (
                    <div className="form card" style={{ marginTop: '12px' }}>
                      <div className="frow">
                        <label>Fecha</label>
                        <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
                      </div>
                      <div className="frow">
                        <label>Hora</label>
                        <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} />
                      </div>
                      <div className="frow">
                        <label>🔔 Alarma previa</label>
                        <select
                          className="fselect"
                          value={fAlarm !== null ? fAlarm : ''}
                          onChange={e => setFAlarm(e.target.value === '' ? null : Number(e.target.value))}
                        >
                          <option value="">Sin alarma</option>
                          {ALARM_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="frow">
                        <label>📍 Ubicación</label>
                        <input type="text" placeholder="Opcional" value={fLocation} onChange={e => setFLocation(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* Campos para CUMPLEAÑOS */}
                  {sheetKind === 'birthday' && (
                    <div className="form card" style={{ marginTop: '12px' }}>
                      <div className="frow">
                        <label>Fecha</label>
                        <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* Campos para TAREA */}
                  {sheetKind === 'task' && (
                    <div className="form card" style={{ marginTop: '12px' }}>
                      <div className="frow">
                        <label>Colección</label>
                        <select
                          className="fselect"
                          value={fListId || ''}
                          onChange={e => setFListId(e.target.value || null)}
                        >
                          {lists.map(l => (
                            <option key={l.id} value={l.id}>{l.icon || '📝'} {l.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="frow">
                        <label>Fecha límite</label>
                        <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  <div className="form card" style={{ marginTop: '12px' }}>
                    <div className="frow" style={{ alignItems: 'flex-start' }}>
                      <label style={{ paddingTop: '8px' }}>Notas</label>
                      <textarea
                        rows={3}
                        placeholder="Detalles adicionales..."
                        value={fNotes}
                        onChange={e => setFNotes(e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 0, outline: 'none', resize: 'none', color: 'var(--label)', textAlign: 'right', font: 'inherit' }}
                      />
                    </div>
                  </div>

                  {/* Botón Eliminar si se está editando */}
                  {sheetEditingItem && (
                    <button
                      type="button"
                      className="empty-btn"
                      onClick={() => handleDeleteItem(sheetEditingItem.id)}
                      style={{ color: 'var(--red)', width: '100%', justifyContent: 'center', marginTop: '16px' }}
                    >
                      🗑️ Eliminar entrada
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Toasts */}
            {toast && (
              <div className="toasts" id="toasts">
                <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{toast.message}</span>
                  {toast.actionLabel && toast.onAction && (
                    <button
                      type="button"
                      onClick={() => { toast.onAction!(); setToast(null) }}
                      style={{ color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', marginLeft: '6px' }}
                    >
                      {toast.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="homebar" aria-hidden="true" />
          </div>
        </div>
        <div className="caption">Tempo · Organizador Personal</div>
      </div>
    </>
  )
}
