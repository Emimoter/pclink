"use client";

import { useState, useEffect, Suspense } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, addDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Landmark, Truck, User, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

function isValidMarDelPlataPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  let national = digits;
  if (digits.startsWith("0054")) {
    national = digits.substring(4);
  } else if (digits.startsWith("54")) {
    national = digits.substring(2);
  }
  if (national.startsWith("9") && (national.length === 11 || national.length === 13)) {
    national = national.substring(1);
  }
  if (national.startsWith("0")) {
    national = national.substring(1);
  }
  if (national.length === 12) {
    if (national.startsWith("1115")) {
      national = "11" + national.substring(4);
    } else if (national.substring(3, 5) === "15") {
      national = national.substring(0, 3) + national.substring(5);
    } else if (national.substring(4, 6) === "15") {
      national = national.substring(0, 4) + national.substring(6);
    }
  }
  return national.length === 10 && national.startsWith("223");
}

interface AddressData {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  number: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

function CheckoutForm() {
  const { items, clearCart, appliedCoupon, subtotal, totalPrice } = useCartStore();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form states
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("Mar del Plata");
  const [state, setState] = useState("Buenos Aires");
  const [zip, setZip] = useState("7600");
  const [addressLabel, setAddressLabel] = useState("Casa");
  
  const [shippingMethod, setShippingMethod] = useState<"standard" | "immediate" | "pickup">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER" | "MERCADO_PAGO" | "CASH">("MERCADO_PAGO");
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checking, setChecking] = useState(false);

