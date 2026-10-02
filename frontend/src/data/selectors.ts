import { useMemo } from 'react'
import { useStore } from './store'
import { hhmmToMin } from '../lib/dates'
import { occursOn } from '../lib/recurrence'
import type { Doc, DocType, Item } from './types'

/** Ítems que ocurren en una fecha, ordenados (manual → hora). */
export function itemsOnDay(items: Item[], ds: string, showWork = true): Item[] {
  return items
    .filter(it => occursOn(it, ds) && (showWork || !it.isWork))
    .sort((a, b) => {
      const oa = a.orderIndex || 0, ob = b.orderIndex || 0
      if (oa && ob && oa !== ob) return oa - ob
      const ta = hhmmToMin(a.time) ?? 9999, tb = hhmmToMin(b.time) ?? 9999
      if (ta !== tb) return ta - tb
      return (a.createdAt ?? 0) - (b.createdAt ?? 0)
    })
}

export function useDayItems(ds: string) {
  const items = useStore(s => s.items)
  const showWork = useStore(s => s.settings.showWork)
  return useMemo(() => itemsOnDay(items, ds, showWork), [items, ds, showWork])
}

export function useDocs<T>(type: DocType) {
  const docs = useStore(s => s.docs)
  return useMemo(() => docs.filter(d => d.type === type) as Doc<T>[], [docs, type])
}

export const ITEM_COLOR: Record<string, string> = {
  event: 'event', task: 'task', reminder: 'reminder', routine: 'routine',
  birthday: 'birthday', wish: 'wish', shopping: 'shopping', book: 'teal',
}
export const kc = (kind: string) => `var(--k-${ITEM_COLOR[kind] ?? 'task'})`
export const ks = (kind: string) => `var(--k-${ITEM_COLOR[kind] ?? 'task'}-soft)`

export const KIND_LABEL: Record<string, string> = {
  event: 'Evento', task: 'Pendiente', reminder: 'Recordatorio', routine: 'Hábito',
  birthday: 'Cumpleaños', wish: 'Deseo', shopping: 'Compra', book: 'Libro',
}
