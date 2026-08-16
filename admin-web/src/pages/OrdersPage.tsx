import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import {
  Search,
  User,
  MapPin,
  Truck,
  CheckCircle2,
  X,
  Eye,
  Clock,
  Ban,
  PackageOpen,
  Trash2
} from 'lucide-react'

// Configuración de visualización por cada estado de la compra
const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', bg: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-500', icon: Clock },
  PAID: { label: 'Pagado', bg: 'bg-pclink-success/10 border-pclink-success/25 text-pclink-success', icon: CheckCircle2 },
  PREPARING: { label: 'En preparación', bg: 'bg-purple-500/10 border-purple-500/25 text-purple-400', icon: PackageOpen },
  SHIPPED: { label: 'Enviado', bg: 'bg-pclink-cyan/10 border-pclink-cyan/25 text-pclink-cyan', icon: Truck },
  IN_TRANSIT: { label: 'En reparto', bg: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400', icon: Truck },
  DELIVERED: { label: 'Recibido', bg: 'bg-teal-500/10 border-teal-500/25 text-teal-400', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelado', bg: 'bg-pclink-error/10 border-pclink-error/25 text-pclink-error', icon: Ban },
} as any

// Helper functions for WhatsApp redirection
const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.705 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function formatWhatsAppNumber(phone: string | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('54')) {
    if (cleaned.length === 12 && !cleaned.startsWith('549')) {
      cleaned = '549' + cleaned.substring(2);
    }
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 12 && cleaned.substring(3, 5) === '15') {
    cleaned = cleaned.substring(0, 3) + cleaned.substring(5);
  }
  if (cleaned.length === 10) {
    return '549' + cleaned;
  }
  return cleaned;
}

function getWhatsAppMessage(order: any): string {
  const name = order.userName || '';
  const number = order.number || '';
  if (order.status === 'PENDING') {
    return `Hola ${name}, te escribo de PC Link por tu pedido ${number}. Vemos que el pago quedó pendiente, ¿necesitás ayuda para completarlo o alguna asistencia?`;
  }
  return `Hola ${name}, te escribo de PC Link por tu pedido ${number}. ¿Necesitás asistencia con tu compra o entrega?`;
}

interface OrderItem {
  productId: string
  productName: string
  price: number
  quantity: number
  imageUrl?: string
}

interface ShippingAddress {
  label: string
  recipient: string
  street: string
  number: string
  apartment?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
}

