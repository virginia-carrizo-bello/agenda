import { useMemo } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useStore } from '../data/store'
import { useDocs } from '../data/selectors'
import { fmt, shiftYmd, todayYmd, weekDays, ymd } from '../lib/dates'
import { BarChart } from '../ui/charts'
import { PageHead, Ring, Section, Segmented } from '../ui/kit'
import { fmtClock, useFocus } from './focusStore'
import type { Phase } from './focusStore'
import type { Focus as FocusDoc } from '../data/types'

const PHASE_LABEL: Record<Phase, string> = { work: 'Enfoque', short: 'Descanso corto', long: 'Descanso largo' }

export function FocusPage() {
  const f = useFocus()
  const sessions = useDocs<FocusDoc>('focus')
  const items = useStore(s => s.items)
  const cfg = useStore(s => s.settings.focus)
  const weekStart = useStore(s => s.settings.weekStart)
  const today = todayYmd()

  const total = (f.phase === 'work' ? cfg.work : f.phase === 'short' ? cfg.short : cfg.long) * 60_000
  const progress = 1 - f.left / total
  const color = f.phase === 'work' ? 'var(--accent)' : 'var(--green)'

  const tasks = items.filter(i => (i.kind === 'task' || i.kind === 'reminder') && !i.done && !i.repeat && (!i.date || i.date <= shiftYmd(today, 1)))

  const stats = useMemo(() => {
    const week = weekDays(new Date(), weekStart).map(ymd)
    const bars = week.map(ds => ({
      label: fmt(ds, 'EEEEE').toUpperCase(),
      value: sessions.filter(s => s.data.date === ds).reduce((n, s) => n + s.data.minutes, 0),
      hi: ds === today,
    }))
    const todayMin = bars.find(b => b.hi)?.value ?? 0
    const weekMin = bars.reduce((n, b) => n + b.value, 0)
    const todayN = sessions.filter(s => s.data.date === today).length
    return { bars, todayMin, weekMin, todayN }
  }, [sessions, weekStart, today])

  return (
    <div className="page">
      <PageHead title="Enfoque" sub="Técnica Pomodoro" />
      <div className="today-grid">
        <div className="col">
          <div className="card focus-card">
            <Segmented value={f.phase} onChange={f.setPhase} label="Fase"
              options={[{ value: 'work', label: 'Enfoque' }, { value: 'short', label: 'Corto' }, { value: 'long', label: 'Largo' }]} />
            <Ring value={f.running || f.left < total ? progress : 0} size={248} stroke={14} color={color}>
              <div className="clock" role="timer" aria-live="off">{fmtClock(f.left)}</div>
              <span className="clock-l">{PHASE_LABEL[f.phase]}</span>
            </Ring>
            <div className="cycle" aria-label={`Pomodoro ${f.cycle % 4} de 4`}>{[0, 1, 2, 3].map(i => <i key={i} className={i < f.cycle ? 'on' : ''} />)}</div>
            <div className="focus-ctl">
              <button type="button" className="icon-btn round lg" aria-label="Reiniciar" onClick={f.reset}><RotateCcw size={20} /></button>
              <button type="button" className="play" aria-label={f.running ? 'Pausar' : 'Iniciar'} onClick={f.running ? f.pause : f.start}>
                {f.running ? <Pause size={30} /> : <Play size={30} />}
              </button>
              <button type="button" className="icon-btn round lg" aria-label="Saltar fase" onClick={f.skip}><SkipForward size={20} /></button>
            </div>
          </div>
          <div className="card pad">
            <label className="field-l" htmlFor="f-task" style={{ marginTop: 0 }}>¿En qué vas a trabajar?</label>
            <select id="f-task" value={f.taskId ?? ''} onChange={e => { const t = items.find(i => i.id === e.target.value); f.setTask(t?.id ?? null, t?.title ?? '') }}>
              <option value="">Sin tarea específica</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>
        <div className="col">
          <div className="card stat-row">
            <div><b>{stats.todayMin}</b><span>min hoy</span></div>
            <div><b>{stats.todayN}</b><span>pomodoros hoy</span></div>
            <div><b>{stats.weekMin}</b><span>min semana</span></div>
          </div>
          <Section title="Minutos de foco por día"><div className="card pad"><BarChart data={stats.bars} /></div></Section>
          <Section title="Últimas sesiones">
            <div className="card list">
              {[...sessions].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).slice(0, 6).map(s => (
                <div key={s.id} className="plain-row"><span className="grow"><b>{s.data.label || 'Sesión de enfoque'}</b><small>{fmt(s.data.date, "EEE d MMM")}</small></span><span className="meta">{s.data.minutes} min</span></div>
              ))}
              {sessions.length === 0 && <div className="plain-row"><span className="grow"><small>Todavía no completaste ningún pomodoro.</small></span></div>}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
