import React from 'react'
import type { ActiveTab } from '../../types/agenda'

interface MobileTabBarProps {
  activeTab: ActiveTab
  onSelectTab: (tab: ActiveTab) => void
  onOpenNew: () => void
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNew,
}) => {
  const TABS: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'today', label: 'Hoy', icon: '☀️' },
    { key: 'calendar', label: 'Calendario', icon: '📅' },
    { key: 'routines', label: 'Rutinas', icon: '🔁' },
    { key: 'lists', label: 'Listas', icon: '📝' },
    { key: 'settings', label: 'Ajustes', icon: '⚙️' },
  ]

  return (
    <nav className="app-tabbar">
      {TABS.slice(0, 2).map(t => {
        const isActive = activeTab === t.key
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelectTab(t.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: isActive ? 'var(--accent)' : 'var(--label3)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '11px',
              padding: '6px 0',
            }}
          >
            <span style={{ fontSize: '20px' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        )
      })}

      {/* Botón Flotante Central "+ Añadir" */}
      <button
        type="button"
        onClick={onOpenNew}
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 700,
          boxShadow: 'var(--shadow-md)',
          margin: '0 4px',
          flexShrink: 0,
        }}
        title="Añadir ítem"
      >
        +
      </button>

      {TABS.slice(2).map(t => {
        const isActive = activeTab === t.key
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelectTab(t.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: isActive ? 'var(--accent)' : 'var(--label3)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '11px',
              padding: '6px 0',
            }}
          >
            <span style={{ fontSize: '20px' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
