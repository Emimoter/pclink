import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Layers,
} from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = getDb()
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = []
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() })
      })
      setOrders(list)
      setLoading(false)
    }, (error) => {
      console.error("Error loading dashboard stats:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filtrar pedidos no pagados y cancelados para estadísticas y actividad
  const completedOrders = orders.filter(o => o.status !== 'PENDING' && o.status !== 'CANCELLED')

  // Cálculos estadísticos en tiempo real
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()
  const ordersToday = completedOrders.filter(o => o.createdAt && o.createdAt >= todayMs).length

  const uniqueUsers = new Set(completedOrders.map(o => o.userId || 'anonymous')).size
  const totalOrders = completedOrders.length

  const stats = [
    {
      label: 'Ventas Totales',
      value: loading ? '...' : `$${totalSales.toLocaleString('es-AR')}`,
      hint: 'Facturación acumulada en la app',
      icon: TrendingUp,
      accent: 'from-pclink-cyan/30 to-transparent',
    },
    {
      label: 'Pedidos Hoy',
      value: loading ? '...' : ordersToday.toString(),
      hint: 'Órdenes recibidas desde medianoche',
      icon: ShoppingBag,
      accent: 'from-pclink-success/25 to-transparent',
    },
    {
      label: 'Clientes Activos',
      value: loading ? '...' : uniqueUsers.toString(),
      hint: 'Compradores únicos registrados',
      icon: Users,
      accent: 'from-pclink-warning/20 to-transparent',
    },
    {
      label: 'Total Pedidos',
      value: loading ? '...' : totalOrders.toString(),
      hint: 'Historial de compras registradas',
      icon: Layers,
      accent: 'from-pclink-cyan-light/20 to-transparent',
    },
  ]

  const formatElapsedTime = (timestamp: number) => {
    if (!timestamp) return ''
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Hace unos instantes'
    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours} h`
    return `Hace ${days} d`
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10">
        <motion.h1
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Estadísticas Generales
        </motion.h1>
        <p className="mt-2 max-w-2xl text-pclink-muted">
          Resumen operativo en tiempo real. Todos los indicadores y actividades se actualizan al instante cuando tus clientes realizan compras.
        </p>
      </header>

      {/* Tarjetas de Estadísticas */}
      <motion.div
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={item}
            transition={{ duration: 0.35 }}
            className="glass-panel group relative overflow-hidden p-6 transition hover:border-pclink-cyan/25"
            whileHover={{ y: -2 }}
          >
            <div
              className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${s.accent} blur-2xl transition group-hover:opacity-100`}
            />
            <s.icon className="relative mb-4 h-8 w-8 text-pclink-cyan" strokeWidth={1.75} />
            <p className="relative text-3xl font-black tracking-tight text-white">{s.value}</p>
            <p className="relative mt-1 text-sm font-semibold text-pclink-muted">{s.label}</p>
            <p className="relative mt-3 text-xs text-pclink-subtle">{s.hint}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Actividad Reciente / Últimos pedidos */}
      <motion.div
        className="glass-panel mt-10 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="text-lg font-bold">Actividad Reciente</h2>
        <p className="mt-2 text-sm text-pclink-muted">
          Últimas compras recibidas desde la app móvil. Haz clic en la sección "Pedidos" en el menú para ver detalles de dirección y gestionar envíos.
        </p>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-pclink-muted text-sm">
              Cargando historial de actividad...
            </div>
          ) : completedOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-pclink-border/80 bg-pclink-elevated/30 py-12 text-center text-sm text-pclink-muted">
              Sin actividad registrada todavía. Realiza compras simuladas en la app para verlas aquí.
            </div>
          ) : (
            completedOrders.slice(0, 5).map((o, idx) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="flex items-center justify-between p-4 rounded-xl border border-pclink-border/40 bg-pclink-elevated/20 hover:border-pclink-cyan/20 hover:bg-pclink-elevated/35 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pclink-cyan/10 text-pclink-cyan border border-pclink-cyan/15">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Pedido <span className="font-mono text-pclink-cyan-light">{o.number}</span>
                    </p>
                    <p className="text-xs text-pclink-muted">
                      Por <span className="text-slate-300 font-semibold">{o.userName}</span> ({o.userEmail})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white font-mono">
                    ${o.total?.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-pclink-subtle font-medium mt-0.5">
                    {formatElapsedTime(o.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
