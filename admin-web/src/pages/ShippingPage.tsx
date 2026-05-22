import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Truck, Zap, Store, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { getDb } from '../lib/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

interface ShippingConfig {
  standard: number
  express: number
  pickup: number
  freeThreshold: number
}

const DEFAULT_CONFIG: ShippingConfig = {
  standard: 4500,
  express: 8500,
  pickup: 0,
  freeThreshold: 80000,
}

export function ShippingPage() {
  const db = getDb()
  const [config, setConfig] = useState<ShippingConfig>(DEFAULT_CONFIG)
  const [draft, setDraft] = useState<ShippingConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load shipping config from Firestore in real time
  useEffect(() => {
    const ref = doc(db, 'settings', 'shipping')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ShippingConfig
        setConfig(data)
        setDraft(data)
      } else {
        // Seed defaults on first open
        setDoc(ref, DEFAULT_CONFIG).catch(console.error)
      }
      setLoading(false)
    }, (err) => {
      console.error('Error loading shipping config:', err)
      setLoading(false)
    })
    return unsub
  }, [db])

  const hasChanges =
    draft.standard !== config.standard ||
    draft.express !== config.express ||
    draft.pickup !== config.pickup ||
    draft.freeThreshold !== config.freeThreshold

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await setDoc(doc(db, 'settings', 'shipping'), draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError('No se pudo guardar. Verificá tu conexión.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setDraft(config)

  const formatARS = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v)

  const inputClass =
    'w-full rounded-xl border border-pclink-border bg-pclink-bg/60 py-3 pl-4 pr-12 text-sm font-bold text-white placeholder-pclink-muted focus:border-pclink-cyan focus:ring-1 focus:ring-pclink-cyan transition-all outline-none'

  const methods = [
    {
      key: 'standard' as const,
      icon: Truck,
      label: 'Envío Estándar',
      desc: 'Entrega domiciliaria estándar (3–5 días hábiles)',
      accent: 'text-pclink-cyan',
      border: 'border-pclink-cyan/20',
      bg: 'bg-pclink-cyan/5',
    },
    {
      key: 'express' as const,
      icon: Zap,
      label: 'Envío Express',
      desc: 'Entrega el mismo día o siguiente día hábil',
      accent: 'text-amber-400',
      border: 'border-amber-400/20',
      bg: 'bg-amber-400/5',
    },
    {
      key: 'pickup' as const,
      icon: Store,
      label: 'Retiro en sucursal',
      desc: 'El cliente retira en el local de PClink',
      accent: 'text-emerald-400',
      border: 'border-emerald-400/20',
      bg: 'bg-emerald-400/5',
    },
  ]

  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Configuración de Envíos
        </h1>
        <p className="mt-2 text-pclink-muted max-w-2xl">
          Definí los precios de cada método de envío. Los cambios se reflejan automáticamente en la app móvil al momento del checkout.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pclink-border border-t-pclink-cyan" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Shipping method cards */}
          {methods.map(({ key, icon: Icon, label, desc, accent, border, bg }) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-panel border ${border} ${bg} p-6`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl border ${border} bg-pclink-elevated/60 p-3 ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">{label}</h3>
                  <p className="mt-0.5 text-xs text-pclink-muted">{desc}</p>

                  <div className="mt-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pclink-muted text-xs font-bold">
                      ARS $
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: Math.max(0, Number(e.target.value)) })}
                      className={inputClass}
                      style={{ paddingLeft: '3.2rem' }}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-pclink-muted text-xs">
                      ARS
                    </div>
                  </div>

                  {key === 'pickup' && (
                    <p className="mt-2 text-[11px] text-emerald-400/70">
                      💡 Dejá en 0 para que sea gratis
                    </p>
                  )}

                  <p className="mt-1.5 text-[11px] text-pclink-subtle">
                    Precio actual guardado: <span className={`font-bold ${accent}`}>{formatARS(config[key])}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Free shipping threshold */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel border border-violet-500/20 bg-violet-500/5 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-violet-500/20 bg-pclink-elevated/60 p-3 text-violet-400">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Monto mínimo para envío gratis</h3>
                <p className="mt-0.5 text-xs text-pclink-muted">
                  Si el subtotal supera este monto, el envío estándar se aplica automáticamente sin costo
                </p>

                <div className="mt-4 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pclink-muted text-xs font-bold">
                    ARS $
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={draft.freeThreshold}
                    onChange={(e) => setDraft({ ...draft, freeThreshold: Math.max(0, Number(e.target.value)) })}
                    className={inputClass}
                    style={{ paddingLeft: '3.2rem' }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-pclink-muted text-xs">
                    ARS
                  </div>
                </div>

                <p className="mt-1.5 text-[11px] text-pclink-subtle">
                  Umbral actual: <span className="font-bold text-violet-400">{formatARS(config.freeThreshold)}</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-pclink-border text-sm text-pclink-muted hover:text-white hover:border-pclink-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-4 w-4" />
              Descartar cambios
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pclink-cyan hover:bg-pclink-cyan-light text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Guardando…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar precios de envío
                </>
              )}
            </button>
          </div>

          {/* Feedback */}
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"
            >
              <CheckCircle className="h-4 w-4 shrink-0" />
              Precios guardados en Firestore. La app los usará en el próximo checkout.
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
