import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarCheck, CloudOff, Flame, Moon, Plus, Search, Sun, SunMoon, Timer } from 'lucide-react'
import { useStore } from '../data/store'
import { useDayItems, useDocs } from '../data/selectors'
import { fmt, greeting, shiftYmd, todayYmd, cap } from '../lib/dates'
import { habitStats, isDoneOn, nextBirthday } from '../lib/recurrence'
import { getArgHoliday } from '../lib/holidays'
import { fetchWeather } from '../lib/weather'
import type { Weather } from '../lib/weather'
import { Empty, Ring, Section } from '../ui/kit'
import { go, useUI } from '../ui/uiStore'
import { ItemRow, toggleWithFeedback } from './ItemRow'
import { QuickAdd } from './QuickAdd'
import type { Focus, Item } from '../data/types'

export function themeIcon(t: string) {
  return t === 'light' ? <Sun size={20} /> : t === 'dark' ? <Moon size={20} /> : <SunMoon size={20} />
}

export function TopActions() {
  const theme = useStore(s => s.settings.theme)
  const setSettings = useStore(s => s.setSettings)
  const setPalette = useUI(s => s.setPalette)
  const openComposer = useUI(s => s.openComposer)
  const next = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'
  return (
    <>
      <button type="button" className="icon-btn" aria-label="Buscar (Ctrl+K)" onClick={() => setPalette(true)}><Search size={20} /></button>
      <button type="button" className="icon-btn" aria-label={`Tema: ${theme}. Cambiar`} onClick={() => setSettings({ theme: next })}>{themeIcon(theme)}</button>
      <button type="button" className="icon-btn accent" aria-label="Nuevo" onClick={() => openComposer({ kind: 'task' })}><Plus size={20} /></button>
    </>
  )
}

function useWeather() {
  const city = useStore(s => s.settings.city)
  const [w, setW] = useState<Weather | null>(null)
  useEffect(() => { let on = true; fetchWeather(city.lat, city.lon).then(r => on && setW(r)); return () => { on = false } }, [city.lat, city.lon])
  return w
}

