import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { api } from './api'
import { DEFAULT_SETTINGS } from './types'
import type { Doc, DocType, Item, Settings, ShopList } from './types'

type OutOp = 'put' | 'del'
type Outbox = Record<string, OutOp> // "i:ID" | "l:ID" | "d:ID"

interface Snapshot {
  items: Item[]
  lists: ShopList[]
  docs: Doc[]
  settings: Settings
  outbox: Outbox
  hydrated: boolean
}

// Ids de los datos de demostración que el backend siembra cuando su base está vacía
const SEED_IDS = new Set([
  'e1', 'e2', 'e3', 'e4', 'r1', 'r2', 't1', 't2', 't3', 'b1', 'b2', 'b3', 'b4',
  'w1', 'w2', 'w3', 'w4', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'sl-super', 'sl-ferro',
])

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`)

interface Store extends Snapshot {
  ready: boolean
  syncing: boolean
  online: boolean
  lastSync: number | null

  boot: () => Promise<void>
  sync: () => Promise<void>

  upsertItem: (it: Item) => void
  patchItem: (id: string, patch: Partial<Item>) => void
  removeItem: (id: string) => Item | undefined
  toggleItem: (id: string, ds?: string) => void
  reorderDay: (ids: string[]) => void

  upsertList: (l: ShopList) => void
  removeList: (id: string) => void

  upsertDoc: <T>(type: DocType, id: string | null, data: T) => string
  removeDoc: (id: string) => Doc | undefined
  restoreDoc: (d: Doc<unknown>) => void

  setSettings: (p: Partial<Settings>) => void
  importAll: (data: { items?: Item[]; lists?: ShopList[]; docs?: Doc[] }) => void
}

const KEY = 'tempo.v2'
let saveTimer: ReturnType<typeof setTimeout> | undefined

function persist(s: Store) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const snap: Snapshot = {
      items: s.items, lists: s.lists, docs: s.docs, settings: s.settings, outbox: s.outbox, hydrated: s.hydrated,
    }
    idbSet(KEY, snap).catch(() => {})
  }, 250)
}

export const useStore = create<Store>((set, getState) => {
  const commit = (fn: (s: Store) => Partial<Store>) => {
    set(fn)
    persist(getState())
    void flush()
  }
  const mark = (s: Store, key: string, op: OutOp): Outbox => ({ ...s.outbox, [key]: op })

  let flushing = false
  async function flush() {
    if (flushing || !navigator.onLine) return
    flushing = true
    try {
      for (const [key, op] of Object.entries(getState().outbox)) {
        const id = key.slice(2)
        const s = getState()
        try {
          if (key[0] === 'i') {
            if (op === 'del') await api.delItem(id)
            else { const it = s.items.find(x => x.id === id); if (it) await api.putItem(it) }
          } else if (key[0] === 'l') {
            if (op === 'del') await api.delList(id)
            else { const l = s.lists.find(x => x.id === id); if (l) await api.putList(l) }
          } else {
            if (op === 'del') await api.delDoc(id)
            else { const d = s.docs.find(x => x.id === id); if (d) await api.putDoc(d) }
          }
          // Solo se limpia si no cambió mientras se enviaba
          set(st => {
            if (st.outbox[key] !== op) return {}
            const next = { ...st.outbox }; delete next[key]
            return { outbox: next, online: true }
          })
        } catch (e) {
          // 404 al borrar = ya no existe: se da por enviado
          if (op === 'del' && String(e).includes('404')) {
            set(st => { const next = { ...st.outbox }; delete next[key]; return { outbox: next } })
            continue
          }
          set({ online: false })
          break
        }
      }
    } finally {
      flushing = false
      persist(getState())
    }
  }

  return {
    items: [], lists: [], docs: [], settings: DEFAULT_SETTINGS, outbox: {}, hydrated: false,
    ready: false, syncing: false, online: true, lastSync: null,

    async boot() {
      try {
        const snap = (await idbGet(KEY)) as Snapshot | undefined
        if (snap) {
          set({
            items: snap.items ?? [], lists: snap.lists ?? [], docs: snap.docs ?? [],
            settings: { ...DEFAULT_SETTINGS, ...(snap.settings ?? {}) },
            outbox: snap.outbox ?? {}, hydrated: !!snap.hydrated,
          })
        }
      } catch { /* sin almacenamiento local */ }
      set({ ready: true })
      void getState().sync()
      window.addEventListener('online', () => void getState().sync())
    },

    async sync() {
      if (getState().syncing || !navigator.onLine) return
      set({ syncing: true })
      try {
        await flush()
        if (Object.keys(getState().outbox).length) { set({ syncing: false }); return }
        const [remote, remoteDocs] = await Promise.all([api.state(), api.docs()])
        set(s => {
          const first = !s.hydrated
          const outbox = { ...s.outbox }
          const mergeById = <T extends { id: string }>(local: T[], server: T[], prefix: string, skipSeed: boolean) => {
            const map = new Map(local.map(x => [x.id, x]))
            const serverIds = new Set(server.map(x => x.id))
            for (const r of server) {
              if (map.has(r.id)) { map.set(r.id, r); continue }
              if (skipSeed && !first && SEED_IDS.has(r.id)) continue // el usuario ya los borró
              map.set(r.id, r)
            }
            // Lo que existe solo localmente se vuelve a subir (el servidor pudo perder datos)
            for (const l of local) if (!serverIds.has(l.id)) outbox[`${prefix}:${l.id}`] = 'put'
            return [...map.values()]
          }
          return {
            items: mergeById(s.items, remote.items, 'i', true),
            lists: mergeById(s.lists, remote.lists, 'l', true),
            docs: mergeById(s.docs, remoteDocs, 'd', false),
            outbox, hydrated: true, online: true, lastSync: Date.now(),
          }
        })
        persist(getState())
        await flush()
      } catch {
        set({ online: false })
      } finally {
        set({ syncing: false })
      }
    },

    upsertItem(it) {
      commit(s => {
        const exists = s.items.some(x => x.id === it.id)
        const next = { ...it, createdAt: it.createdAt ?? Date.now() }
        return {
          items: exists ? s.items.map(x => (x.id === it.id ? next : x)) : [...s.items, next],
          outbox: mark(s, `i:${it.id}`, 'put'),
        }
      })
    },

    patchItem(id, patch) {
      commit(s => ({
        items: s.items.map(x => (x.id === id ? { ...x, ...patch } : x)),
        outbox: mark(s, `i:${id}`, 'put'),
      }))
    },

    removeItem(id) {
      const found = getState().items.find(x => x.id === id)
      if (!found) return undefined
      commit(s => ({ items: s.items.filter(x => x.id !== id), outbox: mark(s, `i:${id}`, 'del') }))
      return found
    },

    toggleItem(id, ds) {
      const it = getState().items.find(x => x.id === id)
      if (!it) return
      const recurring = !!it.repeat && it.kind !== 'birthday'
      if (recurring && ds) {
        const set0 = new Set(it.doneDates ?? [])
        if (set0.has(ds)) set0.delete(ds); else set0.add(ds)
        getState().patchItem(id, { doneDates: [...set0].sort() })
      } else {
        const done = !it.done
        getState().patchItem(id, { done, doneAt: done ? Date.now() : null })
      }
    },

    reorderDay(ids) {
      commit(s => {
        const outbox = { ...s.outbox }
        const items = s.items.map(x => {
          const i = ids.indexOf(x.id)
          if (i === -1) return x
          outbox[`i:${x.id}`] = 'put'
          return { ...x, orderIndex: i + 1 }
        })
        return { items, outbox }
      })
    },

    upsertList(l) {
      commit(s => ({
        lists: s.lists.some(x => x.id === l.id) ? s.lists.map(x => (x.id === l.id ? l : x)) : [...s.lists, l],
        outbox: mark(s, `l:${l.id}`, 'put'),
      }))
    },

    removeList(id) {
      commit(s => {
        const outbox = mark(s, `l:${id}`, 'del')
        for (const it of s.items) if (it.listId === id) delete outbox[`i:${it.id}`]
        return { lists: s.lists.filter(x => x.id !== id), items: s.items.filter(x => x.listId !== id), outbox }
      })
    },

    upsertDoc(type, id, data) {
      const docId = id ?? uid()
      commit(s => {
        const doc: Doc = { id: docId, type, data: data as Record<string, unknown>, updatedAt: Date.now() }
        return {
          docs: s.docs.some(x => x.id === docId) ? s.docs.map(x => (x.id === docId ? doc : x)) : [...s.docs, doc],
          outbox: mark(s, `d:${docId}`, 'put'),
        }
      })
      return docId
    },

    removeDoc(id) {
      const found = getState().docs.find(x => x.id === id)
      if (!found) return undefined
      commit(s => ({ docs: s.docs.filter(x => x.id !== id), outbox: mark(s, `d:${id}`, 'del') }))
      return found
    },

    restoreDoc(d) {
      commit(s => ({ docs: [...s.docs.filter(x => x.id !== d.id), d as Doc], outbox: mark(s, `d:${d.id}`, 'put') }))
    },

    setSettings(p) {
      commit(s => ({ settings: { ...s.settings, ...p } }))
    },

    importAll(data) {
      commit(s => {
        const outbox = { ...s.outbox }
        const merge = <T extends { id: string }>(cur: T[], inc: T[] | undefined, p: string) => {
          if (!inc) return cur
          const map = new Map(cur.map(x => [x.id, x]))
          for (const x of inc) { map.set(x.id, x); outbox[`${p}:${x.id}`] = 'put' }
          return [...map.values()]
        }
        return {
          lists: merge(s.lists, data.lists, 'l'),
          items: merge(s.items, data.items, 'i'),
          docs: merge(s.docs, data.docs, 'd'),
          outbox,
        }
      })
    },
  }
})

export const byId = (id: string) => useStore.getState().items.find(i => i.id === id)
