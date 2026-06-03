"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import { Loader2, X, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCategoryName } from "@/lib/categories";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VISUAL_CATEGORIES = [
  {
    id: "pc",
    name: "Gabinetes",
    categoryId: "CASE",
    image: "https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "monitores",
    name: "Monitores",
    categoryId: "MONITOR",
    image: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "notebooks",
    name: "Notebooks",
    categoryId: "NOTEBOOK",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "ram",
    name: "Memorias RAM",
    categoryId: "RAM",
    image: "/images/categories/ram_memory.png",
  },
  {
    id: "mothers",
    name: "Motherboards",
    categoryId: "MOTHERBOARD",
    image: "/images/categories/mothers.png",
  },
  {
    id: "fuentes",
    name: "Fuentes de Poder (PSU)",
    categoryId: "PSU",
    image: "/images/categories/fuentes.png",
  },
  {
    id: "sillas",
    name: "Accesorios Gaming",
    categoryId: "GAMING",
    image: "/images/categories/sillas_gamers.png",
  },
  {
    id: "perifericos",
    name: "Mouse",
    categoryId: "MOUSE",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "almacenamiento",
    name: "Almacenamiento",
    categoryId: "STORAGE",
    image: "/images/categories/almacenamiento.png",
  },
  {
    id: "gpus",
    name: "Placas de Video (GPU)",
    categoryId: "GPU",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "cpus",
    name: "Microprocesadores (CPU)",
    categoryId: "CPU",
    image: "/images/categories/ryzen_7_cpu.png",
  },
  {
    id: "keyboards",
    name: "Teclados",
    categoryId: "KEYBOARD",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "headphones",
    name: "Auriculares",
    categoryId: "HEADPHONES",
    image: "/images/categories/hyperx_headphones.png",
  },
  {
    id: "printers",
    name: "Impresoras",
    categoryId: "PRINTER",
    image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "cooling",
    name: "Refrigeración",
    categoryId: "COOLING",
    image: "/images/categories/refrigeracion.png",
  },
  {
    id: "network",
    name: "Redes / Routers",
    categoryId: "NETWORK",
    image: "/images/categories/redes_router_v2.png",
  },
  {
    id: "cables",
    name: "Cables y Adaptadores",
    categoryId: "CABLES",
    image: "/images/categories/cables_adaptadores_v2.png",
  },
  {
    id: "toners",
    name: "Cartuchos y Tóners",
    categoryId: "INK_TONER",
    image: "/images/categories/toners.png",
  },
  {
    id: "offers",
    name: "Ofertas",
    categoryId: "OFFERS",
    image: "/images/categories/offers.png",
  },
  {
    id: "all",
    name: "Todas las Categorías",
    categoryId: "ALL",
    image: "",
  }
];

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawCategory = searchParams.get("category");
  const category = rawCategory ? rawCategory.toUpperCase() : null;
  const search = searchParams.get("search") || "";
  const { products, loading, error } = useProducts({
    category: category || undefined,
  });

  const [sortBy, setSortBy] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset visible count when category or search changes
  const filterKey = `${category || ""}-${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(12);
  }

  const filteredProducts = products.filter((p) => {
    const name = p.name ? String(p.name).toLowerCase() : "";
    const description = p.description ? String(p.description).toLowerCase() : "";
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || description.includes(searchTerm);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = typeof a.price === "number" ? a.price : 0;
    const priceB = typeof b.price === "number" ? b.price : 0;
    if (sortBy === "price-asc") {
      return priceA - priceB;
    }
    if (sortBy === "price-desc") {
      return priceB - priceA;
    }
    return 0;
  });

  const handleCategorySelect = (catId: string) => {
    const params = new URLSearchParams(window.location.search);
    
    if (catId === "ALL" || category === catId) {
      params.delete("category");
    } else {
      params.set("category", catId);
    }
    
    const queryStr = params.toString();
    const isHome = pathname === "/";
    const basePath = isHome ? "/" : "/products";
    router.replace(`${basePath}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const isHome = pathname === "/";
    const basePath = isHome ? "/" : "/products";
    router.push(basePath);
  };

  const pcCategory = VISUAL_CATEGORIES.find((c) => c.id === "pc");
  const otherCategories = VISUAL_CATEGORIES.filter((c) => c.id !== "pc");

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl flex flex-col gap-12">
      {/* Category Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black text-primary tracking-tight font-sans">
            Explorá nuestras <span className="text-accent">categorías</span>
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-full border-border/80 hover:bg-surface hover:text-primary active:scale-95 transition-all"
              onClick={() => {
                const container = document.getElementById("small-categories-container");
                if (container) {
                  const scrollAmount = container.clientWidth > 0 ? container.clientWidth : 360;
                  container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
                }
              }}
            >
              <ChevronLeft className="w-4 h-4 text-muted" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-full border-border/80 hover:bg-surface hover:text-primary active:scale-95 transition-all"
              onClick={() => {
                const container = document.getElementById("small-categories-container");
                if (container) {
                  const scrollAmount = container.clientWidth > 0 ? container.clientWidth : 360;
                  container.scrollBy({ left: scrollAmount, behavior: "smooth" });
                }
              }}
            >
              <ChevronRight className="w-4 h-4 text-muted" />
            </Button>
          </div>
        </div>

        {/* Categories container: pinned main card on the left, scrollable grid on the right */}
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center lg:justify-start w-full">
          {/* Categoría Principal: PC de Escritorio (Pinned) */}
          {pcCategory && (
            <div className="w-full max-w-[296px] xl:max-w-[376px] lg:w-[296px] xl:w-[376px] h-[180px] lg:h-[296px] shrink-0 mx-auto lg:mx-0">
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => handleCategorySelect(pcCategory.categoryId)}
                className={cn(
                  "relative overflow-hidden cursor-pointer group rounded-3xl border transition-all duration-500 h-full w-full select-none shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
                  category === pcCategory.categoryId
                    ? "border-accent ring-2 ring-accent/25 shadow-[0_10px_30px_rgba(6,182,212,0.15)]"
                    : "border-border/60 hover:border-slate-300 hover:shadow-[0_12px_35px_rgba(0,0,0,0.12)]"
                )}
              >
                {pcCategory.image ? (
                  <img
                    src={pcCategory.image}
                    alt={pcCategory.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/80 via-primary/95 to-background group-hover:scale-105 transition-transform duration-700 flex items-center justify-center" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />
                
                <div className="absolute bottom-3 inset-x-3 z-20 flex flex-col items-center">
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 flex flex-col items-center gap-1 w-full text-center border",
                    category === pcCategory.categoryId
                      ? "bg-accent/15 border-accent/30"
                      : "bg-black/50 border-white/10 group-hover:bg-black/70"
                  )}>
                    <span className="font-bold text-white uppercase tracking-wider font-sans leading-tight text-xs md:text-sm">
                      {pcCategory.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Categorías Secundarias: Grilla Desplazable sin scrollbar */}
          <div className="flex-1 min-w-0 relative group/scroll">
            <div 
              id="small-categories-container"
              className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
            >
              <div className="grid grid-flow-col grid-rows-2 gap-4 h-[296px] w-max auto-cols-[140px] md:auto-cols-[180px] pr-8">
                {otherCategories.map((item) => {
                  const isSelected = category === item.categoryId;

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      onClick={() => handleCategorySelect(item.categoryId)}
                      className={cn(
                        "relative overflow-hidden cursor-pointer group rounded-3xl border transition-all duration-500 snap-start flex-shrink-0 select-none row-span-1 col-span-1 h-full w-full shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
                        isSelected 
                          ? "border-accent ring-2 ring-accent/25 shadow-[0_10px_30px_rgba(6,182,212,0.15)]" 
                          : "border-border/60 hover:border-slate-300 hover:shadow-[0_12px_35px_rgba(0,0,0,0.12)]"
                      )}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/80 via-primary/95 to-background group-hover:scale-105 transition-transform duration-700 flex flex-col items-center justify-center p-4">
                          <LayoutGrid className="w-8 h-8 text-white/90 mb-1 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />

                      <div className="absolute bottom-3 inset-x-3 z-20 flex flex-col items-center">
                        <div className={cn(
                          "px-3 py-1.5 rounded-2xl backdrop-blur-md transition-all duration-300 flex flex-col items-center gap-0.5 w-full text-center border",
                          isSelected 
                            ? "bg-accent/15 border-accent/30" 
                            : "bg-black/50 border-white/10 group-hover:bg-black/70"
                        )}>
                          <span className="font-bold text-white uppercase tracking-wider font-sans leading-tight text-[9px] md:text-[10px] lg:text-xs">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            {/* Right fade overlay to signal scrollability */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      </div>

      {/* Main Content & Products Catalog */}
      <div className="space-y-8">
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-sans flex items-center gap-3">
              {category ? `Catálogo: ${getCategoryName(category)}` : "Todas las Categorías"}
              {(category || search) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearAllFilters}
                  className="rounded-full h-7 px-2.5 text-[10px] gap-1 font-bold text-muted hover:text-primary transition-colors"
                >
                  <X className="w-3 h-3" /> Limpiar filtros
                </Button>
              )}
            </h1>
            <p className="text-xs text-muted font-bold tracking-wide uppercase font-mono">
              Mostrando {Math.min(visibleCount, filteredProducts.length)} de {filteredProducts.length} producto{filteredProducts.length !== 1 && 's'}
            </p>
          </div>

          {/* Selector de ordenamiento */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <label htmlFor="sort-products" className="text-xs font-bold uppercase tracking-wider text-muted font-sans whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              id="sort-products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-background hover:bg-surface text-primary border border-border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent cursor-pointer transition-all"
            >
              <option value="">Relevancia</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold text-xs uppercase tracking-wide">
            Hubo un error al cargar los productos. Por favor intenta de nuevo.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visibleCount < sortedProducts.length && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest font-sans">
                  {Math.min(visibleCount, sortedProducts.length)} de {sortedProducts.length} productos
                </p>
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="rounded-xl px-8 py-4 text-xs font-black uppercase tracking-wider hover:bg-surface transition-all"
                >
                  Ver más productos
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-32 bg-surface border border-border rounded-3xl">
            <h3 className="text-lg font-black text-primary mb-2 font-sans">No se encontraron productos</h3>
            <p className="text-xs text-muted mb-6 max-w-xs mx-auto leading-relaxed">Intentá buscando en otra categoría o eliminando los filtros de búsqueda.</p>
            <Button variant="outline" onClick={clearAllFilters} className="rounded-xl px-6">
              Ver todos los productos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
