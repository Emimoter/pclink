"use client";

import { useState } from "react";
import { useProduct } from "@/hooks/useProduct";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/useCartStore";
import { Loader2, ArrowLeft, ShoppingCart, Plus, Minus, Check, Cpu, ChevronLeft, ChevronRight, Truck, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import ProductCard from "@/components/product/ProductCard";
import ShippingCalculator from "@/components/product/ShippingCalculator";
import PcDetailSpecs from "@/components/product/PcDetailSpecs";
import { cn } from "@/lib/utils";
import { getCategoryName, isPcCategory } from "@/lib/categories";
import { parsePcSpecs } from "@/lib/pcSpecs";

interface ProductDetailClientProps {
  id: string;
}

export default function ProductDetailClient({ id }: ProductDetailClientProps) {
  const { product, loading, error } = useProduct(id);
  const { products: relatedProducts, loading: loadingRelated } = useProducts({
    category: product?.category,
  });
  
  const addItem = useCartStore((state) => state.addItem);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 flex items-center justify-center max-w-7xl">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-7xl">
        <h2 className="text-2xl font-bold text-primary mb-4">Producto no encontrado</h2>
        <p className="text-muted mb-8">El producto que buscas no existe o ha sido modificado.</p>
        <Link href="/products">
          <Button variant="primary">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  const price = typeof product.price === "number" ? product.price : 0;
  const oldPrice = typeof product.oldPrice === "number" ? product.oldPrice : null;
  const isPc = isPcCategory(product.category);
  const pcSpecs = isPc ? parsePcSpecs(product) : null;

  const galleryImages =
    product.images && product.images.length > 0 && product.images[0]?.trim()
      ? product.images.filter((u) => u && u.trim() !== "")
      : pcSpecs
      ? [pcSpecs.fallbackImage]
      : [];

  const isAvailableForPurchase =
    price > 0 && (product.stock > 0 || !!product.onDemand || !!(pcSpecs && pcSpecs.isOfficialTier));

  const discountPercentage =
    oldPrice && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // WhatsApp link preparation
  const whatsappMessageText = price === 0
    ? `Hola PC Link, estoy interesado en el producto "${product.name}" (código: ${product.id}). ¿Cuál es el precio y disponibilidad?`
    : `Hola PC Link, estoy interesado en el producto "${product.name}" (Precio: $${price.toLocaleString("es-AR")}). ¿Tienen stock disponible?`;
  const encodedMessage = encodeURIComponent(whatsappMessageText);
  const whatsappUrl = `https://wa.me/5492235468972?text=${encodedMessage}`;

  // Filter out the current product from related products
  const filteredRelated = relatedProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Back button */}
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary mb-12 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver a la tienda
      </Link>

      {/* Main product view split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">
        
        {/* Left Column - Gallery */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="md:col-span-2 order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square w-16 md:w-full border rounded-xl overflow-hidden bg-surface transition-all ${
                    selectedImage === idx
                      ? "border-accent ring-2 ring-accent/10"
                      : "border-border hover:border-muted"
                  }`}
                >
                  {img && !failedImages[img] ? (
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={() => setFailedImages(prev => ({ ...prev, [img]: true }))}
                      className="w-full h-full object-contain p-2 mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface/50 text-muted-foreground/30">
                      <Cpu className="w-5 h-5 stroke-[1.2]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className={`${
            galleryImages.length > 1 ? "md:col-span-10" : "md:col-span-12"
          } order-1 md:order-2 aspect-square bg-surface border border-border rounded-3xl overflow-hidden flex items-center justify-center p-8 relative group`}>
            {product.isOffer && discountPercentage && (
              <span className="absolute top-6 left-6 bg-primary text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg z-10">
                Oferta -{discountPercentage}%
              </span>
            )}
            {galleryImages.length > 0 && !failedImages[galleryImages[selectedImage]] ? (
              <img
                src={galleryImages[selectedImage]}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={() => {
                  const bad = galleryImages[selectedImage];
                  if (bad) {
                    setFailedImages(prev => ({ ...prev, [bad]: true }));
                  }
                }}
                className="w-full h-full object-contain max-h-[500px] hover:scale-105 transition-transform duration-500 mix-blend-multiply"
              />
            ) : pcSpecs && !failedImages[pcSpecs.fallbackImage] ? (
              <img
                src={pcSpecs.fallbackImage}
                alt={product.name}
                onError={() => setFailedImages(prev => ({ ...prev, [pcSpecs.fallbackImage]: true }))}
                className="w-full h-full object-contain max-h-[500px] hover:scale-105 transition-transform duration-500 mix-blend-multiply"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 p-8 select-none">
                <Cpu className="w-20 h-20 mb-3 text-accent/20 stroke-[1.2]" />
                <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground/40 font-mono text-center">
                  Imagen no disponible
                </span>
              </div>
            )}

            {/* Carousel Navigation Arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedImage(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-surface/95 hover:bg-surface text-primary p-2.5 rounded-full shadow-md z-10 transition-all hover:scale-105 active:scale-95 border border-border opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-surface/95 hover:bg-surface text-primary p-2.5 rounded-full shadow-md z-10 transition-all hover:scale-105 active:scale-95 border border-border opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Indicator Dots overlaid inside image area */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                  {galleryImages.map((_, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        idx === selectedImage ? "bg-accent w-4" : "bg-primary/20"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Product details */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Category */}
          <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-4 block">
            {getCategoryName(product.category)}
          </span>
          
          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-primary tracking-tight mb-6 leading-tight">
            {product.name}
          </h1>

          {/* Price details */}
          <div className="flex items-baseline gap-4 mb-8">
            {price === 0 ? (
              <span className="text-2xl font-extrabold text-accent tracking-tight">
                Precio a consultar
              </span>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-primary tracking-tight">
                  ${price.toLocaleString("es-AR")}
                </span>
                {oldPrice && oldPrice > price && (
                  <span className="text-lg text-muted line-through font-medium">
                    ${oldPrice.toLocaleString("es-AR")}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="border-t border-border py-6 space-y-4">
            {/* Stock indicator */}
            {pcSpecs && pcSpecs.isOfficialTier ? (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-muted">Disponibilidad</span>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Armado a Pedido • Siempre Disponible
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-muted">Disponibilidad</span>
                {product.stock > 0 ? (
                  <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    {product.stock} {product.stock === 1 ? "unidad disponible" : "unidades disponibles"}
                  </span>
                ) : (
                  <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    Sin stock
                  </span>
                )}
              </div>
            )}

            {/* Delivery time notice for Invid / 4-day products */}
            {(product.externalSource === 'invid' || product.deliveryDays === 4 || product.onDemand) && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-cyan-800 dark:text-cyan-400 text-sm">
                  <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Entrega en 4 días hábiles (Mar del Plata)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  Este artículo se solicita directamente al distribuidor oficial y tiene un plazo estimado de preparación y entrega/retiro de <strong>4 días hábiles</strong> dentro de Mar del Plata.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isAvailableForPurchase ? (
            <div className="space-y-4 mt-4">
              {/* Quantity selector */}
              <div className="flex items-center border border-border rounded-xl w-fit bg-surface">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-3 text-muted hover:text-primary transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono font-bold text-primary">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(pcSpecs && pcSpecs.isOfficialTier ? 10 : Math.max(1, product.stock), q + 1))}
                  className="p-3 text-muted hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={cn(
                    "group/add w-full h-14 rounded-full pl-6 pr-2 flex items-center justify-between gap-3 font-bold text-sm tracking-tight transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer",
                    added
                      ? "bg-emerald-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_24px_-6px_rgba(16,185,129,0.45)]"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_-6px_rgba(24,24,27,0.32)]"
                  )}
                >
                  <span className="whitespace-nowrap">
                    {added ? "Agregado al carrito" : "Añadir al carrito"}
                  </span>
                  <span
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                      added
                        ? "bg-white/20 text-white"
                        : "bg-cyan-500 text-white group-hover/add:scale-105"
                    )}
                  >
                    {added ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <ShoppingCart className="w-4.5 h-4.5 stroke-[2.2]" />
                    )}
                  </span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/wa w-full h-14 rounded-full pl-6 pr-2 bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-6px_rgba(37,211,102,0.42)] flex items-center justify-between gap-3 font-bold text-sm tracking-tight transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <WhatsAppIcon className="w-5 h-5 shrink-0" />
                    <span>Consultar WhatsApp</span>
                  </span>
                  <span className="w-10 h-10 rounded-full bg-black/12 group-hover/wa:bg-black/18 flex items-center justify-center shrink-0 transition-all duration-300 group-hover/wa:translate-x-0.5">
                    <ArrowUpRight className="w-4.5 h-4.5 stroke-[2.3]" />
                  </span>
                </a>
              </div>
            </div>
          ) : (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/wa mt-4 w-full h-14 rounded-full pl-6 pr-2 bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-6px_rgba(37,211,102,0.42)] flex items-center justify-between gap-3 font-bold text-sm tracking-tight transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2.5 whitespace-nowrap">
                <WhatsAppIcon className="w-5 h-5 shrink-0" />
                <span>{price <= 0 ? "Consultar precio por WhatsApp" : "Consultar disponibilidad por WhatsApp"}</span>
              </span>
              <span className="w-10 h-10 rounded-full bg-black/12 group-hover/wa:bg-black/18 flex items-center justify-center shrink-0 transition-all duration-300 group-hover/wa:translate-x-0.5">
                <ArrowUpRight className="w-4.5 h-4.5 stroke-[2.3]" />
              </span>
            </a>
          )}

          {/* Shipping Calculator Widget */}
          <ShippingCalculator isPcArmada={isPc} />

          {/* Description for standard products */}
          {!isPc && (
            <div className="mt-8 border-t border-border pt-8">
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Descripción</h3>
              <p className="text-muted leading-relaxed whitespace-pre-line font-medium">
                {product.description || "Este producto no tiene una descripción detallada provista."}
              </p>
            </div>
          )}

          {/* Specifications for standard products */}
          {!isPc && product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mt-8 border-t border-border pt-8">
              <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Especificaciones</h3>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm font-medium">
                  <tbody>
                    {Object.entries(product.specs).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? "bg-background/40" : "bg-transparent"}>
                        <td className="px-6 py-4 font-bold text-primary border-r border-border/60 w-1/3">{key}</td>
                        <td className="px-6 py-4 text-muted font-mono">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Technical Breakdown for PC Gamer & PC Oficina */}
      {isPc && (
        <PcDetailSpecs 
          product={product}
          productId={product.id} 
          productName={product.name} 
          description={product.description || ""} 
        />
      )}

      {/* Related products */}
      {filteredRelated.length > 0 && (
        <section className="border-t border-border pt-24">
          <h2 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight mb-12">
            Productos Relacionados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRelated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
