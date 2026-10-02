import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Chip, Segmented, Stars, Switch } from '../ui/kit'
import { useUI } from '../ui/uiStore'
import { uid, useStore } from '../data/store'
import { DOW_LABEL, DOW_ORDER, todayYmd } from '../lib/dates'
import { KIND_LABEL, kc, ks } from '../data/selectors'
import type { Item, ItemKind } from '../data/types'
import { deleteWithUndo } from './ItemRow'
import { palOf } from './palette'

const KINDS: ItemKind[] = ['task', 'event', 'reminder', 'routine', 'birthday', 'shopping', 'wish', 'book']

const ALARMS = [
  { v: '', l: 'Sin aviso' }, { v: '0', l: 'A la hora' }, { v: '5', l: '5 min antes' }, { v: '15', l: '15 min antes' },
  { v: '30', l: '30 min antes' }, { v: '60', l: '1 h antes' }, { v: '1440', l: '1 día antes' },
]
const REPEATS = [
  { v: '', l: 'No se repite' }, { v: 'daily', l: 'Todos los días' }, { v: 'weekly', l: 'Cada semana' },
  { v: 'monthly', l: 'Cada mes' }, { v: 'yearly', l: 'Cada año' },
]

interface Form {
  title: string; date: string; time: string; end: string; location: string; notes: string
  prio: number; price: string; qty: string; listId: string; repeat: string; alarm: string
  isWork: boolean; days: string[]; allDay: boolean; year: string
}

function toForm(kind: ItemKind, it: Item | undefined, def: Partial<Item> | undefined, firstList: string): Form {
  const src = { ...(def ?? {}), ...(it ?? {}) } as Partial<Item>
  const isDays = !!src.repeat && !['daily', 'weekly', 'monthly', 'yearly'].includes(src.repeat)
  let date = src.date ?? ''
  if (kind === 'birthday' && date.length === 5) date = `${src.year ?? new Date().getFullYear()}-${date}`
  if (!date && kind !== 'task' && kind !== 'wish' && kind !== 'shopping') date = todayYmd()
  if (!it && kind === 'task' && !def?.date) date = todayYmd()
  return {
    title: src.title ?? '', date, time: src.time ?? '', end: src.end ?? '', location: src.location ?? '',
    notes: src.notes ?? '', prio: src.prio ?? (kind === 'book' ? 5 : 0), price: src.price != null ? String(src.price) : '',
    qty: src.qty ?? '', listId: src.listId ?? firstList, repeat: isDays ? '' : (src.repeat ?? ''),
    alarm: src.alarm != null ? String(src.alarm) : '', isWork: !!src.isWork,
    days: isDays ? src.repeat!.split(',') : [], allDay: !!it && kind === 'event' && !it.time,
    year: src.year ? String(src.year) : '',
  }
}

