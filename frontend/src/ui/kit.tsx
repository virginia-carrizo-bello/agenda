import { useId } from 'react'
import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react'
import { Star } from 'lucide-react'

export function IconBtn({ label, children, className = '', ...rest }: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-btn ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Segmented<T extends string | number>({
  value, onChange, options, label, small,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  label?: string
  small?: boolean
}) {
  return (
    <div className={`seg ${small ? 'seg-sm' : ''}`} role="tablist" aria-label={label}>
      {options.map(o => (
        <button
          key={String(o.value)} type="button" role="tab" aria-selected={o.value === value}
          className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({ on, children, onClick, color }: { on?: boolean; children: ReactNode; onClick?: () => void; color?: string }) {
  return (
    <button
      type="button" className={`chip ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}
      style={color ? ({ '--c': color } as CSSProperties) : undefined}
    >
      {children}
    </button>
  )
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <label className="switch" htmlFor={inputId}>
      <input id={inputId} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-label={label} />
      <span className="switch-track" aria-hidden="true" />
    </label>
  )
}

export function Ring({
  value, size = 96, stroke = 10, color = 'var(--accent)', children,
}: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg3d)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .6s var(--ease)' }}
        />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  )
}

export function Stars({ value, onChange, size = 22 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="stars" role={onChange ? 'radiogroup' : 'img'} aria-label={`Calificación ${value} de 5`}>
      {[1, 2, 3, 4, 5].map(n => {
        const on = n <= value
        const icon = <Star size={size} fill={on ? 'currentColor' : 'none'} strokeWidth={1.8} />
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} estrellas`}
            className={on ? 'on' : ''} onClick={() => onChange(n === value ? 0 : n)}>{icon}</button>
        ) : (
          <span key={n} className={on ? 'on' : ''}>{icon}</span>
        )
      })}
    </div>
  )
}

export function Progress({ value, color = 'var(--accent)', label = 'Progreso' }: { value: number; color?: string; label?: string }) {
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-ic" aria-hidden="true">{icon}</div>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Section({ title, aside, children }: { title?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      {(title || aside) && (
        <div className="section-h">
          <h2>{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHead({ title, sub, actions, back }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="ph-main">
        {back}
        <div>
          <h1>{title}</h1>
          {sub && <p className="ph-meta">{sub}</p>}
        </div>
      </div>
      {actions && <div className="ph-actions">{actions}</div>}
    </header>
  )
}

export const COLORS = ['accent', 'event', 'task', 'birthday', 'reminder', 'shopping', 'teal', 'limon', 'routine', 'wish'] as const
const COLOR_NAME: Record<string, string> = {
  accent: 'Ciruela', event: 'Azul', task: 'Índigo', birthday: 'Rosa', reminder: 'Durazno',
  shopping: 'Salvia', teal: 'Menta', limon: 'Limón', routine: 'Coral', wish: 'Lila',
}
export const colorVar = (c: string) => (c === 'accent' ? 'var(--accent)' : `var(--k-${c})`)
export const colorSoft = (c: string) => (c === 'accent' ? 'var(--tint)' : `var(--k-${c}-soft)`)

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Color">
      {COLORS.map(c => (
        <button
          key={c} type="button" role="radio" aria-checked={c === value} aria-label={COLOR_NAME[c] ?? c} title={COLOR_NAME[c]}
          className={`sw ${c === value ? 'on' : ''}`} style={{ background: colorVar(c) }} onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}
