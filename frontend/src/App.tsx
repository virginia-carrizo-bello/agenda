import { useEffect, useRef } from 'react'
import {
  BarChart3, CalendarDays, FileText, HeartPulse, Home, LayoutGrid, ListChecks, NotebookPen, Plus,
  Repeat, Search, Settings as Cog, Target, Timer, Pause,
} from 'lucide-react'
import { useStore } from './data/store'
import { go, useUI } from './ui/uiStore'
import type { Page } from './ui/uiStore'
import { Toasts } from './ui/Toasts'
import { Composer } from './features/Composer'
import { CommandPalette } from './features/CommandPalette'
import { Today } from './features/Today'
import { Calendar } from './features/Calendar'
import { Habits } from './features/Habits'
import { Lists } from './features/Lists'
import { Health } from './features/Health'
import { Notes, JournalPage, Goals } from './features/Notes'
import { FocusPage } from './features/Focus'
import { Stats } from './features/Stats'
import { Settings } from './features/Settings'
import { More } from './features/More'
import { fmtClock, useFocus } from './features/focusStore'
import { checkAlarms } from './lib/notify'

const VIEWS: Record<Page, () => React.ReactElement> = {
  today: Today, calendar: Calendar, habits: Habits, lists: Lists, more: More,
  health: Health, notes: Notes, journal: JournalPage, goals: Goals, focus: FocusPage, settings: Settings, stats: Stats,
}

const TABS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'today', label: 'Hoy', icon: <Home size={22} /> },
  { page: 'calendar', label: 'Calendario', icon: <CalendarDays size={22} /> },
  { page: 'habits', label: 'Hábitos', icon: <Repeat size={22} /> },
  { page: 'lists', label: 'Listas', icon: <ListChecks size={22} /> },
  { page: 'more', label: 'Más', icon: <LayoutGrid size={22} /> },
]
const MORE_PAGES: Page[] = ['more', 'health', 'notes', 'journal', 'goals', 'focus', 'settings', 'stats']
const tabOf = (p: Page): Page => (MORE_PAGES.includes(p) ? 'more' : p)

const SIDE: { title?: string; links: { page: Page; label: string; icon: React.ReactNode }[] }[] = [
  { links: [
    { page: 'today', label: 'Hoy', icon: <Home size={18} /> },
    { page: 'calendar', label: 'Calendario', icon: <CalendarDays size={18} /> },
    { page: 'habits', label: 'Hábitos', icon: <Repeat size={18} /> },
    { page: 'lists', label: 'Listas', icon: <ListChecks size={18} /> },
  ] },
  { title: 'Bienestar', links: [
    { page: 'focus', label: 'Enfoque', icon: <Timer size={18} /> },
    { page: 'health', label: 'Medidas y peso', icon: <HeartPulse size={18} /> },
    { page: 'journal', label: 'Diario', icon: <NotebookPen size={18} /> },
  ] },
  { title: 'Ideas', links: [
    { page: 'notes', label: 'Notas', icon: <FileText size={18} /> },
    { page: 'goals', label: 'Metas', icon: <Target size={18} /> },
    { page: 'stats', label: 'Resumen', icon: <BarChart3 size={18} /> },
  ] },
]

function isDayTime(d = new Date()) {
  const m = d.getHours() * 60 + d.getMinutes()
  return m >= 7 * 60 && m < 19 * 60 + 30
}

