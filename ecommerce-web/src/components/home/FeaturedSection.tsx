"use client";

import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function FeaturedSection() {
  const { products, loading } = useProducts({ isFeatured: true });

  // Limit to first 4 products for the home section layout
  const featuredProducts = products.slice(0, 4);

  if (loading) {
    return (
      <section className="py-32 bg-background border-t border-border">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    },
  } as const;

  return (
    <section className="py-32 bg-background border-t border-border relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl pointer-events-none z-0" />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-accent font-mono">
              Selección Exclusiva
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-primary tracking-tight leading-none">
              Equipos Destacados
            </h2>
          </div>
          <Link href="/products">
            <Button variant="outline" className="rounded-xl px-6 py-5 text-xs font-bold uppercase tracking-wider">
              Ver todos los productos
            </Button>
          </Link>
        </div>

        {/* Symmetric 2-column grid of unified cards (2 stacked on the left, 2 stacked on the right) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
            >
              <ProductCard product={product} isLarge={false} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
