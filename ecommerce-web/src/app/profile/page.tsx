"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/useUserStore";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User as UserIcon, 
  MapPin, 
  Ticket, 
  ShoppingBag, 
  LogOut, 
  Loader2, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  Clock, 
  CreditCard,
  X,
  Coins,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface OrderData {
  id: string;
  number: string;
  createdAt: number;
  total: number;
  status: string;
  paymentMethod: string;
  items: OrderItem[];
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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { savedCoupons, pointsSpent, removeSavedCoupon } = useUserStore();
  const router = useRouter();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "coupons">("orders");

  // Data states
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [addressLabel, setAddressLabel] = useState("Casa");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("Mar del Plata");
  const [stateName, setStateName] = useState("Buenos Aires");
  const [zipCode, setZipCode] = useState("7600");
  const [isDefault, setIsDefault] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Redirect if guest
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load Orders
  useEffect(() => {
    if (!user) return;

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
            id: doc.id,
            number: data.number || `PC-${doc.id.substring(0, 6)}`,
            createdAt: data.createdAt || Date.now(),
            total: data.total || 0,
            status: data.status || "PENDING",
            paymentMethod: data.paymentMethod || "Efectivo",
            items: data.items || [],
          });
        });
        // Sort locally by date descending
        fetchedOrders.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchOrders();
  }, [user]);

  // Load Addresses
  const fetchAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "addresses")
      );
      const fetchedAddresses: AddressData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedAddresses.push({
          id: doc.id,
          label: data.label || "Casa",
          recipient: data.recipient || "",
          phone: data.phone || "",
          street: data.street || "",
          number: data.number || "",
          apartment: data.apartment || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          country: data.country || "Argentina",
          isDefault: data.isDefault || false,
        });
      });
      // Sort so default address is first
      fetchedAddresses.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
      setAddresses(fetchedAddresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  // Calculate Points & Loyalty Tier
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const ordersCount = orders.length;

  let tier: "Bronce" | "Plata" | "Oro" = "Bronce";
  let multiplier = 1.0;

  if (ordersCount >= 10 || totalSpent >= 500000) {
    tier = "Oro";
    multiplier = 1.2;
  } else if (ordersCount >= 5 || totalSpent >= 250000) {
    tier = "Plata";
    multiplier = 1.1;
  }
  const basePoints = Math.floor((totalSpent / 100) * multiplier) + 800;
  const netPoints = Math.max(0, basePoints - pointsSpent);

  // Address actions
  const handleOpenAddressForm = (addr: AddressData | null = null) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressLabel(addr.label);
      setRecipientName(addr.recipient);
      setPhone(addr.phone);
      setStreet(addr.street);
      setStreetNumber(addr.number);
      setApartment(addr.apartment || "");
      setCity(addr.city);
      setStateName(addr.state);
      setZipCode(addr.zip);
      setIsDefault(addr.isDefault);
    } else {
      setEditingAddress(null);
      setAddressLabel("Casa");
      setRecipientName(user?.displayName || "");
      setPhone("");
      setStreet("");
      setStreetNumber("");
      setApartment("");
      setCity("Mar del Plata");
      setStateName("Buenos Aires");
      setZipCode("7600");
      setIsDefault(addresses.length === 0); // Default if first address
    }
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingAddress(true);

    const addrId = editingAddress ? editingAddress.id : `addr-${Date.now()}`;

    const newAddressData: AddressData = {
      id: addrId,
      label: addressLabel,
      recipient: recipientName,
      phone,
      street,
      number: streetNumber,
      apartment,
      city,
      state: stateName,
      zip: zipCode,
      country: "Argentina",
      isDefault: isDefault,
    };

    try {
      const addressDocRef = doc(db, "users", user.uid, "addresses", addrId);

      // If this address is set as default, mark all others as not default
      if (isDefault) {
        for (const addr of addresses) {
          if (addr.id !== addrId && addr.isDefault) {
            await setDoc(
              doc(db, "users", user.uid, "addresses", addr.id),
              { ...addr, isDefault: false }
            );
          }
        }
      }

      await setDoc(addressDocRef, newAddressData);
      await fetchAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (!confirm("¿Estás seguro de que querés eliminar esta dirección?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "addresses", id));
      await fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "Pendiente";
      case "COMPLETED":
        return "Completado";
      case "SHIPPED":
        return "Enviado";
      case "DELIVERED":
        return "Entregado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-amber-50 border-amber-200 text-amber-600";
      case "COMPLETED":
      case "DELIVERED":
        return "bg-green-50 border-green-200 text-green-600";
      case "SHIPPED":
        return "bg-accent/10 border-accent/20 text-accent";
      case "CANCELLED":
        return "bg-red-50 border-red-200 text-red-600";
      default:
        return "bg-gray-50 border-border text-muted";
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Profile Header Card */}
        <div className="bg-surface border border-border rounded-3xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="flex items-center gap-6 z-10">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent text-3xl font-extrabold font-mono shrink-0">
              {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || "U"}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-primary tracking-tight">{user.displayName || "Usuario"}</h1>
              <p className="text-sm text-muted">{user.email}</p>
              <button 
                onClick={handleLogout} 
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 mt-2 font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
              </button>
            </div>
          </div>

          {/* PC Link Club Stats Badge */}
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8 w-full md:w-auto shrink-0 justify-between md:justify-start">
            <div className="space-y-1">
              <div className="text-xs font-bold text-muted uppercase tracking-wider">Nivel Club</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-primary">{tier}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-md">
                  {multiplier}x
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-muted uppercase tracking-wider">Mis Puntos</div>
              <div className="flex items-center gap-2 text-primary font-mono text-lg font-extrabold">
                <Coins className="w-5 h-5 text-accent" />
                {loadingOrders ? "..." : netPoints}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Left Navigation Menu */}
          <div className="md:col-span-1 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "orders"
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-primary border border-border"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Mis Pedidos</span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "addresses"
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-primary border border-border"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Mis Direcciones</span>
            </button>

            <button
              onClick={() => setActiveTab("coupons")}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-sm transition-all text-left ${
                activeTab === "coupons"
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-primary border border-border"
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Mis Cupones</span>
            </button>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              {/* Tab: Orders */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-primary tracking-tight">Historial de Pedidos</h2>
                    <span className="text-xs text-muted font-mono">{orders.length} pedidos</span>
                  </div>

                  {loadingOrders ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-surface border border-border rounded-3xl p-12 text-center space-y-4">
                      <ShoppingBag className="w-10 h-10 text-muted mx-auto" />
                      <h3 className="font-bold text-primary text-sm">No realizaste pedidos</h3>
                      <p className="text-muted text-xs max-w-xs mx-auto">
                        Tus compras finalizadas aparecerán listadas acá con sus detalles de seguimiento.
                      </p>
                      <Link href="/products">
                        <Button className="rounded-xl text-xs py-4">Explorar Componentes</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-surface border border-border rounded-3xl p-6 space-y-6"
                        >
                          {/* Order metadata */}
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                            <div className="space-y-1">
                              <span className="text-xs text-muted block">CÓDIGO DE PEDIDO</span>
                              <span className="font-mono font-bold text-primary text-sm">{order.number}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted block">FECHA</span>
                              <span className="font-mono text-muted text-xs">
                                {new Date(order.createdAt).toLocaleDateString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted block">ESTADO</span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                            <div className="space-y-1 text-right">
                              <span className="text-xs text-muted block">TOTAL FACTURADO</span>
                              <span className="font-extrabold text-primary text-sm font-mono">
                                ${order.total.toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div key={item.productId} className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-background border border-border rounded-xl p-1.5 shrink-0 flex items-center justify-center">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.productName}
                                      className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                  ) : (
                                    <span className="text-[10px] text-muted">Foto</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-primary truncate leading-tight">
                                    {item.productName}
                                  </h4>
                                  <span className="text-[10px] text-muted mt-1 block">
                                    Cant: {item.quantity} · ${item.price.toLocaleString("es-AR")} c/u
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab: Addresses */}
              {activeTab === "addresses" && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-primary tracking-tight">Direcciones de Envío</h2>
                    {!showAddressForm && (
                      <Button
                        onClick={() => handleOpenAddressForm()}
                        className="rounded-xl text-xs py-4 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Agregar
                      </Button>
                    )}
                  </div>

                  {showAddressForm ? (
                    /* Address Form */
                    <form
                      onSubmit={handleSaveAddress}
                      className="bg-surface border border-border rounded-3xl p-8 space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-4">
                        <h3 className="font-bold text-primary text-sm">
                          {editingAddress ? "Editar Dirección" : "Nueva Dirección de Envío"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                          }}
                          className="p-1 hover:bg-gray-50 rounded-full"
                        >
                          <X className="w-5 h-5 text-muted" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Label */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Etiqueta</label>
                          <input
                            type="text"
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                            required
                            placeholder="Ej. Casa, Oficina"
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* Recipient */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Destinatario</label>
                          <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            required
                            placeholder="Nombre de quien recibe"
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Teléfono</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            placeholder="Ej. 2235123456"
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* Street */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Calle</label>
                          <input
                            type="text"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            required
                            placeholder="Ej. Luro"
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Número</label>
                          <input
                            type="text"
                            value={streetNumber}
                            onChange={(e) => setStreetNumber(e.target.value)}
                            required
                            placeholder="Ej. 1234"
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* Apartment */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Piso / Depto (Opcional)</label>
                          <input
                            type="text"
                            value={apartment}
                            onChange={(e) => setApartment(e.target.value)}
                            placeholder="Ej. 4B"
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Ciudad</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* State */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Provincia</label>
                          <input
                            type="text"
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            required
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>

                        {/* Zip */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-primary uppercase">Código Postal</label>
                          <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            required
                            className="w-full text-sm bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-primary"
                          />
                        </div>
                      </div>

                      {/* Default address toggle */}
                      <label className="flex items-center gap-2 cursor-pointer pt-2 select-none">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          className="w-4 h-4 rounded text-accent border-border accent-accent"
                        />
                        <span className="text-xs font-semibold text-primary">Marcar como predeterminada</span>
                      </label>

                      <div className="flex gap-4 justify-end border-t border-border/60 pt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                          }}
                          className="rounded-xl text-xs py-4"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          isLoading={submittingAddress}
                          className="rounded-xl text-xs py-4"
                        >
                          Guardar Dirección
                        </Button>
                      </div>
                    </form>
                  ) : loadingAddresses ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="bg-surface border border-border rounded-3xl p-12 text-center space-y-4">
                      <MapPin className="w-10 h-10 text-muted mx-auto" />
                      <h3 className="font-bold text-primary text-sm">No tenés direcciones guardadas</h3>
                      <p className="text-muted text-xs max-w-xs mx-auto">
                        Agregá tus datos de envío para poder seleccionarlos rápidamente al momento de pagar.
                      </p>
                      <Button onClick={() => handleOpenAddressForm()} className="rounded-xl text-xs py-4">
                        Agregar Dirección
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="bg-surface border border-border rounded-3xl p-6 flex flex-col justify-between hover:shadow-xs transition-shadow relative"
                        >
                          {addr.isDefault && (
                            <span className="absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-accent uppercase tracking-wider">
                              Predeterminada
                            </span>
                          )}
                          <div className="space-y-3">
                            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                              {addr.label}
                            </span>
                            <div className="space-y-1 text-xs text-muted leading-relaxed">
                              <p className="font-semibold text-primary">{addr.recipient}</p>
                              <p>
                                {addr.street} {addr.number} {addr.apartment && `Depto ${addr.apartment}`}
                              </p>
                              <p>
                                {addr.city}, {addr.state} ({addr.zip})
                              </p>
                              <p>Tel: {addr.phone}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-border/60">
                            <Button
                              onClick={() => handleOpenAddressForm(addr)}
                              variant="secondary"
                              size="sm"
                              className="rounded-lg text-[10px] font-bold"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => handleDeleteAddress(addr.id)}
                              variant="danger"
                              size="sm"
                              className="rounded-lg text-[10px] font-bold"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab: Coupons */}
              {activeTab === "coupons" && (
                <motion.div
                  key="coupons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-primary tracking-tight">Mis Cupones de Descuento</h2>
                    <span className="text-xs text-muted font-mono">{savedCoupons.length} cupones</span>
                  </div>

                  {savedCoupons.length === 0 ? (
                    <div className="bg-surface border border-border rounded-3xl p-12 text-center space-y-4">
                      <Ticket className="w-10 h-10 text-muted mx-auto" />
                      <h3 className="font-bold text-primary text-sm">No tenés cupones canjeados</h3>
                      <p className="text-muted text-xs max-w-xs mx-auto">
                        Canjeá tus puntos del Club en nuestra sección de PClink Club para obtener descuentos directos.
                      </p>
                      <Link href="/pcclub">
                        <Button className="rounded-xl text-xs py-4">Ir a PClink Club</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedCoupons.map((coupon) => (
                        <div
                          key={coupon.code}
                          className="bg-surface border border-border rounded-3xl p-6 flex flex-col justify-between hover:shadow-xs transition-shadow relative overflow-hidden"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-extrabold text-primary font-mono">
                                {coupon.discountPercent}% OFF
                              </span>
                              <span className="text-[10px] text-muted font-mono">
                                Canjeado:{" "}
                                {new Date(coupon.redeemedAt).toLocaleDateString("es-AR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs text-muted leading-relaxed">
                                Hacé click para copiar y pegalo en el carrito de compras.
                              </p>
                            </div>
                          </div>

                          {/* Code Display */}
                          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between bg-background border border-border rounded-xl p-3">
                            <span className="font-mono text-sm font-bold text-primary">{coupon.code}</span>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => copyToClipboard(coupon.code)}
                                variant="secondary"
                                size="sm"
                                className="rounded-lg text-[10px] font-bold px-3"
                              >
                                {copiedCode === coupon.code ? (
                                  <Check className="w-3.5 h-3.5 text-accent" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-muted" />
                                )}
                              </Button>
                              <Button
                                onClick={() => removeSavedCoupon(coupon.code)}
                                variant="danger"
                                size="sm"
                                className="rounded-lg text-[10px] font-bold px-3"
                                title="Eliminar Cupón"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
