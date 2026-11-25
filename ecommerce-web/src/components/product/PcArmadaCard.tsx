"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button";
import {
  Cpu,
  Gamepad2,
  Layers,
  HardDrive,
  Zap,
  Box,
  ShoppingCart,
  MessageCircle,
  Check,
  ArrowRight,
  CheckCircle2,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parsePcSpecs } from "@/lib/pcSpecs";

interface PcArmadaCardProps {
  product: Product;
}

export default function PcArmadaCard({ product }: PcArmadaCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [useFallbackImg, setUseFallbackImg] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const specs = parsePcSpecs(product);
  const price = typeof product.price === "number" ? product.price : 0;

  const primaryImage =
    product.images && product.images.length > 0 && product.images[0]?.trim()
      ? product.images[0].trim()
      : "";

  const activeImageSrc =
    primaryImage && !useFallbackImg ? primaryImage : specs.fallbackImage;

  const isCustomUploadedPhoto = primaryImage.includes("firebasestorage.googleapis.com");
  const showIllustrativeNotice = !specs.isOfficialTier && !isCustomUploadedPhoto;

  const isAvailable =
    price > 0 && (product.stock > 0 || specs.isOfficialTier || !!product.onDemand);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappMessage =
    price > 0
      ? `Hola PC Link! Me interesa la ${product.name} ($${price.toLocaleString("es-AR")}). ¿Tienen disponibilidad para coordinar la compra?`
      : `Hola PC Link! Me interesa consultar precio y disponibilidad de: ${product.name}.`;
  const whatsappUrl = `https://wa.me/5492235468972?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="group relative bg-surface border border-border/80 hover:border-accent/40 rounded-3xl p-6 md:p-8 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden">
      {/* Background subtle glow on hover */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:bg-accent/10 transition-colors pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Case Image (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <Link href={`/products/${product.id}`} className="block w-full">
            <div className="relative aspect-square w-full max-w-[280px] lg:max-w-none mx-auto bg-white rounded-2xl p-6 flex items-center justify-center border border-border/50 group-hover:border-accent/20 transition-all overflow-hidden">
              {/* Badge top-left */}
              <span
                className={cn(
                  "absolute top-3 left-3 z-10 text-xs font-black tracking-wide px-3 py-1 rounded-xl border shadow-xs backdrop-blur-xs",
                  specs.badgeColor
                )}
              >
                {specs.badge}
              </span>

              {!isAvailable && (
                <span className="absolute top-3 right-3 z-10 bg-red-50 text-red-600 border border-red-200 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg font-mono">
                  Agotado
                </span>
              )}

              {showIllustrativeNotice && (
                <span className="absolute bottom-2.5 inset-x-3 z-10 text-center bg-slate-900/75 text-white text-[9px] font-semibold tracking-wide px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  Imagen de gabinete ilustrativa
                </span>
              )}

              {activeImageSrc && !fallbackFailed ? (
                <img
                  src={activeImageSrc}
                  alt={product.name}
                  onError={() => {
                    if (!useFallbackImg && primaryImage) {
                      setUseFallbackImg(true);
                    } else {
                      setFallbackFailed(true);
                    }
                  }}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted">
                  <Box className="w-16 h-16 text-muted/40 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {specs.isOfficePc ? "PC Oficina" : "PC Gamer"}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Usage / Games tags under image */}
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            {specs.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-bold text-muted bg-background/80 px-2.5 py-1 rounded-md border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Middle Column: Hardware Stack (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1 block">
              {specs.isOfficePc
                ? "Equipo Listo para Trabajar & Estudiar"
                : "Configuración Completa & Testeada"}
            </span>
            <Link href={`/products/${product.id}`}>
              <h2 className="text-xl md:text-2xl font-black text-primary hover:text-accent transition-colors tracking-tight leading-snug">
                {product.name}
              </h2>
            </Link>
            <p className="text-xs text-muted font-medium mt-1">
              {specs.tierSubtitle}
            </p>
          </div>

          {/* Component Stack Rows */}
          <div className="bg-background/60 border border-border/70 rounded-2xl p-4 space-y-2.5 text-xs font-medium">
            {/* CPU */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">
                  Procesador
                </span>
                <span className="font-bold text-primary truncate block">
                  {specs.cpu}
                </span>
              </div>
            </div>

            {/* GPU */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                {specs.isOfficePc ? (
                  <Monitor className="w-4 h-4" />
                ) : (
                  <Gamepad2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">
                  Placa de Video / Gráficos
                </span>
                <span className="font-bold text-primary truncate block">
                  {specs.gpu}
                </span>
              </div>
            </div>

            {/* RAM */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">
                  Memoria RAM
                </span>
                <span className="font-bold text-primary truncate block">
                  {specs.ram}
                </span>
              </div>
            </div>

            {/* SSD Storage */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">
                  Almacenamiento
                </span>
                <span className="font-bold text-primary truncate block">
                  {specs.storage}
                </span>
              </div>
            </div>

            {/* Cabinet & PSU */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">
                  Gabinete & Fuente
                </span>
                <span className="font-bold text-primary truncate block">
                  {specs.cabinet} + {specs.psu}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Action (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full bg-background/40 lg:bg-transparent p-5 lg:p-0 rounded-2xl border border-border/50 lg:border-none space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
              Precio Transferencia / Efectivo
            </span>
            <div className="flex items-baseline gap-2">
              {price > 0 ? (
                <span className="text-2xl md:text-3xl font-black text-primary tracking-tight">
                  ${price.toLocaleString("es-AR")}
                </span>
              ) : (
                <span className="text-xl font-black text-accent tracking-tight">
                  Precio a consultar
                </span>
              )}
            </div>
            {price > 0 && (
              <span className="text-xs text-muted block mt-1">
                o en cuotas con tarjeta de crédito
              </span>
            )}

            {/* Service Badges */}
            <div className="mt-4 space-y-1.5 text-xs text-primary font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Windows 11 instalado y listo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Garantía Escrita en nuestro local</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Envíos a todo el país</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Link href={`/products/${product.id}`} className="block w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full rounded-xl py-5 text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Ver Ficha Completa
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                variant="outline"
                size="sm"
                className="w-full rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Agregado
                  </>
                ) : !isAvailable ? (
                  <span>Sin Stock</span>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-accent" />
                    Al Carrito
                  </>
                )}
              </Button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl py-3 text-xs font-bold border-green-500/50 text-green-600 hover:bg-green-500/10 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
