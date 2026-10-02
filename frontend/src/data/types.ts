export type ItemKind =
  | 'event' | 'task' | 'reminder' | 'routine' | 'birthday' | 'wish' | 'shopping' | 'book'

export interface Item {
  id: string
  kind: ItemKind
  title: string
  done: boolean
  createdAt?: number | null
  doneAt?: number | null
  date?: string | null // YYYY-MM-DD (MM-DD para cumpleaños)
  time?: string | null
  end?: string | null
  prio?: number | null // tareas/deseos: 0-2 · libros: calificación 1-5
  notes?: string | null
  year?: number | null
  price?: number | null
  listId?: string | null
  qty?: string | null
  repeat?: string | null // daily | weekly | monthly | yearly | mon,tue,...
  location?: string | null
  alarm?: number | null
  isWork?: boolean | null
  orderIndex?: number | null
  doneDates?: string[] | null
}

export interface ShopList {
  id: string
  name: string
  color: string
}

export type DocType = 'metric' | 'measure' | 'note' | 'journal' | 'goal' | 'focus'

export interface Doc<T = Record<string, unknown>> {
  id: string
  type: DocType
  data: T
  updatedAt?: number | null
}

export interface Metric { name: string; unit: string; goal?: number | null; color: string; decimals?: number }
export interface Measure { metricId: string; date: string; value: number }
export interface Note { title: string; body: string; pinned: boolean; color: string; updatedAt: number }
export interface Journal { date: string; mood: number; text: string; gratitude: string }
export interface SubGoal { id: string; text: string; done: boolean }
export interface Goal { title: string; why: string; due: string | null; color: string; steps: SubGoal[]; done: boolean }
export interface Focus { date: string; minutes: number; taskId?: string | null; label?: string }

export interface AppState {
  lists: ShopList[]
  items: Item[]
}

export type Settings = {
  theme: 'auto' | 'light' | 'dark'
  showWork: boolean
  city: { name: string; lat: number; lon: number }
  focus: { work: number; short: number; long: number }
  weekStart: 0 | 1
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  showWork: true,
  city: { name: 'Rosario', lat: -32.9468, lon: -60.6393 },
  focus: { work: 25, short: 5, long: 15 },
  weekStart: 1,
}
