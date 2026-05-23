"use client";

import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  isLarge?: boolean;
}

export default function ProductCard({ product, isLarge }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

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
        "bg-surface border border-border rounded-3xl overflow-hidden group flex flex-col hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] transition-all duration-500",
        isLarge ? "lg:flex-row lg:h-full lg:min-h-[460px]" : "h-full"
      )}
    >
      <div className={cn(
        "relative overflow-hidden bg-background shrink-0 flex items-center justify-center",
        isLarge ? "aspect-square lg:aspect-auto lg:w-1/2 lg:h-full" : "aspect-square w-full"
      )}>
        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {product.isOffer && discountPercentage && (
            <span className="bg-primary text-white text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md font-mono shadow-xs">
              Oferta -{discountPercentage}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md font-mono">
              Agotado
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-[-4px] group-hover:translate-y-0 flex flex-col gap-2">
          <Link href={`/products/${product.id}`}>
            <Button variant="secondary" size="icon" className="w-10 h-10 rounded-full shadow-md bg-surface hover:bg-background hover:scale-105 active:scale-95 transition-all">
              <Eye className="w-4 h-4 text-primary" />
            </Button>
          </Link>
        </div>

        {/* Image */}
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={cn(
              "w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-700 mix-blend-multiply",
              isLarge ? "lg:p-12" : ""
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm font-medium">
            Sin imagen
          </div>
        )}
      </div>

      <div className={cn(
        "p-6 flex flex-col flex-1 border-t lg:border-t-0 border-border",
        isLarge ? "lg:border-l lg:p-10 lg:justify-between" : "justify-between"
      )}>
        <div className="space-y-3">
          <div className="text-[9px] text-accent uppercase font-bold tracking-widest font-mono">
            {product.category}
          </div>
          <Link href={`/products/${product.id}`}>
            <h3 className={cn(
              "text-primary font-bold leading-tight hover:text-accent transition-colors font-sans tracking-tight",
              isLarge ? "text-xl md:text-2xl lg:text-3xl line-clamp-3" : "text-base line-clamp-2"
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
          isLarge ? "mt-10" : "mt-6"
        )}>
          <div className="flex flex-col">
            {oldPrice && oldPrice > price && (
              <span className="text-xs text-muted line-through font-medium mb-0.5 font-mono">
                ${oldPrice.toLocaleString("es-AR")}
              </span>
            )}
            <span className={cn(
              "font-bold text-primary tracking-tight font-mono",
              isLarge ? "text-2xl lg:text-3xl" : "text-xl"
            )}>
              ${price.toLocaleString("es-AR")}
            </span>
          </div>
          <Button
            size="icon"
            variant="primary"
            disabled={product.stock === 0}
            onClick={() => addItem(product)}
            className="rounded-full w-12 h-12 shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
