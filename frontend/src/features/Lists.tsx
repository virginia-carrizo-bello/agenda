import { useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Bell, CheckSquare, ChevronRight, Gift, Plus, ShoppingCart, Star, Trash2 } from 'lucide-react'
import { uid, useStore } from '../data/store'
import { cap, fmt, relDay, todayYmd } from '../lib/dates'
import { nextBirthday } from '../lib/recurrence'
import { Empty, PageHead, Progress, Section, Stars } from '../ui/kit'
import { Sheet } from '../ui/Sheet'
import { go, useUI } from '../ui/uiStore'
import { ItemRow } from './ItemRow'
import { PALETTE, palOf } from './palette'
import { TopActions } from './Today'
import type { Item, ItemKind } from '../data/types'

const back = () => <button type="button" className="icon-btn round" aria-label="Volver a Listas" onClick={() => go('lists')}><ArrowLeft size={20} /></button>

function Hub() {
  const items = useStore(s => s.items)
  const lists = useStore(s => s.lists)
  const [newList, setNewList] = useState(false)
  const count = (k: ItemKind, open = false) => items.filter(i => i.kind === k && (!open || !i.done)).length

  const rows: { sub: string; icon: React.ReactNode; color: string; name: string; meta: string }[] = [
    { sub: 'task', icon: <CheckSquare size={20} />, color: 'task', name: 'Pendientes', meta: count('task', true) ? `${count('task', true)} abiertos` : 'Al día' },
    { sub: 'reminder', icon: <Bell size={20} />, color: 'reminder', name: 'Recordatorios', meta: count('reminder', true) ? `${count('reminder', true)} pendientes` : 'Al día' },
    { sub: 'birthday', icon: <Gift size={20} />, color: 'birthday', name: 'Cumpleaños', meta: `${count('birthday')} guardados` },
    { sub: 'wish', icon: <Star size={20} />, color: 'wish', name: 'Deseos', meta: `${count('wish', true)} por conseguir` },
    { sub: 'book', icon: <BookOpen size={20} />, color: 'teal', name: 'Libros leídos', meta: `${count('book')} terminados` },
  ]

  return (
    <div className="page">
      <PageHead title="Listas" sub="Colecciones" actions={<TopActions />} />
      <div className="two-col">
        <Section title="Organización">
          <div className="card list">
            {rows.map(r => (
              <button key={r.sub} type="button" className="plain-row" onClick={() => go('lists', r.sub)}>
                <span className="sq" style={{ '--c': `var(--k-${r.color})`, '--cs': `var(--k-${r.color}-soft)` } as React.CSSProperties}>{r.icon}</span>
                <span className="grow"><b>{r.name}</b><small>{r.meta}</small></span>
                <ChevronRight size={16} className="chev" />
              </button>
            ))}
          </div>
        </Section>
        <Section title="Listas de compra">
          <div className="card list">
            {lists.map(l => {
              const p = palOf(l.color)
              const n = items.filter(i => i.kind === 'shopping' && i.listId === l.id && !i.done).length
              return (
                <button key={l.id} type="button" className="plain-row" onClick={() => go('lists', `shop:${l.id}`)}>
                  <span className="sq" style={{ '--c': p.c, '--cs': p.cs } as React.CSSProperties}><ShoppingCart size={20} /></span>
                  <span className="grow"><b>{l.name}</b><small>{n ? `${n} por comprar` : 'Al día'}</small></span>
                  <ChevronRight size={16} className="chev" />
                </button>
              )
            })}
            <button type="button" className="plain-row add" onClick={() => setNewList(true)}>
              <span className="sq link"><Plus size={20} /></span><span className="grow"><b className="link">Nueva lista</b></span>
            </button>
          </div>
        </Section>
      </div>
      <NewList open={newList} onClose={() => setNewList(false)} />
    </div>
  )
}

