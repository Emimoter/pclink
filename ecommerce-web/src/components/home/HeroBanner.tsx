"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useBanners } from "@/hooks/useBanners";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, Check } from "lucide-react";

const CAROUSEL_ITEMS = [
  {
    id: "gpu",
    name: "NVIDIA RTX 4080 Founders",
    category: "GRÁFICOS",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400",
    spec: "16GB GDDR6X"
  },
  {
    id: "keyboard",
    name: "Custom Mech Keyboard",
    category: "PERIFÉRICO",
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400",
    spec: "Gateron Oil Switches"
  },
  {
    id: "mouse",
    name: "Superlight Wireless Mouse",
    category: "PERIFÉRICO",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400",
    spec: "HERO 25K Sensor"
  },
  {
    id: "cooling",
    name: "AIO Liquid Cooler 360",
    category: "REFRIGERACIÓN",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400",
    spec: "RGB Sync Control"
  },
  {
    id: "ram",
    name: "Dominator DDR5 32GB",
    category: "MEMORIA",
    image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=400",
    spec: "6000MHz CL30"
  },
  {
    id: "monitor",
    name: "Pro Display 4K IPS",
    category: "MONITOR",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400",
    spec: "144Hz HDR600"
  },
  {
    id: "cpu",
    name: "Intel Core i9-14900K",
    category: "PROCESADOR",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400",
    spec: "24 Cores / 32 Threads"
  },
  {
    id: "headset",
    name: "Studio Wireless Headset",
    category: "AUDIO",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=400",
    spec: "Spatial Audio 7.1"
  }
];

