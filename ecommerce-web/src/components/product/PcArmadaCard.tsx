"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button";
import { 
  Cpu, 
  Gamepad2, 
  Layers, 
  HardDrive, 
  Zap, 
  Box, 
  ShieldCheck, 
  ShoppingCart, 
  MessageCircle, 
  Check, 
  ArrowRight,
  Flame,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PcArmadaCardProps {
  product: Product;
}

interface ParsedPcSpecs {
  badge: string;
  badgeColor: string;
  tierSubtitle: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  motherboard: string;
  psu: string;
  cabinet: string;
  games: string[];
}

function parseSpecsFromProduct(product: Product): ParsedPcSpecs {
  const id = product.id.toLowerCase();
  const name = (product.name || "").toUpperCase();

  if (id.includes("entry") || name.includes("ENTRY") || name.includes("5600GT")) {
    return {
      badge: "ENTRY LEVEL ESPORTS",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      tierSubtitle: "Ideal para jugar con fluidez a títulos competitivos y trabajo/estudio",
      cpu: "AMD Ryzen 5 5600GT (6 Núcleos / 12 Hilos hasta 4.6 GHz)",
      gpu: "Gráficos Radeon Vega 7 Integrados",
      ram: "16 GB DDR4 3200 MHz (2x8 Dual Channel)",
      storage: "SSD 480 GB SATA III Ultra Rápido",
      motherboard: "MSI A520M-A PRO (Socket AM4)",
      psu: "Fuente 500W con protecciones activas",
      cabinet: "Gabinete Kit ATX Black",
      games: ["CS2", "Valorant", "GTA V", "Fortnite", "LoL", "Roblox", "Minecraft"],
    };
  }

  if (id.includes("ultra") || name.includes("1080P") || name.includes("RX 7600")) {
    return {
      badge: "1080P ULTRA GAMING",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      tierSubtitle: "Potencia gráfica dedicada para jugar a todo en calidad Ultra",
      cpu: "AMD Ryzen 5 5600 (6 Núcleos / 12 Hilos hasta 4.4 GHz)",
      gpu: "AMD Radeon RX 7600 Challenger 8GB GDDR6 OC",
      ram: "16 GB DDR4 3200 MHz (2x8 Dual Channel)",
      storage: "SSD M.2 NVMe 1 TB PCIe Ultra Rápido",
      motherboard: "MSI A520M-A PRO / B450M",
      psu: "600W - 650W 80 Plus Bronze",
      cabinet: "Formula V Line Crystal Z1 Black",
      games: ["Warzone", "Cyberpunk 2077", "RDR 2", "Forza Horizon 5", "Hogwarts Legacy"],
    };
  }

  if (id.includes("nextgen") || name.includes("NEXT-GEN") || name.includes("5060")) {
    return {
      badge: "NEXT-GEN AM5 & GDDR7",
      badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
      tierSubtitle: "Plataforma AM5 de última generación con DLSS 3/4 y trazado de rayos",
      cpu: "AMD Ryzen 5 8400F / 7500F (Socket AM5 Zen 4)",
      gpu: "NVIDIA GeForce RTX 5060 8GB GDDR7",
      ram: "16 GB DDR5 5600/6000 MHz RGB (2x8 Dual Channel)",
      storage: "SSD M.2 NVMe 1 TB PCIe 4.0 Gen4",
      motherboard: "Biostar / ASRock A620MS DDR5",
      psu: "Formula V Line 700W 80 Plus Bronze",
      cabinet: "Formula V Line Crystal U2M Floe White (Acuario)",
      games: ["Cyberpunk 2077 RT", "Black Myth: Wukong", "GTA 6 Ready", "Warzone 144Hz"],
    };
  }

  // Performance / Pro
  return {
    badge: "PERFORMANCE PRO & 4K",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    tierSubtitle: "Máximo rendimiento para juegos pesados en 1440p/4K, streaming y render",
    cpu: "AMD Ryzen 7 8700F / Intel Core Ultra 5 245KF",
    gpu: "NVIDIA GeForce RTX 5060 Ti (Memoria GDDR7)",
    ram: "32 GB DDR5 5600/6000 MHz RGB (2x16 Dual Channel)",
    storage: "SSD M.2 NVMe 1 TB PCIe 4.0 Gen4 Alta Velocidad",
    motherboard: "B650M (AM5) o B860 (Intel) Disipación VRM",
    psu: "700W - 750W 80 Plus Bronze / Gold Modular",
    cabinet: "Formula V Line Crystal Z9 Floe Black (Mid-Tower)",
    games: ["1440p / 4K Ultra", "Streaming 1080p60", "Render Blender / 4K Video", "Ray Tracing Max"],
  };
}

export default function PcArmadaCard({ product }: PcArmadaCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [failedImage, setFailedImage] = useState(false);

  const price = typeof product.price === "number" ? product.price : 0;
  const oldPrice = typeof product.oldPrice === "number" ? product.oldPrice : null;
  const imageSrc = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : ((product as any).imageUrl || "");

  const specs = parseSpecsFromProduct(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappMessage = `Hola PC Link! Me interesa la ${product.name} ($${price.toLocaleString("es-AR")}). ¿Tienen disponibilidad para coordinar la compra?`;
  const whatsappUrl = `https://wa.me/5492235468972?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="group relative bg-surface border border-border/80 hover:border-accent/40 rounded-3xl p-6 md:p-8 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden">
      {/* Background subtle glow on hover */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:bg-accent/10 transition-colors pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Case Image (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <Link href={`/products/${product.id}`} className="block w-full">
            <div className="relative aspect-square w-full max-w-[280px] lg:max-w-none mx-auto bg-background/50 rounded-2xl p-6 flex items-center justify-center border border-border/50 group-hover:border-accent/20 transition-all overflow-hidden">
              {/* Badge top-left */}
              <span className={cn(
                "absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                specs.badgeColor
              )}>
                {specs.badge}
              </span>

              {imageSrc && !failedImage ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  onError={() => setFailedImage(true)}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted">
                  <Box className="w-16 h-16 text-muted/40 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">PC Armada</span>
                </div>
              )}
            </div>
          </Link>

          {/* Games tags under image */}
          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            {specs.games.slice(0, 4).map((game, i) => (
              <span key={i} className="text-[10px] font-bold text-muted bg-background/80 px-2.5 py-1 rounded-md border border-border">
                🎮 {game}
              </span>
            ))}
          </div>
        </div>

        {/* Middle Column: Hardware Stack (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1 block">
              Configuración Completa & Testeada
            </span>
            <Link href={`/products/${product.id}`}>
              <h2 className="text-xl md:text-2xl font-black text-primary hover:text-accent transition-colors tracking-tight leading-snug">
                {product.name}
              </h2>
            </Link>
            <p className="text-xs text-muted font-medium mt-1">
              {specs.tierSubtitle}
            </p>
          </div>

          {/* Component Stack Rows (One on top of another) */}
          <div className="bg-background/60 border border-border/70 rounded-2xl p-4 space-y-2.5 text-xs font-medium">
            {/* CPU */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">Procesador</span>
                <span className="font-bold text-primary truncate block">{specs.cpu}</span>
              </div>
            </div>

            {/* GPU */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">Placa de Video / Gráficos</span>
                <span className="font-bold text-primary truncate block">{specs.gpu}</span>
              </div>
            </div>

            {/* RAM */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">Memoria RAM</span>
                <span className="font-bold text-primary truncate block">{specs.ram}</span>
              </div>
            </div>

            {/* SSD Storage */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">Almacenamiento</span>
                <span className="font-bold text-primary truncate block">{specs.storage}</span>
              </div>
            </div>

            {/* Cabinet & PSU */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted block">Gabinete & Fuente</span>
                <span className="font-bold text-primary truncate block">{specs.cabinet} + {specs.psu}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Action (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between h-full bg-background/40 lg:bg-transparent p-5 lg:p-0 rounded-2xl border border-border/50 lg:border-none space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
              Precio Transferencia / Efectivo
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black text-primary tracking-tight">
                ${price.toLocaleString("es-AR")}
              </span>
            </div>
            <span className="text-xs text-muted block mt-1">
              o en cuotas con tarjeta de crédito
            </span>

            {/* Service Badges */}
            <div className="mt-4 space-y-1.5 text-xs text-primary font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Windows 11 instalado y listo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>12 Meses de Garantía Escrita</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Envíos en el día MDP & Andreani</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Link href={`/products/${product.id}`} className="block w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full rounded-xl py-5 text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Ver Ficha Completa
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                size="sm"
                className="w-full rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Agregado
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-accent" />
                    Al Carrito
                  </>
                )}
              </Button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl py-3 text-xs font-bold border-green-500/50 text-green-600 hover:bg-green-500/10 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
