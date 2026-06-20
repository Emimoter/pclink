import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDb } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore'
import {
  Gift,
  Trophy,
  Sparkles,
  Search,
  Plus,
  Coins,
  QrCode,
  Info,
  ChevronRight,
  User,
  ShoppingBag,
  ArrowRight,
  Check,
  Copy,
  Clock,
  Settings2,
  Trash2,
  CheckCircle,
  X,
  Edit,
  Save
} from 'lucide-react'

// Interfaces
interface Order {
  id: string
  userEmail: string
  userName: string
  total: number
  createdAt: number
}

interface LoyaltyMember {
  email: string
  name: string
  ordersCount: number
  totalSpent: number
  basePoints: number // computed from purchases
  bonusPoints: number // manually adjusted or from tasks
  totalPoints: number
  tier: 'oro' | 'plata' | 'bronce'
}

interface VoucherTemplate {
  id: string
  discountPercent: number
  pointsCost: number
  title: string
  description: string
  color: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'rose'
  tag: string
}

interface PointHistoryItem {
  id: string
  email: string
  type: 'earn' | 'redeem' | 'bonus'
  points: number
  description: string
  date: number
}

interface RedeemedVoucher {
  id: string
  email: string
  code: string
  discountPercent: number
  pointsSpent: number
  redeemedAt: number
  status: 'active' | 'used'
}

