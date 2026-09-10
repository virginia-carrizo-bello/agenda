import type { AgendaItem, ListItem, AppState } from '../types/agenda'

const API_BASE = '/api'

export const api = {
  async getState(): Promise<AppState> {
    const res = await fetch(`${API_BASE}/state`)
    if (!res.ok) throw new Error('Error al cargar el estado de la agenda')
    return res.json()
  },

  async reseed(): Promise<AppState> {
    const res = await fetch(`${API_BASE}/reseed`, { method: 'POST' })
    if (!res.ok) throw new Error('Error al reiniciar los datos')
    return res.json()
  },

  // --- Ítems ---
  async getItems(kind?: string, listId?: string): Promise<AgendaItem[]> {
    const params = new URLSearchParams()
    if (kind) params.append('kind', kind)
    if (listId) params.append('list_id', listId)
    const res = await fetch(`${API_BASE}/items?${params.toString()}`)
    if (!res.ok) throw new Error('Error al obtener los ítems')
    return res.json()
  },

  async createItem(item: Partial<AgendaItem>): Promise<AgendaItem> {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error('Error al crear el ítem')
    return res.json()
  },

  async updateItem(id: string, item: Partial<AgendaItem>): Promise<AgendaItem> {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error('Error al actualizar el ítem')
    return res.json()
  },

  async patchItem(id: string, updates: Partial<AgendaItem>): Promise<AgendaItem> {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Error al modificar campos del ítem')
    return res.json()
  },

  async toggleDone(id: string): Promise<AgendaItem> {
    const res = await fetch(`${API_BASE}/items/${id}/toggle`, {
      method: 'PATCH',
    })
    if (!res.ok) throw new Error('Error al alternar estado del ítem')
    return res.json()
  },

  async deleteItem(id: string): Promise<AgendaItem> {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Error al eliminar el ítem')
    return res.json()
  },

  async batchInsert(items: AgendaItem[]): Promise<AgendaItem[]> {
    const res = await fetch(`${API_BASE}/items/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })
    if (!res.ok) throw new Error('Error al restaurar ítems')
    return res.json()
  },

  // --- Listas ---
  async getLists(): Promise<ListItem[]> {
    const res = await fetch(`${API_BASE}/lists`)
    if (!res.ok) throw new Error('Error al obtener listas')
    return res.json()
  },

  async createList(list: Partial<ListItem>): Promise<ListItem> {
    const res = await fetch(`${API_BASE}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    })
    if (!res.ok) throw new Error('Error al crear la lista')
    return res.json()
  },

  async deleteList(id: string): Promise<{ status: string; id: string }> {
    const res = await fetch(`${API_BASE}/lists/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Error al eliminar la lista')
    return res.json()
  },

  async cleanListDone(id: string): Promise<AgendaItem[]> {
    const res = await fetch(`${API_BASE}/lists/${id}/clean`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Error al limpiar tareas completadas')
    return res.json()
  },
}
