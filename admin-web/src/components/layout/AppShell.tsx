import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { ShoppingBag, User, MapPin, X } from 'lucide-react'
import { getDb } from '../../lib/firebase'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

// Helper to play synthesized chimes on new order
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // First note: G5
    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime) // G5
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)
    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)
    osc1.start()
    osc1.stop(audioCtx.currentTime + 0.35)
    
    // Second note: C6 (delayed and higher pitch)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime) // C6
      gain2.gain.setValueAtTime(0.12, audioCtx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55)
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.start()
      osc2.stop(audioCtx.currentTime + 0.55)
    }, 100)
  } catch (e) {
    console.warn('AudioContext sound failed to play', e)
  }
}

export function AppShell() {
  const location = useLocation()
  const [newOrder, setNewOrder] = useState<any>(null)

  useEffect(() => {
    const db = getDb()
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1))
    
    // Use a flag to skip the initial load of existing orders and only notify for new ones
    let isInitial = true

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitial) {
        isInitial = false
        return
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderData = { id: change.doc.id, ...change.doc.data() } as any
          setNewOrder(orderData)
          playNotificationSound()
        }
      })
    }, (error) => {
      console.error('Error listening to orders:', error)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-pclink-bg bg-mesh text-white">
      <Sidebar />
      <div className="pl-[260px]">
        <TopBar />
        <main className="relative min-h-[calc(100vh-4rem)] p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating real-time alert for new purchases */}
      <AnimatePresence>
        {newOrder && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }}
            className="fixed bottom-6 right-6 z-50 w-[420px] rounded-2xl border border-pclink-cyan/40 bg-pclink-surface/95 p-6 shadow-[0_20px_50px_rgba(0,188,212,0.35)] backdrop-blur-xl text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pclink-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pclink-cyan opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-pclink-cyan"></span>
                </div>
                <h4 className="text-sm font-black uppercase tracking-wider text-pclink-cyan-light flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4" />
                  ¡Nueva compra recibida!
                </h4>
              </div>
              <button
                onClick={() => setNewOrder(null)}
                className="rounded-lg p-1 text-pclink-muted hover:bg-pclink-border hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Buyer */}
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-pclink-elevated/45 p-3 border border-pclink-border/40">
              <div className="rounded-lg bg-pclink-cyan/10 p-2 text-pclink-cyan border border-pclink-cyan/15">
                <User className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white leading-tight truncate">{newOrder.userName || 'Usuario PClink'}</p>
                <p className="text-xs text-pclink-muted truncate">{newOrder.userEmail}</p>
              </div>
            </div>

            {/* Address */}
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-pclink-elevated/45 p-3 border border-pclink-border/40">
              <div className="rounded-lg bg-pclink-cyan/10 p-2 text-pclink-cyan border border-pclink-cyan/15">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="text-xs leading-normal">
                <p className="font-bold text-white uppercase tracking-wide text-[10px] text-pclink-muted">Dirección de envío</p>
                {newOrder.shippingAddress ? (
                  <>
                    <p className="mt-1 font-semibold text-slate-200">
                      {newOrder.shippingAddress.street} {newOrder.shippingAddress.number}
                      {newOrder.shippingAddress.apartment ? `, ${newOrder.shippingAddress.apartment}` : ''}
                    </p>
                    <p className="text-pclink-muted">
                      {newOrder.shippingAddress.city}, {newOrder.shippingAddress.state} · CP {newOrder.shippingAddress.zip}
                    </p>
                    {newOrder.shippingAddress.phone && (
                      <p className="mt-1 text-slate-300">
                        Teléfono: <span className="font-bold text-pclink-cyan-light font-mono">{newOrder.shippingAddress.phone}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-1 italic text-pclink-muted">No especificada / Retiro en sucursal</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="mt-4">
              <p className="text-[10px] font-bold text-pclink-muted uppercase tracking-wider mb-2">Detalle de compra</p>
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 divide-y divide-pclink-border/30">
                {newOrder.items && newOrder.items.length > 0 ? (
                  newOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 first:pt-0">
                      <div className="max-w-[280px]">
                        <p className="font-semibold text-slate-200 truncate">{item.productName}</p>
                        <p className="text-[10px] text-pclink-muted">Cant: {item.quantity} · c/u: ${item.price?.toLocaleString('es-AR')}</p>
                      </div>
                      <span className="font-bold text-white whitespace-nowrap">
                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-pclink-muted py-2">Sin detalles de artículos</p>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 flex items-center justify-between border-t border-pclink-border/60 pt-3">
              <span className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Total pagado</span>
              <span className="text-xl font-black text-pclink-success">
                ${newOrder.total?.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Actions */}
            <button
              onClick={() => setNewOrder(null)}
              className="mt-4 w-full rounded-xl bg-pclink-cyan py-2.5 text-xs font-bold text-white hover:bg-pclink-cyan-light active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(0,188,212,0.25)] flex justify-center items-center"
            >
              Entendido
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
