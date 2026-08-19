"use client";

import { 
  Cpu, 
  Gamepad2, 
  Layers, 
  HardDrive, 
  Zap, 
  Box, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Monitor, 
  Wrench, 
  SlidersHorizontal,
  Award,
  Clock,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PcDetailSpecsProps {
  productId: string;
  productName: string;
  description: string;
}

interface ComponentItem {
  icon: any;
  iconBg: string;
  iconColor: string;
  category: string;
  title: string;
  detail: string;
  badge?: string;
}

interface GamingBenchmark {
  game: string;
  fps: string;
  quality: string;
  resolution: string;
}

export default function PcDetailSpecs({ productId, productName, description }: PcDetailSpecsProps) {
  const id = productId.toLowerCase();
  const name = productName.toUpperCase();

  let tierName = "PC Gamer Entry";
  let tierSubtitle = "Rendimiento fluido para gaming competitivo y estudio/trabajo";
  let components: ComponentItem[] = [];
  let benchmarks: GamingBenchmark[] = [];

  if (id.includes("entry") || name.includes("ENTRY") || name.includes("5600GT")) {
    tierName = "PC Gamer Entry";
    tierSubtitle = "La puerta de entrada ideal a los eSports con memorias en Dual Channel y arranque veloz";
    components = [
      {
        icon: Cpu,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-600 dark:text-orange-400",
        category: "Microprocesador",
        title: "AMD Ryzen 5 5600GT",
        detail: "6 Núcleos / 12 Hilos hasta 4.6 GHz • Arquitectura Zen 3 (7nm)",
        badge: "Cooler Wraith Incluido",
      },
      {
        icon: Gamepad2,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        category: "Gráficos Integrados",
        title: "AMD Radeon Vega 7 (7 CUs @ 1900 MHz)",
        detail: "Gráficos integrados de alto rendimiento para eSports sin placa dedicada",
        badge: "eSports Ready",
      },
      {
        icon: Layers,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        category: "Memoria RAM",
        title: "16 GB DDR4 3200 MHz (2x8 GB)",
        detail: "Configuración Dual Channel para duplicar el ancho de banda gráfico",
        badge: "Dual Channel Activo",
      },
      {
        icon: HardDrive,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-600 dark:text-cyan-400",
        category: "Almacenamiento",
        title: "SSD 480 GB SATA III (6 Gb/s)",
        detail: "Arranque de Windows en 8 segundos y carga instantánea de programas",
        badge: "Ultra Veloz",
      },
      {
        icon: SlidersHorizontal,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600 dark:text-amber-400",
        category: "Placa Madre",
        title: "MSI A520M-A PRO (Socket AM4)",
        detail: "Slots DDR4 reforzados, audio HD, puertos USB 3.2 y compatibilidad AM4",
        badge: "MSI Pro Series",
      },
      {
        icon: Zap,
        iconBg: "bg-pink-500/10",
        iconColor: "text-pink-600 dark:text-pink-400",
        category: "Fuente de Poder",
        title: "Fuente 500W ATX Black",
        detail: "Protecciones eléctricas activas (OVP/SCP) y riel +12V estable",
        badge: "Lista para GPU",
      },
      {
        icon: Box,
        iconBg: "bg-slate-500/10",
        iconColor: "text-slate-600 dark:text-slate-400",
        category: "Gabinete",
        title: "Gabinete Kit ATX Black",
        detail: "Chasis sobrio negro de oficina/hogar con excelente flujo y durabilidad",
        badge: "Kit Incluido",
      },
      {
        icon: Wrench,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
        category: "Software y Armado",
        title: "Windows 11 Optimizado",
        detail: "Ensamble con gestión oculta de cables, BIOS actualizada y drivers listos",
        badge: "Listo para Usar",
      },
    ];
    benchmarks = [
      { game: "Counter-Strike 2", fps: "90 - 130 FPS", quality: "Baja / Competitiva", resolution: "1080p" },
      { game: "Valorant", fps: "140 - 200 FPS", quality: "Media / Alta", resolution: "1080p" },
      { game: "GTA V", fps: "60 - 80 FPS", quality: "Normal / Alta", resolution: "1080p" },
      { game: "League of Legends", fps: "160 - 240 FPS", quality: "Muy Alta", resolution: "1080p" },
      { game: "Fortnite", fps: "80 - 110 FPS", quality: "Modo Rendimiento", resolution: "1080p" },
      { game: "Roblox / Minecraft", fps: "120+ FPS", quality: "Alta", resolution: "1080p" },
    ];
  } else if (id.includes("advanced") || name.includes("ADVANCED") || id.includes("ultra-r7-rx7600") || name.includes("9050") || name.includes("1080P")) {
    tierName = "PC Gamer Advanced";
    tierSubtitle = "Potencia gráfica dedicada para jugar a todo el catálogo moderno en calidad Ultra";
    components = [
      {
        icon: Cpu,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-600 dark:text-orange-400",
        category: "Microprocesador",
        title: "AMD Ryzen 5 5600 (6c/12t)",
        detail: "6 Núcleos / 12 Hilos hasta 4.4 GHz • 32 MB de GameCache L3",
        badge: "Cooler Wraith",
      },
      {
        icon: Gamepad2,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        category: "Placa de Video Dedicada",
        title: "Gigabyte Radeon RX 9050 GAMING OC 8GB GDDR6",
        detail: "Sistema de refrigeración Windforce Triple Fan y arquitectura gráfica RDNA",
        badge: "8GB Dedicados",
      },
      {
        icon: Layers,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        category: "Memoria RAM",
        title: "16 GB DDR4 3200 MHz (2x8 GB)",
        detail: "Dual Channel activo de alta velocidad para juegos pesados y multitarea",
        badge: "Dual Channel",
      },
      {
        icon: HardDrive,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-600 dark:text-cyan-400",
        category: "Almacenamiento",
        title: "SSD M.2 NVMe 512 GB PCIe",
        detail: "Lecturas superiores a 2.400 MB/s para tiempos de carga inexistentes",
        badge: "NVMe Gen3/4",
      },
      {
        icon: SlidersHorizontal,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600 dark:text-amber-400",
        category: "Placa Madre",
        title: "MSI A520M-A PRO (Socket AM4)",
        detail: "VRM optimizado, ranura PCIe reforzada Steel Armor y audio Boost",
        badge: "MSI Gaming",
      },
      {
        icon: Zap,
        iconBg: "bg-pink-500/10",
        iconColor: "text-pink-600 dark:text-pink-400",
        category: "Fuente de Poder",
        title: "Fuente 600W - 650W 80 Plus Bronze",
        detail: "Certificación de eficiencia energética 80 Plus y cableado mallado",
        badge: "80+ Bronze",
      },
      {
        icon: Box,
        iconBg: "bg-slate-500/10",
        iconColor: "text-slate-600 dark:text-slate-400",
        category: "Gabinete",
        title: "Formula V Line Crystal Z1 Black",
        detail: "Lateral de vidrio templado, frontal mesh de alto flujo (sin fans de fábrica)",
        badge: "Vidrio Templado",
      },
      {
        icon: Wrench,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
        category: "Software y Armado",
        title: "Windows 11 Optimizado",
        detail: "Ensamble profesional, perfiles de ventilación y pasta térmica premium",
        badge: "Listo para Jugar",
      },
    ];
    benchmarks = [
      { game: "Call of Duty: Warzone", fps: "110 - 145 FPS", quality: "Ultra", resolution: "1080p" },
      { game: "Cyberpunk 2077", fps: "75 - 95 FPS", quality: "Ultra / Alto", resolution: "1080p" },
      { game: "Red Dead Redemption 2", fps: "80 - 100 FPS", quality: "Ultra", resolution: "1080p" },
      { game: "Counter-Strike 2", fps: "220 - 300 FPS", quality: "Alta", resolution: "1080p" },
      { game: "Forza Horizon 5", fps: "105 - 130 FPS", quality: "Ultra", resolution: "1080p" },
      { game: "Hogwarts Legacy", fps: "70 - 90 FPS", quality: "Ultra", resolution: "1080p" },
    ];
  } else if (id.includes("pro") || name.includes("PRO") || id.includes("nextgen") || name.includes("8500G") || name.includes("5060 8GB")) {
    tierName = "PC Gamer Pro";
    tierSubtitle = "Plataforma AM5 Zen 4 con memorias DDR5 RGB y NVIDIA GeForce RTX 5060 GDDR7";
    components = [
      {
        icon: Cpu,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-600 dark:text-orange-400",
        category: "Microprocesador",
        title: "AMD Ryzen 5 8500G (AM5 Zen 4)",
        detail: "6 Núcleos / 12 Hilos hasta 5.0 GHz • Litografía ultra eficiente de 4nm",
        badge: "Socket AM5",
      },
      {
        icon: Gamepad2,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        category: "Placa de Video Dedicada",
        title: "NVIDIA GeForce RTX 5060 8GB GDDR7",
        detail: "Arquitectura Blackwell con Ray Tracing de 4ta Gen y DLSS 3/4 Frame Generation",
        badge: "GDDR7 & DLSS 4",
      },
      {
        icon: Layers,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        category: "Memoria RAM",
        title: "16 GB (2x8 GB) Corsair Vengeance RGB DDR5 6000MHz",
        detail: "Perfil AMD EXPO activo con iluminación RGB sincronizada",
        badge: "DDR5 RGB 6000MHz",
      },
      {
        icon: HardDrive,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-600 dark:text-cyan-400",
        category: "Almacenamiento",
        title: "SSD M.2 NVMe 1 TB PCIe 4.0 Gen4",
        detail: "Velocidades de hasta 3.500 MB/s con 1000 GB de espacio real",
        badge: "1000 GB Gen4",
      },
      {
        icon: SlidersHorizontal,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600 dark:text-amber-400",
        category: "Placa Madre",
        title: "Gigabyte A620M H / Biostar A620MS DDR5",
        detail: "Socket AM5 con soporte para futuras generaciones de microprocesadores AMD",
        badge: "AM5 con Futuro",
      },
      {
        icon: Zap,
        iconBg: "bg-pink-500/10",
        iconColor: "text-pink-600 dark:text-pink-400",
        category: "Fuente de Poder",
        title: "Formula V Line 700W 80 Plus Bronze",
        detail: "700 Watts reales con protecciones activas y certificación 80 Plus",
        badge: "700W Bronze",
      },
      {
        icon: Box,
        iconBg: "bg-slate-500/10",
        iconColor: "text-slate-600 dark:text-slate-400",
        category: "Gabinete",
        title: "Formula V Line Crystal U2M Floe White (Acuario)",
        detail: "Diseño panorámico blanco estilo pecera con doble vidrio templado sin parantes",
        badge: "All White Acuario",
      },
      {
        icon: Wrench,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
        category: "Software y Armado",
        title: "Windows 11 Pro Optimizado",
        detail: "Perfil EXPO configurado en BIOS, test de estabilidad y pasta térmica de alta conductividad",
        badge: "Optimizado 100%",
      },
    ];
    benchmarks = [
      { game: "Cyberpunk 2077 (RT + DLSS 3)", fps: "95 - 120 FPS", quality: "Ray Tracing Ultra", resolution: "1080p / 1440p" },
      { game: "Black Myth: Wukong", fps: "85 - 110 FPS", quality: "Alta / Muy Alta", resolution: "1080p" },
      { game: "Call of Duty: Warzone", fps: "140 - 175 FPS", quality: "Ultra", resolution: "1080p" },
      { game: "Counter-Strike 2", fps: "280 - 360 FPS", quality: "Competitiva", resolution: "1080p" },
      { game: "Valorant", fps: "380 - 500 FPS", quality: "Alta", resolution: "1080p" },
      { game: "GTA 6 Ready", fps: "Fluidez 60+ FPS", quality: "Ultra (Esperado)", resolution: "1080p" },
    ];
  } else {
    // PC Gamer Ultra
    tierName = "PC Gamer Ultra";
    tierSubtitle = "La configuración definitiva para 1440p/4K, streaming profesional y creación de contenido";
    components = [
      {
        icon: Cpu,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-600 dark:text-orange-400",
        category: "Microprocesador",
        title: "AMD Ryzen 7 8700F / Intel Core Ultra 5 245KF",
        detail: "8 Núcleos / 16 Hilos hasta 5.0 GHz • Máxima potencia mononúcleo y multinúcleo",
        badge: "Ryzen 7 / Ultra 5",
      },
      {
        icon: Award,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-600 dark:text-cyan-400",
        category: "Refrigeración CPU",
        title: "Disipador de Torre 4 Heatpipes ARGB",
        detail: "Ventilador de 120mm ARGB y base de cobre térmico de alto rendimiento",
        badge: "Torre 4 Heatpipes",
      },
      {
        icon: Gamepad2,
        iconBg: "bg-indigo-500/10",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        category: "Placa de Video Dedicada",
        title: "NVIDIA GeForce RTX 5060 Ti 8GB GDDR7",
        detail: "Máxima tasa de FPS en 1440p con Ray Tracing Ultra y codificador NVENC AV1",
        badge: "RTX 5060 Ti GDDR7",
      },
      {
        icon: Layers,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        category: "Memoria RAM",
        title: "32 GB (2x16 GB) DDR5 6000 MHz RGB",
        detail: "Capacidad sobrada para jugar en 4K, transmitir en simultáneo y edición pesada",
        badge: "32GB DDR5 RGB",
      },
      {
        icon: HardDrive,
        iconBg: "bg-cyan-500/10",
        iconColor: "text-cyan-600 dark:text-cyan-400",
        category: "Almacenamiento",
        title: "SSD M.2 NVMe 1 TB PCIe 4.0 Gen4",
        detail: "Velocidades extremas de hasta 3.500 MB/s para renderizado y juegos AAA",
        badge: "Gen4 Alta Velocidad",
      },
      {
        icon: SlidersHorizontal,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-600 dark:text-amber-400",
        category: "Placa Madre",
        title: "ASRock B850M Rock WiFi / B860 Intel",
        detail: "Disipación pasiva de VRM, conectividad WiFi integrada y múltiples slots M.2",
        badge: "WiFi Integrado",
      },
      {
        icon: Zap,
        iconBg: "bg-pink-500/10",
        iconColor: "text-pink-600 dark:text-pink-400",
        category: "Fuente de Poder",
        title: "Formula V Line 750W 80 Plus GOLD Full Modular",
        detail: "Máxima eficiencia 80+ Gold con cables 100% modulares para un ensamble limpio",
        badge: "80+ Gold Modular",
      },
      {
        icon: Box,
        iconBg: "bg-slate-500/10",
        iconColor: "text-slate-600 dark:text-slate-400",
        category: "Gabinete",
        title: "Formula V Line Crystal Z9 Floe Black Mid-Tower",
        detail: "Chasis Mid-Tower de gran tamaño con panel de vidrio templado panorámico",
        badge: "Mid-Tower Premium",
      },
    ];
    benchmarks = [
      { game: "Gaming 1440p / 4K Ultra", fps: "90 - 140 FPS", quality: "Ultra + Ray Tracing", resolution: "1440p" },
      { game: "Streaming Twitch / Kick 1080p60", fps: "Fluidez Absoluta", quality: "Encoder NVENC AV1", resolution: "1080p60" },
      { game: "Cyberpunk 2077 (Path Tracing)", fps: "80 - 105 FPS", quality: "Overdrive + DLSS 3", resolution: "1440p" },
      { game: "Call of Duty: Warzone 1440p", fps: "150 - 190 FPS", quality: "Ultra", resolution: "1440p" },
      { game: "Render Blender / Premiere 4K", fps: "Exportación Rápida", quality: "Aceleración CUDA", resolution: "4K Video" },
      { game: "Black Myth: Wukong 1440p", fps: "95 - 120 FPS", quality: "Muy Alta (DLSS 3)", resolution: "1440p" },
    ];
  }

  return (
    <div className="space-y-12 mt-12 border-t border-border pt-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-accent/10 via-surface to-background border border-accent/20 rounded-3xl p-6 md:p-8 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-accent font-mono">
            Configuración Certificada PC Link
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">
          Desglose Técnico de Hardware: {tierName}
        </h2>
        <p className="text-sm text-muted font-medium max-w-2xl">
          {tierSubtitle}
        </p>
      </div>

      {/* Component Breakdown 2-Column Grid */}
      <div>
        <h3 className="text-base font-black text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
          <Wrench className="w-4 h-4 text-accent" />
          Componentes Incluidos en este Ensamble
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {components.map((comp, idx) => {
            const Icon = comp.icon;
            return (
              <div 
                key={idx}
                className="bg-surface border border-border/80 hover:border-accent/40 rounded-2xl p-4 md:p-5 flex items-start gap-4 transition-all duration-300 hover:shadow-md"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", comp.iconBg, comp.iconColor)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                      {comp.category}
                    </span>
                    {comp.badge && (
                      <span className="text-[9px] font-bold bg-background px-2 py-0.5 rounded-md border border-border text-primary shrink-0">
                        {comp.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-primary truncate">
                    {comp.title}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed mt-1">
                    {comp.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaming Performance / FPS Estimation Table */}
      {benchmarks.length > 0 && (
        <div>
          <h3 className="text-base font-black text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-indigo-500" />
            Rendimiento Estimado en Juegos
          </h3>

          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="bg-background/80 border-b border-border/80 text-[10px] font-black uppercase tracking-wider text-muted">
                    <th className="px-5 py-3.5">Título / Juego</th>
                    <th className="px-5 py-3.5">Resolución</th>
                    <th className="px-5 py-3.5">Calidad Gráfica</th>
                    <th className="px-5 py-3.5 text-right">Rendimiento Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {benchmarks.map((b, i) => (
                    <tr key={i} className="hover:bg-background/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-primary flex items-center gap-2">
                        <span>🎮 {b.game}</span>
                      </td>
                      <td className="px-5 py-3.5 text-muted font-mono">{b.resolution}</td>
                      <td className="px-5 py-3.5 text-muted">{b.quality}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-mono">
                          {b.fps}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Services & Warranty Cards */}
      <div>
        <h3 className="text-base font-black text-primary mb-6 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Servicios Incluidos en tu Compra
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-2 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-primary">12 Meses de Garantía Oficial</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Garantía escrita respaldada por PC Link y los importadores oficiales.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 space-y-2 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1">
              <Wrench className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-primary">Ensamble & Test de Estrés</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Cada equipo pasa por pruebas térmicas continuas de 2 horas antes del despacho.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 space-y-2 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-primary">Windows 11 Listo para Usar</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Sistema operativo optimizado, drivers actualizados y perfiles de memoria activados.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
