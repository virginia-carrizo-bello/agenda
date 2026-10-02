import { useMemo } from 'react'
import { BookOpen, CheckCircle2, Flame, Smile, Timer } from 'lucide-react'
import { useStore } from '../data/store'
import { useDocs } from '../data/selectors'
import { fmt, shiftYmd, todayYmd } from '../lib/dates'
import { isDoneOn, occursOn } from '../lib/recurrence'
import { BarChart } from '../ui/charts'
import { PageHead, Ring, Section } from '../ui/kit'
import type { Focus, Journal } from '../data/types'

export function Stats() {
  const items = useStore(s => s.items)
  const focus = useDocs<Focus>('focus')
  const journal = useDocs<Journal>('journal')
  const today = todayYmd()

  const d = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => shiftYmd(today, i - 13))
    const doneTasks = items.filter(i => (i.kind === 'task' || i.kind === 'reminder') && i.done && i.doneAt)
    const tasksPerDay = days.map(ds => ({
      label: fmt(ds, 'd'),
      value: doneTasks.filter(t => fmt(new Date(t.doneAt!), 'yyyy-MM-dd') === ds).length,
      hi: ds === today,
    }))
    const habits = items.filter(i => i.kind === 'routine')
    const last7 = days.slice(-7)
    let sched = 0, hit = 0
    for (const ds of last7) for (const h of habits) if (occursOn(h, ds)) { sched++; if (isDoneOn(h, ds)) hit++ }
    const focusPerDay = days.map(ds => ({ label: fmt(ds, 'd'), value: focus.filter(f => f.data.date === ds).reduce((n, f) => n + f.data.minutes, 0), hi: ds === today }))
    const moods = journal.filter(j => j.data.date >= days[0] && j.data.mood).map(j => j.data.mood)
    const year = String(new Date().getFullYear())
    return {
      tasksPerDay, tasks14: tasksPerDay.reduce((n, x) => n + x.value, 0),
      habitRate: sched ? hit / sched : 0, sched, hit,
      focusPerDay, focus14: focusPerDay.reduce((n, x) => n + x.value, 0),
      mood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
      books: items.filter(i => i.kind === 'book' && (i.date ?? '').startsWith(year)).length,
    }
  }, [items, focus, journal, today])

  return (
    <div className="page">
      <PageHead title="Resumen" sub="Últimos 14 días" />
      <div className="kpis">
        <div className="card kpi"><CheckCircle2 size={20} /><b>{d.tasks14}</b><span>tareas completadas</span></div>
        <div className="card kpi"><Timer size={20} /><b>{d.focus14}<small> min</small></b><span>de enfoque</span></div>
        <div className="card kpi"><Smile size={20} /><b>{d.mood ? d.mood.toFixed(1).replace('.', ',') : '—'}<small> /5</small></b><span>ánimo promedio</span></div>
        <div className="card kpi"><BookOpen size={20} /><b>{d.books}</b><span>libros este año</span></div>
      </div>
      <div className="today-grid">
        <div className="col">
          <Section title="Hábitos (7 días)">
            <div className="card hero">
              <div className="hero-l"><div className="hero-hi"><Flame size={16} /> Cumplimiento</div><div className="hero-sub">{d.hit} de {d.sched} programados</div></div>
              <Ring value={d.habitRate} size={100} stroke={11} color={d.habitRate > 0.8 ? 'var(--green)' : 'var(--accent)'}><b>{Math.round(d.habitRate * 100)}%</b></Ring>
            </div>
          </Section>
          <Section title="Tareas completadas por día"><div className="card pad"><BarChart data={d.tasksPerDay} /></div></Section>
        </div>
        <div className="col">
          <Section title="Minutos de enfoque por día"><div className="card pad"><BarChart data={d.focusPerDay} color="var(--green)" /></div></Section>
        </div>
      </div>
    </div>
  )
}
