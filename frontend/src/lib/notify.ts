import { hhmmToMin, todayYmd, ymd } from './dates'
import { isDoneOn, occursOn } from './recurrence'
import type { Item } from '../data/types'

const FIRED = 'tempo.alarmsFired'

export const notifSupported = () => typeof Notification !== 'undefined'
export const notifPermission = (): NotificationPermission => (notifSupported() ? Notification.permission : 'denied')
export const askNotif = (): Promise<NotificationPermission> =>
  notifSupported() ? Notification.requestPermission() : Promise.resolve('denied')

function loadFired(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FIRED) || '[]')) } catch { return new Set() }
}

/** Dispara las alarmas de hoy que vencieron en los últimos 5 minutos. */
export function checkAlarms(items: Item[]) {
  if (notifPermission() !== 'granted') return
  const ds = todayYmd()
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const fired = loadFired()
  let changed = false
  for (const it of items) {
    if (it.alarm == null || !it.time || isDoneOn(it, ds) || !occursOn(it, ds)) continue
    const at = (hhmmToMin(it.time) ?? 0) - it.alarm
    const key = `${it.id}:${ds}:${it.time}`
    if (nowMin >= at && nowMin - at <= 5 && !fired.has(key)) {
      fired.add(key)
      changed = true
      const when = it.alarm ? `en ${it.alarm >= 60 ? `${it.alarm / 60} h` : `${it.alarm} min`}` : 'ahora'
      try { new Notification(it.title, { body: `${it.time} · ${when}`, tag: key, icon: '/favicon.svg' }) } catch { /* sin permiso */ }
    }
  }
  if (changed) {
    const limit = ymd(new Date(Date.now() - 2 * 864e5))
    const arr = [...fired].filter(k => k.split(':')[1] >= limit).slice(-300)
    try { localStorage.setItem(FIRED, JSON.stringify(arr)) } catch { /* lleno */ }
  }
}

export const haptic = (ms = 8) => {
  try { navigator.vibrate?.(ms) } catch { /* no soportado */ }
}
