import { addDays } from 'date-fns'
import { pad, ymd } from './dates'
import type { ItemKind } from '../data/types'

export interface Parsed {
  title: string
  kind: ItemKind
  date: string | null
  time: string | null
  repeat: string | null
}

const WEEKDAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
}
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const strip = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const DAY_RE = '(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?)'

/** Captura rápida en español: "Reunión mañana 15:30", "Dentista el viernes a las 10", "Comprar pan" */
export function parseQuick(input: string, now = new Date()): Parsed {
  let s = ' ' + input.trim() + ' '
  let date: string | null = null
  let time: string | null = null
  let repeat: string | null = null
  let kind: ItemKind | null = null

  const cut = (re: RegExp) => { s = s.replace(re, ' ') }

  if (/^\s*(recordar|recordame|recordatorio|recordá)\b/i.test(s)) {
    kind = 'reminder'
    cut(/^\s*(recordar|recordame|recordatorio|recordá)\b/i)
  } else if (/^\s*(comprar|compra)\b/i.test(s)) {
    kind = 'shopping'
    cut(/^\s*(comprar|compra)\b/i)
  } else if (/^\s*(cumple|cumpleaños)\b/i.test(s)) {
    kind = 'birthday'
  }

  const everyDay = /\b(todos los d[ií]as|cada d[ií]a|diariamente)\b/i
  const everyWd = new RegExp(`\\b(cada|todos los)\\s+${DAY_RE}\\b`, 'i')
  if (everyDay.test(s)) { repeat = 'daily'; cut(everyDay) }
  else if (everyWd.test(s)) {
    const m = s.match(everyWd)!
    const w = strip(m[2]).replace(/s$/, '')
    repeat = DOW[WEEKDAYS[w]] ?? null
    cut(everyWd)
  } else if (/\b(cada semana|semanalmente)\b/i.test(s)) { repeat = 'weekly'; cut(/\b(cada semana|semanalmente)\b/i) }
  else if (/\b(cada mes|mensualmente)\b/i.test(s)) { repeat = 'monthly'; cut(/\b(cada mes|mensualmente)\b/i) }

  // Hora
  const m =
    s.match(/\b(?:a las?|a la)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|hs?|h)?\b/i) ??
    s.match(/\b(\d{1,2}):(\d{2})\s*(am|pm|hs?)?\b/i) ??
    s.match(/\b(\d{1,2})\s*(am|pm|hs|h)\b/i)
  if (m) {
    let h = Number(m[1])
    const hasMin = !!m[2] && /^\d+$/.test(m[2])
    const mi = hasMin ? Number(m[2]) : 0
    const suf = ((hasMin ? m[3] : m[2] ?? m[3]) ?? '').toLowerCase()
    if (suf === 'pm' && h < 12) h += 12
    if (suf === 'am' && h === 12) h = 0
    if (h < 24 && mi < 60) { time = `${pad(h)}:${pad(mi)}`; s = s.replace(m[0], ' ') }
  }

  // Fecha
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (/\bpasado ma[ñn]ana\b/i.test(s)) { date = ymd(addDays(base, 2)); cut(/\bpasado ma[ñn]ana\b/i) }
  else if (/\bma[ñn]ana\b/i.test(s)) { date = ymd(addDays(base, 1)); cut(/\bma[ñn]ana\b/i) }
  else if (/\bhoy\b/i.test(s)) { date = ymd(base); cut(/\bhoy\b/i) }
  else {
    const wd = s.match(new RegExp(`\\b(?:el\\s+|este\\s+|pr[oó]ximo\\s+)?${DAY_RE}\\b`, 'i'))
    const dm = s.match(/\b(?:el\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
    const dn = s.match(/\bel\s+(\d{1,2})\b(?!\s*[:h])/i)
    if (dm) {
      const dd = Number(dm[1]), mm = Number(dm[2])
      let yy = dm[3] ? Number(dm[3]) : base.getFullYear()
      if (yy < 100) yy += 2000
      let d = new Date(yy, mm - 1, dd)
      if (!dm[3] && d < base) d = new Date(yy + 1, mm - 1, dd)
      if (d.getMonth() === mm - 1) { date = ymd(d); s = s.replace(dm[0], ' ') }
    } else if (wd) {
      const w = strip(wd[1]).replace(/s$/, '')
      let diff = (WEEKDAYS[w] - base.getDay() + 7) % 7
      if (diff === 0) diff = 7
      date = ymd(addDays(base, diff)); s = s.replace(wd[0], ' ')
    } else if (dn) {
      const dd = Number(dn[1])
      if (dd >= 1 && dd <= 31) {
        let d = new Date(base.getFullYear(), base.getMonth(), dd)
        if (d < base) d = new Date(base.getFullYear(), base.getMonth() + 1, dd)
        date = ymd(d); s = s.replace(dn[0], ' ')
      }
    }
  }

  const title = s.replace(/\s+/g, ' ').replace(/\b(a|el|de|para)$/i, '').trim()
  const clean = title.charAt(0).toUpperCase() + title.slice(1)

  if (!kind) kind = repeat ? 'routine' : time ? 'event' : 'task'
  if (kind === 'birthday') {
    return { title: clean.replace(/^cumple(años)?( de)?\s*/i, ''), kind, date, time: null, repeat: null }
  }
  return { title: clean, kind, date: date ?? (kind === 'shopping' ? null : ymd(base)), time, repeat }
}
