import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3, BookOpen, CalendarDays, CheckSquare, FileText, HeartPulse, Home, ListChecks, NotebookPen,
  Plus, Repeat, Search, Settings as Cog, SunMoon, Target, Timer, Wand2,
} from 'lucide-react'
import { useStore } from '../data/store'
import { useUI, go } from '../ui/uiStore'
import type { Page } from '../ui/uiStore'
import { parseQuick } from '../lib/nlp'
import { KIND_LABEL } from '../data/selectors'
import { fmt } from '../lib/dates'
import { createFromText } from './QuickAdd'
import type { ItemKind } from '../data/types'

interface Entry { id: string; label: string; hint?: string; icon: React.ReactNode; group: string; run: () => void }

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function CommandPalette() {
  const open = useUI(s => s.palette)
  const setOpen = useUI(s => s.setPalette)
  const openComposer = useUI(s => s.openComposer)
  const items = useStore(s => s.items)
  const docs = useStore(s => s.docs)
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => input.current?.focus(), 30) } }, [open])

  const entries = useMemo<Entry[]>(() => {
    const close = () => setOpen(false)
    const nav = (page: Page, sub?: string) => () => { close(); go(page, sub) }
    const newItem = (kind: ItemKind) => () => { close(); openComposer({ kind, lockKind: true }) }
    const base: Entry[] = [
      { id: 'n-today', label: 'Ir a Hoy', icon: <Home size={17} />, group: 'Ir a', run: nav('today') },
      { id: 'n-cal', label: 'Ir a Calendario', icon: <CalendarDays size={17} />, group: 'Ir a', run: nav('calendar') },
      { id: 'n-hab', label: 'Ir a Hábitos', icon: <Repeat size={17} />, group: 'Ir a', run: nav('habits') },
      { id: 'n-lists', label: 'Ir a Listas', icon: <ListChecks size={17} />, group: 'Ir a', run: nav('lists') },
      { id: 'n-books', label: 'Libros leídos', icon: <BookOpen size={17} />, group: 'Ir a', run: nav('lists', 'book') },
      { id: 'n-health', label: 'Medidas y peso', icon: <HeartPulse size={17} />, group: 'Ir a', run: nav('health') },
      { id: 'n-notes', label: 'Notas', icon: <FileText size={17} />, group: 'Ir a', run: nav('notes') },
      { id: 'n-journal', label: 'Diario', icon: <NotebookPen size={17} />, group: 'Ir a', run: nav('journal') },
      { id: 'n-goals', label: 'Metas', icon: <Target size={17} />, group: 'Ir a', run: nav('goals') },
      { id: 'n-focus', label: 'Enfoque (Pomodoro)', icon: <Timer size={17} />, group: 'Ir a', run: nav('focus') },
      { id: 'n-stats', label: 'Resumen y estadísticas', icon: <BarChart3 size={17} />, group: 'Ir a', run: nav('stats') },
      { id: 'n-set', label: 'Ajustes', icon: <Cog size={17} />, group: 'Ir a', run: nav('settings') },
      { id: 'a-task', label: 'Nuevo pendiente', icon: <CheckSquare size={17} />, group: 'Crear', run: newItem('task') },
      { id: 'a-event', label: 'Nuevo evento', icon: <CalendarDays size={17} />, group: 'Crear', run: newItem('event') },
      { id: 'a-hab', label: 'Nuevo hábito', icon: <Repeat size={17} />, group: 'Crear', run: newItem('routine') },
      { id: 'a-book', label: 'Anotar libro leído', icon: <BookOpen size={17} />, group: 'Crear', run: newItem('book') },
      { id: 'a-theme', label: 'Cambiar tema', hint: settings.theme, icon: <SunMoon size={17} />, group: 'Acciones', run: () => { close(); setSettings({ theme: settings.theme === 'auto' ? 'light' : settings.theme === 'light' ? 'dark' : 'auto' }) } },
    ]
    const t = norm(q.trim())
    if (!t) return base
    const out: Entry[] = []
    const p = parseQuick(q)
    out.push({
      id: 'create', group: 'Captura rápida', icon: <Wand2 size={17} />,
      label: `Crear ${KIND_LABEL[p.kind].toLowerCase()}: «${p.title}»`,
      hint: [p.date && p.kind !== 'routine' ? fmt(p.date, 'EEE d MMM') : '', p.time ?? ''].filter(Boolean).join(' · '),
      run: () => { close(); createFromText(q) },
    })
    for (const it of items) {
      if (norm(it.title + ' ' + (it.notes ?? '')).includes(t)) {
        out.push({
          id: `i-${it.id}`, group: 'Elementos', label: it.title, hint: `${KIND_LABEL[it.kind]}${it.date && it.kind !== 'birthday' ? ' · ' + fmt(it.date, 'd MMM') : ''}`,
          icon: <Search size={17} />, run: () => { close(); openComposer({ kind: it.kind, item: it }) },
        })
      }
      if (out.length > 30) break
    }
    for (const d of docs) {
      const data = d.data as Record<string, unknown>
      const label = String(data.title ?? data.name ?? '')
      const body = String(data.body ?? data.text ?? '')
      if (['note', 'goal', 'journal', 'metric'].includes(d.type) && norm(label + ' ' + body).includes(t)) {
        const page: Page = d.type === 'note' ? 'notes' : d.type === 'goal' ? 'goals' : d.type === 'journal' ? 'journal' : 'health'
        out.push({ id: `d-${d.id}`, group: 'Notas y más', label: label || body.slice(0, 40), hint: d.type, icon: <FileText size={17} />, run: nav(page) })
      }
    }
    return [...out, ...base.filter(e => norm(e.label).includes(t))]
  }, [q, items, docs, settings.theme, setOpen, openComposer, setSettings])

  useEffect(() => setIdx(0), [q])
  useEffect(() => {
    document.querySelector('.pal-item.on')?.scrollIntoView({ block: 'nearest' })
  }, [idx])

  if (!open) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(entries.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); entries[idx]?.run() }
    else if (e.key === 'Escape') setOpen(false)
  }

  let lastGroup = ''
  return (
    <div className="pal-wrap" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Buscar y comandos">
        <div className="pal-in"><Search size={18} />
          <input ref={input} autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Buscá o escribí «Dentista mañana 10:30»…" aria-label="Buscar o crear" aria-controls="pal-list" />
          <kbd>Esc</kbd></div>
        <div className="pal-list" id="pal-list" role="listbox">
          {entries.map((e, i) => {
            const head = e.group !== lastGroup ? <div className="pal-g" key={`g-${e.group}-${i}`}>{e.group}</div> : null
            lastGroup = e.group
            return (
              <div key={e.id}>
                {head}
                <button type="button" role="option" aria-selected={i === idx} className={`pal-item ${i === idx ? 'on' : ''}`} onMouseMove={() => setIdx(i)} onClick={e.run}>
                  {e.icon}<span className="grow">{e.label}</span>{e.hint && <small>{e.hint}</small>}
                </button>
              </div>
            )
          })}
          {entries.length === 0 && <div className="pal-empty"><Plus size={18} />Sin resultados</div>}
        </div>
      </div>
    </div>
  )
}
