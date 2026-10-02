import { addDays, format, parse, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

export const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromYmd = (s: string) => parse(s, 'yyyy-MM-dd', new Date())
export const todayYmd = () => ymd(new Date())
export const shiftYmd = (s: string, n: number) => ymd(addDays(fromYmd(s), n))
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export const fmt = (d: Date | string, pattern: string) =>
  format(typeof d === 'string' ? fromYmd(d) : d, pattern, { locale: es })

export const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export const DOW_LABEL: Record<string, string> = {
  mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom',
}
export const DOW_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function weekDays(base: Date, weekStart: 0 | 1 = 1): Date[] {
  const s = startOfWeek(base, { weekStartsOn: weekStart })
  return Array.from({ length: 7 }, (_, i) => addDays(s, i))
}

/** Grilla de 6 semanas que cubre un mes */
export function monthGrid(base: Date, weekStart: 0 | 1 = 1): Date[] {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const s = startOfWeek(first, { weekStartsOn: weekStart })
  return Array.from({ length: 42 }, (_, i) => addDays(s, i))
}

export const hhmmToMin = (t?: string | null) => {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}
export const minToHhmm = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`

export function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function relDay(ds: string): string {
  const t = todayYmd()
  if (ds === t) return 'Hoy'
  if (ds === shiftYmd(t, 1)) return 'Mañana'
  if (ds === shiftYmd(t, -1)) return 'Ayer'
  return cap(fmt(ds, "EEEE d 'de' MMMM"))
}
