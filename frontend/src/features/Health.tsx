import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Minus, Plus, Settings2, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import { useDocs } from '../data/selectors'
import { differenceInCalendarDays } from 'date-fns'
import { cap, fmt, fromYmd, todayYmd } from '../lib/dates'
import { LineChart } from '../ui/charts'
import { Chip, ColorPicker, Empty, PageHead, Progress, Segmented, colorVar } from '../ui/kit'
import { Sheet } from '../ui/Sheet'
import { useUI } from '../ui/uiStore'
import type { Doc, Measure, Metric } from '../data/types'

const SUGGEST: Omit<Metric, 'goal'>[] = [
  { name: 'Cintura', unit: 'cm', color: 'task', decimals: 1 },
  { name: 'Cadera', unit: 'cm', color: 'birthday', decimals: 1 },
  { name: 'Pecho', unit: 'cm', color: 'event', decimals: 1 },
  { name: 'Brazo', unit: 'cm', color: 'teal', decimals: 1 },
  { name: 'Muslo', unit: 'cm', color: 'routine', decimals: 1 },
  { name: 'Grasa corporal', unit: '%', color: 'wish', decimals: 1 },
  { name: 'Altura', unit: 'cm', color: 'shopping', decimals: 0 },
]

const RANGES = [{ value: 30, label: '30 d' }, { value: 90, label: '3 m' }, { value: 365, label: '1 año' }, { value: 0, label: 'Todo' }]
const nf = (v: number, d = 1) => v.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: d })

