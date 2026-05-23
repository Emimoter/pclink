"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { useAuth } from "@/hooks/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, Ticket, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CartDrawer() {
  const { 
    isOpen, 
    setIsOpen, 
    items, 
    removeItem, 
    updateQuantity, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
    subtotal,
    totalPrice 
  } = useCartStore();

  const { savedCoupons } = useUserStore();
  const { user } = useAuth();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Disable page scroll when cart drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleApplyCoupon = (code: string) => {
    setCouponError("");
    setCouponSuccess("");
    const res = applyCoupon(code);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput("");
      // Clear success message after 3 seconds
      setTimeout(() => setCouponSuccess(""), 3000);
    } else {
      setCouponError(res.message);
      setTimeout(() => setCouponError(""), 3000);
    }
  };

  const discountAmount = subtotal - totalPrice;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black backdrop-blur-xs"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-primary tracking-tight">Tu Carrito</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-surface rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted hover:text-primary" />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                    <ShoppingBag className="w-6 h-6 text-muted" />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">El carrito está vacío</h3>
                  <p className="text-muted text-sm max-w-xs mb-8">
                    Explorá nuestras categorías y agregá los componentes que estás buscando.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full"
                  >
                    Volver a la tienda
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 bg-surface border border-border rounded-2xl relative group"
                      >
                        {/* Item Image */}
                        <div className="w-20 h-20 bg-background border border-border rounded-xl p-2 shrink-0 flex items-center justify-center relative">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                          ) : (
                            <span className="text-xs text-muted">Sin foto</span>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-primary leading-tight truncate pr-6">
                              {item.name}
                            </h4>
                            <span className="text-xs text-muted mt-1 block uppercase tracking-wider font-mono text-[10px]">
                              {item.category.replace(/-/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-border rounded-lg bg-background">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, Math.max(1, item.quantity - 1))
                                }
                                className="p-1.5 text-muted hover:text-primary transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-mono font-bold text-primary">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.min(item.stock, item.quantity + 1)
                                  )
                                }
                                className="p-1.5 text-muted hover:text-primary transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price */}
                            <span className="text-sm font-bold text-primary font-mono">
                              ${(item.price * item.quantity).toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute top-4 right-4 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-muted transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Application Area */}
                  <div className="border-t border-border/60 pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-accent" />
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Cupones PcClub</h4>
                    </div>

                    {appliedCoupon ? (
                      /* Coupon already applied */
                      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-between">
                        <div className="text-xs space-y-0.5">
                          <div className="font-bold text-accent tracking-wide uppercase font-mono">{appliedCoupon.code}</div>
                          <div className="text-muted">{appliedCoupon.description}</div>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      /* No coupon applied */
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Código de cupón"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-primary focus:outline-none focus:border-accent font-mono uppercase"
                          />
                          <Button
                            onClick={() => handleApplyCoupon(couponInput)}
                            variant="secondary"
                            className="rounded-xl px-4 text-xs font-bold py-2.5 h-auto"
                          >
                            Aplicar
                          </Button>
                        </div>

                        {couponError && (
                          <div className="text-[10px] text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {couponError}
                          </div>
                        )}
                        {couponSuccess && (
                          <div className="text-[10px] text-green-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 shrink-0" /> {couponSuccess}
                          </div>
                        )}

                        {/* Suggested Coupons from useUserStore */}
                        {user && savedCoupons.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                              Tus cupones canjeados
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {savedCoupons.map((coupon) => (
                                <button
                                  key={coupon.code}
                                  onClick={() => handleApplyCoupon(coupon.code)}
                                  className="text-[10px] font-bold px-2.5 py-1 bg-surface border border-border hover:border-accent rounded-lg text-primary transition-all font-mono"
                                >
                                  {coupon.discountPercent}% OFF
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-surface space-y-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted text-xs">
                    <span>Subtotal</span>
                    <span className="font-mono">${subtotal.toLocaleString("es-AR")}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 text-xs font-semibold">
                      <span>Descuento ({appliedCoupon.discountPercent}%)</span>
                      <span className="font-mono">-${discountAmount.toLocaleString("es-AR")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="font-bold text-primary">Total</span>
                    <span className="text-2xl font-extrabold text-primary tracking-tight font-mono">
                      ${totalPrice.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Link href="/checkout" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-xl py-6 flex items-center justify-center gap-2">
                      Iniciar Compra
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-xl py-6"
                  >
                    Seguir comprando
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