export function Today() {
  const today = todayYmd()
  const items = useStore(s => s.items)
  const online = useStore(s => s.online)
  const showWork = useStore(s => s.settings.showWork)
  const city = useStore(s => s.settings.city)
  const dayItems = useDayItems(today)
  const focus = useDocs<Focus>('focus')
  const weather = useWeather()
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t) }, [])

  const holiday = getArgHoliday(today)
  const events = dayItems.filter(i => i.kind === 'event')
  const checkables = dayItems.filter(i => ['task', 'reminder', 'routine'].includes(i.kind))
  const birthdays = dayItems.filter(i => i.kind === 'birthday')
  const timeline = dayItems.filter(i => i.kind !== 'birthday' && i.kind !== 'routine')
  const habits = dayItems.filter(i => i.kind === 'routine')

  const overdue = useMemo(
    () => items.filter(i => (i.kind === 'task' || i.kind === 'reminder') && !i.repeat && !i.done && i.date && i.date < today && (showWork || !i.isWork))
      .sort((a, b) => (a.date! < b.date! ? -1 : 1)),
    [items, today, showWork],
  )

  const pend = [...checkables, ...habits.filter(h => !checkables.includes(h))]
  const doneN = pend.filter(i => isDoneOn(i, today)).length
  const pct = pend.length ? doneN / pend.length : 0

  const nextUp = useMemo(() => {
    const mins = now.getHours() * 60 + now.getMinutes()
    return timeline.find(i => i.time && !isDoneOn(i, today) && Number(i.time.slice(0, 2)) * 60 + Number(i.time.slice(3, 5)) >= mins)
  }, [timeline, now, today])

  const weekAgo = shiftYmd(today, -6)
  const focusWeek = focus.filter(f => f.data.date >= weekAgo).reduce((n, f) => n + f.data.minutes, 0)
  const focusToday = focus.filter(f => f.data.date === today).reduce((n, f) => n + f.data.minutes, 0)

  const upcomingBdays = useMemo(
    () => items.filter(i => i.kind === 'birthday').map(b => ({ b, ...nextBirthday(b) })).filter(x => x.days > 0 && x.days <= 14).sort((a, b) => a.days - b.days).slice(0, 3),
    [items],
  )

  const bestStreak = useMemo(() => {
    let best: { it: Item; n: number } | null = null
    for (const h of items.filter(i => i.kind === 'routine')) {
      const n = habitStats(h).current
      if (n > 1 && (!best || n > best.n)) best = { it: h, n }
    }
    return best
  }, [items])

  const summary = pend.length === 0 && events.length === 0 ? 'Hoy descansás' : pct === 1 && pend.length ? '¡Todo hecho por hoy!' : `${pend.length - doneN} por delante`

  return (
    <div className="page today">
      <header className="page-head">
        <div className="ph-main">
          <div>
            <div className="ph-sub">{cap(fmt(now, "d 'de' MMMM 'de' yyyy"))}</div>
            <h1>{cap(fmt(now, 'EEEE'))}</h1>
          </div>
        </div>
        <div className="ph-actions"><TopActions /></div>
      </header>

      {!online && <div className="banner"><CloudOff size={16} />Sin conexión: tus cambios se guardan en el dispositivo y se sincronizan al volver.</div>}

      <div className="today-grid">
        <div className="col">
          <QuickAdd />

          <div className="card hero">
            <div className="hero-l">
              <div className="hero-hi">{greeting(now)}</div>
              <div className="hero-sub">{summary}</div>
              <div className="stats">
                <div><b>{events.length}</b><span>eventos</span></div>
                <div><b>{pend.length - doneN}</b><span>pendientes</span></div>
                <div><b>{birthdays.length}</b><span>cumpleaños</span></div>
              </div>
            </div>
            <Ring value={pct} size={104} stroke={11} color={pct === 1 ? 'var(--green)' : 'var(--accent)'}>
              {pend.length === 0 ? <CalendarCheck size={26} /> : <><b>{Math.round(pct * 100)}%</b><span>hecho</span></>}
            </Ring>
          </div>

          <button type="button" className="chipbtn weather" onClick={() => go('settings')} aria-label="Cambiar ciudad">
            <span className="w-ic">{weather?.icon ?? '🌡️'}</span>
            <span><b>{weather ? `${weather.temp}°C` : '—'}</b> {weather?.label ?? 'Sin datos del clima'}</span>
            <span className="w-city">{city.name}</span>
          </button>

          {holiday && (
            <div className="card note-card holiday"><b>🇦🇷 {holiday.name}</b><p>{holiday.desc}</p></div>
          )}

          {nextUp && (
            <div className="card nextup" style={{ '--kc': 'var(--accent)' } as React.CSSProperties}>
              <span className="nu-l">Lo próximo</span>
              <b>{nextUp.title}</b>
              <span className="nu-t">{nextUp.time}</span>
            </div>
          )}

          {overdue.length > 0 && (
            <Section title={<>Vencidos <span className="count warn">{overdue.length}</span></>}
              aside={<button type="button" className="link" onClick={() => overdue.forEach(i => useStore.getState().patchItem(i.id, { date: today }))}>Pasar todo a hoy</button>}>
              <div className="card list">{overdue.slice(0, 5).map(i => <ItemRow key={i.id} item={i} ds={today} showDate />)}</div>
              {overdue.length > 5 && <button type="button" className="link more" onClick={() => go('lists', 'task')}>Ver los {overdue.length} vencidos <ArrowRight size={14} /></button>}
            </Section>
          )}
        </div>

        <div className="col">
          <Section title="Agenda de hoy" aside={<button type="button" className="link" onClick={() => go('calendar')}>Calendario <ArrowRight size={14} /></button>}>
            {timeline.length ? (
              <div className="card list">{timeline.map(i => <ItemRow key={i.id} item={i} ds={today} />)}</div>
            ) : (
              <Empty icon={<CalendarCheck size={24} />} title="Sin eventos ni pendientes" text="Aprovechá el día libre o sumá algo con el botón +." />
            )}
          </Section>

          {birthdays.length > 0 && (
            <Section title="🎂 Cumpleaños de hoy"><div className="card list">{birthdays.map(i => <ItemRow key={i.id} item={i} ds={today} />)}</div></Section>
          )}

          {habits.length > 0 && (
            <Section title="Hábitos de hoy" aside={<button type="button" className="link" onClick={() => go('habits')}>Ver todos <ArrowRight size={14} /></button>}>
              <div className="habit-chips">
                {habits.map(h => {
                  const d = isDoneOn(h, today)
                  const s = habitStats(h)
                  return (
                    <button key={h.id} type="button" className={`habit-chip ${d ? 'on' : ''}`} aria-pressed={d} onClick={() => toggleWithFeedback(h, today)}>
                      <span>{h.title}</span>
                      {s.current > 0 && <em><Flame size={12} />{s.current}</em>}
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {upcomingBdays.length > 0 && (
            <Section title="Próximos cumpleaños">
              <div className="card list">
                {upcomingBdays.map(x => (
                  <button key={x.b.id} type="button" className="plain-row" onClick={() => go('lists', 'birthday')}>
                    <span className="bav">🎂</span>
                    <span className="grow"><b>{x.b.title}</b><small>{x.days === 1 ? 'Mañana' : `En ${x.days} días`}{x.age ? ` · cumple ${x.age}` : ''}</small></span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <Section title="Tu semana">
            <div className="insights">
              <button type="button" className="insight" onClick={() => go('focus')}>
                <Timer size={18} /><b>{focusToday}<small> min</small></b><span>de foco hoy · {focusWeek} min esta semana</span>
              </button>
              <button type="button" className="insight" onClick={() => go('habits')}>
                <Flame size={18} /><b>{bestStreak ? bestStreak.n : 0}<small> días</small></b><span>{bestStreak ? `racha de «${bestStreak.it.title}»` : 'Empezá una racha con un hábito'}</span>
              </button>
            </div>
            <button type="button" className="link more" onClick={() => go('stats')}>Ver resumen completo <ArrowRight size={14} /></button>
          </Section>
        </div>
      </div>
    </div>
  )
}

