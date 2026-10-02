import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { haptic } from '../lib/notify'

interface Props {
  children: ReactNode
  onDelete?: () => void
  onComplete?: () => void
}

const THRESHOLD = 84

/** Fila deslizable: izquierda elimina, derecha completa. */
export function SwipeRow({ children, onDelete, onComplete }: Props) {
  const [dx, setDx] = useState(0)
  const [anim, setAnim] = useState(false)
  const st = useRef<{ x: number; y: number; lock: 'x' | 'y' | null; id: number } | null>(null)

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' || (!onDelete && !onComplete)) return
    st.current = { x: e.clientX, y: e.clientY, lock: null, id: e.pointerId }
  }
  const move = (e: React.PointerEvent) => {
    const s = st.current
    if (!s) return
    const mx = e.clientX - s.x, my = e.clientY - s.y
    if (!s.lock) {
      if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my) * 1.4) { s.lock = 'x'; (e.currentTarget as HTMLElement).setPointerCapture(s.id); setAnim(false) }
      else if (Math.abs(my) > 8) { s.lock = 'y' }
    }
    if (s.lock === 'x') {
      const lo = onDelete ? -140 : 0, hi = onComplete ? 140 : 0
      setDx(Math.max(lo, Math.min(hi, mx)))
    }
  }
  const up = () => {
    const s = st.current
    st.current = null
    if (!s || s.lock !== 'x') return
    setAnim(true)
    if (dx <= -THRESHOLD && onDelete) { haptic(12); setDx(-400); setTimeout(() => { onDelete(); setDx(0) }, 160) }
    else if (dx >= THRESHOLD && onComplete) { haptic(12); onComplete(); setDx(0) }
    else setDx(0)
  }

  return (
    <div className="swipe">
      <div className="swipe-under swipe-l" aria-hidden="true"><Check size={20} /></div>
      <div className="swipe-under swipe-r" aria-hidden="true"><Trash2 size={20} /></div>
      <div
        className="swipe-front"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: anim ? 'transform .2s var(--ease)' : 'none' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      >
        {children}
      </div>
    </div>
  )
}
