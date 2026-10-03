import { useMemo, useState } from 'react'
import { CornerDownLeft, Sparkles } from 'lucide-react'
import { parseQuick } from '../lib/nlp'
import { uid, useStore } from '../data/store'
import { useUI } from '../ui/uiStore'
import { KIND_LABEL } from '../data/selectors'
import { fmt, relDay } from '../lib/dates'
import type { Item } from '../data/types'

export function createFromText(text: string, listId?: string): Item | null {
  const p = parseQuick(text)
  if (!p.title) return null
  const st = useStore.getState()
  const it: Item = {
    id: uid(), kind: p.kind, title: p.title, done: false, createdAt: Date.now(),
    date: p.date, time: p.time, repeat: p.repeat,
  }
  if (p.kind === 'shopping') { it.listId = listId ?? st.lists[0]?.id ?? null; it.date = null }
  if (p.kind === 'birthday') { it.date = p.date ? p.date.slice(5) : null; it.year = p.date ? Number(p.date.slice(0, 4)) : null }
  if (p.kind === 'routine') it.repeat = p.repeat ?? 'daily'
  st.upsertItem(it)
  useUI.getState().toast(`${KIND_LABEL[p.kind]} añadido${p.date && p.kind !== 'routine' ? ` · ${relDay(p.date)}` : ''}${p.time ? ` ${p.time}` : ''}`)
  return it
}

export function QuickAdd({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => (text.trim() ? parseQuick(text) : null), [text])

  const submit = () => {
    if (!text.trim()) return
    if (createFromText(text)) { setText(''); onDone?.() }
  }

  return (
    <div className="quick">
      <div className="quick-in">
        <Sparkles size={18} aria-hidden="true" />
        <input
          autoComplete="off" value={text} onChange={e => setText(e.target.value)} autoFocus={autoFocus}
          placeholder="Ej: Dentista mañana a las 10:30…" aria-label="Anotar rápido: escribí qué y cuándo"
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
        />
        <button type="button" className="icon-btn" aria-label="Agregar" disabled={!text.trim()} onClick={submit}>
          <CornerDownLeft size={18} />
        </button>
      </div>
      {parsed && parsed.title && (
        <div className="quick-prev" aria-live="polite">
          <span className="tag">{KIND_LABEL[parsed.kind]}</span>
          {parsed.date && parsed.kind !== 'routine' && <span className="tag">{parsed.kind === 'birthday' ? fmt(parsed.date, 'd MMM') : relDay(parsed.date)}</span>}
          {parsed.time && <span className="tag">{parsed.time}</span>}
          {parsed.repeat && <span className="tag">Repite</span>}
          <span className="quick-t">{parsed.title}</span>
        </div>
      )}
    </div>
  )
}
