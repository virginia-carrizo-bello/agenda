import { create } from 'zustand'
import { todayYmd } from '../lib/dates'
import type { Item, ItemKind } from '../data/types'

export type Page =
  | 'today' | 'calendar' | 'habits' | 'lists' | 'more'
  | 'health' | 'notes' | 'journal' | 'goals' | 'focus' | 'settings' | 'stats'

export interface Route { page: Page; sub?: string }

export function parseHash(hash = location.hash): Route {
  const [, page, sub] = hash.replace(/^#/, '').split('/')
  const pages: Page[] = ['today', 'calendar', 'habits', 'lists', 'more', 'health', 'notes', 'journal', 'goals', 'focus', 'settings', 'stats']
  return { page: (pages.includes(page as Page) ? page : 'today') as Page, sub: sub ? decodeURIComponent(sub) : undefined }
}

export const go = (page: Page, sub?: string) => {
  const h = `#/${page}${sub ? `/${encodeURIComponent(sub)}` : ''}`
  if (location.hash !== h) location.hash = h
}

export interface ComposerState {
  kind: ItemKind
  item?: Item
  defaults?: Partial<Item>
  lockKind?: boolean
}

export interface Toast {
  id: number
  text: string
  actionLabel?: string
  onAction?: () => void
}

interface UI {
  route: Route
  selDay: string
  calMode: 'month' | 'week' | 'day'
  calCursor: string
  composer: ComposerState | null
  palette: boolean
  toasts: Toast[]
  setRoute: (r: Route) => void
  setSelDay: (d: string) => void
  setCalMode: (m: UI['calMode']) => void
  setCalCursor: (d: string) => void
  openComposer: (c: ComposerState) => void
  closeComposer: () => void
  setPalette: (v: boolean) => void
  toast: (text: string, opts?: { actionLabel?: string; onAction?: () => void; ms?: number }) => void
  dismissToast: (id: number) => void
}

let toastSeq = 1

export const useUI = create<UI>((set, get) => ({
  route: parseHash(),
  selDay: todayYmd(),
  calMode: 'month',
  calCursor: todayYmd(),
  composer: null,
  palette: false,
  toasts: [],
  setRoute: route => set({ route }),
  setSelDay: selDay => set({ selDay }),
  setCalMode: calMode => set({ calMode }),
  setCalCursor: calCursor => set({ calCursor }),
  openComposer: composer => set({ composer }),
  closeComposer: () => set({ composer: null }),
  setPalette: palette => set({ palette }),
  toast: (text, opts) => {
    const id = toastSeq++
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, text, actionLabel: opts?.actionLabel, onAction: opts?.onAction }] }))
    setTimeout(() => get().dismissToast(id), opts?.ms ?? (opts?.onAction ? 6000 : 2600))
  },
  dismissToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => useUI.getState().setRoute(parseHash()))
}
