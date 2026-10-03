import { useEffect, useMemo, useState } from 'react'
import { Check, Pin, PinOff, Plus, Search, Target, Trash2, X } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import { uid, useStore } from '../data/store'
import { useDocs } from '../data/selectors'
import { cap, fmt, fromYmd, relDay, todayYmd, ymd } from '../lib/dates'
import { ColorPicker, Empty, PageHead, Progress, Section, colorSoft, colorVar } from '../ui/kit'
import { Sheet } from '../ui/Sheet'
import { useUI } from '../ui/uiStore'
import type { Doc, Goal, Journal, Note, SubGoal } from '../data/types'

/* ======================= Notas ======================= */
export function Notes() {
  const notes = useDocs<Note>('note')
  const upsertDoc = useStore(s => s.upsertDoc)
  const removeDoc = useStore(s => s.removeDoc)
  const restoreDoc = useStore(s => s.restoreDoc)
  const toast = useUI(s => s.toast)
  const [q, setQ] = useState('')
  const [ed, setEd] = useState<{ id: string | null; n: Note } | null>(null)

  const blank = (): Note => ({ title: '', body: '', pinned: false, color: 'accent', updatedAt: Date.now() })
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return notes
      .filter(n => !t || (n.data.title + ' ' + n.data.body).toLowerCase().includes(t))
      .sort((a, b) => Number(b.data.pinned) - Number(a.data.pinned) || (b.data.updatedAt || 0) - (a.data.updatedAt || 0))
  }, [notes, q])

  const close = () => setEd(null)
  const save = () => {
    if (!ed) return
    if (!ed.n.title.trim() && !ed.n.body.trim()) return close()
    upsertDoc<Note>('note', ed.id, { ...ed.n, updatedAt: Date.now() })
    close()
  }

  return (
    <div className="page">
      <PageHead title="Notas"
        actions={<button type="button" className="icon-btn accent" aria-label="Nueva nota" onClick={() => setEd({ id: null, n: blank() })}><Plus size={20} /></button>} />
      <div className="search-in"><Search size={18} /><input autoComplete="off" placeholder="Buscar en tus notas…" aria-label="Buscar notas" value={q} onChange={e => setQ(e.target.value)} /></div>
      {list.length === 0 ? <Empty icon={<Plus size={24} />} title={q ? 'Sin resultados' : 'Todavía no hay notas'} text={q ? 'Probá con otra palabra.' : 'Anotá ideas, listas de cosas para recordar o lo que se te ocurra.'} /> : (
        <div className="note-grid">
          {list.map(n => (
            <button key={n.id} type="button" className="note" style={{ '--nc': colorVar(n.data.color), '--ncs': colorSoft(n.data.color) } as React.CSSProperties}
              onClick={() => setEd({ id: n.id, n: n.data })}>
              {n.data.pinned && <Pin size={13} className="pin" />}
              {n.data.title && <b>{n.data.title}</b>}
              <p>{n.data.body}</p>
              <small>{relDay(ymd(new Date(n.data.updatedAt || Date.now())))}</small>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!ed} title={ed?.id ? 'Editar nota' : 'Nueva nota'} onClose={save} wide
        footer={ed && (
          <div className="sheet-actions">
            {ed.id && <button type="button" className="btn danger" onClick={() => { const r = removeDoc(ed.id!); close(); if (r) toast('Nota eliminada', { actionLabel: 'Deshacer', onAction: () => restoreDoc(r) }) }}><Trash2 size={16} />Eliminar</button>}
            <button type="button" className="btn" onClick={() => setEd({ ...ed, n: { ...ed.n, pinned: !ed.n.pinned } })}>{ed.n.pinned ? <><PinOff size={16} />Desfijar</> : <><Pin size={16} />Fijar</>}</button>
            <button type="button" className="btn primary" onClick={save}>Listo</button>
          </div>
        )}>
        {ed && (
          <>
            <input autoComplete="off" className="big-input" placeholder="Título…" aria-label="Título" value={ed.n.title} onChange={e => setEd({ ...ed, n: { ...ed.n, title: e.target.value } })} />
            <textarea className="notes tall" rows={9} placeholder="Escribí lo que quieras…" aria-label="Contenido" value={ed.n.body} onChange={e => setEd({ ...ed, n: { ...ed.n, body: e.target.value } })} />
            <ColorPicker value={ed.n.color} onChange={c => setEd({ ...ed, n: { ...ed.n, color: c } })} />
          </>
        )}
      </Sheet>
    </div>
  )
}

/* ======================= Diario ======================= */
const MOODS = ['😞', '😕', '😐', '🙂', '😄']
const MOOD_LABEL = ['Mal', 'Regular', 'Normal', 'Bien', 'Genial']

export function JournalPage() {
  const entries = useDocs<Journal>('journal')
  const upsertDoc = useStore(s => s.upsertDoc)
  const today = todayYmd()
  const existing = entries.find(e => e.data.date === today)
  const [mood, setMood] = useState(existing?.data.mood ?? 0)
  const [text, setText] = useState(existing?.data.text ?? '')
  const [grat, setGrat] = useState(existing?.data.gratitude ?? '')
  const [saved, setSaved] = useState(true)
  const toast = useUI(s => s.toast)

  useEffect(() => {
    if (existing) { setMood(existing.data.mood); setText(existing.data.text); setGrat(existing.data.gratitude) }
    // solo cuando llega el registro de hoy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id])

  const save = () => {
    upsertDoc<Journal>('journal', existing?.id ?? `journal-${today}`, { date: today, mood, text, gratitude: grat })
    setSaved(true); toast('Diario guardado')
  }
  const dirty = (fn: () => void) => { fn(); setSaved(false) }
  const past = entries.filter(e => e.data.date !== today).sort((a, b) => (a.data.date < b.data.date ? 1 : -1))

  const days = new Set(entries.map(e => e.data.date))
  let streak = 0
  for (let i = days.has(today) ? 0 : 1; i < 400; i++) {
    const ds = new Date(Date.now() - i * 864e5); const k = `${ds.getFullYear()}-${String(ds.getMonth() + 1).padStart(2, '0')}-${String(ds.getDate()).padStart(2, '0')}`
    if (days.has(k)) streak++; else break
  }

  return (
    <div className="page">
      <PageHead title="Diario" sub={cap(fmt(new Date(), "EEEE d 'de' MMMM"))} />
      <div className="today-grid">
        <div className="col">
          <div className="card pad">
            <div className="field-l" style={{ marginTop: 0 }}>¿Cómo te sentiste hoy?</div>
            <div className="moods" role="radiogroup" aria-label="Ánimo">
              {MOODS.map((m, i) => (
                <button key={i} type="button" role="radio" aria-checked={mood === i + 1} aria-label={MOOD_LABEL[i]} className={mood === i + 1 ? 'on' : ''} onClick={() => dirty(() => setMood(i + 1))}>
                  <span>{m}</span><small>{MOOD_LABEL[i]}</small>
                </button>
              ))}
            </div>
            <textarea className="notes tall" rows={7} placeholder="Contá cómo estuvo tu día…" aria-label="Entrada del diario" value={text} onChange={e => dirty(() => setText(e.target.value))} />
            <input autoComplete="off" className="inline-input" placeholder="Hoy agradezco…" aria-label="Gratitud" value={grat} onChange={e => dirty(() => setGrat(e.target.value))} />
            <div className="sheet-actions"><button type="button" className="btn primary" disabled={saved || (!mood && !text.trim() && !grat.trim())} onClick={save}>{saved ? 'Guardado' : 'Guardar'}</button></div>
          </div>
          {streak > 1 && <div className="card note-card"><b>🔥 {streak} días seguidos</b><p>Escribir un rato cada día te ayuda a ordenar la cabeza.</p></div>}
        </div>
        <div className="col">
          <Section title="Entradas anteriores">
            {past.length === 0 ? <Empty icon={<Plus size={22} />} title="Aún no hay entradas pasadas" /> : (
              <div className="stack">
                {past.slice(0, 40).map(e => (
                  <div key={e.id} className="card pad journal-e">
                    <div className="je-h"><b>{cap(fmt(e.data.date, "EEEE d 'de' MMMM yyyy"))}</b><span title={MOOD_LABEL[e.data.mood - 1]}>{MOODS[e.data.mood - 1] ?? ''}</span></div>
                    {e.data.text && <p>{e.data.text}</p>}
                    {e.data.gratitude && <small>🙏 {e.data.gratitude}</small>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

/* ======================= Metas ======================= */
export function Goals() {
  const goals = useDocs<Goal>('goal')
  const upsertDoc = useStore(s => s.upsertDoc)
  const removeDoc = useStore(s => s.removeDoc)
  const restoreDoc = useStore(s => s.restoreDoc)
  const toast = useUI(s => s.toast)
  const [ed, setEd] = useState<{ id: string | null; g: Goal } | null>(null)
  const [step, setStep] = useState('')
  const blank = (): Goal => ({ title: '', why: '', due: null, color: 'accent', steps: [], done: false })
  const prog = (g: Goal) => (g.steps.length ? g.steps.filter(s => s.done).length / g.steps.length : g.done ? 1 : 0)

  const open = goals.filter(g => !g.data.done).sort((a, b) => ((a.data.due ?? '9') < (b.data.due ?? '9') ? -1 : 1))
  const done = goals.filter(g => g.data.done)

  const toggleStep = (g: Doc<Goal>, s: SubGoal) => {
    const steps = g.data.steps.map(x => (x.id === s.id ? { ...x, done: !x.done } : x))
    const all = steps.length > 0 && steps.every(x => x.done)
    upsertDoc<Goal>('goal', g.id, { ...g.data, steps, done: all ? true : g.data.done && !all ? false : g.data.done })
    if (all) toast('🎉 ¡Meta cumplida!')
  }
  const close = () => { setEd(null); setStep('') }
  const save = () => {
    if (!ed || !ed.g.title.trim()) return
    const steps = step.trim() ? [...ed.g.steps, { id: uid(), text: step.trim(), done: false }] : ed.g.steps
    upsertDoc<Goal>('goal', ed.id, { ...ed.g, title: ed.g.title.trim(), steps })
    close()
  }

  const card = (g: Doc<Goal>) => {
    const p = prog(g.data)
    const dl = g.data.due ? differenceInCalendarDays(fromYmd(g.data.due), new Date()) : null
    return (
      <div key={g.id} className="card goal" style={{ '--gc': colorVar(g.data.color), '--gcs': colorSoft(g.data.color) } as React.CSSProperties}>
        <button type="button" className="goal-h" onClick={() => setEd({ id: g.id, g: g.data })}>
          <span className="gi"><Target size={18} /></span>
          <span className="grow"><b>{g.data.title}</b>{g.data.why && <small>{g.data.why}</small>}</span>
          <span className="gp">{Math.round(p * 100)}%</span>
        </button>
        <Progress value={p} color="var(--gc)" />
        {g.data.due && <div className={`due ${dl != null && dl < 0 && !g.data.done ? 'late' : ''}`}>{g.data.done ? 'Cumplida' : dl! < 0 ? `Venció hace ${-dl!} días` : dl === 0 ? 'Vence hoy' : `Faltan ${dl} días · ${fmt(g.data.due, 'd MMM yyyy')}`}</div>}
        {g.data.steps.length > 0 && (
          <ul className="steps">
            {g.data.steps.map(s => (
              <li key={s.id}>
                <button type="button" className={`chk sm ${s.done ? 'on' : ''}`} aria-pressed={s.done} aria-label={`${s.done ? 'Desmarcar' : 'Completar'}: ${s.text}`} onClick={() => toggleStep(g, s)}><Check size={12} strokeWidth={3.2} /></button>
                <span className={s.done ? 'done' : ''}>{s.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead title="Metas"
        actions={<button type="button" className="icon-btn accent" aria-label="Nueva meta" onClick={() => setEd({ id: null, g: blank() })}><Plus size={20} /></button>} />
      {goals.length === 0 && <Empty icon={<Target size={26} />} title="Definí tu primera meta" text="Dividila en pasos chicos y seguí tu progreso." />}
      <div className="goal-grid">{open.map(card)}</div>
      {done.length > 0 && <Section title={`Cumplidas · ${done.length}`}><div className="goal-grid">{done.map(card)}</div></Section>}

      <Sheet open={!!ed} title={ed?.id ? 'Editar meta' : 'Nueva meta'} onClose={close}
        footer={ed && (
          <div className="sheet-actions">
            {ed.id && <button type="button" className="btn danger" onClick={() => { const r = removeDoc(ed.id!); close(); if (r) toast('Meta eliminada', { actionLabel: 'Deshacer', onAction: () => restoreDoc(r) }) }}><Trash2 size={16} />Eliminar</button>}
            <button type="button" className="btn primary" disabled={!ed.g.title.trim()} onClick={save}>Guardar</button>
          </div>
        )}>
        {ed && (
          <>
            <input autoComplete="off" className="big-input" placeholder="Ej: correr 5 km…" aria-label="Meta" value={ed.g.title} onChange={e => setEd({ ...ed, g: { ...ed.g, title: e.target.value } })} />
            <textarea className="notes" rows={2} placeholder="¿Por qué es importante? (opcional)…" aria-label="Motivo" value={ed.g.why} onChange={e => setEd({ ...ed, g: { ...ed.g, why: e.target.value } })} />
            <div className="group">
              <div className="row"><label htmlFor="g-due">Fecha límite</label><input id="g-due" type="date" value={ed.g.due ?? ''} onChange={e => setEd({ ...ed, g: { ...ed.g, due: e.target.value || null } })} />
                {ed.g.due && <button type="button" className="link" onClick={() => setEd({ ...ed, g: { ...ed.g, due: null } })}>Quitar</button>}</div>
              <div className="row"><label htmlFor="g-done">Cumplida</label><input id="g-done" type="checkbox" checked={ed.g.done} onChange={e => setEd({ ...ed, g: { ...ed.g, done: e.target.checked } })} /></div>
            </div>
            <div className="field-l">Pasos</div>
            <ul className="steps edit">
              {ed.g.steps.map(s => (
                <li key={s.id}>
                  <button type="button" className={`chk sm ${s.done ? 'on' : ''}`} aria-pressed={s.done} aria-label="Alternar paso" onClick={() => setEd({ ...ed, g: { ...ed.g, steps: ed.g.steps.map(x => (x.id === s.id ? { ...x, done: !x.done } : x)) } })}><Check size={12} strokeWidth={3.2} /></button>
                  <span className={s.done ? 'done' : ''}>{s.text}</span>
                  <button type="button" className="icon-btn" aria-label="Quitar paso" onClick={() => setEd({ ...ed, g: { ...ed.g, steps: ed.g.steps.filter(x => x.id !== s.id) } })}><X size={16} /></button>
                </li>
              ))}
            </ul>
            <div className="inline-add">
              <input autoComplete="off" placeholder="Añadir paso…" aria-label="Nuevo paso" value={step} onChange={e => setStep(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && step.trim()) { setEd({ ...ed, g: { ...ed.g, steps: [...ed.g.steps, { id: uid(), text: step.trim(), done: false }] } }); setStep('') } }} />
              <button type="button" className="icon-btn accent" aria-label="Añadir paso" disabled={!step.trim()}
                onClick={() => { setEd({ ...ed, g: { ...ed.g, steps: [...ed.g.steps, { id: uid(), text: step.trim(), done: false }] } }); setStep('') }}><Plus size={20} /></button>
            </div>
            <div className="field-l">Color</div>
            <ColorPicker value={ed.g.color} onChange={c => setEd({ ...ed, g: { ...ed.g, color: c } })} />
          </>
        )}
      </Sheet>
    </div>
  )
}