function NewList({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('salvia')
  const upsertList = useStore(s => s.upsertList)
  const save = () => {
    if (!name.trim()) return
    const id = uid()
    upsertList({ id, name: name.trim(), color })
    setName(''); onClose(); go('lists', `shop:${id}`)
  }
  return (
    <Sheet open={open} title="Nueva lista" onClose={onClose}
      footer={<div className="sheet-actions"><button type="button" className="btn primary" disabled={!name.trim()} onClick={save}>Crear</button></div>}>
      <input className="big-input" autoFocus placeholder="Nombre de la lista" aria-label="Nombre" value={name}
        onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save() }} />
      <div className="field-l">Color</div>
      <div className="swatches" role="radiogroup" aria-label="Color">
        {Object.entries(PALETTE).map(([k, p]) => (
          <button key={k} type="button" role="radio" aria-checked={k === color} aria-label={p.name} className={`sw ${k === color ? 'on' : ''}`} style={{ background: p.c }} onClick={() => setColor(k)} />
        ))}
      </div>
    </Sheet>
  )
}

function TaskList({ kind }: { kind: 'task' | 'reminder' }) {
  const items = useStore(s => s.items)
  const showWork = useStore(s => s.settings.showWork)
  const openComposer = useUI(s => s.openComposer)
  const today = todayYmd()
  const [showDone, setShowDone] = useState(false)
  const all = items.filter(i => i.kind === kind && (showWork || !i.isWork))
  const open = all.filter(i => !i.done || i.repeat)
  const done = all.filter(i => i.done && !i.repeat).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))

  const groups = useMemo(() => {
    const g = new Map<string, Item[]>()
    for (const i of open.filter(x => !x.done || x.repeat)) {
      const k = i.date ? (i.date < today ? 'overdue' : i.date) : 'none'
      g.set(k, [...(g.get(k) ?? []), i])
    }
    const keys = [...g.keys()].sort((a, b) => (a === 'overdue' ? -1 : b === 'overdue' ? 1 : a === 'none' ? 1 : b === 'none' ? -1 : a < b ? -1 : 1))
    return keys.map(k => ({ k, its: g.get(k)!.sort((a, b) => ((a.date ?? '') + (a.time ?? '')) < ((b.date ?? '') + (b.time ?? '')) ? -1 : 1) }))
  }, [open, today])

  const label = kind === 'task' ? 'Pendientes' : 'Recordatorios'
  return (
    <div className="page">
      <PageHead title={label} back={back()} actions={<button type="button" className="icon-btn accent" aria-label="Nuevo" onClick={() => openComposer({ kind, lockKind: true })}><Plus size={20} /></button>} />
      {groups.length === 0 && <Empty icon={<CheckSquare size={24} />} title="Nada pendiente" text="Todo despejado. Tocá + para añadir uno." />}
      {groups.map(g => (
        <Section key={g.k} title={g.k === 'overdue' ? <>Vencidos <span className="count warn">{g.its.length}</span></> : g.k === 'none' ? 'Algún día' : relDay(g.k)}>
          <div className="card list">{g.its.map(i => <ItemRow key={i.id} item={i} ds={i.date ?? today} />)}</div>
        </Section>
      ))}
      {done.length > 0 && (
        <Section title={`Completados · ${done.length}`} aside={<button type="button" className="link" onClick={() => setShowDone(s => !s)}>{showDone ? 'Ocultar' : 'Mostrar'}</button>}>
          {showDone && <div className="card list grpdone">{done.map(i => <ItemRow key={i.id} item={i} ds={today} />)}</div>}
        </Section>
      )}
      <p className="hint">Tocá el círculo para completar · deslizá a la izquierda para eliminar.</p>
    </div>
  )
}