interface Order {
  id: string
  number: string
  createdAt: number
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  status: string
  userId: string
  userName: string
  userEmail: string
  paymentMethod: string
  shippingAddress?: ShippingAddress
  items: OrderItem[]
  userPhone?: string
  statusHistory?: Record<string, number>
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    const db = getDb()
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Order[] = []
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Order)
      })
      setOrders(list)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching orders:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const db = getDb()
      const orderRef = doc(db, 'orders', orderId)
      const now = Date.now()
      await updateDoc(orderRef, {
        status: newStatus,
        [`statusHistory.${newStatus}`]: now
      })
      
      // Si el modal detallado está abierto y es la orden editada, actualizarla en el estado local del modal
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          status: newStatus,
          statusHistory: {
            ...(prev.statusHistory || {}),
            [newStatus]: now
          }
        } : null)
      }
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`)
    }
  }

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el pedido ${orderNumber}? Esta acción no se puede deshacer.`)) {
      return
    }
    try {
      const db = getDb()
      const orderRef = doc(db, 'orders', orderId)
      await deleteDoc(orderRef)
      
      // Si el modal detallado está abierto y es la orden editada, cerrarlo
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null)
      }
    } catch (err: any) {
      alert(`Error al eliminar el pedido: ${err.message}`)
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '—'
    const date = new Date(timestamp)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pedidos y Ventas</h1>
        <p className="mt-2 text-pclink-muted">
          Monitorea las compras realizadas en la app móvil en tiempo real. Gestiona el estado de entrega y visualiza los datos del cliente.
        </p>
      </header>

      {/* Filtros */}
      <div className="glass-panel mb-8 p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
          <input
            type="search"
            placeholder="Buscar por nro pedido, cliente, mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:border-pclink-cyan/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-pclink-muted">Filtrar por estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pclink-cyan/50"
          >
            <option value="ALL">Todos los Estados</option>
            {Object.keys(STATUS_CONFIG).map((key) => (
              <option key={key} value={key}>
                {STATUS_CONFIG[key].label}
              </option>
            ))}
          </select>
          <div className="text-xs font-bold text-pclink-cyan bg-pclink-cyan/10 px-3 py-1.5 rounded-lg border border-pclink-cyan/20">
            {filteredOrders.length} Pedidos
          </div>
        </div>
      </div>

      {/* Listado de Pedidos */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted">
                <th className="px-6 py-4 font-bold">Número</th>
                <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Artículos</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold text-center">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-pclink-muted">
                    Cargando pedidos de Firestore...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-pclink-muted">
                    No se encontraron pedidos. Realiza una simulación desde la app.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, i) => {
                  const cfg = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: 'bg-slate-500/10 border-slate-500/25 text-slate-400',
                    icon: Clock,
                  }

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.01 * Math.min(i, 20) }}
                      className="border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Número de Pedido */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-pclink-cyan-light">{order.number}</span>
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="max-w-[180px]">
                          <p className="font-bold text-white leading-tight truncate">{order.userName}</p>
                          <p className="text-xs text-pclink-muted truncate">{order.userEmail}</p>
                          {(order.userPhone || order.shippingAddress?.phone) && (
                            <p className="text-xs text-pclink-cyan-light font-bold font-mono mt-0.5">
                              {order.userPhone || order.shippingAddress?.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cantidad de Artículos */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">
                            {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} u.
                          </span>
                          <span className="text-[10px] text-pclink-muted line-clamp-1">
                            {order.items?.map(it => `${it.productName} (${it.quantity})`).join(', ')}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 font-bold text-white font-mono">
                        ${order.total?.toLocaleString('es-AR')}
                      </td>

                      {/* Estado editable directo */}
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold cursor-pointer focus:outline-none transition-all ${cfg.bg}`}
                        >
                          {Object.keys(STATUS_CONFIG).map((statusKey) => (
                            <option key={statusKey} value={statusKey} className="bg-pclink-surface text-white text-left">
                              {STATUS_CONFIG[statusKey].label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="rounded-lg p-2 text-pclink-muted hover:bg-pclink-elevated hover:text-pclink-cyan transition-all"
                            title="Ver detalles de envío"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order.id, order.number);
                            }}
                            className="rounded-lg p-2 text-pclink-muted hover:bg-pclink-elevated hover:text-pclink-error transition-all"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Envío / Dirección */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 z-40 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-12 z-50 mx-auto max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-pclink-border bg-pclink-surface p-5 shadow-2xl backdrop-blur-xl md:top-24"
            >
              <div className="flex items-center justify-between border-b border-pclink-border/60 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Detalle de Envío</h3>
                  <p className="text-xs text-pclink-cyan-light font-mono font-bold mt-0.5">Pedido: {selectedOrder.number}</p>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const cfg = STATUS_CONFIG[selectedOrder.status] || {
                      label: selectedOrder.status,
                      bg: 'bg-slate-500/10 border-slate-500/25 text-slate-400',
                      icon: Clock,
                    }
                    const StatusIcon = cfg.icon
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cfg.bg}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>
                    )
                  })()}
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.number)}
                    className="rounded-lg p-1.5 text-pclink-muted hover:bg-pclink-border hover:text-pclink-error transition"
                    title="Eliminar pedido"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-lg p-1.5 text-pclink-muted hover:bg-pclink-border hover:text-white transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {/* Cliente */}
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-pclink-cyan/10 p-2 text-pclink-cyan border border-pclink-cyan/15">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Cliente / Destinatario</h4>
                    <p className="mt-1 font-bold text-white text-sm">{selectedOrder.userName}</p>
                    <p className="text-xs text-pclink-muted">{selectedOrder.userEmail}</p>
                    {(selectedOrder.userPhone || selectedOrder.shippingAddress?.phone) && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-pclink-cyan-light font-bold font-mono">
                          Teléfono: {selectedOrder.userPhone || selectedOrder.shippingAddress?.phone}
                        </p>
                        <a
                          href={`https://wa.me/${formatWhatsAppNumber(selectedOrder.userPhone || selectedOrder.shippingAddress?.phone)}?text=${encodeURIComponent(getWhatsAppMessage(selectedOrder))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-[#25D366] hover:bg-[#20BA56] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition shadow-sm"
                        >
                          <WhatsAppIcon className="h-2.5 w-2.5" />
                          Contactar
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-pclink-cyan/10 p-2 text-pclink-cyan border border-pclink-cyan/15">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Dirección de Entrega</h4>
                    {selectedOrder.shippingAddress ? (
                      <div className="mt-1.5 text-sm text-slate-200">
                        <p className="font-semibold">
                          {selectedOrder.shippingAddress.recipient}
                        </p>
                        <p className="mt-1">
                          {selectedOrder.shippingAddress.street} {selectedOrder.shippingAddress.number}
                          {selectedOrder.shippingAddress.apartment ? ` - Depto ${selectedOrder.shippingAddress.apartment}` : ''}
                        </p>
                        <p className="text-xs text-pclink-muted mt-0.5">
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} · CP {selectedOrder.shippingAddress.zip} · {selectedOrder.shippingAddress.country}
                        </p>
                        {selectedOrder.shippingAddress.phone && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-300">
                              Teléfono de contacto: <span className="text-pclink-cyan-light font-bold font-mono">{selectedOrder.shippingAddress.phone}</span>
                            </p>
                            <a
                              href={`https://wa.me/${formatWhatsAppNumber(selectedOrder.shippingAddress.phone)}?text=${encodeURIComponent(getWhatsAppMessage(selectedOrder))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-[#25D366] hover:bg-[#20BA56] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition shadow-sm"
                            >
                              <WhatsAppIcon className="h-2.5 w-2.5" />
                              Contactar
                            </a>
                          </div>
                        )}
                        <span className="mt-2 inline-flex text-[9px] uppercase tracking-wider font-extrabold bg-pclink-cyan/10 text-pclink-cyan-light px-2 py-0.5 rounded border border-pclink-cyan/15">
                          Etiqueta: {selectedOrder.shippingAddress.label}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-pclink-muted italic">Retiro en sucursal / No especificada</p>
                    )}
                  </div>
                </div>

                {/* Artículos comprados */}
                <div className="border-t border-pclink-border/40 pt-4">
                  <h4 className="text-xs font-bold text-pclink-muted uppercase tracking-wider mb-3">Artículos</h4>
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-pclink-elevated/25 p-2 rounded-xl border border-pclink-border/30">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{item.productName}</p>
                          <p className="text-[10px] text-pclink-cyan-light font-mono mt-0.5">ID: {item.productId}</p>
                          <p className="text-xs text-pclink-muted mt-0.5">Cantidad: {item.quantity} · c/u: ${item.price?.toLocaleString('es-AR')}</p>
                        </div>
                        <span className="font-bold text-white font-mono text-sm">
                          ${(item.price * item.quantity).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen de Costos */}
                <div className="border-t border-pclink-border/40 pt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-pclink-muted">
                    <span>Subtotal</span>
                    <span className="font-mono">${selectedOrder.subtotal?.toLocaleString('es-AR')}</span>
                  </div>
                  {selectedOrder.shippingCost > 0 && (
                    <div className="flex justify-between text-xs text-pclink-muted">
                      <span>Costo de envío</span>
                      <span className="font-mono">${selectedOrder.shippingCost?.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-xs text-pclink-error">
                      <span>Descuento</span>
                      <span className="font-mono">-${selectedOrder.discount?.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-pclink-muted">
                    <span>Medio de Pago</span>
                    <span className="font-semibold uppercase">{selectedOrder.paymentMethod || 'Simulado'}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white border-t border-pclink-border/30 pt-2">
                    <span>Total de la Compra</span>
                    <span className="text-pclink-success font-mono">${selectedOrder.total?.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
