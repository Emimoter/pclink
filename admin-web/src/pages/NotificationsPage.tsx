import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Eye,
  Trash2,
  MessageCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  QrCode,
} from 'lucide-react'
import { getDb, getFunctionsInstance } from '../lib/firebase'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

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

  // WhatsApp Store Alerts Config (GREEN-API QR Gratis o CallMeBot)
  const [waEnabled, setWaEnabled] = useState(true)
  const [waProvider, setWaProvider] = useState<'green_api' | 'callmebot'>('green_api')
  const [waPhone, setWaPhone] = useState('5492235468972')
  const [greenIdInstance, setGreenIdInstance] = useState('')
  const [greenApiToken, setGreenApiToken] = useState('')
  const [greenApiUrl, setGreenApiUrl] = useState('')
  const [waApiKey, setWaApiKey] = useState('')
  const [backupEmail, setBackupEmail] = useState('mario@pclinkcomputacion.com.ar')
  const [notifyNewOrders, setNotifyNewOrders] = useState(true)
  const [notifyCheckoutAttempts, setNotifyCheckoutAttempts] = useState(true)
  const [notifyEmailBackup, setNotifyEmailBackup] = useState(true)
  const [savingWa, setSavingWa] = useState(false)
  const [testingWa, setTestingWa] = useState(false)
  const [waStatus, setWaStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ ...d.data(), id: d.id } as StoredNotification)))
      setLoading(false)
    })
  }, [db])

  useEffect(() => {
    async function loadWaConfig() {
      try {
        const snap = await getDoc(doc(db, 'admin_settings', 'whatsapp_alerts'))
        if (snap.exists()) {
          const d = snap.data()
          setWaEnabled(d.enabled !== false)
          if (d.provider === 'callmebot' || d.provider === 'green_api') {
            setWaProvider(d.provider)
          }
          if (d.phone) setWaPhone(d.phone)
          if (d.greenIdInstance) setGreenIdInstance(d.greenIdInstance)
          if (d.greenApiToken) setGreenApiToken(d.greenApiToken)
          if (d.greenApiUrl) setGreenApiUrl(d.greenApiUrl)
          if (d.apiKey) setWaApiKey(d.apiKey)
          if (d.backupEmail) setBackupEmail(d.backupEmail)
          setNotifyNewOrders(d.notifyNewOrders !== false)
          setNotifyCheckoutAttempts(d.notifyCheckoutAttempts !== false)
          setNotifyEmailBackup(d.notifyEmailBackup !== false)
        }
      } catch (err) {
        console.error('Error loading WhatsApp alerts config:', err)
      }
    }
    loadWaConfig()
  }, [db])

  async function saveWaSettings(silent = false) {
    setSavingWa(true)
    if (!silent) setWaStatus(null)
    try {
      await setDoc(
        doc(db, 'admin_settings', 'whatsapp_alerts'),
        {
          enabled: waEnabled,
          provider: waProvider,
          phone: waPhone.trim(),
          greenIdInstance: greenIdInstance.trim(),
          greenApiToken: greenApiToken.trim(),
          greenApiUrl: greenApiUrl.trim(),
          apiKey: waApiKey.trim(),
          backupEmail: backupEmail.trim(),
          notifyNewOrders,
          notifyCheckoutAttempts,
          notifyEmailBackup,
          updatedAt: Date.now(),
        },
        { merge: true }
      )
      if (!silent) {
        setWaStatus({
          ok: true,
          msg: 'Configuración guardada correctamente.',
        })
      }
      return true
    } catch (err: any) {
      setWaStatus({ ok: false, msg: `Error al guardar: ${err.message}` })
      return false
    } finally {
      setSavingWa(false)
    }
  }

  async function handleTestWhatsApp() {
    if (waProvider === 'green_api' && (!waPhone.trim() || !greenIdInstance.trim() || !greenApiToken.trim())) {
      setWaStatus({
        ok: false,
        msg: 'Completá el WhatsApp destino, el idInstance y el apiTokenInstance de GREEN-API antes de probar.',
      })
      return
    }
    if (waProvider === 'callmebot' && (!waPhone.trim() || !waApiKey.trim())) {
      setWaStatus({
        ok: false,
        msg: 'Ingresá el número de WhatsApp y la API Key de CallMeBot antes de probar.',
      })
      return
    }

    setTestingWa(true)
    setWaStatus(null)
    try {
      const saved = await saveWaSettings(true)
      if (!saved) return
      const testFn = httpsCallable<
        Record<string, string>,
        { success: boolean; message: string }
      >(getFunctionsInstance(), 'sendTestWhatsAppAlert')
      const res = await testFn({
        provider: waProvider,
        phone: waPhone.trim(),
        apiKey: waApiKey.trim(),
        greenApiUrl: greenApiUrl.trim(),
        greenIdInstance: greenIdInstance.trim(),
        greenApiToken: greenApiToken.trim(),
      })
      setWaStatus({
        ok: res.data.success,
        msg: res.data.message,
      })
    } catch (err: any) {
      setWaStatus({
        ok: false,
        msg: err.message || 'No se pudo enviar el mensaje de prueba.',
      })
    } finally {
      setTestingWa(false)
    }
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    const notifType = NOTIF_TYPES.find((t) => t.value === type)!
    await addDoc(collection(db, 'notifications'), {
      title: title.trim(),
      body: body.trim(),
      type,
      icon: notifType.icon,
      tone:
        notifType.value === 'flash_sale'
          ? '#FF5252'
          : notifType.value === 'new_arrival'
            ? '#4CAF50'
            : notifType.value === 'promo'
              ? '#FF9800'
              : notifType.value === 'order_update'
                ? '#00BCD4'
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
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones y Alertas</h1>
        <p className="mt-2 max-w-2xl text-pclink-muted">
          Configurá los avisos instantáneos al WhatsApp del local ante nuevos pedidos o intentos de compra, y enviá alertas push a los usuarios de la app.
        </p>
      </div>

      {/* PANEL 1: ALERTAS AUTOMÁTICAS AL WHATSAPP DEL LOCAL */}
      <div className="glass-panel p-6 border border-emerald-500/25 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alertas de Pedidos y Checkout al WhatsApp del Local</h2>
              <p className="text-xs text-pclink-muted">
                Recibí al instante cada venta, pago acreditado o intento de compra abandonado con link de 1 toque para escribirle al cliente.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-white cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={waEnabled}
              onChange={(e) => setWaEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
            />
            Alertas Activas
          </label>
        </div>

        {/* Selector de Proveedor */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWaProvider('green_api')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              waProvider === 'green_api'
                ? 'bg-emerald-500 text-pclink-bg shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-pclink-elevated text-pclink-muted hover:text-white'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            GREEN-API con Código QR (Recomendado • Gratis sin espera)
          </button>
          <button
            type="button"
            onClick={() => setWaProvider('callmebot')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              waProvider === 'callmebot'
                ? 'bg-pclink-cyan text-pclink-bg'
                : 'bg-pclink-elevated text-pclink-muted hover:text-white'
            }`}
          >
            CallMeBot (Si ya tenés API Key)
          </button>
        </div>

        {waProvider === 'green_api' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-pclink-border bg-pclink-elevated/40 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
                  Cómo obtener tu instancia gratuita en 1 minuto (sin colas ni bloqueos):
                </p>
                <a
                  href="https://console.green-api.com/?lang=es"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Consola GREEN-API Gratis
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-pclink-muted leading-relaxed">
                <li>
                  Registrate gratis en <strong className="text-white">console.green-api.com</strong> y hacé clic en{' '}
                  <strong className="text-white">Crear instancia → Plan Developer ($0 Gratis)</strong>.
                </li>
                <li>
                  En la instancia creada, tocá <strong className="text-white">Obtener QR</strong> y escanealo desde el WhatsApp del local (<em>Dispositivos vinculados → Vincular un dispositivo</em>).
                </li>
                <li>
                  Copiá ahí mismo el <code className="text-white">idInstance</code> y el <code className="text-white">apiTokenInstance</code>, pegalos abajo y tocá <strong className="text-white">Guardar y Enviar WhatsApp de Prueba</strong>.
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pclink-muted">
                  idInstance (GREEN-API)
                </label>
                <input
                  type="text"
                  value={greenIdInstance}
                  onChange={(e) => setGreenIdInstance(e.target.value)}
                  placeholder="Ej: 7103948571"
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pclink-muted">
                  apiTokenInstance (GREEN-API)
                </label>
                <input
                  type="password"
                  value={greenApiToken}
                  onChange={(e) => setGreenApiToken(e.target.value)}
                  placeholder="Pegá el token de tu instancia"
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pclink-muted">
                  WhatsApp Destino (hasta 3 separados por coma)
                </label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="5492235468972"
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pclink-muted">
                  apiUrl (Opcional — se detecta solo)
                </label>
                <input
                  type="text"
                  value={greenApiUrl}
                  onChange={(e) => setGreenApiUrl(e.target.value)}
                  placeholder="Ej: https://7103.api.green-api.com"
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-pclink-cyan"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 leading-relaxed">
              <strong>Nota sobre CallMeBot:</strong> Sus bots públicos gratuitos (<code className="font-mono">+34 644 99 26 98</code> / <code className="font-mono">+34 623 78 64 49</code>) suelen llenarse y demorar horas en entregar nuevas claves. Si no te respondió, usá la pestaña <strong>GREEN-API con Código QR</strong> de al lado que activa al instante sin esperas.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pclink-muted">
                  WhatsApp del Local (con 549)
                </label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="5492235468972"
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pclink-muted">
                  API Key de CallMeBot
                </label>
                <input
                  type="text"
                  value={waApiKey}
                  onChange={(e) => setWaApiKey(e.target.value)}
                  placeholder="Ej: 4829103"
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pclink-muted">
            Email de Respaldo Instantáneo (siempre activo)
          </label>
          <input
            type="email"
            value={backupEmail}
            onChange={(e) => setBackupEmail(e.target.value)}
            placeholder="mario@pclinkcomputacion.com.ar"
            className="w-full sm:max-w-sm rounded-xl border border-pclink-border bg-pclink-elevated px-3.5 py-2.5 text-sm text-white outline-none focus:border-pclink-cyan"
          />
        </div>

        <div className="flex flex-wrap gap-5 pt-1 text-xs text-pclink-muted">
          <label className="inline-flex items-center gap-2 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={notifyNewOrders}
              onChange={(e) => setNotifyNewOrders(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
            />
            <span>🟢 Nuevos pedidos y pagos acreditados</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={notifyCheckoutAttempts}
              onChange={(e) => setNotifyCheckoutAttempts(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
            />
            <span>🟡 Intentos de checkout y carritos abandonados</span>
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={notifyEmailBackup}
              onChange={(e) => setNotifyEmailBackup(e.target.checked)}
              className="h-4 w-4 rounded accent-pclink-cyan cursor-pointer"
            />
            <span>📧 Enviar también copia por correo electrónico</span>
          </label>
        </div>

        {waStatus && (
          <div
            className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-medium border ${
              waStatus.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
          >
            {waStatus.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{waStatus.msg}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => saveWaSettings(false)}
            disabled={savingWa || testingWa}
            className="inline-flex items-center gap-2 rounded-xl border border-pclink-cyan/40 bg-pclink-cyan/15 px-5 py-2.5 text-xs font-bold text-white hover:bg-pclink-cyan/25 disabled:opacity-50 cursor-pointer"
          >
            {savingWa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-pclink-cyan" />}
            Guardar Configuración
          </button>

          <button
            type="button"
            onClick={handleTestWhatsApp}
            disabled={savingWa || testingWa}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] disabled:opacity-50 cursor-pointer"
          >
            {testingWa ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Guardar y Enviar WhatsApp de Prueba
          </button>
        </div>
      </div>

      {/* PANEL 2: COMPOSER NOTIFICACIONES IN-APP */}
      <div className="glass-panel p-6">
        <h2 className="mb-4 text-lg font-bold">Nueva notificación para usuarios de la App</h2>
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
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
      <div>
        <h2 className="mb-4 text-lg font-bold">Historial de notificaciones App</h2>
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
              <div key={n.id} className="glass-panel flex items-center gap-4 p-4">
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
                <button onClick={() => handleDelete(n.id)} className="text-pclink-muted hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
