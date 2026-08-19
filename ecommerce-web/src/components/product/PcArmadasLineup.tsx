"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button";
import { Sparkles, ArrowRight, ShieldCheck, Gamepad2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PcArmadasLineupProps {
  products: Product[];
}

const TIER_ORDER = ["entry", "advanced", "pro", "ultra"];

const TIER_CONFIG: Record<string, { badge: string; color: string; games: string; subtitle: string }> = {
  entry: {
    badge: "PC Gamer Entry",
    color: "from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-600",
    games: "CS2 • Valorant • LoL • GTA V",
    subtitle: "Ryzen 5 5600GT • 16GB Dual • SSD 480GB",
  },
  advanced: {
    badge: "PC Gamer Advanced",
    color: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30 text-amber-600",
    games: "Warzone • Cyberpunk • RDR 2",
    subtitle: "Ryzen 5 5600 • RX 9050 8GB • 512GB NVMe",
  },
  pro: {
    badge: "PC Gamer Pro",
    color: "from-cyan-500/20 via-cyan-500/5 to-transparent border-cyan-500/30 text-cyan-600",
    games: "Black Myth • RT 1080p • GTA 6 Ready",
    subtitle: "Ryzen 5 8500G • RTX 5060 GDDR7 • 1TB NVMe",
  },
  ultra: {
    badge: "PC Gamer Ultra",
    color: "from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/30 text-purple-600",
    games: "1440p / 4K Ultra • Streaming • Render",
    subtitle: "Ryzen 7 8700F • RTX 5060 Ti • 32GB DDR5",
  },
};

function getTierKey(product: Product): string {
  const id = product.id.toLowerCase();
  const name = (product.name || "").toLowerCase();
  if (id.includes("entry") || name.includes("entry") || name.includes("5600gt")) return "entry";
  if (id.includes("advanced") || name.includes("advanced") || name.includes("9050") || name.includes("1080p")) return "advanced";
  if (id.includes("pro") || name.includes("pro") || id.includes("nextgen") || name.includes("8500g") || name.includes("5060 8gb")) return "pro";
  return "ultra";
}

export default function PcArmadasLineup({ products }: PcArmadasLineupProps) {
  const addItem = useCartStore((state) => state.addItem);

  const pcProducts = products
    .filter((p) => p.category === "PC_ARMADAS")
    .sort((a, b) => {
      const tierA = TIER_ORDER.indexOf(getTierKey(a));
      const tierB = TIER_ORDER.indexOf(getTierKey(b));
      return tierA - tierB;
    });

  if (pcProducts.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-b from-surface via-surface/60 to-background border border-border/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm overflow-hidden relative">
      {/* Background ambient blur */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent font-mono">
              Armados Exclusivos PC Link
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-primary tracking-tight">
            Lineup Oficial de PCs Gamer
          </h2>
          <p className="text-xs text-muted font-medium mt-0.5">
            Ensambladas a pedido con componentes de primera línea, test de estrés y 6 meses de garantía escrita.
          </p>
        </div>

        <Link href="/products?category=PC_ARMADAS">
          <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5 shrink-0">
            Ver todas las PCs Armadas
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* 4-Column Grid of PC Lineup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pcProducts.map((product) => {
          const tier = getTierKey(product);
          const config = TIER_CONFIG[tier] || TIER_CONFIG.ultra;
          const price = typeof product.price === "number" ? product.price : 0;
          const imageSrc = product.images && product.images.length > 0 ? product.images[0] : "";

          return (
            <div
              key={product.id}
              className={cn(
                "group relative bg-background border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden",
                config.color
              )}
            >
              <div>
                {/* Badge top */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black tracking-wide px-2.5 py-1 rounded-lg border bg-surface/90 shadow-xs">
                    {config.badge}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    A Pedido
                  </span>
                </div>

                {/* Product Image */}
                <Link href={`/products/${product.id}`} className="block aspect-square w-full relative mb-3 bg-surface/40 rounded-xl overflow-hidden p-3 flex items-center justify-center">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500"
                    />
                  ) : null}
                </Link>

                {/* Specs Subtitle */}
                <h3 className="text-xs font-bold text-primary leading-snug line-clamp-2 mb-1">
                  {config.subtitle}
                </h3>
                <p className="text-[10px] text-muted font-medium mb-3">
                  🎮 {config.games}
                </p>
              </div>

              {/* Price & Actions */}
              <div className="pt-3 border-t border-border/60 mt-2 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted block leading-none mb-0.5">
                    Transferencia
                  </span>
                  <span className="text-base font-black text-primary font-mono tracking-tight">
                    ${price.toLocaleString("es-AR")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link href={`/products/${product.id}`}>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-[10px] font-bold rounded-lg">
                      Ver
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      addItem(product);
                    }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
