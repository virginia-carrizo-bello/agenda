import React from 'react'
import type { ToastState } from '../../hooks/useAgenda'

interface ToastProps {
  toast: ToastState | null
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--label)',
        color: 'var(--bg)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 1000,
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '90vw',
        animation: 'fadeIn 0.2s cubic-bezier(0.25, 0.8, 0.3, 1)',
      }}
    >
      <span>{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          onClick={() => {
            toast.onAction!()
            onClose()
          }}
          style={{
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '12px',
            textTransform: 'uppercase',
          }}
        >
          {toast.actionLabel}
        </button>
      )}
    </div>
  )
}
