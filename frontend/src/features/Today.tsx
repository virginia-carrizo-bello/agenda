import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarCheck, CloudOff, Flame, Moon, Plus, Search, Sun, SunMoon, Timer } from 'lucide-react'
import { useStore } from '../data/store'
import { useDayItems, useDocs } from '../data/selectors'
import { fmt, hhmmToMin, shiftYmd, todayYmd, cap } from '../lib/dates'
import { habitStats, isDoneOn, nextBirthday } from '../lib/recurrence'
import { getArgHoliday } from '../lib/holidays'
import { fetchWeather } from '../lib/weather'
import type { Weather } from '../lib/weather'
import { Empty, Progress, Section } from '../ui/kit'
import { go, useUI } from '../ui/uiStore'
import { ItemRow, toggleWithFeedback } from './ItemRow'
import { QuickAdd } from './QuickAdd'
import type { Focus, Item } from '../data/types'

const THEME_NAME = { auto: 'automático', light: 'claro', dark: 'oscuro' } as const

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
      <button type="button" className="icon-btn" aria-label={`Tema ${THEME_NAME[theme]}. Cambiar a ${THEME_NAME[next]}`} onClick={() => setSettings({ theme: next })}>{themeIcon(theme)}</button>
      <button type="button" className="icon-btn accent" aria-label="Nuevo elemento" onClick={() => openComposer({ kind: 'task' })}><Plus size={20} /></button>
    </>
  )
}

function useWeather() {
  const city = useStore(s => s.settings.city)
  const [w, setW] = useState<Weather | null>(null)
  useEffect(() => { let on = true; fetchWeather(city.lat, city.lon).then(r => on && setW(r)); return () => { on = false } }, [city.lat, city.lon])
  return w
}