export default function App() {
  const route = useUI(s => s.route)
  const ready = useStore(s => s.ready)
  const theme = useStore(s => s.settings.theme)
  const items = useStore(s => s.items)
  const setPalette = useUI(s => s.setPalette)
  const openComposer = useUI(s => s.openComposer)
  const focusRunning = useFocus(s => s.running)
  const left = useFocus(s => s.left)
  const phase = useFocus(s => s.phase)
  const tick = useFocus(s => s.tick)
  const main = useRef<HTMLElement>(null)

  useEffect(() => { void useStore.getState().boot() }, [])

  // Tema (auto por horario) + color de la barra del navegador
  useEffect(() => {
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'auto' && !isDayTime())
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#16121D' : '#FAF5EF'))
    }
    apply()
    const t = setInterval(apply, 60_000)
    return () => clearInterval(t)
  }, [theme])

  // Alto real de pantalla (en PWA de iOS innerHeight queda ~50px corto y la barra inferior flota)
  useEffect(() => {
    const set = () => {
      let h = window.innerHeight
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
      if (ios && (navigator as unknown as { standalone?: boolean }).standalone) {
        const portrait = window.innerHeight >= window.innerWidth
        const sh = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height)
        h = Math.max(h, sh)
      }
      document.documentElement.style.setProperty('--app-h', `${h}px`)
    }
    set()
    window.addEventListener('resize', set)
    window.addEventListener('orientationchange', set)
    return () => { window.removeEventListener('resize', set); window.removeEventListener('orientationchange', set) }
  }, [])

  // Alarmas
  useEffect(() => {
    if (!ready) return
    const run = () => checkAlarms(useStore.getState().items)
    run()
    const t = setInterval(run, 30_000)
    return () => clearInterval(t)
  }, [ready, items.length])

  // Temporizador de foco
  useEffect(() => {
    if (!focusRunning) return
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [focusRunning, tick])

  // Atajos de teclado
  useEffect(() => {
    let g = 0
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); return }
      const t = e.target as HTMLElement
      if (t.closest('input,textarea,select,[contenteditable],[role=dialog]') || e.ctrlKey || e.metaKey || e.altKey) return
      if (g && Date.now() - g < 900) {
        const map: Record<string, Page> = { h: 'today', c: 'calendar', b: 'habits', l: 'lists', f: 'focus', n: 'notes', s: 'settings', m: 'health' }
        const p = map[e.key.toLowerCase()]
        g = 0
        if (p) { e.preventDefault(); go(p); return }
      }
      if (e.key === 'g') { g = Date.now(); return }
      if (e.key === 'n') { e.preventDefault(); openComposer({ kind: 'task' }) }
      if (e.key === '/') { e.preventDefault(); setPalette(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPalette, openComposer])

  useEffect(() => { main.current?.scrollTo({ top: 0 }) }, [route.page, route.sub])

  const View = VIEWS[route.page] ?? Today
  const activeTab = tabOf(route.page)

  if (!ready) return <div className="boot" aria-busy="true"><span className="boot-logo" /></div>

  return (
    <div className="shell">
      <a className="skip" href="#main" onClick={e => { e.preventDefault(); main.current?.focus() }}>Saltar al contenido</a>
      <aside className="side" aria-label="Navegación principal">
        <div className="brand" translate="no"><span className="brand-logo" aria-hidden="true" />Tempo</div>
        <button type="button" className="side-search" onClick={() => setPalette(true)}><Search size={16} />Buscar<kbd>Ctrl K</kbd></button>
        <button type="button" className="btn primary side-new" onClick={() => openComposer({ kind: 'task' })}><Plus size={18} />Nuevo</button>
        <nav>
          {SIDE.map((g, i) => (
            <div key={i} className="side-g">
              {g.title && <span>{g.title}</span>}
              {g.links.map(l => (
                <button key={l.page} type="button" className={route.page === l.page ? 'on' : ''} aria-current={route.page === l.page ? 'page' : undefined} onClick={() => go(l.page)}>{l.icon}{l.label}</button>
              ))}
            </div>
          ))}
        </nav>
        <button type="button" className={`side-set ${route.page === 'settings' ? 'on' : ''}`} onClick={() => go('settings')}><Cog size={18} />Ajustes</button>
      </aside>

      <main ref={main} className="main" id="main" tabIndex={0} aria-label="Contenido">
        <View />
      </main>

      {focusRunning && route.page !== 'focus' && (
        <button type="button" className="focus-pill" onClick={() => go('focus')} aria-label="Volver al temporizador de enfoque">
          {phase === 'work' ? <Timer size={15} /> : <Pause size={15} />}{fmtClock(left)}
        </button>
      )}

      <button type="button" className="fab" aria-label="Nuevo elemento" onClick={() => openComposer({ kind: route.page === 'calendar' ? 'event' : 'task', defaults: route.page === 'calendar' ? { date: useUI.getState().selDay } : undefined })}>
        <Plus size={20} strokeWidth={2.6} /><span>Nuevo</span>
      </button>

      <nav className="tabbar" aria-label="Secciones">
        {TABS.map(t => (
          <button key={t.page} type="button" className={activeTab === t.page ? 'on' : ''} aria-current={activeTab === t.page ? 'page' : undefined}
            onClick={() => go(t.page)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </nav>

      <Composer />
      <CommandPalette />
      <Toasts />
    </div>
  )
}
