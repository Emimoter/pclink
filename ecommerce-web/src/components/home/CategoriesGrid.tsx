"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Cpu, Layers, Laptop, Database, Monitor, Mouse } from "lucide-react";

const categories = [
  { id: "CPU", name: "Procesadores", icon: Cpu, desc: "AMD Ryzen & Intel Core" },
  { id: "GPU", name: "Placas de Video", icon: Layers, desc: "NVIDIA GeForce & AMD Radeon" },
  { id: "NOTEBOOK", name: "Notebooks", icon: Laptop, desc: "Gamer, Oficina & Diseño" },
  { id: "RAM", name: "Memorias RAM", icon: Database, desc: "DDR4 & DDR5 Alto Rendimiento" },
  { id: "MONITOR", name: "Monitores", icon: Monitor, desc: "144Hz+, IPS & Curvos" },
  { id: "GAMING", name: "Periféricos", icon: Mouse, desc: "Teclados, Mouses & Audio" },
];

export default function CategoriesGrid() {
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 110,
        damping: 18
      }
    },
  } as const;

  return (
    <section className="py-32 bg-surface relative overflow-hidden border-t border-border">
      {/* Subtle ambient light */}
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-tr from-accent/3 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-accent font-mono">
              Categorías principales
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-primary tracking-tight leading-none">
              Hardware & Componentes
            </h2>
          </div>
          <Link href="/products" className="text-xs uppercase font-bold tracking-wider text-muted hover:text-accent font-mono transition-colors">
            Ver todas las categorías →
          </Link>
        </div>

        {/* Staggered Responsive Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.id} href={`/products?category=${category.id}`} className="block h-full">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="bg-background border border-border aspect-[4/3] rounded-3xl p-6 flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,0,0,0.02)] transition-all duration-500 group cursor-pointer h-full"
                >
                  <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center border border-border group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-500">
                    <Icon className="w-5 h-5 text-primary group-hover:text-accent transition-colors duration-500" />
                  </div>
                  
                  <div className="space-y-1 mt-4">
                    <h3 className="font-bold text-primary text-sm tracking-tight group-hover:text-accent transition-colors duration-300">
                      {category.name}
                    </h3>
                    <p className="text-[10px] text-muted leading-snug font-medium line-clamp-1">
                      {category.desc}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
