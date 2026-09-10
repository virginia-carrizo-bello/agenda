import React from 'react'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  onOpenNew: () => void
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNew,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
        <span
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--label3)',
            fontSize: '14px',
          }}
        >
          🔍
        </span>
        <input
          type="text"
          placeholder="Buscar eventos, rutinas, notas... (Ctrl+K)"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '36px',
            paddingRight: searchQuery ? '32px' : '14px',
            fontSize: '14px',
            borderRadius: 'var(--radius-full)',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--label3)',
              fontSize: '12px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenNew}
        style={{
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          fontWeight: 700,
          fontSize: '13px',
          display: 'none', // Visible only when needed on specific views or handled by Sidebar/TabBar
        }}
      >
        + Nuevo
      </button>
    </header>
  )
}
