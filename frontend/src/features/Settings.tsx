import { useRef, useState } from 'react'
import { Bell, Download, MapPin, RefreshCw, Search, Upload } from 'lucide-react'
import { useStore } from '../data/store'
import { askNotif, notifPermission, notifSupported } from '../lib/notify'
import { PageHead, Section, Segmented, Switch } from '../ui/kit'
import { useUI } from '../ui/uiStore'
import { todayYmd } from '../lib/dates'

interface Geo { name: string; admin1?: string; country?: string; latitude: number; longitude: number }

export function Settings() {
  const s = useStore(st => st.settings)
  const set = useStore(st => st.setSettings)
  const sync = useStore(st => st.sync)
  const syncing = useStore(st => st.syncing)
  const lastSync = useStore(st => st.lastSync)
  const online = useStore(st => st.online)
  const pending = useStore(st => Object.keys(st.outbox).length)
  const toast = useUI(u => u.toast)
  const [perm, setPerm] = useState(notifPermission())
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Geo[]>([])
  const file = useRef<HTMLInputElement>(null)

  const search = async () => {
    if (!q.trim()) return
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=es`)
      setRes((await r.json()).results ?? [])
    } catch { toast('No se pudo buscar la ciudad') }
  }

  const exportAll = () => {
    const { items, lists, docs } = useStore.getState()
    const blob = new Blob([JSON.stringify({ app: 'tempo', version: 2, exportedAt: new Date().toISOString(), items, lists, docs }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `tempo-respaldo-${todayYmd()}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Copia de seguridad descargada')
  }

  const importAll = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!data || (!Array.isArray(data.items) && !Array.isArray(data.docs))) throw new Error('formato')
      if (!confirm(`Se van a combinar ${data.items?.length ?? 0} ítems y ${data.docs?.length ?? 0} registros con tus datos actuales. ¿Continuar?`)) return
      useStore.getState().importAll({ items: data.items, lists: data.lists, docs: data.docs })
      toast('Copia restaurada')
    } catch { toast('El archivo no es una copia válida de Tempo') }
  }

  return (
    <div className="page narrow">
      <PageHead title="Ajustes" />

      <Section title="Apariencia">
        <div className="card pad stack-s">
          <div className="field-l" style={{ marginTop: 0 }}>Tema</div>
          <Segmented value={s.theme} onChange={v => set({ theme: v })} label="Tema"
            options={[{ value: 'auto', label: 'Automático' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]} />
          <p className="hint">Automático: claro de 07:00 a 19:30 y oscuro el resto del día.</p>
          <div className="field-l">La semana empieza en</div>
          <Segmented value={s.weekStart} onChange={v => set({ weekStart: v })} label="Inicio de semana" options={[{ value: 1, label: 'Lunes' }, { value: 0, label: 'Domingo' }]} />
          <div className="row between"><label>Mostrar elementos de trabajo</label><Switch checked={s.showWork} onChange={v => set({ showWork: v })} label="Mostrar trabajo" /></div>
        </div>
      </Section>

      <Section title="Ubicación y clima">
        <div className="card pad stack-s">
          <div className="row between"><span><MapPin size={15} /> {s.city.name}</span></div>
          <div className="inline-add">
            <input autoComplete="off" placeholder="Buscar otra ciudad…" aria-label="Buscar ciudad" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') search() }} />
            <button type="button" className="icon-btn accent" aria-label="Buscar" onClick={search}><Search size={19} /></button>
          </div>
          {res.map(r => (
            <button key={`${r.latitude},${r.longitude}`} type="button" className="plain-row" onClick={() => { set({ city: { name: r.name, lat: r.latitude, lon: r.longitude } }); setRes([]); setQ(''); toast(`Ciudad: ${r.name}`) }}>
              <span className="grow"><b>{r.name}</b><small>{[r.admin1, r.country].filter(Boolean).join(', ')}</small></span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Avisos">
        <div className="card pad stack-s">
          <div className="row between">
            <span><Bell size={15} /> Notificaciones de alarma</span>
            <button type="button" className="btn" disabled={!notifSupported() || perm === 'granted'} onClick={async () => setPerm(await askNotif())}>
              {perm === 'granted' ? 'Activadas' : perm === 'denied' ? 'Bloqueadas' : 'Activar'}
            </button>
          </div>
          <p className="hint">Las alarmas suenan mientras Tempo está abierto o instalado como app. En iPhone hay que agregarla a la pantalla de inicio.</p>
        </div>
      </Section>

      <Section title="Enfoque (minutos)">
        <div className="card pad">
          <div className="three">
            {(['work', 'short', 'long'] as const).map(k => (
              <label key={k} className="mini-field"><span>{k === 'work' ? 'Enfoque' : k === 'short' ? 'Descanso' : 'Descanso largo'}</span>
                <input autoComplete="off" type="number" min={1} max={120} value={s.focus[k]} onChange={e => set({ focus: { ...s.focus, [k]: Math.max(1, Number(e.target.value) || 1) } })} /></label>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Datos">
        <div className="card pad stack-s">
          <div className="row between">
            <span>{online ? (pending ? `Sincronizando ${pending} cambios…` : 'Sincronizado con el servidor') : `Sin conexión · ${pending} cambios pendientes`}
              {lastSync && online && <small className="hint"> · {new Date(lastSync).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>}</span>
            <button type="button" className="btn" onClick={() => sync()} disabled={syncing}><RefreshCw size={15} className={syncing ? 'spin' : ''} />Sincronizar</button>
          </div>
          <div className="row gap">
            <button type="button" className="btn" onClick={exportAll}><Download size={15} />Exportar copia</button>
            <button type="button" className="btn" onClick={() => file.current?.click()}><Upload size={15} />Importar copia</button>
            <input ref={file} type="file" accept="application/json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importAll(f); e.target.value = '' }} />
          </div>
        </div>
      </Section>
      <p className="hint center">Tempo · atajos: <kbd>Ctrl</kbd>+<kbd>K</kbd> buscar · <kbd>N</kbd> nuevo · <kbd>G</kbd> luego <kbd>H</kbd>/<kbd>C</kbd>/<kbd>L</kbd> navegar</p>
    </div>
  )
}