  // Enforce Login before checkout
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  const handleResendEmail = async () => {
    if (!user) return;
    setResending(true);
    setErrorMsg("");
    try {
      const { sendEmailVerification } = await import("firebase/auth");
      await sendEmailVerification(user);
      setResendSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error al re-enviar el correo: " + err.message);
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    setChecking(true);
    setErrorMsg("");
    try {
      await user.reload();
      if (user.emailVerified) {
        window.location.reload();
      } else {
        setErrorMsg("Tu correo aún figura como no verificado.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error al comprobar verificación: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  // Saved addresses from Firestore
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Auto-fill logged in user info
  useEffect(() => {
    if (user) {
      setRecipient(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Fetch saved addresses from Firestore
  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    const fetchSavedAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const snapshot = await getDocs(collection(db, "users", user.uid, "addresses"));
        const list: AddressData[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AddressData);
        });
        setSavedAddresses(list);
        
        // Auto-select default address if exists
        const defaultAddr = list.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          applySelectedAddress(defaultAddr);
        } else if (list.length > 0) {
          setSelectedAddressId(list[0].id);
          applySelectedAddress(list[0]);
        }
      } catch (err) {
        console.error("Error loading checkout addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchSavedAddresses();
  }, [user]);

  const applySelectedAddress = (addr: AddressData) => {
    setRecipient(addr.recipient || "");
    setPhone(addr.phone || "");
    setStreet(addr.street || "");
    setNumber(addr.number || "");
    setApartment(addr.apartment || "");
    setCity(addr.city || "Mar del Plata");
    setState(addr.state || "Buenos Aires");
    setZip(addr.zip || "7600");
    setAddressLabel(addr.label || "Casa");
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (id === "new") {
      setRecipient(user?.displayName || "");
      setPhone("");
      setStreet("");
      setNumber("");
      setApartment("");
      setCity("Mar del Plata");
      setState("Buenos Aires");
      setZip("7600");
      setAddressLabel("Casa");
    } else {
      const found = savedAddresses.find(a => a.id === id);
      if (found) {
        applySelectedAddress(found);
      }
    }
  };

  // Calculations from CartStore
  const shippingCost = 
    shippingMethod === "standard" 
      ? 4500 
      : shippingMethod === "immediate" 
      ? 8500 
      : 0;
  const discount = subtotal - totalPrice;
  const total = totalPrice + shippingCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!user) {
      setErrorMsg("Debes iniciar sesión para realizar compras.");
      return;
    }
    if (!user.emailVerified) {
      setErrorMsg("Debes verificar tu correo electrónico para poder comprar.");
      return;
    }
    if (shippingMethod !== "pickup" && !isValidMarDelPlataPhone(phone)) {
      setErrorMsg("Por favor, ingresá un teléfono de contacto de Mar del Plata válido (ej: 2235407787).");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");

    try {
      const orderId = `ord-${Date.now()}`;
      const orderNumber = `PC-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const orderItems = items.map((item) => ({
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.images && item.images.length > 0 ? item.images[0] : "",
      }));

      const shippingAddress = {
        id: selectedAddressId && selectedAddressId !== "new" ? selectedAddressId : `addr-${Date.now()}`,
        label: addressLabel,
        recipient: recipient,
        phone: phone,
        street: shippingMethod === "pickup" ? "Sucursal Central" : street,
        number: shippingMethod === "pickup" ? "—" : number,
        apartment: shippingMethod === "pickup" ? "" : apartment,
        city: shippingMethod === "pickup" ? "Mar del Plata" : city,
        state: shippingMethod === "pickup" ? "Buenos Aires" : state,
        zip: shippingMethod === "pickup" ? "7600" : zip,
        country: "Argentina",
      };

      const orderData = {
        id: orderId,
        number: orderNumber,
        createdAt: Date.now(),
        subtotal: subtotal,
        shippingCost: shippingCost,
        discount: discount,
        total: total,
        status: "PENDING",
        userId: user?.uid || "guest",
        userName: recipient,
        userEmail: email,
        paymentMethod: 
          paymentMethod === "TRANSFER" 
            ? "Transferencia Bancaria" 
            : paymentMethod === "MERCADO_PAGO" 
            ? "Mercado Pago" 
            : "Efectivo / Contra-entrega",
        shippingAddress: shippingAddress,
        items: orderItems,
        userPhone: phone,
        statusHistory: {
          PENDING: Date.now(),
        },
      };

      // 1. Write the order to Firestore
      await setDoc(doc(db, "orders", orderId), orderData);

      // 2. Sync shipping address to user's address collection if authenticated and not pickup
      if (user && shippingMethod !== "pickup") {
        await setDoc(
          doc(db, "users", user.uid, "addresses", shippingAddress.id),
          { ...shippingAddress, isDefault: savedAddresses.length === 0 }
        );
      }

      // 3. Remove applied coupon from user's store since it was consumed
      if (user && appliedCoupon) {
        useUserStore.getState().removeSavedCoupon(appliedCoupon.code);
      }

      // 4. Handle checkout final step depending on payment method
      if (paymentMethod === "MERCADO_PAGO") {
        const { httpsCallable } = await import("firebase/functions");
        const { functions } = await import("@/lib/firebase/config");
        
        const createPreferenceFn = httpsCallable(functions, "createPreference");
        const baseUrl = window.location.origin;
        const result = await createPreferenceFn({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          shippingCost: shippingCost,
          email: email,
          orderId: orderId,
          backUrls: {
            success: `${baseUrl}/checkout/success?orderId=${orderId}&status=approved`,
            failure: `${baseUrl}/checkout/success?orderId=${orderId}&status=failure`,
            pending: `${baseUrl}/checkout/success?orderId=${orderId}&status=pending`,
          },
        });

        const data = result.data as { initPoint?: string };
        if (data && data.initPoint) {
          window.location.href = data.initPoint;
        } else {
          throw new Error("No se pudo iniciar el pago con Mercado Pago.");
        }
      } else {
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}`);
      }
    } catch (err: any) {
      console.error("Order submission error:", err);
      setErrorMsg("Ocurrió un error al procesar el pedido. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-lg">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-6">
          <Truck className="w-6 h-6 text-muted" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-3">El carrito está vacío</h2>
        <p className="text-muted mb-8">
          No hay artículos listos para la compra. Agregá productos para poder iniciar el checkout.
        </p>
        <Link href="/products">
          <Button variant="primary" className="rounded-full px-8">
            Ir a la tienda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-12 tracking-tight">Finalizar Compra</h1>

      {!user.emailVerified && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl mb-8">
          <h3 className="text-lg font-bold text-amber-800 mb-2 flex items-center gap-2">
            ⚠️ Verifica tu dirección de correo electrónico
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            Te enviamos un correo electrónico de verificación a <strong>{user.email}</strong>. Debes hacer clic en el enlace de verificación para poder realizar compras.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              disabled={checking}
              onClick={handleCheckVerification}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {checking ? "Comprobando..." : "Ya verifiqué"}
            </button>
            <button
              type="button"
              disabled={resending}
              onClick={handleResendEmail}
              className="px-4 py-2 border border-accent text-accent hover:bg-accent/5 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {resendSuccess ? "Re-enviado ✓" : resending ? "Re-enviando..." : "Re-enviar email"}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl mb-8">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Shipping option */}
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-accent" />
              Método de Entrega
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setShippingMethod("standard")}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-32 transition-all ${
                  shippingMethod === "standard"
                    ? "border-accent ring-2 ring-accent/10 bg-accent/[0.02]"
                    : "border-border hover:border-muted bg-transparent"
                }`}
              >
                <div className="font-bold text-primary">Envío Estándar</div>
                <div className="text-xs text-muted font-medium mt-1">Mar del Plata y alrededores. Costo: $4.500</div>
              </button>
              <button
                type="button"
                onClick={() => setShippingMethod("immediate")}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-32 transition-all ${
                  shippingMethod === "immediate"
                    ? "border-accent ring-2 ring-accent/10 bg-accent/[0.02]"
                    : "border-border hover:border-muted bg-transparent"
                }`}
              >
                <div className="font-bold text-primary">Envío Inmediato</div>
                <div className="text-xs text-muted font-medium mt-1">Envío express en el día. Costo: $8.500</div>
              </button>
              <button
                type="button"
                onClick={() => setShippingMethod("pickup")}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-32 transition-all ${
                  shippingMethod === "pickup"
                    ? "border-accent ring-2 ring-accent/10 bg-accent/[0.02]"
                    : "border-border hover:border-muted bg-transparent"
                }`}
              >
                <div className="font-bold text-primary">Retiro en Sucursal</div>
                <div className="text-xs text-muted font-medium mt-1">Gratis en nuestro local de Mar del Plata.</div>
              </button>
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-5">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              Datos del Cliente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Nombre de quien recibe
                </label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Teléfono de contacto
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-mono"
                  placeholder="2235555555"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                  placeholder="nombre@ejemplo.com"
                  disabled={!!user}
                />
              </div>
            </div>
          </div>

          {/* Delivery Address (only if delivery) */}
          {shippingMethod !== "pickup" && (
            <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-5">
              <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                Dirección de Envío
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                {user && savedAddresses.length > 0 && (
                  <div className="sm:col-span-12 border-b border-border pb-4 mb-4">
                    <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                      Seleccionar Dirección Guardada
                    </label>
                    {loadingAddresses ? (
                      <div className="text-xs text-muted">Cargando direcciones...</div>
                    ) : (
                      <select
                        value={selectedAddressId}
                        onChange={handleAddressChange}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-primary font-medium"
                      >
                        {savedAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.label} — {addr.street} {addr.number} ({addr.recipient})
                          </option>
                        ))}
                        <option value="new">Nueva Dirección...</option>
                      </select>
                    )}
                  </div>
                )}

                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Calle
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                    placeholder="San Martín"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                    placeholder="1234"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Depto / Piso (Opcional)
                  </label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                    placeholder="Piso 2 Depto B"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Nombre o Etiqueta de Dirección
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                    placeholder="Casa / Oficina"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Provincia
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    C. Postal
                  </label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Notice */}
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Medio de Pago
            </h3>
            <p className="text-sm text-muted font-medium">
              El pago se procesará de forma segura a través de <strong>Mercado Pago</strong> (saldo, tarjetas de débito o crédito).
            </p>
          </div>
        </div>

        {/* Right Side: Cart Summary (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 bg-surface border border-border rounded-3xl p-6 md:p-8">
          <h3 className="text-lg font-bold text-primary mb-6">Resumen de Compra</h3>

          {/* Cart items list */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6 border-b border-border pb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold bg-background text-muted px-2 py-1 rounded border border-border">
                    {item.quantity}x
                  </span>
                  <span className="text-primary truncate font-semibold">{item.name}</span>
                </div>
                <span className="font-bold text-primary shrink-0">
                  ${(item.price * item.quantity).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>

          {/* Money totals */}
          <div className="space-y-3 text-sm font-medium border-b border-border pb-6 mb-6">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Costo de envío</span>
              <span className="font-mono">
                {shippingCost > 0 ? `$${shippingCost.toLocaleString("es-AR")}` : "Gratis"}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-bold">
                <span>Descuento ({appliedCoupon?.discountPercent}%)</span>
                <span className="font-mono">-${discount.toLocaleString("es-AR")}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline mb-8">
            <span className="font-extrabold text-primary text-lg">Total</span>
            <span className="text-3xl font-black text-accent tracking-tight">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>

          <Button type="submit" disabled={submitting || !user.emailVerified} className="w-full rounded-xl py-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Confirmar Compra"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