export function LoyaltyPage() {
  const db = getDb()
  
  // Real Firestore States
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const loading = loadingUsers || loadingOrders
  const [searchQuery, setSearchQuery] = useState('')
  
  // Custom states for Loyalty configuration
  const [pointsRatio, setPointsRatio] = useState<number>(100) // $100 = 1 point
  const [surveyBonus, setSurveyBonus] = useState<number>(500) // +500 points for survey
  const [emailBonus, setEmailBonus] = useState<number>(300)   // +300 points for email verification
  const [savingConfig, setSavingConfig] = useState(false)

  // Load config from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'loyalty'), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (typeof data.pointsRatio === 'number') setPointsRatio(data.pointsRatio)
        if (typeof data.surveyBonus === 'number') setSurveyBonus(data.surveyBonus)
        if (typeof data.emailBonus === 'number') setEmailBonus(data.emailBonus)
      } else {
        // Seed default config in Firestore
        setDoc(doc(db, 'settings', 'loyalty'), {
          pointsRatio: 100,
          surveyBonus: 500,
          emailBonus: 300
        }).catch(console.error)
      }
    }, (err) => {
      console.error("Error loading loyalty config:", err)
    })
    return unsub
  }, [db])

  const handleSaveLoyaltyConfig = async () => {
    setSavingConfig(true)
    try {
      await setDoc(doc(db, 'settings', 'loyalty'), {
        pointsRatio,
        surveyBonus,
        emailBonus
      })
      triggerToast('Parámetros Guardados', 'Los parámetros se guardaron con éxito en Firestore.')
    } catch (err) {
      console.error("Error saving config:", err)
      triggerToast('Error al guardar', 'No se pudieron guardar los parámetros.')
    } finally {
      setSavingConfig(false)
    }
  }
  
  // Voucher templates (loaded dynamically from Firestore)
  const [vouchers, setVouchers] = useState<VoucherTemplate[]>([])

  // Admin New Voucher Form State
  const [showAddVoucher, setShowAddVoucher] = useState(false)
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null)
  const [newDiscount, setNewDiscount] = useState<number>(10)
  const [newCost, setNewCost] = useState<number>(800)
  const [newColor, setNewColor] = useState<'emerald' | 'cyan' | 'amber' | 'indigo' | 'rose'>('emerald')
  const [newTag, setNewTag] = useState('NUEVO BENEFICIO')

  // SELECTED CLIENT FOR SIMULATOR
  const [selectedEmail, setSelectedEmail] = useState<string>('')
  const [simulatedCustomer, setSimulatedCustomer] = useState<LoyaltyMember>({
    email: '',
    name: 'Visitante del Club',
    ordersCount: 0,
    totalSpent: 0,
    basePoints: 0,
    bonusPoints: 0,
    totalPoints: 0,
    tier: 'bronce'
  })

  // Simulated Client Actions state
  const [pointsHistory, setPointsHistory] = useState<PointHistoryItem[]>([])
  const [redeemedVouchers, setRedeemedVouchers] = useState<RedeemedVoucher[]>([])

  // Mobile App drawers
  const [showRewardsDrawer, setShowRewardsDrawer] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  
  // Simulator triggers
  const [surveyCompleted, setSurveyCompleted] = useState(false)
  const [emailCompleted, setEmailCompleted] = useState(false)
  const [simPurchaseAmount, setSimPurchaseAmount] = useState<string>('25000')
  const [copiedVoucherCode, setCopiedVoucherCode] = useState<string | null>(null)
  
  // Interactive UI Animations
  const [showConfetti, setShowConfetti] = useState(false)
  const [notificationToast, setNotificationToast] = useState<{message: string; sub: string} | null>(null)

  // Load and sync vouchers from Firestore (with automatic seeding)
  useEffect(() => {
    const q = query(collection(db, 'vouchers'))
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        const defaults: VoucherTemplate[] = [
          {
            id: 'v1',
            discountPercent: 15,
            pointsCost: 1000,
            title: '15% DESCUENTO VOUCHER',
            description: 'Válido para compras en toda la tienda online de PClink. No acumulable.',
            color: 'emerald',
            tag: 'CUPÓN CLUB'
          },
          {
            id: 'v2',
            discountPercent: 20,
            pointsCost: 1800,
            title: '20% DESCUENTO VOUCHER',
            description: 'Cupón especial de nivel Plata y Oro para productos seleccionados.',
            color: 'cyan',
            tag: 'PRODUCTOS SELECCIONADOS'
          },
          {
            id: 'v3',
            discountPercent: 25,
            pointsCost: 2500,
            title: '25% DESCUENTO VOUCHER',
            description: '¡Nuestra mayor recompensa! Válido en toda tu próxima compra.',
            color: 'amber',
            tag: 'BENEFICIO EXCLUSIVO'
          }
        ]
        for (const v of defaults) {
          try {
            await setDoc(doc(db, 'vouchers', v.id), v)
          } catch (err) {
            console.error("Error seeding default voucher in Firestore:", err)
          }
        }
      } else {
        const list = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as VoucherTemplate))
        setVouchers(list)
      }
    })
    return unsubscribe
  }, [db])

  // Load users from Firestore
  useEffect(() => {
    const q = query(collection(db, 'users'))
    return onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      }))
      setUsers(usersList)
      setLoadingUsers(false)
    }, (err) => {
      console.error("Error loading users:", err)
      setLoadingUsers(false)
    })
  }, [db])

  // Load orders from Firestore
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Order))
      setOrders(ordersList)
      setLoadingOrders(false)
    }, (err) => {
      console.error("Error loading orders:", err)
      setLoadingOrders(false)
    })
  }, [db])

  // Combine users and orders into LoyaltyMembers
  const members = useMemo(() => {
    // 1. Group orders by userEmail
    const ordersByUserEmail = orders.reduce<Record<string, { total: number; count: number; name: string }>>((acc, order) => {
      const email = order.userEmail || 'anonimo@pclink.com'
      if (!acc[email]) {
        acc[email] = { total: 0, count: 0, name: order.userName || email.split('@')[0] }
      }
      acc[email].total += order.total || 0
      acc[email].count += 1
      return acc
    }, {})

    // 2. Create a map of existing users by email
    const usersMap = new Map<string, any>()
    users.forEach(u => {
      if (u.email) {
        usersMap.set(u.email.toLowerCase(), u)
      }
    })

    // 3. Build the combined list (registered users + anyone who has placed an order)
    const combinedEmails = new Set<string>()
    users.forEach(u => {
      if (u.email) combinedEmails.add(u.email.toLowerCase())
    })
    Object.keys(ordersByUserEmail).forEach(email => {
      combinedEmails.add(email.toLowerCase())
    })

    const memberList = Array.from(combinedEmails).map(email => {
      const user = usersMap.get(email)
      const orderInfo = ordersByUserEmail[email] || { total: 0, count: 0, name: email.split('@')[0] }
      
      const name = user?.name || orderInfo.name || email.split('@')[0]
      
      // Tier calculation: oro (count >= 10 or total >= 500k), plata (count >= 5 or total >= 250k), bronce
      let tier: 'oro' | 'plata' | 'bronce' = 'bronce'
      if (orderInfo.count >= 10 || orderInfo.total >= 500000) {
        tier = 'oro'
      } else if (orderInfo.count >= 5 || orderInfo.total >= 250000) {
        tier = 'plata'
      }

      const multiplier = tier === 'oro' ? 1.3 : tier === 'plata' ? 1.15 : 1.0
      
      // Calculate points (matching e-commerce / Android view logic)
      const basePoints = Math.floor((orderInfo.total / 100) * multiplier) + 800
      const pointsSpent = user?.pointsSpent || 0
      const totalPoints = Math.max(0, basePoints - pointsSpent)

      return {
        email,
        name,
        ordersCount: orderInfo.count,
        totalSpent: orderInfo.total,
        basePoints,
        bonusPoints: 800, // welcome points
        totalPoints,
        tier
      } as LoyaltyMember
    })

    // 4. Sort by points descending so clients with the most points are at the top
    return memberList.sort((a, b) => b.totalPoints - a.totalPoints)
  }, [users, orders])

  // Automatically select the first member once loaded
  useEffect(() => {
    if (!selectedEmail && members.length > 0) {
      setSelectedEmail(members[0].email)
      setSimulatedCustomer(members[0])
    }
  }, [members, selectedEmail])

  // Keep simulator customer details in sync with members list updates
  useEffect(() => {
    const currentSim = members.find(m => m.email === selectedEmail)
    if (currentSim) {
      setSimulatedCustomer(currentSim)
    }
  }, [members, selectedEmail])

  // Select simulator customer
  const handleSelectSimulatedMember = (member: LoyaltyMember) => {
    setSelectedEmail(member.email)
    setSimulatedCustomer(member)
    
    // Clear history and survey status for this simulator view
    setSurveyCompleted(false)
    setEmailCompleted(false)
    
    // Generate some simulated points history
    setPointsHistory([
      {
        id: 'h1',
        email: member.email,
        type: 'bonus',
        points: member.bonusPoints,
        description: 'Puntos de bienvenida PClink Club',
        date: Date.now() - 86400000 * 5
      },
      {
        id: 'h2',
        email: member.email,
        type: 'earn',
        points: member.basePoints,
        description: `Puntos acumulados por ${member.ordersCount} compras`,
        date: Date.now() - 86400000 * 2
      }
    ])
    setRedeemedVouchers([])
    triggerToast(`Cliente Seleccionado`, `Simulando vista para ${member.name}`)
  }

  // Toast Helper
  const triggerToast = (message: string, sub: string) => {
    setNotificationToast({ message, sub })
    setTimeout(() => setNotificationToast(null), 3000)
  }

  // Simulating Points Earning via Purchase
  const handleSimulatePurchase = () => {
    const amount = parseFloat(simPurchaseAmount)
    if (isNaN(amount) || amount <= 0) return

    const ptsEarned = Math.floor(amount / pointsRatio)
    if (ptsEarned <= 0) {
      triggerToast('Compra sin puntos', `El monto debe superar $${pointsRatio}`)
      return
    }

    // Update state
    const updated = {
      ...simulatedCustomer,
      totalSpent: simulatedCustomer.totalSpent + amount,
      ordersCount: simulatedCustomer.ordersCount + 1,
      basePoints: simulatedCustomer.basePoints + ptsEarned,
      totalPoints: simulatedCustomer.totalPoints + ptsEarned
    }
    
    // recalculate tier
    if (updated.ordersCount >= 10 || updated.totalSpent >= 500000) {
      updated.tier = 'oro'
    } else if (updated.ordersCount >= 5 || updated.totalSpent >= 250000) {
      updated.tier = 'plata'
    }

    setSimulatedCustomer(updated)
    
    // Add point history log
    const newLog: PointHistoryItem = {
      id: `h-sim-${Date.now()}`,
      email: simulatedCustomer.email,
      type: 'earn',
      points: ptsEarned,
      description: `Puntos por compra (Simulación de Carrito)`,
      date: Date.now()
    }
    setPointsHistory([newLog, ...pointsHistory])
    
    // trigger animation
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
    triggerToast('¡Fidelización exitosa!', `Sumaste +${ptsEarned} Puntos (Compra de $${amount.toLocaleString('es-AR')})`)
  }

  // Simulating Points Earning via Tasks (survey)
  const handleCompleteSurvey = () => {
    if (surveyCompleted) return
    
    const updated = {
      ...simulatedCustomer,
      bonusPoints: simulatedCustomer.bonusPoints + surveyBonus,
      totalPoints: simulatedCustomer.totalPoints + surveyBonus
    }
    setSimulatedCustomer(updated)
    setSurveyCompleted(true)
    
    const newLog: PointHistoryItem = {
      id: `h-survey-${Date.now()}`,
      email: simulatedCustomer.email,
      type: 'bonus',
      points: surveyBonus,
      description: 'Bonus: Completar encuesta de perfil',
      date: Date.now()
    }
    setPointsHistory([newLog, ...pointsHistory])
    
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
    triggerToast('¡Perfil Completo!', `Ganaste +${surveyBonus} Puntos PClink Club`)
  }

  // Simulating Points Earning via Email Verification
  const handleCompleteEmailVerify = () => {
    if (emailCompleted) return
    
    const updated = {
      ...simulatedCustomer,
      bonusPoints: simulatedCustomer.bonusPoints + emailBonus,
      totalPoints: simulatedCustomer.totalPoints + emailBonus
    }
    setSimulatedCustomer(updated)
    setEmailCompleted(true)
    
    const newLog: PointHistoryItem = {
      id: `h-email-${Date.now()}`,
      email: simulatedCustomer.email,
      type: 'bonus',
      points: emailBonus,
      description: 'Bonus: Verificar correo electrónico',
      date: Date.now()
    }
    setPointsHistory([newLog, ...pointsHistory])
    
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
    triggerToast('¡Correo verificado!', `Ganaste +${emailBonus} Puntos PClink Club`)
  }

  // Simulating Voucher Redemption (The adiClub main goal!)
  const handleRedeemVoucher = async (voucher: VoucherTemplate) => {
    if (simulatedCustomer.totalPoints < voucher.pointsCost) {
      triggerToast('Puntos insuficientes', `Necesitás ${voucher.pointsCost} puntos. Tenés ${simulatedCustomer.totalPoints}`)
      return
    }

    // Deduct points
    const updated = {
      ...simulatedCustomer,
      totalPoints: simulatedCustomer.totalPoints - voucher.pointsCost
    }
    setSimulatedCustomer(updated)

    // Generate coupon code
    const generatedCode = `PCCLUB-${voucher.discountPercent}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Add redeemed voucher
    const newRedemption: RedeemedVoucher = {
      id: `v-redeem-${Date.now()}`,
      email: simulatedCustomer.email,
      code: generatedCode,
      discountPercent: voucher.discountPercent,
      pointsSpent: voucher.pointsCost,
      redeemedAt: Date.now(),
      status: 'active'
    }
    setRedeemedVouchers([newRedemption, ...redeemedVouchers])

    // Add points log
    const newLog: PointHistoryItem = {
      id: `h-redeem-${Date.now()}`,
      email: simulatedCustomer.email,
      type: 'redeem',
      points: voucher.pointsCost,
      description: `Canje de Cupón ${voucher.discountPercent}% Off`,
      date: Date.now()
    }
    setPointsHistory([newLog, ...pointsHistory])

    // Try to write to real Firestore notifications/benefits collection if a real user is selected
    if (simulatedCustomer.email !== 'invitado@pclink.com') {
      try {
        await addDoc(collection(db, 'notifications'), {
          title: `🎟️ ¡Cupón Canjeado en pcClub!`,
          body: `¡Felicidades! Canjeaste ${voucher.pointsCost} puntos por un cupón del ${voucher.discountPercent}% off: ${generatedCode}. ¡Copia y usalo en el carrito!`,
          type: 'promo',
          icon: 'gift',
          tone: '#00BCD4',
          targetCategory: null,
          targetProductId: null,
          createdAt: Date.now(),
          read: false
        })
      } catch (e) {
        console.error("No se pudo escribir en Firestore: ", e)
      }
    }

    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
    triggerToast('¡Voucher Canjeado!', `¡Generaste tu cupón del ${voucher.discountPercent}% Off!`)
    setShowRewardsDrawer(true) // Automatically open the rewards drawer so they see the coupon code!
  }

  // Create or update a voucher template (persisted in Firestore)
  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingVoucherId) {
      // Edit existing voucher
      const updatedVoucher = {
        id: editingVoucherId,
        discountPercent: newDiscount,
        pointsCost: newCost,
        title: `${newDiscount}% DESCUENTO VOUCHER`,
        description: `Canjeable por ${newCost} puntos pcClub. Válido en toda la tienda online.`,
        color: newColor,
        tag: newTag.toUpperCase() || 'CUPÓN ESPECIAL'
      }
      try {
        await setDoc(doc(db, 'vouchers', editingVoucherId), updatedVoucher)
        setShowAddVoucher(false)
        setEditingVoucherId(null)
        triggerToast('Beneficio Guardado', `Se actualizó el cupón de ${newDiscount}% Off en Firestore`)
      } catch (error) {
        console.error("Error saving voucher: ", error)
        triggerToast('Error', 'No se pudo actualizar el beneficio en Firestore')
      }
    } else {
      // Create new voucher
      const id = `v-custom-${Date.now()}`
      const newVoucher: VoucherTemplate = {
        id,
        discountPercent: newDiscount,
        pointsCost: newCost,
        title: `${newDiscount}% DESCUENTO VOUCHER`,
        description: `Canjeable por ${newCost} puntos pcClub. Válido en toda la tienda online.`,
        color: newColor,
        tag: newTag.toUpperCase() || 'CUPÓN ESPECIAL'
      }
      try {
        await setDoc(doc(db, 'vouchers', id), newVoucher)
        setShowAddVoucher(false)
        triggerToast('Beneficio Creado', `Se agregó el cupón de ${newDiscount}% Off en Firestore`)
      } catch (error) {
        console.error("Error creating voucher: ", error)
        triggerToast('Error', 'No se pudo guardar el beneficio en Firestore')
      }
    }
  }

  const handleEditVoucher = (voucher: VoucherTemplate) => {
    setEditingVoucherId(voucher.id)
    setNewDiscount(voucher.discountPercent)
    setNewCost(voucher.pointsCost)
    setNewColor(voucher.color)
    setNewTag(voucher.tag)
    setShowAddVoucher(true)
    
    // Smooth scroll to the form
    setTimeout(() => {
      const formEl = document.querySelector('form')
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleDeleteVoucher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vouchers', id))
      triggerToast('Beneficio Eliminado', 'El cupón fue eliminado de Firestore')
    } catch (error) {
      console.error("Error deleting voucher: ", error)
      triggerToast('Error', 'No se pudo eliminar el beneficio de Firestore')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedVoucherCode(text)
    setTimeout(() => setCopiedVoucherCode(null), 2500)
    triggerToast('Código Copiado', '¡Listo para pegar en el carrito!')
  }

  // Filter members on search
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const cardColorsMap = {
    emerald: 'bg-emerald-800 border-emerald-700/60 shadow-emerald-950/20 text-emerald-100',
    cyan: 'bg-cyan-800 border-cyan-700/60 shadow-cyan-950/20 text-cyan-100',
    amber: 'bg-amber-800 border-amber-700/60 shadow-amber-950/20 text-amber-100',
    indigo: 'bg-indigo-800 border-indigo-700/60 shadow-indigo-950/20 text-indigo-100',
    rose: 'bg-rose-800 border-rose-700/60 shadow-rose-950/20 text-rose-100',
  }

  const tagColorsMap = {
    emerald: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    cyan: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30',
    amber: 'bg-amber-950/40 text-amber-300 border-amber-500/30',
    indigo: 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30',
    rose: 'bg-rose-950/40 text-rose-300 border-rose-500/30',
  }

  return (
    <div className="mx-auto max-w-7xl pb-16 relative bg-mesh">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            PClink Club · Fidelización
          </h1>
          <p className="mt-2 text-pclink-muted max-w-3xl">
            Inspirado en el sistema <strong>adiClub de Adidas</strong>. Los clientes ganan puntos por sus compras online y tareas, los cuales pueden canjear en tiempo real por cupones de descuento exclusivos.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm text-amber-300">
          <Trophy className="h-4 w-4 text-amber-500 animate-pulse" />
          Fidelización Activa por Puntos
        </div>
      </div>

      {/* Grid Layout: Config/Members Left, Phone Simulator Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ADMIN CORE CONTROLS (8 cols) */}
        <div className="xl:col-span-7 space-y-8">
          
          {/* Rules Configuration Card */}
          <div className="glass-panel p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-pclink-cyan/10 p-3 text-pclink-cyan border border-pclink-cyan/10">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Parámetros del Club</h3>
                  <p className="text-xs text-pclink-muted">Establecé la relación monetaria de puntos y bonus iniciales</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleSaveLoyaltyConfig}
                disabled={savingConfig}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pclink-cyan hover:bg-pclink-cyan-light text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-3.5 w-3.5" />
                {savingConfig ? 'Guardando...' : 'Guardar Parámetros'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-pclink-muted uppercase tracking-wider mb-2">Relación de Puntos</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pclink-muted text-xs">
                    $100 =
                  </div>
                  <input
                    type="number"
                    value={pointsRatio}
                    onChange={(e) => setPointsRatio(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2.5 pl-14 pr-10 text-sm font-bold text-white focus:border-pclink-cyan focus:ring-1 focus:ring-pclink-cyan transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-pclink-cyan text-xs font-bold">
                    Pts
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-pclink-subtle">Monto en pesos para obtener 1 punto.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-pclink-muted uppercase tracking-wider mb-2">Encuesta Perfil</label>
                <div className="relative">
                  <input
                    type="number"
                    value={surveyBonus}
                    onChange={(e) => setSurveyBonus(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2.5 px-4 text-sm font-bold text-white focus:border-pclink-cyan focus:ring-1 focus:ring-pclink-cyan transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-amber-400 text-xs font-bold">
                    +Pts
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-pclink-subtle">Regalo de bienvenida completando perfil.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-pclink-muted uppercase tracking-wider mb-2">Verificar Email</label>
                <div className="relative">
                  <input
                    type="number"
                    value={emailBonus}
                    onChange={(e) => setEmailBonus(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2.5 px-4 text-sm font-bold text-white focus:border-pclink-cyan focus:ring-1 focus:ring-pclink-cyan transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-400 text-xs font-bold">
                    +Pts
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-pclink-subtle">Regalo por verificación de correo.</p>
              </div>
            </div>
          </div>

          {/* Tiers & Benefits Reference Card */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400 border border-amber-500/10">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Niveles y Beneficios del Club</h3>
                <p className="text-xs text-pclink-muted">Políticas de fidelización automática por compras acumuladas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Bronce */}
              <div className="border border-orange-500/20 bg-orange-500/5 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase text-orange-400 tracking-wider">🥉 Bronce</span>
                    <span className="text-[10px] text-pclink-muted">Nivel Inicial</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Cliente Registrado</h4>
                  <ul className="text-[11px] text-pclink-muted space-y-1.5 list-disc pl-4 leading-normal">
                    <li>Acumulación base: 1 punto por cada ${pointsRatio} ARS gastados.</li>
                    <li>Acceso al simulador y canje de vouchers básicos (15% Off).</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-pclink-subtle">
                  Requisito: Entrada automática al unirse.
                </div>
              </div>

              {/* Plata */}
              <div className="border border-slate-400/20 bg-slate-400/5 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase text-slate-300 tracking-wider">🥈 Plata</span>
                    <span className="text-[10px] text-pclink-muted">Nivel Medio</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Comprador Recurrente</h4>
                  <ul className="text-[11px] text-pclink-muted space-y-1.5 list-disc pl-4 leading-normal">
                    <li>Habilita canjes de vouchers medianos (20% Off).</li>
                    <li>Regalo extra de 500 Puntos PClink Club en aniversario de la cuenta.</li>
                    <li>Soporte de compra prioritario.</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-pclink-subtle">
                  Requisito: ≥ 5 compras o gastar ≥ $250.000.
                </div>
              </div>

              {/* Oro */}
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase text-amber-300 tracking-wider">🥇 Oro</span>
                    <span className="text-[10px] text-pclink-muted">Nivel VIP</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Cliente Exclusivo</h4>
                  <ul className="text-[11px] text-pclink-muted space-y-1.5 list-disc pl-4 leading-normal">
                    <li>Multiplicador de puntos: <strong>1.2x puntos</strong> por cada compra online.</li>
                    <li>Habilita canjes de vouchers máximos (25% Off).</li>
                    <li><strong>Envío gratis</strong> a domicilio en Mar del Plata.</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-pclink-subtle">
                  Requisito: ≥ 10 compras o gastar ≥ $500.000.
                </div>
              </div>
            </div>
          </div>

          {/* Active Rewards / Voucher Templates Manager */}
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400 border border-amber-500/10">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Vouchers Activos de Canje</h3>
                  <p className="text-xs text-pclink-muted">Administrá los cupones que los clientes canjean por puntos</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (showAddVoucher && editingVoucherId === null) {
                    setShowAddVoucher(false)
                  } else {
                    setEditingVoucherId(null)
                    setNewDiscount(10)
                    setNewCost(800)
                    setNewColor('emerald')
                    setNewTag('NUEVO BENEFICIO')
                    setShowAddVoucher(true)
                  }
                }}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-pclink-cyan hover:bg-pclink-cyan-light text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo Cupón
              </button>
            </div>

            {/* Expandable Add Voucher Form */}
            <AnimatePresence>
              {showAddVoucher && (
                <motion.form
                  onSubmit={handleSaveVoucher}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border border-pclink-border/80 bg-pclink-elevated/40 rounded-2xl p-4 mb-6 space-y-4"
                >
                  <h4 className="text-xs font-black uppercase text-pclink-cyan tracking-wider">
                    {editingVoucherId ? 'Editar Recompensa pcClub' : 'Crear Recompensa pcClub'}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-pclink-muted mb-1">Porcentaje de Descuento</label>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={newDiscount}
                        onChange={(e) => setNewDiscount(parseInt(e.target.value) || 10)}
                        className="w-full rounded-lg border border-pclink-border bg-pclink-bg py-2 px-3 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-pclink-muted mb-1">Costo en Puntos</label>
                      <input
                        type="number"
                        min="10"
                        value={newCost}
                        onChange={(e) => setNewCost(parseInt(e.target.value) || 100)}
                        className="w-full rounded-lg border border-pclink-border bg-pclink-bg py-2 px-3 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-pclink-muted mb-1">Etiqueta de Recompensa</label>
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="E.g. BENEFICIO EXCLUSIVO"
                        className="w-full rounded-lg border border-pclink-border bg-pclink-bg py-2 px-3 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-pclink-muted mb-1">Color de Tarjeta (Aesthetic)</label>
                      <select
                        value={newColor}
                        onChange={(e: any) => setNewColor(e.target.value)}
                        className="w-full rounded-lg border border-pclink-border bg-pclink-bg py-2 px-3 text-xs text-white outline-none"
                      >
                        <option value="emerald">Verde Esmeralda (Adidas Classic)</option>
                        <option value="cyan">Celeste Cyan (PClink Neon)</option>
                        <option value="amber">Oro Dorado (VIP Premium)</option>
                        <option value="indigo">Violeta Índigo (Modern Premium)</option>
                        <option value="rose">Rosa / Carmín (Vibrante)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddVoucher(false)
                        setEditingVoucherId(null)
                      }}
                      className="px-3.5 py-2 rounded-lg border border-pclink-border text-xs text-pclink-muted hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-pclink-cyan hover:bg-pclink-cyan-light text-xs font-bold text-white cursor-pointer"
                    >
                      {editingVoucherId ? 'Guardar Cambios' : 'Crear Recompensa'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of Vouchers with Adidas Styling Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className={`border rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:scale-[1.01] ${cardColorsMap[voucher.color]}`}
                >
                  <div>
                    {/* Header bar */}
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded border ${tagColorsMap[voucher.color]}`}>
                        {voucher.tag}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditVoucher(voucher)}
                          className="text-white/50 hover:text-white transition-colors cursor-pointer"
                          title="Editar cupón de canje"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          className="text-white/50 hover:text-white transition-colors cursor-pointer"
                          title="Eliminar cupón de canje"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xl font-black tracking-tight mt-3 text-white">
                      {voucher.discountPercent}% DESCUENTO
                    </h4>
                    <p className="text-[10px] text-white/70 font-semibold mt-1">
                      VOUCHER CANJEABLE
                    </p>
                    <p className="text-xs text-white/80 mt-2 line-clamp-2 leading-relaxed">
                      {voucher.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-white font-black text-sm">
                      <Coins className="h-4 w-4 text-amber-300 animate-pulse" />
                      {voucher.pointsCost.toLocaleString('es-AR')}
                      <span className="text-[10px] text-white/60 font-semibold ml-0.5">pts</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/70 uppercase">
                      pcClub
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members List Directory */}
          <div className="glass-panel p-6 border border-pclink-border/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Directorio de Clientes</h3>
                <p className="text-xs text-pclink-muted">Seleccioná un cliente para simular su app de fidelización en vivo</p>
              </div>

              {/* Search input */}
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pclink-muted" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-9 pr-3 text-xs text-white placeholder-pclink-muted focus:border-pclink-cyan focus:outline-none transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-pclink-surface" />
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-pclink-muted text-xs">
                No se encontraron clientes para simular
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredMembers.map((member) => {
                  const isSelected = member.email === selectedEmail
                  return (
                    <div
                      key={member.email}
                      onClick={() => handleSelectSimulatedMember(member)}
                      className={`rounded-xl border p-3.5 flex justify-between items-center cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-pclink-cyan/10 border-pclink-cyan shadow-md shadow-pclink-cyan/5 scale-[1.005]'
                          : 'bg-pclink-surface/40 border-pclink-border/60 hover:bg-pclink-surface/90 hover:border-pclink-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                          member.tier === 'oro' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                          member.tier === 'plata' ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20' :
                          'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                        }`}>
                          {member.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {member.name}
                            {isSelected && (
                              <span className="rounded-full bg-pclink-cyan/20 border border-pclink-cyan/30 text-[9px] font-black text-pclink-cyan-light px-1.5 py-0.2 animate-pulse uppercase">
                                Activo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-pclink-muted mt-0.5">{member.email}</div>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="text-xs font-black text-white flex items-center justify-end gap-1">
                            <Coins className="h-3.5 w-3.5 text-amber-400" />
                            {member.totalPoints.toLocaleString('es-AR')}
                          </div>
                          <div className="text-[9px] text-pclink-subtle uppercase font-semibold tracking-wider mt-0.5">
                            {member.tier} · {member.ordersCount} compras
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'text-pclink-cyan transform translate-x-0.5' : 'text-pclink-muted'}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH FIDELITY ADICLUB-STYLE SMARTPHONE SIMULATOR (5 cols) */}
        <div className="xl:col-span-5 flex justify-center">
          
          {/* Smartphone device shell */}
          <div className="w-[365px] h-[780px] bg-[#06090c] rounded-[52px] border-[12px] border-[#161c24] relative shadow-[0_24px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden ring-4 ring-pclink-border/30">
            
            {/* Top Speaker / Camera Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#161c24] rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-10 h-1 bg-black rounded-full mb-1" />
            </div>

            {/* Live Interactive Notification Toast Overlay */}
            <AnimatePresence>
              {notificationToast && (
                <motion.div
                  initial={{ opacity: 0, y: -40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 16, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="absolute left-4 right-4 top-8 z-50 rounded-2xl bg-pclink-surface border border-pclink-cyan/30 p-3 shadow-2xl flex items-start gap-3 backdrop-blur-xl"
                >
                  <div className="rounded-lg bg-pclink-cyan/10 border border-pclink-cyan/20 p-2 text-pclink-cyan shrink-0 animate-bounce">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{notificationToast.message}</h5>
                    <p className="text-[10px] text-pclink-muted mt-0.5 leading-snug">{notificationToast.sub}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confetti simulation overlays */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                <div className="absolute top-10 left-10 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                <div className="absolute top-20 right-14 w-3.5 h-3.5 bg-pclink-cyan rounded-full animate-bounce" />
                <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce" />
                <div className="absolute inset-0 bg-pclink-cyan/5 transition-opacity duration-200" />
              </div>
            )}

            {/* SIMULATOR SCREEN CONTENT (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto px-4 pt-12 pb-16 scrollbar-none relative">
              
              {/* adiClub Brand Header */}
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tighter text-white uppercase italic">
                    pcClub
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-pclink-cyan animate-pulse" />
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Info className="h-4.5 w-4.5 cursor-pointer hover:text-white" />
                  <QrCode className="h-4.5 w-4.5 cursor-pointer hover:text-white" />
                  <div className="h-5 w-5 rounded-full bg-pclink-border flex items-center justify-center text-[10px] font-black text-pclink-cyan border border-pclink-cyan/20">
                    {simulatedCustomer.name.substring(0, 1).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* SURVEY BANNER IF UNCOMPLETED */}
              {!surveyCompleted && (
                <div className="mt-3 bg-pclink-ink border border-pclink-border rounded-xl p-3 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-2">
                    <Gift className="h-20 w-20 text-white" />
                  </div>
                  <div className="relative z-10 pr-2">
                    <p className="text-[11px] font-black text-pclink-cyan uppercase tracking-wider">¿Te gusta pcClub?</p>
                    <p className="text-[9px] text-pclink-muted mt-0.5 leading-snug">Danos tu opinión en una encuesta breve</p>
                  </div>
                  <button
                    onClick={handleCompleteSurvey}
                    className="relative z-10 rounded px-2.5 py-1.5 border border-white text-[9px] font-bold text-white uppercase hover:bg-white hover:text-black transition-all"
                  >
                    CONTESTÁ LA ENCUESTA
                  </button>
                </div>
              )}

              {/* POINTS HERO BALANCE (Matches adiClub Champagne/Beige styling) */}
              <div className="mt-4 bg-[#f8f5f0] text-black rounded-2xl p-5 shadow-md relative overflow-hidden border border-black/5">
                
                {/* Rotating Star Icon */}
                <div className="flex justify-between items-start">
                  <div>
                    {/* Points Counter */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tracking-tight leading-none">
                        {simulatedCustomer.totalPoints.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-black/60 mt-1 flex items-center gap-1">
                      Puntos para gastar
                    </p>
                  </div>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                    className="rounded-full bg-black p-2 border border-black"
                  >
                    <Trophy className="h-4.5 w-4.5 text-[#f8f5f0]" />
                  </motion.div>
                </div>

                {/* Sub Menu Links */}
                <div className="mt-6 space-y-3.5 pt-4 border-t border-black/10">
                  <div
                    onClick={() => { setShowHistoryDrawer(false); setShowRewardsDrawer(true) }}
                    className="flex justify-between items-center cursor-pointer group"
                  >
                    <span className="text-[10px] font-black tracking-wider uppercase text-black">MIS RECOMPENSAS</span>
                    <ArrowRight className="h-3.5 w-3.5 text-black transform transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div
                    onClick={() => { setShowRewardsDrawer(false); setShowHistoryDrawer(true) }}
                    className="flex justify-between items-center cursor-pointer group"
                  >
                    <span className="text-[10px] font-black tracking-wider uppercase text-black">HISTORIAL DE PUNTOS</span>
                    <ArrowRight className="h-3.5 w-3.5 text-black transform transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>

              {/* USA TUS PUNTOS / GANÁ PUNTOS TABS */}
              <div className="mt-6 flex border-b border-white/10">
                <button className="flex-1 py-2 text-center text-[10px] font-black tracking-wider uppercase border-b-2 border-pclink-cyan text-white">
                  USÁ TUS PUNTOS
                </button>
                <button className="flex-1 py-2 text-center text-[10px] font-black tracking-wider uppercase border-b-2 border-transparent text-white/50 hover:text-white">
                  GANÁ PUNTOS
                </button>
              </div>

              {/* CANJEA TUS PUNTOS POR CUPONES DE DESCUENTO SECTION */}
              <div className="mt-5">
                <h4 className="text-sm font-bold tracking-tight text-white uppercase text-center">
                  CANJEÁ TUS PUNTOS POR CUPONES DE DESCUENTO
                </h4>

                <div className="flex justify-center mt-2.5">
                  <button className="rounded px-3 py-1.5 border border-white/20 text-[9px] font-bold text-white uppercase hover:border-white transition-all flex items-center gap-1">
                    VER PRODUCTOS SELECCIONADOS
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {/* VOUCHERS LIST (Forest green cards inspired by Adidas 15% green card) */}
                <div className="mt-5 space-y-4">
                  {vouchers.map((v) => {
                    const hasEnoughPoints = simulatedCustomer.totalPoints >= v.pointsCost
                    return (
                      <div
                        key={v.id}
                        className={`rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all border ${
                          v.color === 'emerald' ? 'bg-[#2b5c46] border-[#376b53]/80' :
                          v.color === 'cyan' ? 'bg-[#15545c] border-[#1d6b75]/80' :
                          v.color === 'amber' ? 'bg-[#665022] border-[#7d642e]/80' :
                          v.color === 'indigo' ? 'bg-[#3b2b5c] border-[#4b3775]/80' :
                          'bg-[#5c2b3e] border-[#753751]/80'
                        }`}
                      >
                        {/* Adidas diagonal lines watermark */}
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 transform rotate-12 translate-x-8 -translate-y-8 pointer-events-none" />

                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[16px] font-black text-white italic">
                              {v.discountPercent}% DESCUENTO
                            </span>
                            <span className="text-[9px] font-bold text-white/60 tracking-widest uppercase">
                              VOUCHER
                            </span>
                          </div>
                          <p className="text-[10px] text-white/80 mt-1 text-left leading-relaxed">
                            {v.description}
                          </p>
                        </div>

                        {/* Canjear Footer */}
                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                          <div className="flex items-center gap-1 text-white font-black text-xs">
                            <Coins className="h-3.5 w-3.5 text-amber-300" />
                            {v.pointsCost.toLocaleString('es-AR')}
                          </div>
                          
                          <button
                            onClick={() => handleRedeemVoucher(v)}
                            className={`rounded-lg px-3 py-1.5 text-[9px] font-black uppercase transition-all shadow-sm ${
                              hasEnoughPoints
                                ? 'bg-white text-black hover:bg-white/90 active:scale-95'
                                : 'bg-black/40 text-white/40 cursor-not-allowed border border-white/5'
                            }`}
                          >
                            {hasEnoughPoints ? 'CANJEAR' : 'PUNTOS INSUFICIENTES'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SIMULATE ACTIVITIES / GANAR PUNTOS SECTION */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-[11px] font-black tracking-wider text-pclink-cyan uppercase mb-3">
                  💡 Simular Tareas de Cliente
                </h4>
                <p className="text-[10px] text-pclink-muted mb-4 leading-normal">
                  Ejecutá acciones en la app del cliente para ver cómo sube el balance y se genera el historial en vivo.
                </p>

                <div className="space-y-3">
                  
                  {/* Task 1: Buy Products Simulator */}
                  <div className="bg-pclink-elevated/40 border border-pclink-border rounded-xl p-3.5">
                    <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-pclink-cyan" />
                      Comprar en tienda online
                    </p>
                    <p className="text-[9px] text-pclink-muted mt-0.5 leading-relaxed">
                      Suma 1 punto por cada ${pointsRatio} ARS gastados.
                    </p>
                    
                    <div className="mt-3 flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-pclink-muted text-[10px]">
                          $
                        </div>
                        <input
                          type="number"
                          value={simPurchaseAmount}
                          onChange={(e) => setSimPurchaseAmount(e.target.value)}
                          className="w-full rounded bg-pclink-bg border border-pclink-border py-1.5 pl-5 pr-2 text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleSimulatePurchase}
                        className="rounded bg-pclink-cyan hover:bg-pclink-cyan-light px-3 py-1.5 text-[9px] font-black text-white uppercase transition-all"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>

                  {/* Task 2: Complete Profile Survey */}
                  <div className="bg-pclink-elevated/40 border border-pclink-border rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-amber-400" />
                        Completar datos de perfil
                      </p>
                      <p className="text-[9px] text-pclink-muted mt-0.5">
                        Suma +{surveyBonus} puntos de regalo.
                      </p>
                    </div>
                    <button
                      onClick={handleCompleteSurvey}
                      disabled={surveyCompleted}
                      className={`rounded px-2.5 py-1 text-[9px] font-bold uppercase transition-all ${
                        surveyCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white text-black hover:bg-white/90 active:scale-95'
                      }`}
                    >
                      {surveyCompleted ? 'Listo ✓' : `+${surveyBonus} Pts`}
                    </button>
                  </div>

                  {/* Task 3: Verify email */}
                  <div className="bg-pclink-elevated/40 border border-pclink-border rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        Verificar casilla de email
                      </p>
                      <p className="text-[9px] text-pclink-muted mt-0.5">
                        Suma +{emailBonus} puntos al club.
                      </p>
                    </div>
                    <button
                      onClick={handleCompleteEmailVerify}
                      disabled={emailCompleted}
                      className={`rounded px-2.5 py-1 text-[9px] font-bold uppercase transition-all ${
                        emailCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white text-black hover:bg-white/90 active:scale-95'
                      }`}
                    >
                      {emailCompleted ? 'Listo ✓' : `+${emailBonus} Pts`}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC DRAWERS INSIDE THE SMARTPHONE MOCKUP */}

            {/* DRAWER 1: MIS RECOMPENSAS (REDEEMED VOUCHERS LIST WITH CODES) */}
            <AnimatePresence>
              {showRewardsDrawer && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute inset-x-0 bottom-0 h-[85%] bg-pclink-surface border-t border-pclink-border rounded-t-[32px] z-50 p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4.5 w-4.5 text-pclink-cyan" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Mis Recompensas Canjeadas</h4>
                      </div>
                      <button
                        onClick={() => setShowRewardsDrawer(false)}
                        className="text-pclink-muted hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-[9px] text-pclink-muted mt-2 mb-4 leading-normal">
                      Copia el código de descuento y pégalo directamente en la barra de cupones de tu carrito para aplicar el descuento.
                    </p>

                    {/* Redeemed List */}
                    <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1 scrollbar-none">
                      {redeemedVouchers.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center">
                          <Gift className="h-10 w-10 text-pclink-border mb-3" />
                          <p className="text-[10px] text-pclink-muted">Aún no canjeaste ningún cupón.</p>
                          <p className="text-[9px] text-pclink-subtle mt-1">¡Gana puntos y canjéalos en el panel anterior!</p>
                        </div>
                      ) : (
                        redeemedVouchers.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="bg-pclink-bg border border-pclink-border rounded-xl p-3.5 shadow-md"
                          >
                            <div className="flex justify-between items-center mb-2.5">
                              <span className="text-[11px] font-black text-pclink-cyan-light uppercase">
                                {coupon.discountPercent}% DESCUENTO VOUCHER
                              </span>
                              <span className="text-[8px] bg-pclink-cyan/15 text-pclink-cyan px-2 py-0.5 rounded-full border border-pclink-cyan/10">
                                Activo
                              </span>
                            </div>

                            {/* Code Copier Bar */}
                            <div className="rounded-lg bg-pclink-elevated/70 border border-pclink-border/50 p-2 flex justify-between items-center">
                              <code className="text-xs font-black text-white font-mono">{coupon.code}</code>
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="text-pclink-cyan hover:text-white p-1 rounded hover:bg-pclink-border transition-colors flex items-center gap-1 text-[9px] font-bold"
                              >
                                {copiedVoucherCode === coupon.code ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400" />
                                    Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    Copiar
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="text-[8px] text-pclink-subtle mt-2 flex justify-between">
                              <span>Canjeado por {coupon.pointsSpent} pts</span>
                              <span>{new Date(coupon.redeemedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions Drawer Footer */}
                  <button
                    onClick={() => setShowRewardsDrawer(false)}
                    className="w-full py-2.5 rounded-xl bg-pclink-border hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-wider transition-colors border border-white/5 mt-4"
                  >
                    CERRAR RECOMPENSAS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DRAWER 2: HISTORIAL DE PUNTOS */}
            <AnimatePresence>
              {showHistoryDrawer && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute inset-x-0 bottom-0 h-[85%] bg-pclink-surface border-t border-pclink-border rounded-t-[32px] z-50 p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4.5 w-4.5 text-amber-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Historial de Puntos</h4>
                      </div>
                      <button
                        onClick={() => setShowHistoryDrawer(false)}
                        className="text-pclink-muted hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* History Audit Log */}
                    <div className="mt-4 space-y-3.5 overflow-y-auto max-h-[380px] pr-1 scrollbar-none">
                      {pointsHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-start py-2.5 border-b border-pclink-border/50 text-xs"
                        >
                          <div>
                            <p className="font-bold text-white text-left leading-normal">{item.description}</p>
                            <p className="text-[9px] text-pclink-subtle mt-0.5 text-left">
                              {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          
                          <div className={`font-black text-right shrink-0 flex items-center gap-0.5 ${
                            item.type === 'redeem' ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {item.type === 'redeem' ? '-' : '+'}
                            {item.points.toLocaleString()}
                            <span className="text-[8px] font-semibold text-white/50 ml-0.2">pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowHistoryDrawer(false)}
                    className="w-full py-2.5 rounded-xl bg-pclink-border hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-wider transition-colors border border-white/5 mt-4"
                  >
                    CERRAR HISTORIAL
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Smartphone Navigation Bar (Replicates adidas icon set) */}
            <div className="absolute bottom-0 inset-x-0 h-14 bg-[#0a0f14] border-t border-white/5 z-40 px-6 flex justify-between items-center text-white/40">
              <div className="flex flex-col items-center cursor-pointer hover:text-white">
                <span className="text-[11px] font-black tracking-tighter italic">pclink</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-white">
                <Search className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-white relative">
                <span className="absolute -top-1.5 -right-1.5 bg-pclink-cyan text-black font-black text-[8px] rounded-full h-3.5 w-3.5 flex items-center justify-center">2</span>
                <span className="text-xs font-black">♥</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:text-white relative">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
              <div
                onClick={() => { setShowRewardsDrawer(false); setShowHistoryDrawer(false) }}
                className="flex flex-col items-center cursor-pointer text-pclink-cyan-light font-black"
              >
                <span className="text-[9px] uppercase tracking-tighter">pcClub</span>
                <div className="w-1 h-1 rounded-full bg-pclink-cyan mt-0.5" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
