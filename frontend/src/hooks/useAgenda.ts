import { useState, useEffect, useCallback } from 'react'
import type { AgendaItem, ListItem, ActiveTab, ThemeMode, GCalConfig } from '../types/agenda'
import { api } from '../api/client'
import { getStoredGCalConfig, saveGCalConfig, gcalService } from '../api/gcal'

export interface ToastState {
  id: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function useAgenda() {
  const [items, setItems] = useState<AgendaItem[]>([])
  const [lists, setLists] = useState<ListItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<ActiveTab>('today')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [toast, setToast] = useState<ToastState | null>(null)

  // Configuración de Tema
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('tempo_theme') as ThemeMode
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Google Calendar Config
  const [gcalConfig, setGcalConfig] = useState<GCalConfig>(getStoredGCalConfig)

  // Aplicar tema al elemento :root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('tempo_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const showToast = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    const id = Date.now().toString()
    setToast({ id, message, actionLabel, onAction })
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr))
    }, 4500)
  }, [])

  // Cargar estado inicial desde FastAPI backend
  const loadState = useCallback(async () => {
    setLoading(true)
    try {
      const state = await api.getState()
      setItems(state.items || [])
      setLists(state.lists || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching state:', err)
      setError(err.message || 'No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadState()
  }, [loadState])

  // Guardar ítem (Crear o Actualizar)
  const saveItem = async (itemData: Partial<AgendaItem>) => {
    try {
      let savedItem: AgendaItem
      const isEdit = !!itemData.id

      if (isEdit) {
        savedItem = await api.updateItem(itemData.id!, itemData)
        setItems(prev => prev.map(it => (it.id === savedItem.id ? savedItem : it)))
        showToast('Ítem actualizado con éxito')
      } else {
        const payload = {
          ...itemData,
          id: itemData.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          created_at: new Date().toISOString(),
        }
        savedItem = await api.createItem(payload)
        setItems(prev => [savedItem, ...prev])
        showToast('Ítem añadido a la agenda')
      }

      // Sincronizar automáticamente con Google Calendar si está configurado
      if (gcalConfig.autoSync && gcalConfig.accessToken && savedItem.date) {
        gcalService.pushItem(savedItem, gcalConfig).then(gcalId => {
          if (gcalId && gcalId !== savedItem.gcal_id) {
            api.patchItem(savedItem.id, { gcal_id: gcalId })
          }
        })
      }

      return savedItem
    } catch (err: any) {
      console.error('Error saving item:', err)
      showToast('Error al guardar el ítem')
      throw err
    }
  }

  // Eliminar ítem con opción de Deshacer
  const deleteItem = async (id: string) => {
    const itemToDelete = items.find(it => it.id === id)
    if (!itemToDelete) return

    // Optimistic UI
    setItems(prev => prev.filter(it => it.id !== id))

    try {
      await api.deleteItem(id)

      if (gcalConfig.accessToken && itemToDelete.gcal_id) {
        gcalService.deleteItem(itemToDelete.gcal_id, gcalConfig)
      }

      showToast(`Eliminado: ${itemToDelete.title}`, 'Deshacer', async () => {
        // Restaurar ítem
        await api.createItem(itemToDelete)
        setItems(prev => [itemToDelete, ...prev])
      })
    } catch (err) {
      console.error('Error deleting item:', err)
      // Rollback
      setItems(prev => [...prev, itemToDelete])
      showToast('Error al eliminar el ítem')
    }
  }

  // Alternar completado
  const toggleDone = async (id: string, customDate?: string) => {
    const item = items.find(it => it.id === id)
    if (!item) return

    if (item.kind === 'routine' && customDate) {
      // Rutinas: actualizar done_dates
      const dateList = (item.done_dates || '').split(',').map(s => s.trim()).filter(Boolean)
      const hasDate = dateList.includes(customDate)
      const nextDates = hasDate ? dateList.filter(d => d !== customDate) : [...dateList, customDate]
      const updatedDatesStr = nextDates.join(',')

      setItems(prev => prev.map(it => (it.id === id ? { ...it, done_dates: updatedDatesStr } : it)))
      try {
        await api.patchItem(id, { done_dates: updatedDatesStr })
      } catch (e) {
        console.error(e)
      }
      return
    }

    // Toggle normal
    const nextDone = !item.done
    setItems(prev => prev.map(it => (it.id === id ? { ...it, done: nextDone } : it)))

    try {
      await api.toggleDone(id)
    } catch (err) {
      // Rollback
      setItems(prev => prev.map(it => (it.id === id ? { ...it, done: item.done } : it)))
    }
  }

  // Listas
  const createList = async (name: string, icon = '📝', color = '#8B5FA8') => {
    const id = `list_${Date.now()}`
    const newList: ListItem = { id, name, icon, color }
    setLists(prev => [...prev, newList])
    try {
      await api.createList(newList)
      setSelectedListId(id)
      showToast(`Lista "${name}" creada`)
    } catch (err) {
      setLists(prev => prev.filter(l => l.id !== id))
      showToast('Error al crear la lista')
    }
  }

  const deleteList = async (id: string) => {
    const listToDelete = lists.find(l => l.id === id)
    if (!listToDelete) return
    const itemsToDelete = items.filter(it => it.list_id === id)

    setLists(prev => prev.filter(l => l.id !== id))
    setItems(prev => prev.filter(it => it.list_id !== id))
    if (selectedListId === id) setSelectedListId(null)

    try {
      await api.deleteList(id)
      showToast(`Lista eliminada: ${listToDelete.name}`, 'Deshacer', async () => {
        await api.createList(listToDelete)
        if (itemsToDelete.length) await api.batchInsert(itemsToDelete)
        setLists(prev => [...prev, listToDelete])
        setItems(prev => [...prev, ...itemsToDelete])
      })
    } catch (err) {
      setLists(prev => [...prev, listToDelete])
      setItems(prev => [...prev, ...itemsToDelete])
      showToast('Error al eliminar la lista')
    }
  }

  const cleanListDone = async (listId: string) => {
    const doneItems = items.filter(it => it.list_id === listId && it.done)
    if (!doneItems.length) return

    setItems(prev => prev.filter(it => !(it.list_id === listId && it.done)))

    try {
      await api.cleanListDone(listId)
      showToast(`${doneItems.length} completados eliminados`, 'Deshacer', async () => {
        await api.batchInsert(doneItems)
        setItems(prev => [...prev, ...doneItems])
      })
    } catch (err) {
      setItems(prev => [...prev, ...doneItems])
      showToast('Error al limpiar tareas completadas')
    }
  }

  const reseedData = async () => {
    try {
      const state = await api.reseed()
      setItems(state.items || [])
      setLists(state.lists || [])
      showToast('Datos reiniciados con éxito')
    } catch (err) {
      showToast('Error al reiniciar los datos')
    }
  }

  const updateGCalConfig = (cfg: Partial<GCalConfig>) => {
    setGcalConfig(prev => {
      const next = { ...prev, ...cfg }
      saveGCalConfig(next)
      return next
    })
  }

  return {
    items,
    lists,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    selectedListId,
    setSelectedListId,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    toast,
    setToast,
    showToast,
    saveItem,
    deleteItem,
    toggleDone,
    createList,
    deleteList,
    cleanListDone,
    reseedData,
    gcalConfig,
    updateGCalConfig,
    loadState,
  }
}
