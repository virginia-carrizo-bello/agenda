import type { AppState, Doc, Item, ShopList } from './types'

const BASE = '/api'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  state: () => req<AppState>('/state'),
  docs: () => req<Doc[]>('/docs'),
  putItem: (it: Item) => req<Item>(`/items/${encodeURIComponent(it.id)}`, { method: 'PUT', body: JSON.stringify(it) }),
  delItem: (id: string) => req<unknown>(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  putList: (l: ShopList) => req<ShopList>('/lists', { method: 'POST', body: JSON.stringify(l) }),
  delList: (id: string) => req<unknown>(`/lists/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  putDoc: (d: Doc) => req<Doc>(`/docs/${encodeURIComponent(d.id)}`, { method: 'PUT', body: JSON.stringify(d) }),
  delDoc: (id: string) => req<unknown>(`/docs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