function Birthdays() {
  const items = useStore(s => s.items)
  const openComposer = useUI(s => s.openComposer)
  const list = items.filter(i => i.kind === 'birthday').map(b => ({ b, ...nextBirthday(b) })).sort((a, b) => a.days - b.days)
  return (
    <div className="page">
      <PageHead title="Cumpleaños" back={back()} actions={<button type="button" className="icon-btn accent" aria-label="Nuevo" onClick={() => openComposer({ kind: 'birthday', lockKind: true })}><Plus size={20} /></button>} />
      {list.length ? <div className="card list">{list.map(x => <ItemRow key={x.b.id} item={x.b} ds={todayYmd()} />)}</div>
        : <Empty icon={<Gift size={24} />} title="Sin cumpleaños" text="Guardá los cumpleaños importantes y nunca llegues tarde con el regalo." />}
      <p className="hint">Ordenados por el más cercano.</p>
    </div>
  )
}

function Wishes() {
  const items = useStore(s => s.items)
  const patch = useStore(s => s.patchItem)
  const openComposer = useUI(s => s.openComposer)
  const open = items.filter(i => i.kind === 'wish' && !i.done).sort((a, b) => (b.prio ?? 0) - (a.prio ?? 0))
  const done = items.filter(i => i.kind === 'wish' && i.done)
  const total = open.reduce((n, i) => n + (i.price ?? 0), 0)
  const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
  return (
    <div className="page">
      <PageHead title="Deseos" back={back()} sub={total ? `Total estimado ${money.format(total)}` : undefined}
        actions={<button type="button" className="icon-btn accent" aria-label="Nuevo" onClick={() => openComposer({ kind: 'wish', lockKind: true })}><Plus size={20} /></button>} />
      {open.length ? <div className="card list">{open.map(i => <ItemRow key={i.id} item={i} ds={todayYmd()} />)}</div>
        : <Empty icon={<Star size={24} />} title="Tu lista de deseos" text="Apuntá lo que te gustaría tener, con prioridad y precio." />}
      {done.length > 0 && <Section title={`Conseguidos · ${done.length}`}><div className="card list grpdone">{done.map(i => <ItemRow key={i.id} item={i} ds={todayYmd()} />)}</div>
        <button type="button" className="link more" onClick={() => done.forEach(i => patch(i.id, { done: false }))}>Marcar todos como pendientes</button></Section>}
    </div>
  )
}

