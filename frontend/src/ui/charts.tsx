import { useEffect, useId, useRef, useState } from 'react'

export interface Pt { x: number; y: number; label?: string }

/** Gráfico de líneas liviano en SVG (con área, meta opcional y puntos). */
export function LineChart({
  points, color = 'var(--accent)', goal, height = 180, unit = '', decimals = 1, xLabels,
}: {
  points: Pt[]
  color?: string
  goal?: number | null
  height?: number
  unit?: string
  decimals?: number
  xLabels?: [string, string]
}) {
  const gid = useId()
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(600)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = height, P = { l: 8, r: 8, t: 14, b: 22 }
  if (points.length === 0) return <div ref={box} className="chart-empty">Sin datos todavía</div>
  const ys = points.map(p => p.y).concat(goal != null ? [goal] : [])
  let min = Math.min(...ys), max = Math.max(...ys)
  if (min === max) { min -= 1; max += 1 }
  const pad = (max - min) * 0.15
  min -= pad; max += pad
  const xs = points.map(p => p.x)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const sx = (x: number) => P.l + (x1 === x0 ? (W - P.l - P.r) / 2 : ((x - x0) / (x1 - x0)) * (W - P.l - P.r))
  const sy = (y: number) => P.t + (1 - (y - min) / (max - min)) * (H - P.t - P.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')
  const area = `${line} L${sx(points[points.length - 1].x).toFixed(1)},${H - P.b} L${sx(points[0].x).toFixed(1)},${H - P.b} Z`
  const last = points[points.length - 1]
  return (
    <div ref={box} className="chart-box">
    <svg className="chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Gráfico, último valor ${last.y.toFixed(decimals)} ${unit}`}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {goal != null && (
        <g>
          <line x1={P.l} x2={W - P.r} y1={sy(goal)} y2={sy(goal)} stroke={color} strokeOpacity=".55" strokeDasharray="5 5" />
          <text x={W - P.r} y={sy(goal) - 5} textAnchor="end" className="chart-t">meta {goal}{unit}</text>
        </g>
      )}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.length <= 40 && points.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={i === points.length - 1 ? 5 : 3} fill="var(--card)" stroke={color} strokeWidth="2">
          <title>{`${p.label ?? ''} ${p.y.toFixed(decimals)} ${unit}`}</title>
        </circle>
      ))}
      {xLabels && (
        <g className="chart-t">
          <text x={P.l} y={H - 4}>{xLabels[0]}</text>
          <text x={W - P.r} y={H - 4} textAnchor="end">{xLabels[1]}</text>
        </g>
      )}
    </svg>
    </div>
  )
}

/** Barras verticales simples. */
export function BarChart({
  data, color = 'var(--accent)', height = 120, max,
}: { data: { label: string; value: number; hi?: boolean }[]; color?: string; height?: number; max?: number }) {
  const m = max ?? Math.max(1, ...data.map(d => d.value))
  return (
    <div className="bars" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar-track">
            <div className="bar" title={`${d.label}: ${d.value}`}
              style={{ height: `${Math.max(d.value ? 6 : 0, (d.value / m) * 100)}%`, background: d.hi ? color : 'var(--bg3d)' }} />
          </div>
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Mapa de calor tipo "contribuciones" (semanas en columnas). */
export function Heatmap({ days, color = 'var(--accent)' }: { days: { ds: string; v: number; scheduled: boolean }[]; color?: string }) {
  return (
    <div className="heat" role="img" aria-label="Historial de cumplimiento">
      {days.map(d => (
        <i key={d.ds} title={d.ds}
          style={{ background: d.v ? color : d.scheduled ? 'var(--bg3d)' : 'var(--bg3)', opacity: d.v ? 1 : d.scheduled ? 0.9 : 0.5 }} />
      ))}
    </div>
  )
}