export function Composer() {
  const comp = useUI(s => s.composer)
  const close = useUI(s => s.closeComposer)
  const toast = useUI(s => s.toast)
  const lists = useStore(s => s.lists)
  const upsert = useStore(s => s.upsertItem)

  const [kind, setKind] = useState<ItemKind>('task')
  const [f, setF] = useState<Form>(() => toForm('task', undefined, undefined, ''))
  const editing = comp?.item

  useEffect(() => {
    if (!comp) return
    setKind(comp.kind)
    setF(toForm(comp.kind, comp.item, comp.defaults, lists[0]?.id ?? ''))
  }, [comp, lists])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(p => ({ ...p, [k]: v }))
  const changeKind = (k: ItemKind) => {
    setKind(k)
    setF(p => ({
      ...toForm(k, undefined, comp?.defaults, lists[0]?.id ?? ''),
      title: p.title, notes: p.notes, isWork: p.isWork,
    }))
  }

  const canSave = f.title.trim().length > 0
  const hasTime = !!f.time && !(kind === 'event' && f.allDay)

  const save = () => {
    if (!canSave) return
    const base: Item = editing ?? { id: uid(), kind, title: '', done: false, createdAt: Date.now() }
    const it: Item = { ...base, kind, title: f.title.trim(), isWork: f.isWork }
    it.notes = f.notes.trim() || null

    switch (kind) {
      case 'birthday': {
        it.date = f.date.slice(5)
        it.year = Number(f.date.slice(0, 4)) || null
        it.repeat = null
        break
      }
      case 'book': {
        it.date = f.date || todayYmd(); it.prio = f.prio; it.done = true; it.repeat = null
        break
      }
      case 'wish': {
        it.price = f.price ? parseFloat(f.price) : null; it.prio = f.prio; it.date = null
        break
      }
      case 'shopping': {
        it.listId = f.listId || lists[0]?.id || null; it.qty = f.qty.trim() || null; it.date = null
        break
      }
      case 'routine': {
        it.date = f.date || todayYmd()
        it.time = f.time || null
        it.repeat = f.days.length ? f.days.join(',') : 'daily'
        it.alarm = f.alarm !== '' && f.time ? Number(f.alarm) : null
        break
      }
      default: {
        it.date = f.date || null
        it.time = kind === 'event' && f.allDay ? null : (f.time || null)
        it.end = kind === 'event' && !f.allDay ? (f.end || null) : null
        it.location = f.location.trim() || null
        it.repeat = f.repeat || null
        it.alarm = f.alarm !== '' && hasTime ? Number(f.alarm) : null
        if (kind === 'task') it.prio = f.prio
        if (it.repeat) it.doneDates = it.doneDates ?? []
      }
    }
    upsert(it)
    toast(editing ? 'Cambios guardados' : `${KIND_LABEL[kind]} añadido`)
    close()
  }

  const title = editing ? `Editar ${KIND_LABEL[kind].toLowerCase()}` : `Nuevo ${KIND_LABEL[kind].toLowerCase()}`
  const showWork = !['birthday', 'book', 'wish', 'shopping'].includes(kind)
  const titleHint: Record<ItemKind, string> = useMemo(() => ({
    event: 'Reunión, cena, turno…', task: '¿Qué hay que hacer?', reminder: '¿Qué querés recordar?',
    routine: 'Ej: Tomar agua, leer 20 min…', birthday: 'Nombre de la persona', shopping: '¿Qué hay que comprar?',
    wish: '¿Qué querés conseguir?', book: 'Título del libro',
  }), [])

  return (
    <Sheet open={!!comp} title={title} onClose={close}
      footer={(
        <div className="sheet-actions">
          {editing && (
            <button type="button" className="btn danger" onClick={() => { deleteWithUndo(editing.id); close() }}>
              <Trash2 size={16} />Eliminar
            </button>
          )}
          <button type="button" className="btn primary" disabled={!canSave} onClick={save}>{editing ? 'Guardar' : 'Añadir'}</button>
        </div>
      )}>
      {!comp?.lockKind && !editing && (
        <div className="kind-pick" role="radiogroup" aria-label="Tipo">
          {KINDS.map(k => (
            <button key={k} type="button" role="radio" aria-checked={k === kind} className={k === kind ? 'on' : ''}
              style={{ '--kc': kc(k), '--kcs': ks(k) } as React.CSSProperties} onClick={() => changeKind(k)}>
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      <input className="big-input" autoFocus={!editing} placeholder={titleHint[kind]} value={f.title}
        aria-label="Título" onChange={e => set('title', e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save() }} />

      {['event', 'task', 'reminder', 'routine'].includes(kind) && (
        <div className="group">
          <div className="row">
            <label htmlFor="c-date">{kind === 'routine' ? 'Desde' : 'Fecha'}</label>
            <input id="c-date" type="date" value={f.date} onChange={e => set('date', e.target.value)} />
            {kind === 'task' && f.date && <button type="button" className="link" onClick={() => set('date', '')}>Sin fecha</button>}
          </div>
          {kind === 'event' && (
            <div className="row">
              <label htmlFor="c-all">Todo el día</label>
              <Switch checked={f.allDay} onChange={v => set('allDay', v)} label="Todo el día" />
            </div>
          )}
          {!(kind === 'event' && f.allDay) && (
            <div className="row">
              <label htmlFor="c-time">{kind === 'event' ? 'Desde' : 'Hora'}</label>
              <input id="c-time" type="time" value={f.time} onChange={e => set('time', e.target.value)} />
            </div>
          )}
          {kind === 'event' && !f.allDay && (
            <div className="row">
              <label htmlFor="c-end">Hasta</label>
              <input id="c-end" type="time" value={f.end} onChange={e => set('end', e.target.value)} />
            </div>
          )}
        </div>
      )}

      {kind === 'task' && (
        <>
          <div className="field-l">Prioridad</div>
          <Segmented value={f.prio} onChange={v => set('prio', v)} options={[{ value: 0, label: 'Baja' }, { value: 1, label: 'Media' }, { value: 2, label: 'Alta' }]} />
        </>
      )}

      {kind === 'routine' && (
        <>
          <div className="field-l">Días en que se repite</div>
          <div className="days">
            {DOW_ORDER.map(d => (
              <button key={d} type="button" aria-pressed={f.days.includes(d)} className={f.days.includes(d) ? 'on' : ''}
                onClick={() => set('days', f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d])}>
                {DOW_LABEL[d]}
              </button>
            ))}
          </div>
          <p className="hint">{f.days.length ? `${f.days.length} ${f.days.length === 1 ? 'día' : 'días'} por semana` : 'Sin elegir días = todos los días'}</p>
        </>
      )}

      {['event', 'task', 'reminder'].includes(kind) && (
        <div className="group">
          <div className="row">
            <label htmlFor="c-rep">Repetir</label>
            <select id="c-rep" value={f.repeat} onChange={e => set('repeat', e.target.value)}>
              {REPEATS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>
      )}

      {['event', 'task', 'reminder', 'routine'].includes(kind) && hasTime && (
        <div className="group">
          <div className="row">
            <label htmlFor="c-alarm">Aviso</label>
            <select id="c-alarm" value={f.alarm} onChange={e => set('alarm', e.target.value)}>
              {ALARMS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>
      )}

      {['event', 'reminder'].includes(kind) && (
        <div className="group">
          <div className="row">
            <label htmlFor="c-loc">Lugar</label>
            <input id="c-loc" type="text" placeholder="Dirección o enlace" value={f.location} onChange={e => set('location', e.target.value)} />
          </div>
        </div>
      )}

      {kind === 'birthday' && (
        <div className="group">
          <div className="row">
            <label htmlFor="c-bd">Nacimiento</label>
            <input id="c-bd" type="date" value={f.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
      )}

      {kind === 'wish' && (
        <>
          <div className="group">
            <div className="row">
              <label htmlFor="c-price">Precio</label>
              <input id="c-price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0" value={f.price} onChange={e => set('price', e.target.value)} />
            </div>
          </div>
          <div className="field-l">Qué tanto lo querés</div>
          <Segmented value={f.prio} onChange={v => set('prio', v)} options={[{ value: 0, label: 'Algún día' }, { value: 1, label: 'Me interesa' }, { value: 2, label: 'Lo quiero' }]} />
        </>
      )}

      {kind === 'shopping' && (
        <>
          <div className="field-l">Lista</div>
          <div className="chips">
            {lists.map(l => (
              <Chip key={l.id} on={l.id === f.listId} color={palOf(l.color).c} onClick={() => set('listId', l.id)}>{l.name}</Chip>
            ))}
          </div>
          <div className="group">
            <div className="row">
              <label htmlFor="c-qty">Cantidad</label>
              <input id="c-qty" type="text" placeholder="1 kg, ×2…" value={f.qty} onChange={e => set('qty', e.target.value)} />
            </div>
          </div>
        </>
      )}

      {kind === 'book' && (
        <>
          <div className="group">
            <div className="row">
              <label htmlFor="c-fin">Terminado el</label>
              <input id="c-fin" type="date" value={f.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="field-l">Calificación</div>
          <Stars value={f.prio} onChange={v => set('prio', v)} size={32} />
        </>
      )}

      {showWork && (
        <div className="group">
          <div className="row">
            <label htmlFor="c-work">💼 Es de trabajo</label>
            <Switch checked={f.isWork} onChange={v => set('isWork', v)} label="Clasificar como trabajo" />
          </div>
        </div>
      )}

      <textarea className="notes" rows={3} aria-label={kind === 'book' ? 'Descripción' : 'Notas'}
        placeholder={kind === 'book' ? 'Descripción u opinión del libro (opcional)' : 'Notas (opcional)'}
        value={f.notes} onChange={e => set('notes', e.target.value)} />
    </Sheet>
  )
}
