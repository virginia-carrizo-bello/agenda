import React from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, id }) => {
  return (
    <label
      htmlFor={id}
      className="switch-label"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        gap: '12px',
        width: '100%',
      }}
    >
      {label && <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--label)' }}>{label}</span>}
      <div
        className={`switch-track ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onChange(!checked)
          }
        }}
      >
        <div className="switch-thumb" />
      </div>
    </label>
  )
}
