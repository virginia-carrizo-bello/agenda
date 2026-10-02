import { differenceInCalendarDays } from 'date-fns'
import { DOW, fromYmd, shiftYmd, todayYmd, ymd } from './dates'
import type { Item } from '../data/types'
import { getArgHoliday } from './holidays'

export { getArgHoliday }

export const isRecurring = (it: Item) => !!it.repeat && it.kind !== 'birthday'

/** ¿El ítem ocurre en esa fecha? */
export function occursOn(it: Item, ds: string): boolean {
  if (it.kind === 'book' || it.kind === 'wish' || it.kind === 'shopping') return false
  if (it.kind === 'birthday') return !!it.date && it.date.slice(-5) === ds.slice(5)
  const rep = it.repeat
  if (!rep) return it.date === ds
  const start = it.date || ds
  if (ds < start && it.kind !== 'routine') return false
  const d = fromYmd(ds)
  switch (rep) {
    case 'daily': return true
    case 'weekly': return fromYmd(start).getDay() === d.getDay()
    case 'monthly': return fromYmd(start).getDate() === d.getDate()
    case 'yearly': return start.slice(5) === ds.slice(5)
    default: return rep.split(',').includes(DOW[d.getDay()])
  }
}

export function isDoneOn(it: Item, ds: string): boolean {
  return isRecurring(it) ? (it.doneDates ?? []).includes(ds) : !!it.done
}

export function nextBirthday(it: Item, from = new Date()) {
  const [m, d] = (it.date ?? '01-01').slice(-5).split('-').map(Number)
  let next = new Date(from.getFullYear(), m - 1, d)
  const t0 = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  if (next < t0) next = new Date(from.getFullYear() + 1, m - 1, d)
  const days = differenceInCalendarDays(next, t0)
  const age = it.year ? next.getFullYear() - it.year : null
  return { next, days, age }
}

/** Racha actual y mejor racha de un hábito (rutina). Cuenta solo los días programados. */
export function habitStats(it: Item, upTo = todayYmd()) {
  const done = new Set(it.doneDates ?? [])
  let cur = 0
  let cursor = upTo
  // el día de hoy sin completar todavía no corta la racha
  if (!done.has(cursor) && occursOn(it, cursor)) cursor = shiftYmd(cursor, -1)
  for (let i = 0; i < 800; i++) {
    if (!occursOn(it, cursor)) { cursor = shiftYmd(cursor, -1); continue }
    if (done.has(cursor)) { cur++; cursor = shiftYmd(cursor, -1) } else break
  }
  const all = [...done].sort()
  let best = 0, run = 0
  if (all.length) {
    let d = all[0]
    while (d <= upTo) {
      if (occursOn(it, d)) {
        if (done.has(d)) { run++; best = Math.max(best, run) } else run = 0
      }
      d = shiftYmd(d, 1)
    }
  }
  // tasa de los últimos 30 días
  let sched = 0, hit = 0
  for (let i = 0; i < 30; i++) {
    const ds = ymd(new Date(Date.now() - i * 86400000))
    if (occursOn(it, ds)) { sched++; if (done.has(ds)) hit++ }
  }
  return { current: cur, best, rate30: sched ? hit / sched : 0, total: done.size }
}
