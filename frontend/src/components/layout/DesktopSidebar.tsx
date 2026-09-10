import React from 'react'
import type { ActiveTab, ListItem } from '../../types/agenda'

interface DesktopSidebarProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  lists: ListItem[]
  selectedListId: string | null
  onSelectList: (id: string | null) => void
  onOpenNew: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  lists,
  selectedListId,
  onSelectList,
  onOpenNew,
  theme,
  onToggleTheme,
}) => {
  const NAV_ITEMS: { key: ActiveTab; label: string; icon: string; shortcut?: string }[] = [
    { key: 'today', label: 'Hoy', icon: '☀️', shortcut: '1' },
    { key: 'calendar', label: 'Calendario', icon: '📅', shortcut: '2' },
    { key: 'routines', label: 'Rutinas', icon: '🔁', shortcut: '3' },
    { key: 'lists', label: 'Listas', icon: '📝', shortcut: '4' },
    { key: 'settings', label: 'Ajustes', icon: '⚙️', shortcut: '5' },
  ]

  return (
    <aside className="app-sidebar">
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '18px',
          }}
        >
          ⏱️
        </div>
        <div>
          <h1 style={{ fontSize: '18px', color: 'var(--label)', letterSpacing: '-0.02em' }}>Tempo</h1>
          <span style={{ fontSize: '11px', color: 'var(--label3)', fontWeight: 600 }}>Organizador Personal</span>
        </div>
      </div>

      {/* Botón Principal "+ Nuevo" */}
      <button
        type="button"
        onClick={onOpenNew}
        style={{
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 700,
          fontSize: '14px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <span>+ Nuevo Ítem</span>
        <kbd
          style={{
            background: 'rgba(255,255,255,0.25)',
            color: '#FFFFFF',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          N
        </kbd>
      </button>

      {/* Menú de Vistas Principales */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--tint)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--label2)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.shortcut && (
                <span style={{ fontSize: '11px', color: 'var(--label3)', fontFamily: 'monospace' }}>
                  {item.shortcut}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Listas Rápidas en Sidebar */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--label3)', textTransform: 'uppercase', padding: '0 12px', marginBottom: '4px' }}>
          Tus Listas
        </span>
        {lists.map(l => {
          const isSelected = activeTab === 'lists' && selectedListId === l.id
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                onSelectList(l.id)
                onSelectTab('lists')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'var(--bg3)' : 'transparent',
                color: isSelected ? 'var(--accent)' : 'var(--label2)',
                fontSize: '13px',
                fontWeight: isSelected ? 700 : 500,
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span>{l.icon || '📝'}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {l.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Footer del Sidebar: Tema */}
      <div style={{ borderTop: '1px solid var(--sep)', paddingTop: '12px' }}>
        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--label2)',
            fontSize: '13px',
            width: '100%',
          }}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>
      </div>
    </aside>
  )
}
