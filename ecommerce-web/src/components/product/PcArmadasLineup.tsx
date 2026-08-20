"use client";

import Link from "next/link";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button";
import { Sparkles, ArrowRight, Eye, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PcArmadasLineupProps {
  products: Product[];
}

const TIER_ORDER = ["entry", "advanced", "pro", "ultra"];

const TIER_CONFIG: Record<string, { badge: string; games: string; subtitle: string }> = {
  entry: {
    badge: "PC Gamer Entry",
    games: "CS2 • Valorant • LoL • GTA V",
    subtitle: "Ryzen 5 5600GT • 16GB Dual • SSD 480GB",
  },
  advanced: {
    badge: "PC Gamer Advanced",
    games: "Warzone • Cyberpunk • RDR 2",
    subtitle: "Ryzen 5 5600 • RX 9050 8GB • 512GB NVMe",
  },
  pro: {
    badge: "PC Gamer Pro",
    games: "Black Myth • RT 1080p • GTA 6 Ready",
    subtitle: "Ryzen 5 8500G • RTX 5060 GDDR7 • 1TB NVMe",
  },
  ultra: {
    badge: "PC Gamer Ultra",
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
    <div className="w-full bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-primary tracking-tight font-sans">
            PCs Gamer <span className="text-accent">listas para usar</span>
          </h2>
          <p className="text-xs text-muted font-medium mt-0.5">
            Testeadas bajo carga continua con Windows 11 instalado y 6 meses de garantía escrita.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pcProducts.map((product) => {
          const tier = getTierKey(product);
          const config = TIER_CONFIG[tier] || TIER_CONFIG.ultra;
          const price = typeof product.price === "number" ? product.price : 0;
          const imageSrc = product.images && product.images.length > 0 ? product.images[0] : "";

          return (
            <div
              key={product.id}
              className="group relative bg-background border border-border hover:border-slate-400 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 overflow-hidden"
            >
              <div>
                {/* Badges top */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono">
                    {config.badge}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    A Pedido
                  </span>
                </div>

                {/* Product Image */}
                <Link href={`/products/${product.id}`} className="block aspect-square w-full relative mb-4 bg-surface/50 rounded-2xl overflow-hidden p-4 flex items-center justify-center border border-border/50">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500"
                    />
                  ) : null}
                </Link>

                {/* Specs Subtitle */}
                <Link href={`/products/${product.id}`}>
                  <h3 className="text-xs font-bold text-primary hover:text-accent transition-colors leading-snug line-clamp-2 mb-1.5">
                    {config.subtitle}
                  </h3>
                </Link>
                <p className="text-[11px] text-muted font-medium mb-3">
                  🎮 {config.games}
                </p>
              </div>

              {/* Price & Actions (Circular Buttons) */}
              <div className="pt-4 border-t border-border/60 mt-2 flex items-end justify-between gap-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted block leading-none mb-1">
                    Transferencia
                  </span>
                  <span className="text-lg font-black text-primary font-mono tracking-tight">
                    ${price.toLocaleString("es-AR")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/products/${product.id}`}>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-9 h-9 rounded-full bg-surface hover:bg-background border border-border shadow-xs hover:scale-105 active:scale-95 transition-all"
                    >
                      <Eye className="w-4 h-4 text-primary" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    className="w-9 h-9 rounded-full bg-primary text-white hover:bg-primary/90 shadow-xs hover:scale-105 active:scale-95 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      addItem(product);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
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
