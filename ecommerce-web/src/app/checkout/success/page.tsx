"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageCircle, 
  Landmark, 
  Copy, 
  Check, 
  RefreshCw 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const statusParam = searchParams.get("status");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchAndProcessOrder = async () => {
      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          let orderData = docSnap.data();

          // If Mercado Pago payment was approved and the order is still PENDING
          if (statusParam === "approved" && orderData.status === "PENDING") {
            const { updateDoc } = await import("firebase/firestore");
            const updatedHistory = {
              ...(orderData.statusHistory || {}),
              PAID: Date.now()
            };

            await updateDoc(docRef, {
              status: "PAID",
              statusHistory: updatedHistory
            });

            orderData = {
              ...orderData,
              status: "PAID",
              statusHistory: updatedHistory
            };

            // Clear shopping cart on success
            const { useCartStore } = await import("@/store/useCartStore");
            useCartStore.getState().clearCart();
          }

          setOrder(orderData);
        }
      } catch (err) {
        console.error("Error loading/processing order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessOrder();
  }, [orderId, statusParam]);

  const handleCopy = (text: string, type: "alias" | "cbu") => {
    navigator.clipboard.writeText(text);
    if (type === "alias") {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else {
      setCopiedCbu(true);
      setTimeout(() => setCopiedCbu(false), 2000);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setRetryingPayment(true);
    try {
      const { httpsCallable } = await import("firebase/functions");
      const { functions } = await import("@/lib/firebase/config");

      const createPreferenceFn = httpsCallable(functions, "createPreference");
      const baseUrl = window.location.origin;
      const result = await createPreferenceFn({
        items: order.items.map((item: any) => ({
          id: item.productId,
          quantity: item.quantity,
        })),
        shippingCost: order.shippingCost || 0,
        email: order.userEmail || "",
        backUrls: {
          success: `${baseUrl}/checkout/success?orderId=${order.id}&status=approved`,
          failure: `${baseUrl}/checkout/success?orderId=${order.id}&status=failure`,
          pending: `${baseUrl}/checkout/success?orderId=${order.id}&status=pending`,
        },
      });

      const data = result.data as { initPoint?: string };
      if (data && data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error("No se pudo regenerar el link de pago.");
      }
    } catch (err) {
      console.error("Error retrying payment:", err);
      alert("No se pudo iniciar el reintento de pago. Intentá de nuevo.");
    } finally {
      setRetryingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 flex items-center justify-center max-w-7xl">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-7xl">
        <h2 className="text-2xl font-bold text-primary mb-4">Pedido no encontrado</h2>
        <p className="text-muted mb-8">No pudimos encontrar la información de tu compra.</p>
        <Link href="/">
          <Button variant="primary">Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hola PC Link! Realicé el pedido #${order.number} por la web por un total de $${order.total.toLocaleString("es-AR")}.`
  );
  // Real company WhatsApp number (Av. Carlos Tejedor 554): 223 546 8972
  const whatsappUrl = `https://wa.me/5492235468972?text=${whatsappMessage}`;

  // Determine top card styling based on order state / Mercado Pago callback status
  let cardBg = "bg-green-50 border-green-200 text-green-500";
  let cardIcon = <CheckCircle2 className="w-8 h-8" />;
  let cardSubtitle = "Compra Exitosa";
  let cardTitle = "¡Gracias por tu compra!";
  let cardDesc = "Tu pedido ha sido registrado con éxito en nuestro sistema.";

  if (order.paymentMethod === "Mercado Pago") {
    if (statusParam === "failure") {
      cardBg = "bg-red-50 border-red-200 text-red-500";
      cardIcon = <XCircle className="w-8 h-8" />;
      cardSubtitle = "Pago Cancelado / Fallido";
      cardTitle = "No pudimos procesar tu pago";
      cardDesc = "El pago fue cancelado o rechazado por Mercado Pago. Podés volver a intentarlo a continuación.";
    } else if (statusParam === "pending") {
      cardBg = "bg-amber-50 border-amber-200 text-amber-500";
      cardIcon = <AlertCircle className="w-8 h-8" />;
      cardSubtitle = "Pago Pendiente";
      cardTitle = "Tu pago está en proceso";
      cardDesc = "Mercado Pago se encuentra procesando la transacción. Te informaremos una vez acreditado.";
    } else {
      cardSubtitle = "Pago Aprobado";
      cardTitle = "¡Pago recibido con éxito!";
      cardDesc = "Tu pago a través de Mercado Pago fue acreditado. Ya estamos preparando tu pedido.";
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Top success card */}
      <div className="bg-surface border border-border rounded-3xl p-8 text-center mb-8 shadow-sm">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${cardBg}`}>
          {cardIcon}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-2 block">
          {cardSubtitle}
        </span>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">{cardTitle}</h1>
        <p className="text-muted font-medium mb-6">{cardDesc}</p>
        
        <div className="inline-block bg-background border border-border px-6 py-3 rounded-2xl">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">Número de Pedido</span>
          <span className="text-xl font-mono font-bold text-primary tracking-tight mt-0.5 block">{order.number}</span>
        </div>
      </div>

      {/* Transfer account details */}
      {order.paymentMethod === "Transferencia Bancaria" && (
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 mb-8 space-y-6">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <Landmark className="w-5 h-5 text-accent" />
            Datos para la Transferencia
          </h3>
          <p className="text-sm text-muted font-medium">
            Por favor, realizá la transferencia por el total de <strong className="text-primary font-bold">${order.total.toLocaleString("es-AR")}</strong> y envianos el comprobante por WhatsApp para validar tu compra.
          </p>

          <div className="bg-background border border-border rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center text-sm font-medium gap-4">
              <div>
                <span className="text-xs text-muted block">Banco</span>
                <span className="text-primary font-bold">Banco Galicia</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm font-medium border-t border-border pt-4 gap-4">
              <div>
                <span className="text-xs text-muted block">Alias</span>
                <span className="text-primary font-bold font-mono">pclink.galicia</span>
              </div>
              <button
                onClick={() => handleCopy("pclink.galicia", "alias")}
                className="p-2 hover:bg-surface rounded-lg text-muted hover:text-primary transition-colors"
                title="Copiar Alias"
              >
                {copiedAlias ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-between items-center text-sm font-medium border-t border-border pt-4 gap-4">
              <div>
                <span className="text-xs text-muted block">CBU</span>
                <span className="text-primary font-bold font-mono">0070000000000000000000</span>
              </div>
              <button
                onClick={() => handleCopy("0070000000000000000000", "cbu")}
                className="p-2 hover:bg-surface rounded-lg text-muted hover:text-primary transition-colors"
                title="Copiar CBU"
              >
                {copiedCbu ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-between items-center text-sm font-medium border-t border-border pt-4 gap-4">
              <div>
                <span className="text-xs text-muted block">Titular de Cuenta</span>
                <span className="text-primary font-bold">PC Link S.R.L.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {order.paymentMethod === "Mercado Pago" && statusParam === "failure" ? (
          <Button 
            onClick={handleRetryPayment}
            disabled={retryingPayment}
            className="flex-1 rounded-xl py-6 bg-accent hover:bg-accent/90 flex items-center justify-center gap-2 border-none"
          >
            {retryingPayment ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <RefreshCw className="w-5 h-5 text-white" />
            )}
            <span className="text-white">Reintentar pago con Mercado Pago</span>
          </Button>
        ) : (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full rounded-xl py-6 bg-green-500 hover:bg-green-600 border-none flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-white">
                {order.paymentMethod === "Transferencia Bancaria" 
                  ? "Enviar comprobante por WhatsApp" 
                  : "Contactar por WhatsApp"}
              </span>
            </Button>
          </a>
        )}
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full rounded-xl py-6">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
