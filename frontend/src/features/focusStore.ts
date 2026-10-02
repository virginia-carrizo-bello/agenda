import { create } from 'zustand'
import { useStore } from '../data/store'
import { todayYmd } from '../lib/dates'
import { notifPermission } from '../lib/notify'
import type { Focus } from '../data/types'

export type Phase = 'work' | 'short' | 'long'

interface FocusState {
  phase: Phase
  running: boolean
  endAt: number | null // ms epoch si corre
  left: number // ms restantes si está en pausa
  cycle: number // pomodoros de trabajo completados en la tanda
  taskId: string | null
  label: string
  startedWork: number | null
  setTask: (id: string | null, label?: string) => void
  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  tick: () => void
  setPhase: (p: Phase) => void
}

const minutes = (p: Phase) => {
  const f = useStore.getState().settings.focus
  return (p === 'work' ? f.work : p === 'short' ? f.short : f.long) * 60_000
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    ;[0, 0.22, 0.44].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = 660 + i * 110
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22)
    })
  } catch { /* sin audio */ }
}

export const useFocus = create<FocusState>((set, get) => ({
  phase: 'work', running: false, endAt: null, left: minutes('work'), cycle: 0, taskId: null, label: '', startedWork: null,

  setTask: (taskId, label = '') => set({ taskId, label }),

  start: () => {
    const s = get()
    const left = s.left > 0 ? s.left : minutes(s.phase)
    set({ running: true, endAt: Date.now() + left, left, startedWork: s.phase === 'work' ? (s.startedWork ?? Date.now()) : null })
  },
  pause: () => { const s = get(); if (s.running && s.endAt) set({ running: false, endAt: null, left: Math.max(0, s.endAt - Date.now()) }) },
  reset: () => set({ running: false, endAt: null, left: minutes(get().phase), startedWork: null }),
  setPhase: phase => set({ phase, running: false, endAt: null, left: minutes(phase), startedWork: null }),

  skip: () => {
    const s = get()
    const next: Phase = s.phase === 'work' ? (s.cycle + 1 >= 4 ? 'long' : 'short') : 'work'
    set({ phase: next, running: false, endAt: null, left: minutes(next), startedWork: null, cycle: s.phase === 'work' ? s.cycle : (s.phase === 'long' ? 0 : s.cycle) })
  },

  tick: () => {
    const s = get()
    if (!s.running || !s.endAt) return
    if (Date.now() < s.endAt) { set({ left: s.endAt - Date.now() }); return }
    // fin de la fase
    beep()
    const wasWork = s.phase === 'work'
    if (wasWork) {
      const mins = Math.round(minutes('work') / 60_000)
      useStore.getState().upsertDoc<Focus>('focus', null, { date: todayYmd(), minutes: mins, taskId: s.taskId, label: s.label })
    }
    const cycle = wasWork ? s.cycle + 1 : s.phase === 'long' ? 0 : s.cycle
    const next: Phase = wasWork ? (cycle >= 4 ? 'long' : 'short') : 'work'
    if (notifPermission() === 'granted') {
      try { new Notification(wasWork ? '¡Pomodoro completo!' : 'Descanso terminado', { body: wasWork ? 'Hora de un descanso.' : 'Volvamos al foco.', icon: '/favicon.svg' }) } catch { /* sin permiso */ }
    }
    set({ phase: next, running: false, endAt: null, left: minutes(next), cycle, startedWork: null })
  },
}))

export const fmtClock = (ms: number) => {
  const t = Math.ceil(ms / 1000)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
