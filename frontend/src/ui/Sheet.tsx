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
  const closeRef = useRef(onClose)
  closeRef.current = onClose // el efecto no debe reiniciarse (ni robar el foco) en cada render

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const focusables = () =>
      [...(ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])]
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
    // foco inicial: primer campo del formulario, o el diálogo mismo
    const t = setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('.sheet-body input, .sheet-body textarea, .sheet-body select')
      // en pantallas táctiles no se abre el teclado solo
      const fine = window.matchMedia('(pointer: fine)').matches
      ;(fine ? (first ?? ref.current) : ref.current)?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open])

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
      <div ref={ref} className={`sheet ${wide ? 'sheet-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
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
