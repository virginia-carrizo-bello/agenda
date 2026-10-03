import { Bell, Briefcase, Check, ChevronRight, Flag, MapPin, Repeat } from 'lucide-react'
import { useStore } from '../data/store'
import { isDoneOn, isRecurring, nextBirthday } from '../lib/recurrence'
import { kc, ks } from '../data/selectors'
import type { Item } from '../data/types'
import { useUI } from '../ui/uiStore'
import { SwipeRow } from '../ui/SwipeRow'
import { haptic } from '../lib/notify'
import { Stars } from '../ui/kit'
import { fmt } from '../lib/dates'

export const hasCheck = (k: Item['kind']) => ['task', 'reminder', 'routine', 'shopping', 'wish'].includes(k)

export function deleteWithUndo(id: string) {
  const removed = useStore.getState().removeItem(id)
  if (!removed) return
  useUI.getState().toast(`«${removed.title}» eliminado`, {
    actionLabel: 'Deshacer',
    onAction: () => useStore.getState().upsertItem(removed),
  })
}

export function toggleWithFeedback(it: Item, ds: string) {
  const wasDone = isDoneOn(it, ds)
  useStore.getState().toggleItem(it.id, ds)
  haptic(wasDone ? 6 : 14)
}

const REPEAT_LABEL: Record<string, string> = {
  daily: 'Todos los días', weekly: 'Cada semana', monthly: 'Cada mes', yearly: 'Cada año',
}

export function repeatLabel(rep?: string | null) {
  if (!rep) return ''
  if (REPEAT_LABEL[rep]) return REPEAT_LABEL[rep]
  const map: Record<string, string> = { mon: 'L', tue: 'M', wed: 'X', thu: 'J', fri: 'V', sat: 'S', sun: 'D' }
  return rep.split(',').map(d => map[d] ?? d).join(' ')
}

interface Props {
  item: Item
  ds: string
  showDate?: boolean
  hideTime?: boolean
  onOpen?: (it: Item) => void
}

export function ItemRow({ item: it, ds, showDate, hideTime, onOpen }: Props) {
  const openComposer = useUI(s => s.openComposer)
  const done = isDoneOn(it, ds)
  const checkable = hasCheck(it.kind)
  const edit = () => (onOpen ? onOpen(it) : openComposer({ kind: it.kind, item: it }))

  let sub = ''
  if (it.kind === 'birthday') {
    const b = nextBirthday(it)
    sub = b.days === 0 ? '¡Hoy cumple!' : b.days === 1 ? 'Mañana' : `En ${b.days} días`
    if (b.age != null) sub += ` · cumple ${b.age}`
  }

  return (
    <SwipeRow onDelete={() => deleteWithUndo(it.id)} onComplete={checkable ? () => toggleWithFeedback(it, ds) : undefined}>
      <div className={`item ${done ? 'done' : ''}`} style={{ '--kc': kc(it.kind), '--kcs': ks(it.kind) } as React.CSSProperties}>
        {checkable ? (
          <button type="button" className="chk" aria-pressed={done}
            aria-label={`${done ? 'Desmarcar' : 'Completar'}: ${it.title}`}
            onClick={() => toggleWithFeedback(it, ds)}>
            <Check size={15} strokeWidth={3} />
          </button>
        ) : (
          <span className="dot" aria-hidden="true" />
        )}
        <button type="button" className="item-main" onClick={edit}>
          <span className="item-t">
            {it.title}
            {it.isWork && <span className="badge work"><Briefcase size={11} />Trabajo</span>}
          </span>
          <span className="item-s">
            {it.time && !hideTime && <span>{it.time}{it.end ? `–${it.end}` : ''}</span>}
            {hideTime && it.end && <span>hasta {it.end}</span>}
            {showDate && it.date && it.kind !== 'birthday' && <span>{fmt(it.date, "EEE d MMM")}</span>}
            {sub && <span>{sub}</span>}
            {it.location && <span className="ic"><MapPin size={12} />{it.location}</span>}
            {isRecurring(it) && <span className="ic"><Repeat size={12} />{repeatLabel(it.repeat)}</span>}
            {it.alarm != null && it.time && <span className="ic"><Bell size={12} /></span>}
            {it.notes && it.kind !== 'book' && <span className="note-s">{it.notes}</span>}
          </span>
        </button>
        {it.kind === 'task' && !done && (it.prio ?? 0) > 0 && (
          <span className={`prio p${it.prio}`} role="img" aria-label={it.prio === 2 ? 'Prioridad alta' : 'Prioridad media'}><Flag size={15} /></span>
        )}
        {it.kind === 'book' && <Stars value={it.prio ?? 0} size={14} />}
        {it.kind === 'wish' && it.price ? <span className="price">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(it.price)}</span> : null}
        <ChevronRight size={16} className="chev" aria-hidden="true" />
      </div>
    </SwipeRow>
  )
}
