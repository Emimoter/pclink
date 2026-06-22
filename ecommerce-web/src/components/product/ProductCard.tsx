"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, Cpu, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  isLarge?: boolean;
  isSmall?: boolean;
}

export default function ProductCard({ product, isLarge, isSmall }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const price = typeof product.price === "number" ? product.price : 0;
  const oldPrice = typeof product.oldPrice === "number" ? product.oldPrice : null;

  const discountPercentage =
    oldPrice && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "bg-surface border border-border overflow-hidden group flex flex-col hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] transition-all duration-500",
        isSmall ? "rounded-2xl" : "rounded-3xl",
        isLarge ? "lg:flex-row lg:h-full lg:min-h-[460px]" : "h-full"
      )}
    >
      <div className={cn(
        "relative overflow-hidden bg-background shrink-0 flex items-center justify-center",
        isLarge ? "aspect-square lg:aspect-auto lg:w-1/2 lg:h-full" : "aspect-square w-full"
      )}>
        {/* Badges */}
        <div className={cn("absolute z-10 flex flex-col gap-1.5", isSmall ? "top-3 left-3" : "top-4 left-4")}>
          {product.isOffer && discountPercentage && (
            <span className={cn(
              "bg-primary text-white text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md font-mono shadow-xs",
              isSmall && "text-[8px] px-2 py-0.5"
            )}>
              Oferta -{discountPercentage}%
            </span>
          )}
          {product.stock === 0 && (
            <span className={cn(
              "bg-red-50 text-red-600 border border-red-200 text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md font-mono",
              isSmall && "text-[8px] px-2 py-0.5"
            )}>
              Agotado
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className={cn(
          "absolute z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-4px] group-hover:translate-y-0 flex flex-col gap-1.5",
          isSmall ? "top-3 right-3" : "top-4 right-4"
        )}>
          <Link href={`/products/${product.id}`}>
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "rounded-full shadow-md bg-surface hover:bg-background hover:scale-105 active:scale-95 transition-all",
                isSmall ? "w-8 h-8" : "w-10 h-10"
              )}
            >
              <Eye className={cn("text-primary", isSmall ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </Button>
          </Link>
        </div>

        {/* Image & Carousel Controls */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Link href={`/products/${product.id}`} className="w-full h-full flex items-center justify-center cursor-pointer">
            {product.images && product.images.length > 0 && !failedImages[product.images[currentImageIndex]] ? (
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                onError={() => {
                  if (product.images?.[currentImageIndex]) {
                    setFailedImages(prev => ({ ...prev, [product.images[currentImageIndex]]: true }));
                  }
                }}
                className={cn(
                  "w-full h-full object-contain transition-transform duration-700 mix-blend-multiply group-hover:scale-105",
                  isSmall ? "p-4" : (isLarge ? "lg:p-12 p-8" : "p-8")
                )}
              />
            ) : (
              <div className={cn(
                "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-surface/30 to-background text-muted-foreground/30 select-none",
                isSmall ? "p-4" : "p-8"
              )}>
                <Cpu className={cn("text-accent/20 stroke-[1.2]", isSmall ? "w-10 h-10 mb-1.5" : "w-16 h-16 mb-3")} />
                <span className={cn(
                  "uppercase font-bold tracking-widest text-muted-foreground/40 font-mono text-center",
                  isSmall ? "text-[8px]" : "text-[10px]"
                )}>
                  Imagen no disponible
                </span>
              </div>
            )}
          </Link>

          {/* Carousel Arrows */}
          {product.images && product.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
                }}
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 bg-surface/90 hover:bg-surface border border-border text-primary p-1.5 rounded-full shadow-md z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 bg-surface/90 hover:bg-surface border border-border text-primary p-1.5 rounded-full shadow-md z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
                {product.images.map((_, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      idx === currentImageIndex ? "bg-accent w-3" : "bg-primary/15"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={cn(
        "flex flex-col flex-1 border-t lg:border-t-0 border-border justify-between",
        isSmall ? "p-4" : (isLarge ? "lg:border-l lg:p-10" : "p-6")
      )}>
        <div className={cn("space-y-3", isSmall && "space-y-1.5")}>
          <div className={cn(
            "text-accent uppercase font-bold tracking-widest font-mono",
            isSmall ? "text-[8px]" : "text-[9px]"
          )}>
            {product.category}
          </div>
          <Link href={`/products/${product.id}`}>
            <h3 className={cn(
              "text-primary font-bold leading-tight hover:text-accent transition-colors font-sans tracking-tight",
              isSmall ? "text-sm line-clamp-2" : (isLarge ? "text-xl md:text-2xl lg:text-3xl line-clamp-3" : "text-base line-clamp-2")
            )}>
              {product.name}
            </h3>
          </Link>
          {isLarge && product.description && (
            <p className="text-muted text-xs leading-relaxed max-w-[45ch] line-clamp-4 mt-2">
              {product.description}
            </p>
          )}
        </div>
        
        <div className={cn(
          "flex items-end justify-between gap-2",
          isSmall ? "mt-4" : (isLarge ? "mt-10" : "mt-6")
        )}>
          <div className="flex flex-col">
            {oldPrice && oldPrice > price && (
              <span className={cn(
                "text-muted line-through font-medium mb-0.5 font-mono",
                isSmall ? "text-[10px]" : "text-xs"
              )}>
                ${oldPrice.toLocaleString("es-AR")}
              </span>
            )}
            {price === 0 ? (
              <span className={cn(
                "font-bold text-accent tracking-tight",
                isSmall ? "text-sm" : (isLarge ? "text-xl lg:text-2xl" : "text-base md:text-lg")
              )}>
                Precio a consultar
              </span>
            ) : (
              <span className={cn(
                "font-bold text-primary tracking-tight font-mono",
                isSmall ? "text-lg" : (isLarge ? "text-2xl lg:text-3xl" : "text-xl")
              )}>
                ${price.toLocaleString("es-AR")}
              </span>
            )}
          </div>
          <Button
            size={price === 0 ? (isSmall ? "sm" : "md") : "icon"}
            variant={price === 0 ? "secondary" : "primary"}
            disabled={product.stock === 0}
            onClick={() => {
              if (price === 0) {
                const text = encodeURIComponent(`Hola PC Link, me interesa consultar el precio de: ${product.name} (Código: ${product.id})`);
                window.open(`https://wa.me/5492235468972?text=${text}`, "_blank");
              } else {
                addItem(product);
              }
            }}
            className={cn(
              "rounded-full shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-all",
              price === 0
                ? (isSmall ? "px-3 h-8 w-auto text-[10px] font-bold bg-green-600 hover:bg-green-700 text-white border-none" : "px-4 h-10 w-auto text-xs font-bold bg-green-600 hover:bg-green-700 text-white border-none")
                : (isSmall ? "w-9 h-9" : "w-12 h-12")
            )}
          >
            {price === 0 ? (
              <span>Consultar</span>
            ) : (
              <ShoppingCart className={cn(isSmall ? "w-4 h-4" : "w-5 h-5")} />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
