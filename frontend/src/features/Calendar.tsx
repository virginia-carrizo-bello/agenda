import { useEffect, useMemo, useRef } from 'react'
import { addMonths, addWeeks, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Briefcase, Plus } from 'lucide-react'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useStore } from '../data/store'
import { itemsOnDay, kc, ks } from '../data/selectors'
import { cap, fmt, fromYmd, hhmmToMin, minToHhmm, monthGrid, todayYmd, weekDays, ymd } from '../lib/dates'
import { getArgHoliday, isDoneOn } from '../lib/recurrence'
import { Chip, Empty, Segmented } from '../ui/kit'
import { useUI } from '../ui/uiStore'
import { ItemRow } from './ItemRow'
import { TopActions } from './Today'
import type { Item } from '../data/types'

const HOUR_H = 56

function useCal() {
  const mode = useUI(s => s.calMode)
  const cursor = useUI(s => s.calCursor)
  const sel = useUI(s => s.selDay)
  const setMode = useUI(s => s.setCalMode)
  const setCursor = useUI(s => s.setCalCursor)
  const setSel = useUI(s => s.setSelDay)
  const weekStart = useStore(s => s.settings.weekStart)
  const move = (dir: -1 | 1) => {
    const c = fromYmd(cursor)
    const n = mode === 'month' ? addMonths(c, dir) : mode === 'week' ? addWeeks(c, dir) : new Date(c.getFullYear(), c.getMonth(), c.getDate() + dir)
    setCursor(ymd(n))
    if (mode === 'day') setSel(ymd(n))
  }
  return { mode, cursor, sel, setMode, setCursor, setSel, move, weekStart }
}

export function Calendar() {
  const cal = useCal()
  const showWork = useStore(s => s.settings.showWork)
  const setSettings = useStore(s => s.setSettings)
  const items = useStore(s => s.items)
  const openComposer = useUI(s => s.openComposer)
  const today = todayYmd()
  const cur = fromYmd(cal.cursor)

  const title = cal.mode === 'month' ? cap(fmt(cur, 'MMMM yyyy'))
    : cal.mode === 'week' ? (() => { const w = weekDays(cur, cal.weekStart); return `${fmt(w[0], 'd MMM')} – ${fmt(w[6], 'd MMM yyyy')}` })()
      : cap(fmt(cur, "EEEE d 'de' MMMM"))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input,textarea,select,[role=dialog]')) return
      if (e.key === 'ArrowLeft') cal.move(-1)
      if (e.key === 'ArrowRight') cal.move(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="page cal">
      <header className="page-head">
        <div className="ph-main"><div><div className="ph-sub">Calendario</div><h1 className="cal-title">{title}</h1></div></div>
        <div className="ph-actions"><TopActions /></div>
      </header>

      <div className="cal-bar">
        <div className="cal-nav">
          <button type="button" className="icon-btn round" aria-label="Anterior" onClick={() => cal.move(-1)}><ChevronLeft size={20} /></button>
          <button type="button" className="chipbtn" onClick={() => { cal.setCursor(today); cal.setSel(today) }}>Hoy</button>
          <button type="button" className="icon-btn round" aria-label="Siguiente" onClick={() => cal.move(1)}><ChevronRight size={20} /></button>
        </div>
        <Segmented small value={cal.mode} onChange={cal.setMode} label="Vista"
          options={[{ value: 'month', label: 'Mes' }, { value: 'week', label: 'Semana' }, { value: 'day', label: 'Día' }]} />
        <Chip on={showWork} onClick={() => setSettings({ showWork: !showWork })}><Briefcase size={14} />Trabajo</Chip>
      </div>

      {cal.mode === 'month' && (
        <div className="cal-split">
          <MonthGrid cursor={cur} sel={cal.sel} weekStart={cal.weekStart} items={items} showWork={showWork} onPick={d => { cal.setSel(d) }} />
          <DayPanel ds={cal.sel} />
        </div>
      )}
      {cal.mode === 'week' && (
        <TimeGrid days={weekDays(cur, cal.weekStart).map(ymd)} items={items} showWork={showWork}
          onPickDay={d => { cal.setSel(d); cal.setCursor(d); cal.setMode('day') }}
          onCreate={(ds, time) => openComposer({ kind: 'event', defaults: { date: ds, time } })} />
      )}
      {cal.mode === 'day' && (
        <div className="cal-split day">
          <TimeGrid days={[cal.sel]} items={items} showWork={showWork}
            onCreate={(ds, time) => openComposer({ kind: 'event', defaults: { date: ds, time } })} />
          <DayPanel ds={cal.sel} compact />
        </div>
      )}
    </div>
  )
}