export default function HeroBanner() {
  const { banners, loading } = useBanners();
  const { products: realProducts } = useProducts();

  // Fallback static banner if database is empty or loading
  const activeBanner = banners.length > 0 ? banners[0] : null;

  let carouselItems = CAROUSEL_ITEMS;
  if (realProducts && realProducts.length > 0) {
    // Select up to 15 "vistosos" products (with images, prioritizing featured, offers, and high-end hardware by price)
    const visuallyAppealing = [...realProducts]
      .filter((p) => p.images && p.images.length > 0)
      .sort((a, b) => {
        // Prioritize featured items
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Prioritize offers
        if (a.isOffer && !b.isOffer) return -1;
        if (!a.isOffer && b.isOffer) return 1;
        // Prioritize higher price (corresponds to high-end hardware like GPUs, notebooks, full PCs)
        return b.price - a.price;
      })
      .slice(0, 15);

    const mapped = visuallyAppealing.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || "HARDWARE",
      image: p.images[0],
      spec: p.price ? `$${p.price.toLocaleString("es-AR")}` : "Consultar precio",
    }));

    if (mapped.length > 0) {
      if (mapped.length < 8) {
        // Repeat multiple times if there are few products to maintain a smooth scroll
        carouselItems = [...mapped, ...mapped, ...mapped, ...mapped].slice(0, 16);
      } else {
        // Otherwise repeat them to form a continuous infinite scroll loop
        carouselItems = [...mapped, ...mapped];
      }
    }
  }

  if (loading) {
    return (
      <section className="relative w-full h-[80vh] bg-background flex items-center justify-center pt-16">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  // Dynamic values
  const title = activeBanner?.title || "Tu tienda de tecnología";
  const subtitle = activeBanner?.subtitle || "Componentes, notebooks y setups gamer al mejor precio en Mar del Plata. Comprá online con stock real y atención personalizada.";
  const ctaLabel = activeBanner?.ctaLabel || "Explorar Catálogo";
  const badge = activeBanner?.badge || "Ensambles 2026";
  
  // Parse category or product target link
  let targetLink = "/products";
  if (activeBanner?.targetCategory) {
    targetLink = `/products?category=${activeBanner.targetCategory.toLowerCase()}`;
  } else if (activeBanner?.targetProductId) {
    targetLink = `/products/${activeBanner.targetProductId}`;
  }

  // If the ctaLabel is "MAR DEL PLATA", override targetLink to maps Tejedor 554
  const isMapsLink = ctaLabel.toLowerCase().includes("mar del plata");
  const finalLink = isMapsLink
    ? "https://maps.google.com/?q=Av.+Carlos+Tejedor+554,+Mar+del+Plata"
    : targetLink;

  return (
    <section className="relative w-full min-h-[90vh] bg-background flex items-center overflow-hidden pt-16">
      {/* Premium ambient light backgrounds */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-accent/4 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-slate-200/30 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Text Content - Asymmetric (8 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-8 flex flex-col z-10"
          >

            <h1 className="text-4xl md:text-6xl lg:text-[5rem] font-black text-primary leading-[1.05] tracking-tighter mb-6">
              Tu tienda de <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-accent to-cyan-600 bg-clip-text text-transparent">
                tecnología
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted mb-8 leading-relaxed max-w-2xl font-medium">
              Componentes, notebooks y setups gamer al mejor precio en Mar del Plata.
              <br className="hidden md:inline" />
              Comprá online con stock real y atención personalizada.
            </p>
            
            <div className="flex items-center gap-6 mb-8">
              {isMapsLink ? (
                <a 
                  href={finalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button size="lg" className="rounded-2xl px-10 py-6 text-xs uppercase tracking-wider font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-300">
                    {ctaLabel}
                  </Button>
                </a>
              ) : (
                <Link href={finalLink}>
                  <Button size="lg" className="rounded-2xl px-10 py-6 text-xs uppercase tracking-wider font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-300">
                    {ctaLabel}
                  </Button>
                </Link>
              )}
            </div>

            {/* Extras Visuales */}
            <div className="flex flex-wrap items-center gap-3.5 mb-10 lg:mb-0 mt-2">
              {[
                "Envíos rápidos",
                "Cuotas",
                "Stock actualizado",
                "Garantía oficial"
              ].map((extra, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-slate-50/90 backdrop-blur-xs border border-border/80 px-4 py-2 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:border-accent/40 transition-colors duration-300"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20">
                    <Check className="w-3 h-3 text-accent stroke-[3]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 tracking-wide font-sans">
                    {extra}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile Carousel - Horizontal Scrolling (only visible on mobile/tablet) */}
            <div className="relative w-full overflow-hidden mt-12 lg:hidden">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              <div className="w-full overflow-hidden">
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    ease: "linear",
                    duration: 45,
                    repeat: Infinity
                  }}
                  className="flex gap-4 pr-4 flex-nowrap w-max"
                >
                  {[...carouselItems, ...carouselItems].map((item, idx) => (
                    <div 
                      key={`${item.id}-mobile-${idx}`} 
                      className="w-[180px] shrink-0 bg-surface rounded-2xl border border-border p-3 shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[9px] font-semibold text-accent mb-1 tracking-wider uppercase font-sans">{item.category}</div>
                      <h3 className="text-xs font-bold text-foreground truncate mb-0.5 font-sans">{item.name}</h3>
                      <p className="text-[9px] text-muted font-medium font-sans">{item.spec}</p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Visual Content - Asymmetric (4 cols) - Dual Vertical Carousel (only visible on desktop) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-4 relative hidden lg:block h-[580px] w-full"
          >
            {/* Gradient Fades for visual depth */}
            <div className="absolute -top-1 inset-x-0 h-24 bg-gradient-to-b from-background via-background/60 to-transparent z-10 pointer-events-none" />
            <div className="absolute -bottom-1 inset-x-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent z-10 pointer-events-none" />
            
            <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-border bg-surface/50 backdrop-blur-sm p-4 flex gap-4">
              
              {/* Column 1 - Scrolling Downward */}
              <div className="w-1/2 h-full overflow-hidden flex flex-col">
                <motion.div
                  animate={{ y: ["0%", "-50%"] }}
                  transition={{
                    ease: "linear",
                    duration: 75,
                    repeat: Infinity
                  }}
                  className="flex flex-col gap-4"
                >
                  {[...carouselItems, ...carouselItems].map((item, idx) => (
                    <div 
                      key={`${item.id}-col1-${idx}`} 
                      className="group bg-surface rounded-2xl border border-border p-3 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] hover:border-slate-300"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="text-[9px] font-semibold text-accent mb-1 tracking-wider uppercase font-sans">{item.category}</div>
                      <h3 className="text-xs font-bold text-foreground truncate mb-0.5 font-sans">{item.name}</h3>
                      <p className="text-[9px] text-muted font-medium font-sans">{item.spec}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Column 2 - Scrolling Upward */}
              <div className="w-1/2 h-full overflow-hidden flex flex-col">
                <motion.div
                  animate={{ y: ["-50%", "0%"] }}
                  transition={{
                    ease: "linear",
                    duration: 75,
                    repeat: Infinity
                  }}
                  className="flex flex-col gap-4"
                >
                  {[...carouselItems.slice(Math.floor(carouselItems.length / 2)), ...carouselItems, ...carouselItems.slice(0, Math.floor(carouselItems.length / 2))].map((item, idx) => (
                    <div 
                      key={`${item.id}-col2-${idx}`} 
                      className="group bg-surface rounded-2xl border border-border p-3 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] hover:border-slate-300"
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="text-[9px] font-semibold text-accent mb-1 tracking-wider uppercase font-sans">{item.category}</div>
                      <h3 className="text-xs font-bold text-foreground truncate mb-0.5 font-sans">{item.name}</h3>
                      <p className="text-[9px] text-muted font-medium font-sans">{item.spec}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

            </div>


          </motion.div>

        </div>
      </div>
    </section>
  );
}

