import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

/** Hoja inferior en móvil, modal centrado en escritorio. Cierra con Esc, fondo o arrastrando hacia abajo. */
export function Sheet({ open, title, onClose, children, footer, wide }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; dy: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const start = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, dy: 0 }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return
    drag.current.dy = Math.max(0, e.clientY - drag.current.y)
    ref.current.style.transform = `translateY(${drag.current.dy}px)`
    ref.current.style.transition = 'none'
  }
  const end = () => {
    if (!drag.current || !ref.current) return
    const dy = drag.current.dy
    drag.current = null
    ref.current.style.transition = ''
    ref.current.style.transform = ''
    if (dy > 110) onClose()
  }

  return (
    <div className="sheet-wrap" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className={`sheet ${wide ? 'sheet-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <i />
        </div>
        <div className="sheet-h">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-f">{footer}</div>}
      </div>
    </div>
  )
}
