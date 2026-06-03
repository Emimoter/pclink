"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/useUserStore";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Award, Coins, Ticket, ArrowRight, Check, Copy, Loader2, Shield, Gift, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface OrderData {
  total: number;
  status: string;
}

export default function PcClubPage() {
  const { user, loading: authLoading } = useAuth();
  const { savedCoupons, pointsSpent, addSavedCoupon } = useUserStore();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemedCoupon, setRedeemedCoupon] = useState<{ code: string; percent: number } | null>(null);

  // Fetch user orders from Firestore to calculate points
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    async function fetchOrders() {
      if (!user) return;
      setLoadingOrders(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedOrders: OrderData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedOrders.push({
            total: data.total || 0,
            status: data.status || "PENDING",
          });
        });
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders for PC Club:", error);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchOrders();
  }, [user]);

  // Calculations
  const ordersCount = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  // Tier rules
  let tier: "Bronce" | "Plata" | "Oro" = "Bronce";
  let multiplier = 1.0;
  let nextTierMessage = "";
  let progressToNext = 0; // percentage

  if (ordersCount >= 10 || totalSpent >= 500000) {
    tier = "Oro";
    multiplier = 1.2;
    nextTierMessage = "¡Alcanzaste el nivel máximo de beneficios!";
    progressToNext = 100;
  } else if (ordersCount >= 5 || totalSpent >= 250000) {
    tier = "Plata";
    multiplier = 1.1;
    const remainingOrders = 10 - ordersCount;
    const remainingSpent = 500000 - totalSpent;
    nextTierMessage = `Faltan ${remainingOrders} compras o $${remainingSpent.toLocaleString("es-AR")} para ser Oro.`;
    const ordersProgress = (ordersCount - 5) / 5;
    const spentProgress = (totalSpent - 250000) / 250000;
    progressToNext = Math.min(100, Math.round(Math.max(ordersProgress, spentProgress) * 100));
  } else {
    tier = "Bronce";
    multiplier = 1.0;
    const remainingOrders = 5 - ordersCount;
    const remainingSpent = 250000 - totalSpent;
    nextTierMessage = `Faltan ${remainingOrders} compras o $${remainingSpent.toLocaleString("es-AR")} para ser Plata.`;
    const ordersProgress = ordersCount / 5;
    const spentProgress = totalSpent / 250000;
    progressToNext = Math.min(100, Math.round(Math.max(ordersProgress, spentProgress) * 100));
  }

  // Base Points: $100 spent = 1 point * multiplier + 800 welcome points
  const basePoints = Math.floor((totalSpent / 100) * multiplier) + 800;
  const netPoints = Math.max(0, basePoints - pointsSpent);

  // Available vouchers to redeem
  const VOUCHERS = [
    { percent: 15, cost: 1000, title: "Voucher 15% OFF", desc: "Válido para cualquier componente de hardware o notebook." },
    { percent: 20, cost: 1800, title: "Voucher 20% OFF", desc: "Válido para periféricos, accesorios y monitores." },
    { percent: 25, cost: 2500, title: "Voucher 25% OFF", desc: "Válido en la compra final de periféricos seleccionados." },
  ];

  // Handle voucher redemption
  const handleRedeem = (percent: number, cost: number) => {
    if (netPoints < cost) return;

    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `PCCLUB-${percent}-${randomDigits}`;

    const newCoupon = {
      code,
      discountPercent: percent,
      redeemedAt: Date.now(),
    };

    addSavedCoupon(newCoupon, cost);
    setRedeemedCoupon({ code, percent });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (authLoading) {
    return <PcClubSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-background min-h-screen py-20 px-4 relative overflow-hidden"
    >
      {/* Background blurs */}
      <div className="absolute top-10 left-0 w-[400px] h-[400px] bg-accent/4 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="container mx-auto max-w-5xl relative z-10">
        
        {/* Header Hero (Asymmetric split layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-accent/5 border border-accent/15 rounded-full text-accent text-[9px] font-black tracking-widest uppercase font-sans">
              <Sparkles className="w-3.5 h-3.5" /> Club de Fidelización
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tighter leading-none font-sans">
              PClink Club
            </h1>
            <p className="text-muted text-sm md:text-base max-w-lg leading-relaxed font-medium">
              Sumá puntos con cada una de tus compras de tecnología y canjealos por cupones de descuento exclusivos. Registrate, sumá y obtené el mejor hardware al mejor precio.
            </p>
            {!user && (
              <div className="flex gap-4">
                <Link href="/auth">
                  <Button className="rounded-xl px-6 py-4.5 text-xs font-bold uppercase tracking-wider">
                    Unirme al Club
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="secondary" className="rounded-xl px-6 py-4.5 text-xs font-bold uppercase tracking-wider">
                    Ver Catálogo
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
          
          {/* Card Component (Frosted Dark Titanium Credit Card Design) */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <motion.div 
              whileHover={{ y: -4, rotate: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[2.2rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] flex flex-col justify-between aspect-video relative overflow-hidden group cursor-default"
            >
              {/* Internal glow meshes */}
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-all duration-500 pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]" />
              
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase font-sans">
                    PClink Club
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-[9px] font-black uppercase tracking-widest font-sans">
                  {tier} Member
                </div>
              </div>
              
              <div className="mt-8 z-10">
                <div className="text-[8px] font-black text-zinc-500 tracking-wider mb-1">MEMBER ACCOUNT</div>
                <div className="text-base font-black text-white tracking-tight uppercase font-sans">
                  {user ? user.displayName || "Socio Registrado" : "Invitado Especial"}
                </div>
                {user && (
                  <div className="mt-3 text-[10px] text-zinc-400 font-sans font-bold tracking-wider flex items-center gap-1.5 min-h-[16px]">
                    <Coins className="w-3.5 h-3.5 text-accent" />
                    {loadingOrders ? (
                      <div className="h-3 w-28 bg-zinc-800 animate-pulse rounded" />
                    ) : (
                      <span>{netPoints} PUNTOS DISPONIBLES</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {user ? (
          /* User Dashboard View */
          <div className="space-y-16">
            {/* Status Panel (Sleek Border-Grouped Stats Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Points */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden hover:shadow-[0_15px_30px_rgba(0,0,0,0.005)] transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest font-sans">Mis Puntos</span>
                  <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-4xl lg:text-5xl font-black text-primary tracking-tight font-sans min-h-[40px] flex items-center">
                  {loadingOrders ? (
                    <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800/80 animate-pulse rounded-lg" />
                  ) : (
                    netPoints
                  )}
                </div>
                <p className="text-[10px] font-semibold text-muted mt-2">
                  Saldo disponible para canjear
                </p>
                <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted block">Ganados:</span>
                    {loadingOrders ? (
                      <div className="h-3.5 w-12 bg-zinc-200 dark:bg-zinc-800/60 animate-pulse rounded mt-0.5" />
                    ) : (
                      <span className="font-extrabold text-primary">{basePoints}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted block">Canjeados:</span>
                    <span className="font-extrabold text-primary">{pointsSpent}</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Tier */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="bg-surface border border-border rounded-[2rem] p-8 hover:shadow-[0_15px_30px_rgba(0,0,0,0.005)] transition-all duration-300 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest font-sans">Nivel Actual</span>
                    <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  {loadingOrders ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800/80 animate-pulse rounded-lg" />
                        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800/50 animate-pulse rounded-md" />
                      </div>
                      <div className="h-3.5 w-48 bg-zinc-100 dark:bg-zinc-800/40 animate-pulse rounded mt-3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-primary tracking-tight font-sans">{tier}</span>
                        <span className="text-[9px] font-black text-accent px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md">
                          {multiplier}x Puntos
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-muted mt-3 leading-relaxed">
                        {nextTierMessage}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Progress bar to next tier */}
                {loadingOrders ? (
                  <div className="mt-6 space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-2.5 w-12 bg-zinc-100 dark:bg-zinc-800/30 animate-pulse rounded" />
                      <div className="h-2.5 w-8 bg-zinc-100 dark:bg-zinc-800/30 animate-pulse rounded" />
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden" />
                  </div>
                ) : (
                  tier !== "Oro" && (
                    <div className="mt-6 space-y-1.5">
                      <div className="flex justify-between text-[9px] text-muted font-bold">
                        <span>Progreso</span>
                        <span>{progressToNext}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progressToNext}%` }} />
                      </div>
                    </div>
                  )
                )}
              </motion.div>

              {/* Card 3: Stats Summary */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: [0.32, 0.72, 0, 1] }}
                className="bg-surface border border-border rounded-[2rem] p-8 hover:shadow-[0_15px_30px_rgba(0,0,0,0.005)] transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest font-sans">Historial Club</span>
                  <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Gift className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted font-medium">Puntos de Bienvenida:</span>
                    <span className="font-extrabold text-primary">+800</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2 h-6 items-center">
                    <span className="text-muted font-medium">Compras Realizadas:</span>
                    {loadingOrders ? (
                      <div className="h-3.5 w-8 bg-zinc-200 dark:bg-zinc-800/60 animate-pulse rounded" />
                    ) : (
                      <span className="font-extrabold text-primary">{ordersCount}</span>
                    )}
                  </div>
                  <div className="flex justify-between pb-0.5 h-6 items-center">
                    <span className="text-muted font-medium">Facturación Total:</span>
                    {loadingOrders ? (
                      <div className="h-3.5 w-16 bg-zinc-200 dark:bg-zinc-800/60 animate-pulse rounded" />
                    ) : (
                      <span className="font-extrabold text-primary">${totalSpent.toLocaleString("es-AR")}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Vouchers Section */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.32, 0.72, 0, 1] }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tight font-sans">Canjear Beneficios</h2>
                <p className="text-muted text-xs mt-1 leading-relaxed max-w-[65ch]">
                  Elegí el descuento que más te convenga y canjealo al instante con tus puntos acumulados.
                </p>
              </div>

              {/* Unique cut-out Coupon Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {VOUCHERS.map((v, idx) => {
                  const canRedeem = netPoints >= v.cost;
                  return (
                    <motion.div
                      key={v.percent}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + idx * 0.1, ease: [0.32, 0.72, 0, 1] }}
                      whileHover={{ y: -4 }}
                      className="bg-surface border border-border rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,0,0,0.015)] hover:border-slate-300 transition-shadow transition-colors duration-300 relative overflow-hidden"
                    >
                      {/* Decorative ticket notch circles on left/right edges */}
                      <div className="absolute top-1/3 -left-3 w-6 h-6 bg-background rounded-full border-r border-border pointer-events-none z-10" />
                      <div className="absolute top-1/3 -right-3 w-6 h-6 bg-background rounded-full border-l border-border pointer-events-none z-10" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-black text-accent font-sans">{v.percent}% OFF</span>
                          <span className="text-[9px] font-black px-2.5 py-1 bg-accent/5 border border-accent/20 rounded-xl text-accent font-sans uppercase tracking-widest">
                            {v.cost} pts
                          </span>
                        </div>
                        
                        {/* Dotted divider line */}
                        <div className="border-t border-dashed border-border/80 my-3" />

                        <div className="space-y-2">
                          <h3 className="font-extrabold text-primary text-xs uppercase tracking-wider">{v.title}</h3>
                          <p className="text-muted text-[11px] leading-relaxed">{v.desc}</p>
                        </div>
                      </div>

                      <div className="mt-8">
                        <Button
                          onClick={() => handleRedeem(v.percent, v.cost)}
                          disabled={!canRedeem}
                          className="w-full rounded-2xl py-4 text-[10px] tracking-wider uppercase font-black"
                          variant={canRedeem ? "primary" : "secondary"}
                        >
                          {canRedeem ? "Canjear Voucher" : "Puntos Insuficientes"}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Redirection to Profile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85, ease: [0.32, 0.72, 0, 1] }}
              whileHover={{ y: -2 }}
              className="bg-surface border border-border rounded-[2.2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0 border border-accent/20">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-primary text-xs uppercase tracking-wider">Mis Cupones Canjeados</h3>
                  <p className="text-xs text-muted">Revisá y administrá tus códigos de descuento guardados.</p>
                </div>
              </div>
              <Link href="/profile">
                <Button variant="outline" className="rounded-xl text-[10px] font-black uppercase tracking-wider gap-1.5 py-4">
                  Ir a mi Perfil <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        ) : (
          /* Marketing / Non-Logged In View */
          <div className="space-y-20">
            {/* Rules Grid (Border-Grouped Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="bg-surface border border-border rounded-[2rem] p-8 space-y-4 hover:shadow-[0_15px_30px_rgba(0,0,0,0.005)] transition-all duration-300"
              >
                <div className="w-12 h-12 bg-accent/5 border border-accent/15 rounded-2xl flex items-center justify-center text-accent">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-primary text-sm uppercase tracking-wider">Sumás en Cada Compra</h3>
                <p className="text-muted text-xs leading-relaxed">
                  Por cada $100 gastados en nuestro sitio web, acumulás 1 punto. Aumentá tus compras para multiplicar tus recompensas.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="bg-surface border border-border rounded-[2rem] p-8 space-y-4 hover:shadow-[0_15px_30px_rgba(0,0,0,0.005)] transition-all duration-300"
              >
                <div className="w-12 h-12 bg-accent/5 border border-accent/15 rounded-2xl flex items-center justify-center text-accent">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-primary text-sm uppercase tracking-wider">Subís de Categoría</h3>
                <p className="text-muted text-xs leading-relaxed">
                  Alcanzá Plata (1.1x puntos) a partir de 5 compras o Oro (1.2x puntos) desde 10 compras. ¡Los clientes fieles ganan más rápido!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="bg-surface border border-border rounded-[2rem] p-8 space-y-4 hover:shadow-[0_15px_30px_rgba(0,0,0,0.005)] transition-all duration-300"
              >
                <div className="w-12 h-12 bg-accent/5 border border-accent/15 rounded-2xl flex items-center justify-center text-accent">
                  <Ticket className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-primary text-sm uppercase tracking-wider">Canjeás Descuentos</h3>
                <p className="text-muted text-xs leading-relaxed">
                  Usá tus puntos acumulados para canjear cupones del 15%, 20% o 25% de descuento directo en tus siguientes carritos de compras.
                </p>
              </motion.div>
            </div>

            {/* Info Welcome Banner (Double Layered Card) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="bg-surface border border-border rounded-[2.2rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
            >
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-accent/4 rounded-full blur-[80px] pointer-events-none z-0" />
              
              <div className="max-w-2xl space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/5 border border-accent/15 rounded-full text-accent text-[9px] font-black tracking-widest uppercase font-sans">
                  Regalo de bienvenida
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-sans">
                  800 Puntos de Regalo al Registrarte
                </h2>
                <p className="text-muted text-xs md:text-sm leading-relaxed max-w-[55ch]">
                  Creá tu cuenta de PC Link hoy mismo y recibí automáticamente 800 puntos de regalo. Solo registrándote ya estás casi listo para tu primer canje de descuento.
                </p>
              </div>
              
              <div className="relative z-10 shrink-0">
                <Link href="/auth">
                  <Button className="rounded-xl px-8 py-5 text-xs font-bold uppercase tracking-wider gap-2">
                    <LogIn className="w-4 h-4" /> Registrarme Ahora
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Redeemed Coupon Dialog Overlay ( frosted-glass style with tight borders) */}
      <AnimatePresence>
        {redeemedCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setRedeemedCoupon(null)}
              className="fixed inset-0 bg-zinc-950"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-surface/90 backdrop-blur-xl border border-border rounded-[2.2rem] p-8 max-w-md w-full shadow-[0_30px_70px_rgba(0,0,0,0.12)] relative z-10 space-y-6 text-center"
            >
              <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center text-accent mx-auto shadow-xs">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-primary tracking-tight font-sans">¡Canje Exitoso!</h2>
                <p className="text-muted text-xs leading-relaxed px-4">
                  Canjeaste {redeemedCoupon.percent === 15 ? 1000 : redeemedCoupon.percent === 20 ? 1800 : 2500} puntos por un cupón de {redeemedCoupon.percent}% de descuento.
                </p>
              </div>

              {/* Coupon Box */}
              <div className="bg-background border border-border rounded-2xl p-4.5 flex items-center justify-between gap-4">
                <div className="text-left">
                  <div className="text-[8px] font-black text-muted uppercase tracking-widest">CÓDIGO DE CUPÓN</div>
                  <div className="text-base font-extrabold text-primary tracking-tight font-mono">{redeemedCoupon.code}</div>
                </div>
                <Button
                  onClick={() => copyToClipboard(redeemedCoupon.code)}
                  variant="secondary"
                  size="icon"
                  className="rounded-xl shrink-0 hover:scale-105 active:scale-95 transition-transform"
                >
                  {copiedCode === redeemedCoupon.code ? (
                    <Check className="w-4 h-4 text-accent" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted" />
                  )}
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => setRedeemedCoupon(null)}
                  className="w-full rounded-2xl py-4.5 text-xs font-black uppercase tracking-wider"
                >
                  Entendido
                </Button>
                <p className="text-[9px] text-muted leading-relaxed px-6">
                  Podés encontrar este código en cualquier momento en tu sección de Perfil o aplicarlo directamente desde la barra de resumen en tu carrito de compras.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PcClubSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background min-h-screen py-20 px-4 relative overflow-hidden"
    >
      {/* Background blurs */}
      <div className="absolute top-10 left-0 w-[400px] h-[400px] bg-accent/4 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Header Hero Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-center">
          <div className="lg:col-span-7 space-y-6">
            {/* Pill */}
            <div className="w-40 h-6 bg-zinc-200 dark:bg-zinc-800/60 rounded-full animate-pulse border border-zinc-300 dark:border-zinc-800/80" />
            
            {/* Title */}
            <div className="space-y-3">
              <div className="h-12 w-2/3 bg-zinc-200 dark:bg-zinc-800/80 rounded-2xl animate-pulse" />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-205 dark:bg-zinc-800/50 rounded animate-pulse" />
              <div className="h-4 w-[90%] bg-zinc-205 dark:bg-zinc-800/50 rounded animate-pulse" />
              <div className="h-4 w-[75%] bg-zinc-205 dark:bg-zinc-800/50 rounded animate-pulse" />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <div className="w-32 h-11 bg-zinc-200 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
              <div className="w-32 h-11 bg-zinc-200 dark:bg-zinc-800/40 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Member Card Skeleton */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[2.2rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] flex flex-col justify-between aspect-video relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.06),rgba(255,255,255,0))]" />
              
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse shrink-0" />
                  <div className="w-20 h-3 bg-zinc-800 animate-pulse rounded" />
                </div>
                <div className="w-24 h-5 rounded-full bg-zinc-800 animate-pulse" />
              </div>
              
              <div className="mt-8 z-10 space-y-3">
                <div className="w-24 h-2 bg-zinc-800 animate-pulse rounded" />
                <div className="w-40 h-5 bg-zinc-800 animate-pulse rounded-lg" />
                <div className="w-48 h-3.5 bg-zinc-800 animate-pulse rounded-md mt-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Skeleton */}
        <div className="space-y-16">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-surface border border-border rounded-[2rem] p-8 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800/50 rounded animate-pulse" />
                <div className="w-8 h-8 bg-zinc-250 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
              </div>
              <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800/80 rounded-xl animate-pulse" />
              <div className="h-3 w-36 bg-zinc-200 dark:bg-zinc-800/40 rounded animate-pulse" />
              <div className="pt-4 border-t border-border/60 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="h-2 w-10 bg-zinc-200 dark:bg-zinc-800/30 rounded animate-pulse" />
                  <div className="h-3.5 w-14 bg-zinc-200 dark:bg-zinc-800/60 rounded animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-10 bg-zinc-200 dark:bg-zinc-800/30 rounded animate-pulse" />
                  <div className="h-3.5 w-14 bg-zinc-200 dark:bg-zinc-800/60 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface border border-border rounded-[2rem] p-8 space-y-4 flex flex-col justify-between h-[220px]">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800/50 rounded animate-pulse" />
                  <div className="w-8 h-8 bg-zinc-250 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800/80 rounded-xl animate-pulse" />
                  <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800/50 rounded-md animate-pulse" />
                </div>
                <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800/40 rounded animate-pulse" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <div className="h-2 w-12 bg-zinc-200 dark:bg-zinc-800/30 rounded animate-pulse" />
                  <div className="h-2 w-8 bg-zinc-200 dark:bg-zinc-800/30 rounded animate-pulse" />
                </div>
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800/30 rounded-full overflow-hidden" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-surface border border-border rounded-[2rem] p-8 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-800/50 rounded animate-pulse" />
                <div className="w-8 h-8 bg-zinc-250 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
              </div>
              <div className="space-y-3.5 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center border-b border-border/40 pb-2 last:border-0 last:pb-0 h-6">
                    <div className="h-3.5 w-28 bg-zinc-200 dark:bg-zinc-800/40 rounded animate-pulse" />
                    <div className="h-3.5 w-10 bg-zinc-200 dark:bg-zinc-800/60 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vouchers section skeleton */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-800/80 rounded-lg animate-pulse" />
              <div className="h-3.5 w-96 bg-zinc-200 dark:bg-zinc-800/40 rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden h-[300px]"
                >
                  {/* Decorative notch circles */}
                  <div className="absolute top-1/3 -left-3 w-6 h-6 bg-background rounded-full border-r border-border pointer-events-none z-10" />
                  <div className="absolute top-1/3 -right-3 w-6 h-6 bg-background rounded-full border-l border-border pointer-events-none z-10" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800/80 rounded-xl animate-pulse" />
                      <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800/60 rounded-xl animate-pulse" />
                    </div>
                    
                    <div className="border-t border-dashed border-border/80 my-3" />

                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800/60 rounded animate-pulse" />
                      <div className="h-3.5 w-full bg-zinc-200 dark:bg-zinc-800/40 rounded animate-pulse" />
                      <div className="h-3.5 w-[85%] bg-zinc-200 dark:bg-zinc-800/40 rounded animate-pulse" />
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="w-full h-11 bg-zinc-200 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