export function Health() {
  const metrics = useDocs<Metric>('metric')
  const measures = useDocs<Measure>('measure')
  const upsertDoc = useStore(s => s.upsertDoc)
  const removeDoc = useStore(s => s.removeDoc)
  const restoreDoc = useStore(s => s.restoreDoc)
  const toast = useUI(s => s.toast)
  const [selId, setSelId] = useState<string | null>(null)
  const [range, setRange] = useState(90)
  const [editor, setEditor] = useState<{ id: string | null; m: Metric } | null>(null)
  const [val, setVal] = useState('')
  const [date, setDate] = useState(todayYmd())

  // primer uso: crear "Peso"
  useEffect(() => {
    if (metrics.length === 0) {
      const id = upsertDoc<Metric>('metric', 'metric-peso', { name: 'Peso', unit: 'kg', color: 'accent', goal: null, decimals: 1 })
      setSelId(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = useMemo(() => [...metrics].sort((a, b) => (a.id === 'metric-peso' ? -1 : b.id === 'metric-peso' ? 1 : 0)), [metrics])
  const cur = sorted.find(m => m.id === selId) ?? sorted[0]
  const entries = useMemo(
    () => (cur ? measures.filter(m => m.data.metricId === cur.id).sort((a, b) => (a.data.date < b.data.date ? -1 : 1)) : []),
    [measures, cur],
  )
  const shown = range ? entries.filter(e => differenceInCalendarDays(new Date(), fromYmd(e.data.date)) <= range) : entries
  const last = entries[entries.length - 1]?.data.value
  const first = entries[0]?.data.value
  const prev = entries.length > 1 ? entries[entries.length - 2].data.value : null
  const goal = cur?.data.goal ?? null
  const dec = cur?.data.decimals ?? 1
  const color = cur ? colorVar(cur.data.color) : 'var(--accent)'

  const progress = goal != null && first != null && last != null && first !== goal ? Math.max(0, Math.min(1, (first - last) / (first - goal))) : null

  const add = () => {
    if (!cur) return
    const v = parseFloat(val.replace(',', '.'))
    if (!isFinite(v)) return
    // un registro por día y por medida: se reemplaza el existente
    const same = measures.find(m => m.data.metricId === cur.id && m.data.date === date)
    upsertDoc<Measure>('measure', same?.id ?? null, { metricId: cur.id, date, value: v })
    setVal('')
    toast(`${cur.data.name}: ${nf(v, dec)} ${cur.data.unit} registrado`)
  }

  const delMetric = (id: string) => {
    const mDoc = metrics.find(m => m.id === id)
    const its = measures.filter(m => m.data.metricId === id)
    if (!mDoc || !confirm(`¿Eliminar «${mDoc.data.name}» y sus ${its.length} registros?`)) return
    removeDoc(id); const rm = its.map(i => removeDoc(i.id)).filter(Boolean) as Doc[]
    setSelId(null); setEditor(null)
    toast('Medida eliminada', { actionLabel: 'Deshacer', onAction: () => { restoreDoc(mDoc); rm.forEach(restoreDoc) } })
  }

  const delta = last != null && prev != null ? last - prev : null
  const total = last != null && first != null ? last - first : null

  return (
    <div className="page">
      <PageHead title="Medidas y peso" sub="Salud"
        actions={<button type="button" className="icon-btn accent" aria-label="Nueva medida" onClick={() => setEditor({ id: null, m: { name: '', unit: '', color: 'accent', goal: null, decimals: 1 } })}><Plus size={20} /></button>} />

      <div className="chips scroll" role="tablist">
        {sorted.map(m => <Chip key={m.id} on={cur?.id === m.id} color={colorVar(m.data.color)} onClick={() => setSelId(m.id)}>{m.data.name}</Chip>)}
      </div>

      {cur && (
        <div className="today-grid">
          <div className="col">
            <div className="card hero health-hero">
              <div className="hero-l">
                <div className="hero-hi">{cur.data.name}</div>
                <div className="big-n" style={{ color }}>{last != null ? nf(last, dec) : '–'}<small> {cur.data.unit}</small></div>
                <div className="deltas">
                  {delta != null && <span className={delta === 0 ? '' : delta < 0 ? 'down' : 'up'}>{delta === 0 ? <Minus size={14} /> : delta < 0 ? <ArrowDown size={14} /> : <ArrowUp size={14} />}{nf(Math.abs(delta), dec)} {cur.data.unit} vs. anterior</span>}
                  {total != null && entries.length > 1 && <span>{total > 0 ? '+' : ''}{nf(total, dec)} {cur.data.unit} desde el inicio</span>}
                </div>
              </div>
              <button type="button" className="icon-btn" aria-label="Editar medida" onClick={() => setEditor({ id: cur.id, m: cur.data })}><Settings2 size={19} /></button>
            </div>

            {goal != null && last != null && (
              <div className="card pad">
                <div className="goal-row"><b>Meta: {nf(goal, dec)} {cur.data.unit}</b><span>{Math.abs(last - goal) < 0.05 ? '¡Meta alcanzada!' : `${last > goal ? 'Faltan' : 'Pasaste por'} ${nf(Math.abs(last - goal), dec)} ${cur.data.unit}`}</span></div>
                {progress != null && <Progress value={progress} color={color} />}
              </div>
            )}

            <div className="card pad">
              <div className="field-l" style={{ marginTop: 0 }}>Registrar</div>
              <div className="register">
                <input type="text" inputMode="decimal" autoComplete="off" placeholder={`Valor en ${cur.data.unit}`} aria-label="Valor" value={val}
                  onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
                <input type="date" aria-label="Fecha" value={date} max={todayYmd()} onChange={e => setDate(e.target.value)} />
                <button type="button" className="btn primary" onClick={add} disabled={!val}>Guardar</button>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card pad">
              <div className="chart-h"><b>Evolución</b><Segmented small value={range} onChange={setRange} options={RANGES} label="Rango" /></div>
              <LineChart points={shown.map(e => ({ x: fromYmd(e.data.date).getTime(), y: e.data.value, label: fmt(e.data.date, 'd MMM') }))}
                color={color} goal={goal} unit={cur.data.unit} decimals={dec}
                xLabels={shown.length > 1 ? [fmt(shown[0].data.date, 'd MMM'), fmt(shown[shown.length - 1].data.date, 'd MMM')] : undefined} />
            </div>

            <div className="section-h"><h2>Historial</h2></div>
            {entries.length === 0 ? <Empty icon={<Plus size={22} />} title="Sin registros" text="Anotá tu primer valor arriba." /> : (
              <div className="card list">
                {[...entries].reverse().slice(0, 30).map(e => (
                  <div key={e.id} className="plain-row">
                    <span className="grow"><b>{nf(e.data.value, dec)} {cur.data.unit}</b><small>{cap(fmt(e.data.date, "EEEE d 'de' MMMM yyyy"))}</small></span>
                    <button type="button" className="icon-btn" aria-label="Eliminar registro" onClick={() => { const r = removeDoc(e.id); if (r) toast('Registro eliminado', { actionLabel: 'Deshacer', onAction: () => restoreDoc(r) }) }}><Trash2 size={17} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet open={!!editor} title={editor?.id ? 'Editar medida' : 'Nueva medida'} onClose={() => setEditor(null)}
        footer={editor && (
          <div className="sheet-actions">
            {editor.id && editor.id !== 'metric-peso' && <button type="button" className="btn danger" onClick={() => delMetric(editor.id!)}><Trash2 size={16} />Eliminar</button>}
            <button type="button" className="btn primary" disabled={!editor.m.name.trim()} onClick={() => {
              const id = upsertDoc<Metric>('metric', editor.id, { ...editor.m, name: editor.m.name.trim(), unit: editor.m.unit.trim() })
              setSelId(id); setEditor(null)
            }}>Guardar</button>
          </div>
        )}>
        {editor && (
          <>
            {!editor.id && (
              <>
                <div className="field-l" style={{ marginTop: 0 }}>Sugeridas</div>
                <div className="chips">{SUGGEST.filter(s => !metrics.some(m => m.data.name === s.name)).map(s => <Chip key={s.name} onClick={() => setEditor({ ...editor, m: { ...s, goal: null } })}>{s.name}</Chip>)}</div>
              </>
            )}
            <input className="big-input" placeholder="Nombre (ej: Cintura)" aria-label="Nombre" value={editor.m.name} onChange={e => setEditor({ ...editor, m: { ...editor.m, name: e.target.value } })} />
            <div className="group">
              <div className="row"><label htmlFor="m-unit">Unidad</label><input id="m-unit" type="text" placeholder="kg, cm, %…" value={editor.m.unit} onChange={e => setEditor({ ...editor, m: { ...editor.m, unit: e.target.value } })} /></div>
              <div className="row"><label htmlFor="m-goal">Meta</label><input id="m-goal" type="number" inputMode="decimal" step="0.1" placeholder="Opcional" value={editor.m.goal ?? ''} onChange={e => setEditor({ ...editor, m: { ...editor.m, goal: e.target.value === '' ? null : parseFloat(e.target.value) } })} /></div>
            </div>
            <div className="field-l">Color</div>
            <ColorPicker value={editor.m.color} onChange={c => setEditor({ ...editor, m: { ...editor.m, color: c } })} />
          </>
        )}
      </Sheet>
    </div>
  )
}