type Node = { kind: 'item'; item: Item } | { kind: 'now' }

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
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const holiday = getArgHoliday(today)
  const habits = dayItems.filter(i => i.kind === 'routine')
  const timed = dayItems.filter(i => i.time && i.kind !== 'routine' && i.kind !== 'birthday')
  const allDay = dayItems.filter(i => !i.time && i.kind !== 'routine')

  const rail = useMemo<Node[]>(() => {
    const out: Node[] = []
    let placed = false
    for (const it of timed) {
      if (!placed && (hhmmToMin(it.time) ?? 0) > nowMin) { out.push({ kind: 'now' }); placed = true }
      out.push({ kind: 'item', item: it })
    }
    if (!placed) out.push({ kind: 'now' })
    return out
  }, [timed, nowMin])

  const overdue = useMemo(
    () => items.filter(i => (i.kind === 'task' || i.kind === 'reminder') && !i.repeat && !i.done && i.date && i.date < today && (showWork || !i.isWork))
      .sort((a, b) => (a.date! < b.date! ? -1 : 1)),
    [items, today, showWork],
  )

  const pend = dayItems.filter(i => ['task', 'reminder', 'routine'].includes(i.kind))
  const doneN = pend.filter(i => isDoneOn(i, today)).length
  const empty = timed.length === 0 && allDay.length === 0

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

  const fullDate = `${cap(fmt(now, 'EEEE'))} ${now.getDate()} de ${fmt(now, 'MMMM')}`
  const summary = pend.length === 0 ? 'Nada que tildar hoy' : doneN === pend.length ? 'Todo hecho por hoy' : `${doneN} de ${pend.length} hechas`

  return (
    <div className="page today">
      <header className="leaf">
        <h1 aria-label={fullDate}>
          <span className="leaf-num" aria-hidden="true">{now.getDate()}</span>
          <span className="leaf-txt" aria-hidden="true">
            <span className="leaf-day">{fmt(now, 'EEEE')}</span>
            <span className="leaf-mon">{fmt(now, 'MMMM yyyy')}</span>
          </span>
        </h1>
        <div className="ph-actions"><TopActions /></div>
        <p className="leaf-wx">
          <span aria-hidden="true">{weather?.icon ?? ''}</span>{' '}
          {weather ? `${weather.temp} °C, ${weather.label.toLowerCase()} en ${city.name}` : city.name}
          {' '}<button type="button" className="link" onClick={() => go('settings')}>Cambiar ciudad</button>
        </p>
      </header>

      {!online && <div className="banner" role="status"><CloudOff size={16} aria-hidden="true" />Sin conexión: tus cambios se guardan en el dispositivo y se sincronizan al volver.</div>}

      <div className="today-grid">
        <div className="col">
          <QuickAdd />

          <div className="day-sum">
            <p>{summary}</p>
            {pend.length > 0 && <Progress value={doneN / pend.length} />}
          </div>

          {holiday && <p className="holiday-line"><b>{holiday.name}.</b> {holiday.desc}</p>}

          <Section title="Tu día" aside={<button type="button" className="link" onClick={() => go('calendar')}>Abrir calendario <ArrowRight size={14} aria-hidden="true" /></button>}>
            {empty ? (
              <Empty icon={<CalendarCheck size={24} />} title="Día libre" text="Sumá algo escribiendo arriba o con el botón Nuevo." />
            ) : (
              <ol className="rail">
                {rail.map((n, i) => n.kind === 'now' ? (
                  <li key={`now-${i}`} className="rail-now" aria-label={`Ahora, ${fmt(now, 'HH:mm')}`}>
                    <time>{fmt(now, 'HH:mm')}</time><span>Ahora</span>
                  </li>
                ) : (
                  <li key={n.item.id} className="rail-slot">
                    <time dateTime={n.item.time ?? undefined}>{n.item.time}</time>
                    <div className="rail-body"><ItemRow item={n.item} ds={today} hideTime /></div>
                  </li>
                ))}
                {allDay.length > 0 && (
                  <li className="rail-slot">
                    <span className="rail-lbl">Todo el día</span>
                    <div className="rail-body">{allDay.map(i => <ItemRow key={i.id} item={i} ds={today} />)}</div>
                  </li>
                )}
              </ol>
            )}
          </Section>

          {overdue.length > 0 && (
            <Section title={<>Vencidas <span className="count warn">{overdue.length}</span></>}
              aside={<button type="button" className="link" onClick={() => overdue.forEach(i => useStore.getState().patchItem(i.id, { date: today }))}>Pasar todas a hoy</button>}>
              <div className="list">{overdue.slice(0, 4).map(i => <ItemRow key={i.id} item={i} ds={today} showDate />)}</div>
              {overdue.length > 4 && <button type="button" className="link more" onClick={() => go('lists', 'task')}>Ver las {overdue.length} vencidas <ArrowRight size={14} aria-hidden="true" /></button>}
            </Section>
          )}
        </div>

        <div className="col side-col">
          {habits.length > 0 && (
            <Section title="Hábitos de hoy" aside={<button type="button" className="link" onClick={() => go('habits')}>Ver todos <ArrowRight size={14} aria-hidden="true" /></button>}>
              <div className="habit-chips">
                {habits.map(h => {
                  const d = isDoneOn(h, today)
                  const s = habitStats(h)
                  return (
                    <button key={h.id} type="button" className={`habit-chip ${d ? 'on' : ''}`} aria-pressed={d} onClick={() => toggleWithFeedback(h, today)}>
                      <span>{h.title}</span>
                      {s.current > 0 && <em><Flame size={12} aria-hidden="true" />{s.current}<span className="sr"> días de racha</span></em>}
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {upcomingBdays.length > 0 && (
            <Section title="Próximos cumpleaños">
              <div className="list">
                {upcomingBdays.map(x => (
                  <button key={x.b.id} type="button" className="plain-row" onClick={() => go('lists', 'birthday')}>
                    <span className="grow"><b>{x.b.title}</b><small>{x.days === 1 ? 'Mañana' : `En ${x.days} días`}{x.age ? `, cumple ${x.age}` : ''}</small></span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <Section title="Tu semana">
            <div className="insights">
              <button type="button" className="insight" onClick={() => go('focus')}>
                <Timer size={18} aria-hidden="true" /><b>{focusToday} min</b><span>de enfoque hoy, {focusWeek} min en la semana</span>
              </button>
              <button type="button" className="insight" onClick={() => go('habits')}>
                <Flame size={18} aria-hidden="true" /><b>{bestStreak ? `${bestStreak.n} días` : 'Sin racha'}</b><span>{bestStreak ? `de «${bestStreak.it.title}»` : 'Empezá una con un hábito'}</span>
              </button>
            </div>
            <button type="button" className="link more" onClick={() => go('stats')}>Ver resumen completo <ArrowRight size={14} aria-hidden="true" /></button>
          </Section>
        </div>
      </div>
    </div>
  )
}
