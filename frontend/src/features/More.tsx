import { BarChart3, FileText, HeartPulse, NotebookPen, Settings as Cog, Target, Timer } from 'lucide-react'
import { go } from '../ui/uiStore'
import type { Page } from '../ui/uiStore'
import { PageHead } from '../ui/kit'

const ITEMS: { page: Page; icon: React.ReactNode; name: string; desc: string; c: string }[] = [
  { page: 'focus', icon: <Timer size={22} />, name: 'Enfoque', desc: 'Temporizador Pomodoro', c: 'accent' },
  { page: 'health', icon: <HeartPulse size={22} />, name: 'Medidas y peso', desc: 'Seguí tu evolución', c: 'birthday' },
  { page: 'notes', icon: <FileText size={22} />, name: 'Notas', desc: 'Ideas y apuntes', c: 'limon' },
  { page: 'journal', icon: <NotebookPen size={22} />, name: 'Diario', desc: 'Ánimo y gratitud', c: 'reminder' },
  { page: 'goals', icon: <Target size={22} />, name: 'Metas', desc: 'Objetivos con pasos', c: 'teal' },
  { page: 'stats', icon: <BarChart3 size={22} />, name: 'Resumen', desc: 'Estadísticas de 14 días', c: 'event' },
  { page: 'settings', icon: <Cog size={22} />, name: 'Ajustes', desc: 'Tema, avisos y datos', c: 'task' },
]

export function More() {
  return (
    <div className="page">
      <PageHead title="Más" sub="Herramientas" />
      <div className="more-grid">
        {ITEMS.map(i => (
          <button key={i.page} type="button" className="card more-card" onClick={() => go(i.page)}
            style={{ '--c': i.c === 'accent' ? 'var(--accent)' : `var(--k-${i.c})`, '--cs': i.c === 'accent' ? 'var(--tint)' : `var(--k-${i.c}-soft)` } as React.CSSProperties}>
            <span className="sq">{i.icon}</span>
            <b>{i.name}</b>
            <small>{i.desc}</small>
          </button>
        ))}
      </div>
    </div>
  )
}
