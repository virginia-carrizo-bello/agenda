import type { AgendaItem, GCalConfig } from '../types/agenda'

const GCAL_CONFIG_KEY = 'tempo_gcal_cfg_v1'

export const getStoredGCalConfig = (): GCalConfig => {
  try {
    const raw = localStorage.getItem(GCAL_CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error loading GCal config', e)
  }
  return {
    clientId: '',
    apiKey: '',
    accessToken: null,
    calendarId: 'primary',
    autoSync: false,
    lastSync: null,
  }
}

export const saveGCalConfig = (cfg: GCalConfig) => {
  localStorage.setItem(GCAL_CONFIG_KEY, JSON.stringify(cfg))
}

export const gcalService = {
  requestAccessToken(clientId: string, callback: (token: string) => void) {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      alert('El script de Google Identity Services aún se está cargando. Reintenta en unos segundos.')
      return
    }
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      callback: (resp: any) => {
        if (resp.access_token) {
          callback(resp.access_token)
        }
      },
    })
    tokenClient.requestAccessToken()
  },

  async pushItem(item: AgendaItem, cfg: GCalConfig): Promise<string | null> {
    if (!cfg.accessToken || !item.date) return null

    let summary = item.title
    if (item.kind === 'birthday') {
      const cleanName = item.title.replace(/^cumpleaños\s*(de\s*)?/i, '').replace(/^🎂\s*/, '').trim()
      summary = `🎂 ${cleanName}`
    }

    let start: any = {}
    let end: any = {}

    if (item.all_day || !item.time) {
      start = { date: item.date }
      const d = new Date(item.date + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      const nextDay = d.toISOString().split('T')[0]
      end = { date: nextDay }
    } else {
      const timeStart = item.time.length === 5 ? `${item.time}:00` : item.time
      start = { dateTime: `${item.date}T${timeStart}` }
      const timeEnd = item.time_end ? (item.time_end.length === 5 ? `${item.time_end}:00` : item.time_end) : timeStart
      end = { dateTime: `${item.date}T${timeEnd}` }
    }

    const payload: any = {
      summary,
      description: item.notes || '',
      start,
      end,
    }

    if (item.location) {
      payload.location = item.location
    }

    if (item.rrule) {
      payload.recurrence = [`RRULE:${item.rrule}`]
    }

    if (item.alarm !== undefined && item.alarm !== null) {
      payload.reminders = {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: item.alarm }],
      }
    }

    const method = item.gcal_id ? 'PUT' : 'POST'
    const url = item.gcal_id
      ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events/${item.gcal_id}`
      : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events`

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Google Calendar error: ${res.statusText}`)
      const data = await res.json()
      return data.id
    } catch (err) {
      console.error('Error sincronizando con Google Calendar:', err)
      return null
    }
  },

  async deleteItem(gcalId: string, cfg: GCalConfig): Promise<boolean> {
    if (!cfg.accessToken || !gcalId) return false
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events/${gcalId}`
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cfg.accessToken}` },
      })
      return res.ok
    } catch (err) {
      console.error('Error eliminando de Google Calendar:', err)
      return false
    }
  },

  async fetchEvents(cfg: GCalConfig, timeMin?: string, timeMax?: string): Promise<any[]> {
    if (!cfg.accessToken) return []
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    })
    if (timeMin) params.append('timeMin', timeMin)
    if (timeMax) params.append('timeMax', timeMax)

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events?${params.toString()}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.accessToken}` },
    })
    if (!res.ok) throw new Error('Error al importar eventos de Google Calendar')
    const data = await res.json()
    return data.items || []
  },
}
