export type ItemKind = 'event' | 'routine' | 'reminder' | 'task' | 'birthday' | 'general'

export interface AgendaItem {
  id: string
  kind: ItemKind
  title: string
  notes?: string | null
  date?: string | null          // YYYY-MM-DD
  time?: string | null          // HH:MM (Desde)
  time_end?: string | null      // HH:MM (Hasta)
  all_day?: boolean | number    // 0/1 or boolean
  rrule?: string | null         // e.g. FREQ=DAILY or FREQ=WEEKLY;BYDAY=TU
  repeat?: string | null        // daily or specific day
  alarm?: number | null         // minutes before event: 0, 5, 10, 15, 30, 60, 120, 1440
  location?: string | null      // Place or link
  list_id?: string | null       // Parent list ID
  listId?: string | null
  year?: number | null          // Birth year for birthdays
  prio?: number | null
  price?: number | null
  qty?: string | null
  color?: string | null
  icon?: string | null
  done?: boolean | number
  done_dates?: string | null    // Comma-separated YYYY-MM-DD for routines
  order_index?: number
  created_at?: string | null
  createdAt?: number | null
  updated_at?: string | null
  gcal_id?: string | null
  gcal_etag?: string | null
}

export interface ListItem {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  order_index?: number
}

export interface AppState {
  lists: ListItem[]
  items: AgendaItem[]
}

export type ActiveTab = 'today' | 'calendar' | 'routines' | 'lists' | 'settings'
export type CalendarViewMode = 'month' | 'week'
export type ThemeMode = 'light' | 'dark'

export interface GCalConfig {
  clientId: string
  apiKey: string
  accessToken: string | null
  calendarId: string
  autoSync: boolean
  lastSync: string | null
}