function Books() {
  const items = useStore(s => s.items)
  const openComposer = useUI(s => s.openComposer)
  const list = items.filter(i => i.kind === 'book').sort((a, b) => ((b.date ?? '') < (a.date ?? '') ? -1 : 1))
  const rated = list.filter(i => (i.prio ?? 0) > 0)
  const avg = rated.length ? rated.reduce((n, i) => n + (i.prio ?? 0), 0) / rated.length : 0
  const thisYear = list.filter(i => (i.date ?? '').startsWith(String(new Date().getFullYear()))).length
  const byYear = useMemo(() => {
    const g = new Map<string, Item[]>()
    for (const i of list) { const y = (i.date ?? '').slice(0, 4) || 'Sin fecha'; g.set(y, [...(g.get(y) ?? []), i]) }
    return [...g.entries()]
  }, [list])

  return (
    <div className="page">
      <PageHead title="Libros leídos" back={back()} actions={<button type="button" className="icon-btn accent" aria-label="Nuevo libro" onClick={() => openComposer({ kind: 'book', lockKind: true })}><Plus size={20} /></button>} />
      {list.length > 0 && (
        <div className="card stat-row">
          <div><b>{list.length}</b><span>terminados</span></div>
          <div><b>{thisYear}</b><span>este año</span></div>
          <div><b>{avg ? avg.toFixed(1).replace('.', ',') : '—'}</b><span>promedio</span>{avg > 0 && <Stars value={Math.round(avg)} size={12} />}</div>
        </div>
      )}
      {list.length === 0 && <Empty icon={<BookOpen size={24} />} title="Todavía no anotaste libros" text="Registrá cada libro que termines con su calificación y tu opinión." />}
      {byYear.map(([y, its]) => (
        <Section key={y} title={`${y} · ${its.length}`}>
          <div className="card list">
            {its.map(i => (
              <div key={i.id} className="book">
                <ItemRow item={i} ds={todayYmd()} />
                {i.notes && <p className="book-d">{i.notes}</p>}
                {i.date && <small className="book-f">Terminado el {cap(fmt(i.date, "d 'de' MMMM"))}</small>}
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  )
}

function Shopping({ id }: { id: string }) {
  const lists = useStore(s => s.lists)
  const items = useStore(s => s.items)
  const upsertItem = useStore(s => s.upsertItem)
  const upsertList = useStore(s => s.upsertList)
  const removeList = useStore(s => s.removeList)
  const removeItem = useStore(s => s.removeItem)
  const toast = useUI(s => s.toast)
  const [text, setText] = useState('')
  const l = lists.find(x => x.id === id)
  if (!l) return <div className="page"><PageHead title="Lista" back={back()} /><Empty icon={<ShoppingCart size={24} />} title="Esta lista ya no existe" /></div>
  const p = palOf(l.color)
  const open = items.filter(i => i.kind === 'shopping' && i.listId === id && !i.done)
  const done = items.filter(i => i.kind === 'shopping' && i.listId === id && i.done)
  const tot = open.length + done.length

  const add = () => {
    const t = text.trim()
    if (!t) return
    upsertItem({ id: uid(), kind: 'shopping', title: t[0].toUpperCase() + t.slice(1), done: false, listId: id })
    setText('')
  }

  return (
    <div className="page">
      <PageHead title={l.name} back={back()} sub={`${open.length} por comprar · ${done.length} en la cesta`}
        actions={
          <button type="button" className="icon-btn" aria-label="Eliminar lista"
            onClick={() => {
              if (!confirm(`¿Eliminar la lista «${l.name}» y sus artículos?`)) return
              const keep = items.filter(i => i.listId === id)
              removeList(id); go('lists')
              toast('Lista eliminada', { actionLabel: 'Deshacer', onAction: () => { upsertList(l); keep.forEach(upsertItem) } })
            }}><Trash2 size={19} /></button>
        } />
      <div className="swatches sm" role="radiogroup" aria-label="Color de la lista">
        {Object.entries(PALETTE).map(([k, pp]) => (
          <button key={k} type="button" role="radio" aria-checked={pp.c === p.c} aria-label={pp.name} className={`sw ${pp.c === p.c ? 'on' : ''}`} style={{ background: pp.c }} onClick={() => upsertList({ ...l, color: k })} />
        ))}
      </div>
      {tot > 0 && <Progress value={done.length / tot} color={p.c} />}
      <div className="inline-add">
        <input placeholder="Añadir artículo…" aria-label="Añadir artículo" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
        <button type="button" className="icon-btn accent" aria-label="Añadir" onClick={add} disabled={!text.trim()}><Plus size={20} /></button>
      </div>
      {open.length ? <div className="card list">{open.map(i => <ItemRow key={i.id} item={i} ds={todayYmd()} />)}</div>
        : <Empty icon={<ShoppingCart size={24} />} title="Cesta vacía" text="Escribí arriba lo que necesites." />}
      {done.length > 0 && (
        <Section title={`Comprado · ${done.length}`} aside={<button type="button" className="link" onClick={() => { const rm = done.map(d => removeItem(d.id)!).filter(Boolean); toast('Artículos comprados vaciados', { actionLabel: 'Deshacer', onAction: () => rm.forEach(upsertItem) }) }}>Vaciar</button>}>
          <div className="card list grpdone">{done.map(i => <ItemRow key={i.id} item={i} ds={todayYmd()} />)}</div>
        </Section>
      )}
    </div>
  )
}

export function Lists() {
  const sub = useUI(s => s.route.sub)
  if (!sub) return <Hub />
  if (sub === 'task' || sub === 'reminder') return <TaskList kind={sub} />
  if (sub === 'birthday') return <Birthdays />
  if (sub === 'wish') return <Wishes />
  if (sub === 'book') return <Books />
  if (sub.startsWith('shop:')) return <Shopping id={sub.slice(5)} />
  return <Hub />
}

