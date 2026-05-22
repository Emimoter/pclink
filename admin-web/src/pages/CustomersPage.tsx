import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDb } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore'
import { 
  Crown, 
  Sparkles, 
  Search, 
  Gift, 
  Trophy, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  ShoppingBag 
} from 'lucide-react'

interface Order {
  id: string
  userEmail: string
  userName: string
  total: number
  createdAt: number
}

interface CustomerStats {
  name: string
  email: string
  ordersCount: number
  totalSpent: number
  lastOrderDate: number
  tier: 'oro' | 'plata' | 'bronce'
}

const tierColor = {
  oro: 'text-amber-200 bg-amber-500/10 ring-amber-400/40 border-amber-500/20',
  plata: 'text-slate-200 bg-slate-500/10 ring-slate-400/35 border-slate-500/20',
  bronce: 'text-orange-200 bg-orange-500/10 ring-orange-400/30 border-orange-500/20',
}

const tierGradient = {
  oro: 'from-amber-500/20 to-yellow-600/5 border-amber-500/30',
  plata: 'from-slate-500/20 to-slate-600/5 border-slate-500/30',
  bronce: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const secs = Math.floor(diff / 1000)
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (secs < 60) return 'Hace instantes'
  if (mins < 60) return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours} hs`
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  
  const date = new Date(timestamp)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function CustomersPage() {
  const db = getDb()
  const [customers, setCustomers] = useState<CustomerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'oro' | 'plata' | 'bronce'>('todos')
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  
  // Modal for sending benefits
  const [activeModalCust, setActiveModalCust] = useState<CustomerStats | null>(null)
  const [benefitPercent, setBenefitPercent] = useState<number>(10)
  const [sendingBenefit, setSendingBenefit] = useState(false)
  const [benefitSentSuccess, setBenefitSentSuccess] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      } as Order))
      
      // Group orders by User Email
      const grouped = ordersList.reduce<Record<string, { name: string; total: number; count: number; last: number }>>((acc, order) => {
        const email = order.userEmail || 'anonimo@pclink.com'
        if (!acc[email]) {
          acc[email] = {
            name: order.userName || email.split('@')[0],
            total: 0,
            count: 0,
            last: 0
          }
        }
        acc[email].total += order.total || 0
        acc[email].count += 1
        acc[email].last = Math.max(acc[email].last, order.createdAt || 0)
        return acc
      }, {})

      // Map grouped dictionary to array and categorize by Tiers
      const statsList: CustomerStats[] = Object.entries(grouped).map(([email, info]) => {
        // Tiers Segmentation Rules:
        // - Gold (Oro): >= 10 orders OR total spent >= $500,000 ARS
        // - Silver (Plata): >= 5 orders OR total spent >= $250,000 ARS
        // - Bronze (Bronce): < 5 orders
        let tier: 'oro' | 'plata' | 'bronce' = 'bronce'
        if (info.count >= 10 || info.total >= 500000) {
          tier = 'oro'
        } else if (info.count >= 5 || info.total >= 250000) {
          tier = 'plata'
        }

        return {
          email,
          name: info.name,
          ordersCount: info.count,
          totalSpent: info.total,
          lastOrderDate: info.last,
          tier
        }
      })

      // Sort by order count descending
      setCustomers(statsList.sort((a, b) => b.ordersCount - a.ordersCount))
      setLoading(false)
    })
  }, [db])

  // Copy email to clipboard
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  // Send a custom coupon to Firestore (which fires notifications in the Client app in real-time!)
  const handleSendBenefit = async () => {
    if (!activeModalCust) return
    setSendingBenefit(true)
    
    try {
      const couponCode = `PCLINK-${activeModalCust.tier.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
      
      // Write benefit notification directly in Firestore
      await addDoc(collection(db, 'notifications'), {
        title: `🎁 ¡Beneficio Exclusivo para ${activeModalCust.name}!`,
        body: `Por tu gran fidelidad en PClink, te regalamos un cupón del ${benefitPercent}% de descuento: ${couponCode}. ¡Ingresalo en tu carrito!`,
        type: 'promo',
        icon: 'bolt',
        tone: '#FF9800',
        targetCategory: null,
        targetProductId: null,
        createdAt: Date.now(),
        read: false
      })

      setBenefitSentSuccess(true)
      setTimeout(() => {
        setBenefitSentSuccess(false)
        setActiveModalCust(null)
      }, 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSendingBenefit(false)
    }
  }

  // Filtered list based on Search and Tabs
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesFilter = selectedFilter === 'todos' || c.tier === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  // Counters
  const countTotal = customers.length
  const countGold = customers.filter(c => c.tier === 'oro').length
  const countSilver = customers.filter(c => c.tier === 'plata').length
  const countBronze = customers.filter(c => c.tier === 'bronce').length

  return (
    <div className="mx-auto max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Clientes recurrentes
          </h1>
          <p className="mt-2 max-w-2xl text-pclink-muted">
            Monitoreá a tus compradores más fieles en tiempo real. Segmentalos de forma inteligente y enviales cupones exclusivos directamente a su dispositivo.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-pclink-cyan/25 bg-pclink-cyan/5 px-4 py-2 text-sm text-pclink-cyan-light">
          <Crown className="h-4 w-4 text-pclink-cyan animate-pulse" />
          Base conectada en vivo con Firestore
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-pclink-muted">Clientes Totales</p>
              <h3 className="mt-2 text-3xl font-black tabular-nums">{countTotal}</h3>
            </div>
            <div className="rounded-xl bg-pclink-cyan/10 p-3 border border-pclink-cyan/10">
              <Users className="h-5 w-5 text-pclink-cyan" />
            </div>
          </div>
          <div className="mt-4 text-xs text-pclink-muted flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-pclink-cyan" />
            Registrados con compras completadas
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-panel p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-pclink-muted">Segmento Oro</p>
              <h3 className="mt-2 text-3xl font-black text-amber-300 tabular-nums">{countGold}</h3>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-pclink-muted flex items-center gap-1.5">
            <Crown className="h-3 w-3 text-amber-400" />
            Más de 10 compras o $500k gastados
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-pclink-muted">Ventas Acumuladas (Fieles)</p>
              <h3 className="mt-2 text-3xl font-black text-emerald-400 tabular-nums">
                $ {customers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString('es-AR')}
              </h3>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 text-xs text-pclink-muted flex items-center gap-1.5">
            <ShoppingBag className="h-3 w-3 text-emerald-400" />
            Valor de ciclo de vida (LTV) global
          </div>
        </motion.div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-pclink-muted focus:border-pclink-cyan focus:outline-none focus:ring-1 focus:ring-pclink-cyan transition-all"
          />
        </div>

        {/* Tier Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('todos')}
            className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all flex items-center gap-1.5 ${
              selectedFilter === 'todos' 
                ? 'bg-pclink-cyan/20 border-pclink-cyan text-white' 
                : 'bg-pclink-surface border-pclink-border text-pclink-muted hover:text-white'
            }`}
          >
            Todos
            <span className="rounded-md bg-pclink-bg px-1.5 py-0.5 text-[10px] text-pclink-muted">{countTotal}</span>
          </button>
          
          <button
            onClick={() => setSelectedFilter('oro')}
            className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all flex items-center gap-1.5 ${
              selectedFilter === 'oro' 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' 
                : 'bg-pclink-surface border-pclink-border text-pclink-muted hover:text-white'
            }`}
          >
            🥇 Oro
            <span className="rounded-md bg-pclink-bg px-1.5 py-0.5 text-[10px] text-amber-400/80">{countGold}</span>
          </button>
          
          <button
            onClick={() => setSelectedFilter('plata')}
            className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all flex items-center gap-1.5 ${
              selectedFilter === 'plata' 
                ? 'bg-slate-400/20 border-slate-400/50 text-slate-200' 
                : 'bg-pclink-surface border-pclink-border text-pclink-muted hover:text-white'
            }`}
          >
            🥈 Plata
            <span className="rounded-md bg-pclink-bg px-1.5 py-0.5 text-[10px] text-slate-400">{countSilver}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('bronce')}
            className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all flex items-center gap-1.5 ${
              selectedFilter === 'bronce' 
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-200' 
                : 'bg-pclink-surface border-pclink-border text-pclink-muted hover:text-white'
            }`}
          >
            🥉 Bronce
            <span className="rounded-md bg-pclink-bg px-1.5 py-0.5 text-[10px] text-orange-400">{countBronze}</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel mt-6 overflow-hidden border border-pclink-border/50">
        {loading ? (
          <div className="space-y-4 p-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-pclink-surface border border-pclink-border/30" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-pclink-surface border border-pclink-border/50 p-4 mb-4 text-pclink-muted">
              <Users className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold">No se encontraron clientes</h4>
            <p className="text-sm text-pclink-muted mt-1 text-center max-w-sm">
              No hay pedidos que coincidan con la búsqueda o segmento seleccionado en este momento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-pclink-border/60 bg-pclink-surface/50 text-xs uppercase tracking-wider text-pclink-muted">
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Correo</th>
                  <th className="px-6 py-4 font-semibold text-center">Pedidos</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Gastado</th>
                  <th className="px-6 py-4 font-semibold">Última compra</th>
                  <th className="px-6 py-4 font-semibold">Segmento</th>
                  <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pclink-border/40">
                <AnimatePresence>
                  {filteredCustomers.map((c, i) => (
                    <motion.tr
                      key={c.email}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(0.03 * i, 0.5), duration: 0.2 }}
                      className="hover:bg-pclink-surface/30 transition-all duration-150"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs border uppercase bg-gradient-to-br ${tierGradient[c.tier]}`}>
                            {c.name.substring(0, 2)}
                          </div>
                          <span className="font-bold text-white text-sm">{c.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-pclink-muted">
                        <div className="flex items-center gap-2 group">
                          <span className="text-xs truncate max-w-[160px]">{c.email}</span>
                          <button
                            onClick={() => handleCopyEmail(c.email)}
                            className="text-pclink-muted hover:text-pclink-cyan opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-pclink-surface"
                            title="Copiar correo"
                          >
                            {copiedEmail === c.email ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="px-6 py-4 text-center tabular-nums font-bold">
                        <span className="rounded-lg bg-pclink-surface px-2.5 py-1 text-xs border border-pclink-border/40">
                          {c.ordersCount}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="px-6 py-4 text-right font-black text-white tabular-nums">
                        $ {c.totalSpent.toLocaleString('es-AR')}
                      </td>

                      {/* Last Purchase */}
                      <td className="px-6 py-4 text-pclink-muted text-xs">
                        {formatRelativeTime(c.lastOrderDate)}
                      </td>

                      {/* Tier Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ring-1 ${tierColor[c.tier]}`}>
                          {c.tier}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setActiveModalCust(c)
                            setBenefitPercent(c.tier === 'oro' ? 20 : c.tier === 'plata' ? 15 : 10)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-pclink-cyan/10 hover:bg-pclink-cyan/20 border border-pclink-cyan/30 px-3 py-1.5 text-xs font-bold text-pclink-cyan-light hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95"
                        >
                          <Gift className="h-3.5 w-3.5" />
                          Regalar Promo
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Premium Benefit Modal Overlay */}
      <AnimatePresence>
        {activeModalCust && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!sendingBenefit) setActiveModalCust(null) }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Content Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-pclink-border bg-pclink-bg p-6 shadow-2xl"
            >
              {benefitSentSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/30 p-4 mb-4 text-emerald-400 animate-bounce">
                    <Check className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-bold text-white">¡Beneficio Enviado!</h4>
                  <p className="text-sm text-pclink-muted mt-2 max-w-xs">
                    El cupón del {benefitPercent}% de descuento ha sido creado y se notificó a <strong>{activeModalCust.name}</strong> en su celular.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-pclink-cyan/10 p-3 border border-pclink-cyan/20 text-pclink-cyan">
                      <Gift className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Enviar Beneficio</h3>
                      <p className="text-xs text-pclink-muted">A {activeModalCust.name} ({activeModalCust.email})</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-pclink-border bg-pclink-surface p-4">
                      <p className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Detalles del Cliente</p>
                      <div className="mt-3 flex justify-between text-sm">
                        <span className="text-pclink-muted">Compras totales:</span>
                        <span className="font-bold text-white">{activeModalCust.ordersCount}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-pclink-muted">Segmento Actual:</span>
                        <span className="font-black text-pclink-cyan uppercase">{activeModalCust.tier}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-pclink-muted uppercase tracking-wider mb-2">Porcentaje del Cupón</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setBenefitPercent(pct)}
                            className={`rounded-xl py-2.5 text-sm font-bold border transition-all ${
                              benefitPercent === pct 
                                ? 'bg-pclink-cyan border-pclink-cyan text-white shadow-md' 
                                : 'bg-pclink-surface border-pclink-border text-pclink-muted hover:text-white'
                            }`}
                          >
                            {pct}% Off
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] text-pclink-muted leading-relaxed">
                      💡 <strong>¿Cómo funciona?</strong> Al hacer clic en enviar, Firestore guardará un registro de cupón y creará una notificación push dirigida. La campanita de la app móvil del cliente se iluminará en tiempo real con este regalo.
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setActiveModalCust(null)}
                      disabled={sendingBenefit}
                      className="flex-1 rounded-xl border border-pclink-border bg-pclink-surface py-2.5 text-xs font-bold text-pclink-muted hover:text-white transition-all hover:bg-pclink-border"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendBenefit}
                      disabled={sendingBenefit}
                      className="flex-1 rounded-xl bg-pclink-cyan py-2.5 text-xs font-bold text-white hover:bg-pclink-cyan-light transition-all flex justify-center items-center gap-1.5 shadow-lg shadow-pclink-cyan/20"
                    >
                      {sendingBenefit ? 'Enviando...' : 'Enviar Cupón'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
