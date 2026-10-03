import { useMemo, useState } from 'react'
import { Check, ChevronDown, Flame, Plus, Repeat, Trophy } from 'lucide-react'
import { useStore } from '../data/store'
import { DOW_LABEL, fmt, shiftYmd, todayYmd, weekDays, ymd } from '../lib/dates'
import { habitStats, isDoneOn, occursOn } from '../lib/recurrence'
import { BarChart, Heatmap } from '../ui/charts'
import { Empty, PageHead, Progress, Ring, Section } from '../ui/kit'
import { useUI } from '../ui/uiStore'
import { repeatLabel, toggleWithFeedback } from './ItemRow'
import { TopActions } from './Today'
import type { Item } from '../data/types'

function HabitCard({ h }: { h: Item }) {
  const [open, setOpen] = useState(false)
  const openComposer = useUI(s => s.openComposer)
  const weekStart = useStore(s => s.settings.weekStart)
  const today = todayYmd()
  const s = habitStats(h)
  const week = weekDays(new Date(), weekStart).map(ymd)
  const heat = useMemo(
    () => Array.from({ length: 84 }, (_, i) => {
      const ds = shiftYmd(today, i - 83)
      return { ds, v: isDoneOn(h, ds) ? 1 : 0, scheduled: occursOn(h, ds) }
    }),
    [h, today],
  )
  const doneToday = isDoneOn(h, today)
  const scheduledToday = occursOn(h, today)

  return (
    <div className="card habit">
      <div className="habit-top">
        <button type="button" className={`chk big ${doneToday ? 'on' : ''}`} aria-pressed={doneToday}
          aria-label={`${doneToday ? 'Desmarcar' : 'Completar'} hoy: ${h.title}`}
          disabled={!scheduledToday && !doneToday} onClick={() => toggleWithFeedback(h, today)}>
          <Check size={20} strokeWidth={3} />
        </button>
        <button type="button" className="habit-name" onClick={() => openComposer({ kind: 'routine', item: h })}>
          <b>{h.title}</b>
          <span><Repeat size={12} />{repeatLabel(h.repeat)}{h.time ? ` · ${h.time}` : ''}</span>
        </button>
        <div className={`streak ${s.current > 0 ? 'hot' : ''}`} title="Racha actual"><Flame size={16} /><b>{s.current}</b></div>
        <button type="button" className={`icon-btn ${open ? 'flip' : ''}`} aria-expanded={open} aria-label="Ver historial" onClick={() => setOpen(o => !o)}><ChevronDown size={18} /></button>
      </div>

      <div className="week-dots">
        {week.map(ds => {
          const sched = occursOn(h, ds)
          const d = isDoneOn(h, ds)
          const future = ds > today
          return (
            <button key={ds} type="button" disabled={future || (!sched && !d)} aria-pressed={d}
              aria-label={`${fmt(ds, "EEEE d")}: ${d ? 'hecho' : sched ? 'pendiente' : 'no programado'}`}
              className={`wd ${d ? 'on' : ''} ${sched ? '' : 'off'} ${ds === today ? 'today' : ''}`} onClick={() => toggleWithFeedback(h, ds)}>
              <small>{DOW_LABEL[['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(ds + 'T12:00').getDay()]]}</small>
              <i>{d ? <Check size={13} strokeWidth={3.2} /> : null}</i>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="habit-more">
          <div className="mini-stats">
            <div><Trophy size={15} /><b>{s.best}</b><span>mejor racha</span></div>
            <div><b>{Math.round(s.rate30 * 100)}%</b><span>últimos 30 días</span></div>
            <div><b>{s.total}</b><span>veces total</span></div>
          </div>
          <Progress value={s.rate30} />
          <div className="field-l">Últimas 12 semanas</div>
          <Heatmap days={heat} />
        </div>
      )}
    </div>
  )
}

export function Habits() {
  const items = useStore(s => s.items)
  const weekStart = useStore(s => s.settings.weekStart)
  const openComposer = useUI(s => s.openComposer)
  const habits = useMemo(() => items.filter(i => i.kind === 'routine').sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1), [items])
  const today = todayYmd()

  const dueToday = habits.filter(h => occursOn(h, today))
  const doneToday = dueToday.filter(h => isDoneOn(h, today)).length
  const week = weekDays(new Date(), weekStart).map(ymd)
  const bars = week.map(ds => {
    const due = habits.filter(h => occursOn(h, ds))
    const done = due.filter(h => isDoneOn(h, ds)).length
    return { label: fmt(ds, 'EEEEE').toUpperCase(), value: due.length ? Math.round((done / due.length) * 100) : 0, hi: ds === today }
  })

  return (
    <div className="page">
      <PageHead title="Hábitos" actions={<><TopActions /></>} />
      {habits.length === 0 ? (
        <Empty icon={<Repeat size={26} />} title="Armá tu primer hábito"
          text="Beber agua, leer, entrenar… Marcalo cada día y mirá crecer tu racha."
          action={<button type="button" className="btn primary" onClick={() => openComposer({ kind: 'routine', lockKind: true })}><Plus size={16} />Nuevo hábito</button>} />
      ) : (
        <div className="today-grid">
          <div className="col">
            <div className="card hero">
              <div className="hero-l">
                <div className="hero-hi">Hoy</div>
                <div className="hero-sub">{dueToday.length === 0 ? 'Sin hábitos programados' : doneToday === dueToday.length ? '¡Día perfecto!' : `${dueToday.length - doneToday} por completar`}</div>
                <div className="stats"><div><b>{doneToday}/{dueToday.length}</b><span>completados</span></div></div>
              </div>
              <Ring value={dueToday.length ? doneToday / dueToday.length : 0} size={96} stroke={10} color={dueToday.length && doneToday === dueToday.length ? 'var(--green)' : 'var(--accent)'}>
                <b>{dueToday.length ? Math.round((doneToday / dueToday.length) * 100) : 0}%</b>
              </Ring>
            </div>
            <Section title="Cumplimiento semanal"><div className="card pad"><BarChart data={bars} max={100} /></div></Section>
          </div>
          <div className="col">
            <Section title="Tus hábitos" aside={<button type="button" className="link" onClick={() => openComposer({ kind: 'routine', lockKind: true })}><Plus size={14} />Nuevo</button>}>
              <div className="stack">{habits.map(h => <HabitCard key={h.id} h={h} />)}</div>
            </Section>
          </div>
        </div>
      )}
    </div>
  )
}
