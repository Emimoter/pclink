"use client";

import { useState } from "react";
import { useProduct } from "@/hooks/useProduct";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/useCartStore";
import { Loader2, ArrowLeft, ShoppingCart, MessageCircle, Plus, Minus, Check, Cpu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import ProductCard from "@/components/product/ProductCard";

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
          {product.images && product.images.length > 1 && (
            <div className="md:col-span-2 order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {product.images.map((img, idx) => (
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
            product.images && product.images.length > 1 ? "md:col-span-10" : "md:col-span-12"
          } order-1 md:order-2 aspect-square bg-surface border border-border rounded-3xl overflow-hidden flex items-center justify-center p-8 relative`}>
            {product.isOffer && discountPercentage && (
              <span className="absolute top-6 left-6 bg-primary text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg z-10">
                Oferta -{discountPercentage}%
              </span>
            )}
            {product.images && product.images.length > 0 && !failedImages[product.images[selectedImage]] ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                onError={() => setFailedImages(prev => ({ ...prev, [product.images[selectedImage]]: true }))}
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
          </div>
        </div>

        {/* Right Column - Product details */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Category */}
          <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-4 block">
            {product.category.replace(/-/g, ' ')}
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
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-muted">Disponibilidad</span>
              {product.stock > 0 ? (
                <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  {product.stock} unidades en stock
                </span>
              ) : (
                <span className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  Sin stock
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {product.stock > 0 && price > 0 ? (
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
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="p-3 text-muted hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="w-full rounded-xl py-6 flex items-center justify-center gap-2"
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" />
                      Agregado
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Añadir al Carrito
                    </>
                  )}
                </Button>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl py-6 border-green-500 hover:bg-green-50 text-green-600 hover:text-green-700 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Consultar WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full rounded-xl py-6 bg-green-600 hover:bg-green-700 border-none text-white flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {price === 0 ? "Consultar precio por WhatsApp" : "Consultar stock por WhatsApp"}
              </Button>
            </a>
          )}

          {/* Description */}
          <div className="mt-8 border-t border-border pt-8">
            <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Descripción</h3>
            <p className="text-muted leading-relaxed whitespace-pre-line font-medium">
              {product.description || "Este producto no tiene una descripción detallada provista."}
            </p>
          </div>

          {/* Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
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
