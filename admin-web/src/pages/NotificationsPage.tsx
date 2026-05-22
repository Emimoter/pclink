import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Eye, Trash2 } from 'lucide-react'
import { getDb } from '../lib/firebase'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'

interface StoredNotification {
  id: string
  title: string
  body: string
  type: string
  icon: string
  tone: string
  targetCategory: string | null
  targetProductId: string | null
  createdAt: number
  read: boolean
}

const NOTIF_TYPES = [
  { value: 'flash_sale', label: 'Flash Sale', icon: 'local_fire_department' },
  { value: 'new_arrival', label: 'Nuevo ingreso', icon: 'new_releases' },
  { value: 'promo', label: 'Promoción', icon: 'bolt' },
  { value: 'order_update', label: 'Estado de pedido', icon: 'inventory' },
  { value: 'general', label: 'General', icon: 'bolt' },
] as const

export function NotificationsPage() {
  const db = getDb()
  const [notifications, setNotifications] = useState<StoredNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('flash_sale')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ ...d.data(), id: d.id } as StoredNotification)))
      setLoading(false)
    })
  }, [db])

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    const notifType = NOTIF_TYPES.find((t) => t.value === type)!
    await addDoc(collection(db, 'notifications'), {
      title: title.trim(),
      body: body.trim(),
      type,
      icon: notifType.icon,
      tone: notifType.value === 'flash_sale' ? '#FF5252'
        : notifType.value === 'new_arrival' ? '#4CAF50'
        : notifType.value === 'promo' ? '#FF9800'
        : notifType.value === 'order_update' ? '#00BCD4'
        : '#00BCD4',
      targetCategory: null,
      targetProductId: null,
      createdAt: Date.now(),
      read: false,
    })
    setTitle('')
    setBody('')
    setType('flash_sale')
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta notificación?')) return
    await deleteDoc(doc(db, 'notifications', id))
  }

  function formatTime(ts: number): string {
    const diff = Date.now() - ts
    if (diff < 60_000) return 'Ahora'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hs`
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} días`
    return new Date(ts).toLocaleDateString()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="mt-2 max-w-2xl text-pclink-muted">
            Enviá notificaciones a los usuarios de la app. Aparecen en la campanita en tiempo real.
          </p>
        </div>
      </div>

      {/* Composer */}
      <div className="glass-panel mt-6 p-6">
        <h2 className="mb-4 text-lg font-bold">Nueva notificación</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-pclink-muted">Título</label>
            <input
              className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: 🔥 Flash Sale activa"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-pclink-muted">Mensaje</label>
            <textarea
              className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ej: Hasta -35% en Placas de Video. Solo por hoy."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-pclink-muted">Tipo</label>
            <select
              className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {NOTIF_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {preview && title && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div
                className="rounded-xl border border-pclink-border p-4"
                style={{ borderLeftColor: '#00BCD4', borderLeftWidth: 4 }}
              >
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-sm text-pclink-muted">{body}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex gap-3">
          <motion.button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 rounded-xl border border-pclink-border px-5 py-2.5 text-sm font-bold text-pclink-muted transition hover:border-pclink-cyan/40 hover:text-pclink-cyan"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="h-4 w-4" />
            Vista previa
          </motion.button>
          <motion.button
            onClick={handleSend}
            disabled={!title.trim() || !body.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2.5 text-sm font-bold text-pclink-bg shadow-[0_0_20px_rgba(0,188,212,0.25)] disabled:opacity-40"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Send className="h-4 w-4" />
            Enviar notificación
          </motion.button>
        </div>
      </div>

      {/* History */}
      <h2 className="mb-4 mt-10 text-lg font-bold">Historial</h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-pclink-elevated" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-4 py-12">
          <p className="text-pclink-muted">No hay notificaciones enviadas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="glass-panel flex items-center gap-4 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{n.title}</p>
                <p className="truncate text-sm text-pclink-muted">{n.body}</p>
                <p className="mt-1 text-xs text-pclink-muted">
                  {formatTime(n.createdAt)}
                  {!n.read && (
                    <span className="ml-2 rounded bg-pclink-cyan/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-pclink-cyan">
                      Nueva
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                className="text-pclink-muted hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