function MonthGrid({ cursor, sel, weekStart, items, showWork, onPick }: {
  cursor: Date; sel: string; weekStart: 0 | 1; items: Item[]; showWork: boolean; onPick: (d: string) => void
}) {
  const cells = useMemo(() => monthGrid(cursor, weekStart), [cursor, weekStart])
  const labels = weekStart === 1 ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const today = todayYmd()
  const byDay = useMemo(() => {
    const m = new Map<string, Item[]>()
    for (const d of cells) m.set(ymd(d), itemsOnDay(items, ymd(d), showWork))
    return m
  }, [cells, items, showWork])

  return (
    <div className="card month" role="grid" aria-label="Mes">
      <div className="month-h" role="row">{labels.map((l, i) => <span key={i} role="columnheader">{l}</span>)}</div>
      <div className="month-b">
        {cells.map(d => {
          const ds = ymd(d)
          const its = byDay.get(ds) ?? []
          const hol = getArgHoliday(ds)
          const kinds = [...new Set(its.map(i => i.kind))].slice(0, 4)
          const dow = d.getDay()
          return (
            <button key={ds} type="button" role="gridcell" aria-selected={ds === sel}
              aria-label={`${fmt(d, "EEEE d 'de' MMMM")}${its.length ? `, ${its.length} elementos` : ''}${hol ? `, ${hol.name}` : ''}`}
              className={`cell ${isSameMonth(d, cursor) ? '' : 'out'} ${ds === today ? 'today' : ''} ${ds === sel ? 'sel' : ''} ${hol || dow === 0 || dow === 6 ? 'off' : ''}`}
              onClick={() => onPick(ds)}>
              <span className="n">{d.getDate()}</span>
              <span className="dots">{kinds.map(k => <i key={k} style={{ background: kc(k) }} />)}</span>
              {its.length > 4 && <span className="more">+{its.length - 4}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SortableRow({ item, ds }: { item: Item; ds: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div ref={setNodeRef} className={`sortable ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button type="button" className="grip" aria-label="Arrastrar para reordenar" {...attributes} {...listeners}><GripVertical size={16} /></button>
      <div className="grow"><ItemRow item={item} ds={ds} /></div>
    </div>
  )
}

function DayPanel({ ds, compact }: { ds: string; compact?: boolean }) {
  const items = useStore(s => s.items)
  const showWork = useStore(s => s.settings.showWork)
  const reorder = useStore(s => s.reorderDay)
  const openComposer = useUI(s => s.openComposer)
  const list = useMemo(() => itemsOnDay(items, ds, showWork), [items, ds, showWork])
  const hol = getArgHoliday(ds)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const ids = list.map(i => i.id)
    reorder(arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))))
  }
  const done = list.filter(i => isDoneOn(i, ds)).length

  return (
    <aside className={`day-panel ${compact ? 'compact' : ''}`}>
      <div className="dp-h">
        <div>
          <h3>{cap(fmt(ds, "EEEE d 'de' MMMM"))}</h3>
          <span className="dp-s">{list.length ? `${list.length} ${list.length === 1 ? 'elemento' : 'elementos'} · ${done} hechos` : 'Día libre'}</span>
        </div>
        <button type="button" className="icon-btn accent" aria-label="Agregar a este día"
          onClick={() => openComposer({ kind: 'event', defaults: { date: ds } })}><Plus size={20} /></button>
      </div>
      {hol && <div className="holiday-pill">🇦🇷 {hol.name}</div>}
      {list.length === 0 ? (
        <Empty icon={<Plus size={22} />} title="Nada planeado" text="Tocá + para agendar algo en este día." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
          <SortableContext items={list.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="card list">{list.map(i => <SortableRow key={i.id} item={i} ds={ds} />)}</div>
          </SortableContext>
        </DndContext>
      )}
      <p className="hint">Mantené presionado el asa para reordenar · deslizá para completar o borrar.</p>
    </aside>
  )
}

function layoutDay(its: Item[]) {
  const evs = its.filter(i => i.time).map(i => {
    const s = hhmmToMin(i.time)!
    const e = Math.max(s + 30, hhmmToMin(i.end) ?? s + 60)
    return { it: i, s, e, lane: 0, lanes: 1 }
  }).sort((a, b) => a.s - b.s || a.e - b.e)
  // agrupa los que se solapan y los reparte en carriles
  let group: typeof evs = []
  let gEnd = -1
  const flush = () => {
    const lanesEnd: number[] = []
    for (const ev of group) {
      let l = lanesEnd.findIndex(end => end <= ev.s)
      if (l === -1) { l = lanesEnd.length; lanesEnd.push(ev.e) } else lanesEnd[l] = ev.e
      ev.lane = l
    }
    for (const ev of group) ev.lanes = lanesEnd.length
    group = []
  }
  for (const ev of evs) {
    if (group.length && ev.s >= gEnd) { flush(); gEnd = -1 }
    group.push(ev); gEnd = Math.max(gEnd, ev.e)
  }
  flush()
  return evs
}

function TimeGrid({ days, items, showWork, onCreate, onPickDay }: {
  days: string[]; items: Item[]; showWork: boolean
  onCreate: (ds: string, time: string) => void; onPickDay?: (ds: string) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const today = todayYmd()
  const openComposer = useUI(s => s.openComposer)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const perDay = useMemo(() => days.map(ds => {
    const its = itemsOnDay(items, ds, showWork)
    return { ds, allDay: its.filter(i => !i.time), timed: layoutDay(its) }
  }), [days, items, showWork])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const first = Math.min(...perDay.flatMap(d => d.timed.map(t => t.s)), 8 * 60)
    el.scrollTop = Math.max(0, (days.includes(today) ? Math.min(first, nowMin - 90) : first - 60) / 60 * HOUR_H)
    // solo al montar o al cambiar de rango
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.join(',')])

  const click = (e: React.MouseEvent<HTMLDivElement>, ds: string) => {
    if ((e.target as HTMLElement).closest('.ev')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const min = Math.floor(((e.clientY - rect.top) / HOUR_H) * 2) * 30
    onCreate(ds, minToHhmm(min))
  }

  return (
    <div className={`card timegrid cols-${days.length}`}>
      <div className="tg-head" style={{ gridTemplateColumns: `44px repeat(${days.length}, 1fr)` }}>
        <span />
        {perDay.map(d => (
          <button key={d.ds} type="button" className={`tg-day ${d.ds === today ? 'today' : ''}`} onClick={() => onPickDay?.(d.ds)} disabled={!onPickDay}>
            <small>{cap(fmt(d.ds, 'EEE'))}</small><b>{fromYmd(d.ds).getDate()}</b>
          </button>
        ))}
      </div>
      {perDay.some(d => d.allDay.length) && (
        <div className="tg-all" style={{ gridTemplateColumns: `44px repeat(${days.length}, 1fr)` }}>
          <span className="tg-lbl">todo<br />el día</span>
          {perDay.map(d => (
            <div key={d.ds}>
              {d.allDay.slice(0, 4).map(i => (
                <button key={i.id} type="button" className={`pill ${isDoneOn(i, d.ds) ? 'done' : ''}`}
                  style={{ '--kc': kc(i.kind), '--kcs': ks(i.kind) } as React.CSSProperties}
                  onClick={() => openComposer({ kind: i.kind, item: i })}>{i.title}</button>
              ))}
              {d.allDay.length > 4 && <small>+{d.allDay.length - 4}</small>}
            </div>
          ))}
        </div>
      )}
      <div className="tg-scroll" ref={scroller}>
        <div className="tg-body" style={{ gridTemplateColumns: `44px repeat(${days.length}, 1fr)`, height: 24 * HOUR_H }}>
          <div className="tg-hours">
            {Array.from({ length: 24 }, (_, h) => <span key={h} style={{ top: h * HOUR_H }}>{h ? `${String(h).padStart(2, '0')}:00` : ''}</span>)}
          </div>
          {perDay.map(d => (
            <div key={d.ds} className="tg-col" onClick={e => click(e, d.ds)}>
              {Array.from({ length: 24 }, (_, h) => <i key={h} style={{ top: h * HOUR_H }} />)}
              {d.ds === today && <div className="tg-now" style={{ top: (nowMin / 60) * HOUR_H }} />}
              {d.timed.map(ev => (
                <button key={ev.it.id} type="button" className={`ev ${isDoneOn(ev.it, d.ds) ? 'done' : ''}`}
                  style={{
                    top: (ev.s / 60) * HOUR_H, height: Math.max(24, ((ev.e - ev.s) / 60) * HOUR_H - 2),
                    left: `${(ev.lane / ev.lanes) * 100}%`, width: `calc(${100 / ev.lanes}% - 3px)`,
                    '--kc': kc(ev.it.kind), '--kcs': ks(ev.it.kind),
                  } as React.CSSProperties}
                  onClick={() => openComposer({ kind: ev.it.kind, item: ev.it })}>
                  <b>{ev.it.title}</b><span>{ev.it.time}{ev.it.end ? `–${ev.it.end}` : ''}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
