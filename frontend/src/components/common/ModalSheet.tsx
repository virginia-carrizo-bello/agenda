import React, { useEffect } from 'react'

interface ModalSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  onSave?: () => void
  saveLabel?: string
  isSaveDisabled?: boolean
  children: React.ReactNode
}

export const ModalSheet: React.FC<ModalSheetProps> = ({
  isOpen,
  onClose,
  title,
  onSave,
  saveLabel = 'Guardar',
  isSaveDisabled = false,
  children,
}) => {
  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera Ergonómica (Cancelar a la izq, Título centrado, Guardar a la der) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--sep)',
            background: 'var(--card)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              color: 'var(--label2)',
              fontSize: '15px',
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Cancelar
          </button>

          <h3
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--label)',
              textAlign: 'center',
              flex: 1,
              margin: '0 8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h3>

          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaveDisabled}
              style={{
                color: isSaveDisabled ? 'var(--label3)' : 'var(--accent)',
                fontSize: '15px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isSaveDisabled ? 'transparent' : 'var(--tint)',
                cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {saveLabel}
            </button>
          ) : (
            <div style={{ width: '60px' }} />
          )}
        </div>

        {/* Contenido scrolleable */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
