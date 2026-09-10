import React, { useState } from 'react'
import type { AgendaItem, ListItem } from '../../types/agenda'
import { ItemRow } from '../items/ItemRow'

interface ListsViewProps {
  lists: ListItem[]
  items: AgendaItem[]
  selectedListId: string | null
  onSelectList: (id: string | null) => void
  onCreateList: (name: string, icon?: string, color?: string) => Promise<void>
  onDeleteList: (id: string) => Promise<void>
  onCleanDone: (listId: string) => Promise<void>
  onToggleDone: (id: string) => void
  onEditItem: (item: AgendaItem) => void
  onDeleteItem: (id: string) => void
  onQuickAddItem: (title: string, listId: string | null) => Promise<void>
}

export const ListsView: React.FC<ListsViewProps> = ({
  lists,
  items,
  selectedListId,
  onSelectList,
  onCreateList,
  onDeleteList,
  onCleanDone,
  onToggleDone,
  onEditItem,
  onDeleteItem,
  onQuickAddItem,
}) => {
  const [newListName, setNewListName] = useState('')
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState('')

  // Lista activa
  const activeList = lists.find(l => l.id === selectedListId) || lists[0]
  const currentListId = activeList?.id || null

  // Tareas de la lista activa
  const listItems = items.filter(it => it.kind === 'task' && it.list_id === currentListId)
  const pendingItems = listItems.filter(it => !it.done)
  const completedItems = listItems.filter(it => it.done)

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    await onCreateList(newListName.trim(), '📝', '#8B5FA8')
    setNewListName('')
    setShowNewListModal(false)
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    await onQuickAddItem(quickTaskTitle.trim(), currentListId)
    setQuickTaskTitle('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Selector de Listas / Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {lists.map(l => {
          const isSelected = l.id === currentListId
          const count = items.filter(it => it.kind === 'task' && it.list_id === l.id && !it.done).length

          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelectList(l.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-full)',
                background: isSelected ? 'var(--accent)' : 'var(--card)',
                color: isSelected ? 'var(--on-accent)' : 'var(--label)',
                border: '1px solid var(--sep)',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s var(--ease)',
              }}
            >
              <span>{l.icon || '📝'}</span>
              <span>{l.name}</span>
              {count > 0 && (
                <span
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg3)',
                    color: isSelected ? '#FFFFFF' : 'var(--label2)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setShowNewListModal(true)}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg3)',
            color: 'var(--accent)',
            fontSize: '14px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          + Nueva Lista
        </button>
      </div>

      {/* Contenido de la Lista Activa */}
      {activeList && (
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--sep)',
            boxShadow: 'var(--shadow-sm)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Cabecera de la Lista */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{activeList.icon || '📝'}</span>
              <h2 style={{ fontSize: '20px', color: 'var(--label)' }}>{activeList.name}</h2>
              <span style={{ fontSize: '13px', color: 'var(--label3)' }}>
                ({pendingItems.length} pendientes)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {completedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => onCleanDone(activeList.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg3)',
                    color: 'var(--label2)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  🧹 Limpiar {completedItems.length} completados
                </button>
              )}

              {lists.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar la lista "${activeList.name}" y todas sus tareas?`)) {
                      onDeleteList(activeList.id)
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--red)',
                    fontSize: '13px',
                  }}
                  title="Eliminar lista"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Input rápido para agregar tarea */}
          <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={`Añadir tarea a ${activeList.name}...`}
              value={quickTaskTitle}
              onChange={e => setQuickTaskTitle(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={!quickTaskTitle.trim()}
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                padding: '0 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '14px',
                opacity: quickTaskTitle.trim() ? 1 : 0.5,
              }}
            >
              Añadir
            </button>
          </form>

          {/* Lista de Tareas Pendientes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingItems.length === 0 && completedItems.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--label3)', fontStyle: 'italic', textAlign: 'center', padding: '16px' }}>
                No hay tareas en esta lista. ¡Añade una arriba!
              </p>
            ) : (
              pendingItems.map(it => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onToggleDone={onToggleDone}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                />
              ))
            )}

            {/* Tareas Completadas */}
            {completedItems.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--label3)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  ✓ Completadas ({completedItems.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {completedItems.map(it => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      onToggleDone={onToggleDone}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear nueva lista */}
      {showNewListModal && (
        <div className="modal-overlay" onClick={() => setShowNewListModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--sep)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setShowNewListModal(false)} style={{ color: 'var(--label2)', fontWeight: 600 }}>
                Cancelar
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Nueva Lista</h3>
              <div style={{ width: '40px' }} />
            </div>
            <form onSubmit={handleCreateList} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
                  Nombre de la lista
                </label>
                <input
                  type="text"
                  placeholder="Ej: Proyectos, Compras, Libros..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>
              <button
                type="submit"
                disabled={!newListName.trim()}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  marginTop: '8px',
                }}
              >
                Crear Lista
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
