import { Product } from "@/types/product";

export interface ParsedPcSpecs {
  isOfficialTier: boolean;
  isOfficePc: boolean;
  tierKey: "entry" | "advanced" | "pro" | "ultra" | "custom_gamer" | "office";
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
  tags: string[];
  fallbackImage: string;
}

/**
 * Devuelve una ruta local garantizada (/images/pcs/...) según el gabinete o línea de la PC,
 * evitando que links externos caídos dejen tarjetas sin foto.
 */
export function getPcFallbackImage(product: Product): string {
  const id = (product.id || "").toLowerCase();
  const text = `${product.name || ""} ${product.brand || ""} ${product.model || ""}`.toLowerCase();

  if (id === "pc-gamer-highend-intel-ultra-rtx5060ti" || text.includes("crystal z9")) {
    return "/images/pcs/gamer-crystal-z9.jpg";
  }
  if (id === "pc-gamer-nextgen-am5-rtx5060" || text.includes("u2m") || text.includes("acuario")) {
    return "/images/pcs/gamer-crystal-u2m.jpg";
  }
  if (id === "pc-gamer-ultra-r7-rx7600" || text.includes("crystal z1")) {
    return "/images/pcs/gamer-crystal-z1.jpg";
  }
  if (product.category === "PC_OFICINA") {
    if (text.includes("performance")) return "/images/pcs/office-performance.png";
    if (text.includes("pcbox") || text.includes("gabinete kit")) return "/images/pcs/office-pcbox.jpg";
    if (text.includes("kelyx")) return "/images/pcs/office-kelyx.png";
    return "/images/pcs/office-melody.jpg";
  }
  if (text.includes("gamemax") || text.includes("raptor")) {
    return "/images/pcs/gamer-gamemax.png";
  }
  if (text.includes("performance")) {
    return "/images/pcs/office-performance.png";
  }
  if (text.includes("melody")) {
    return "/images/pcs/office-melody.jpg";
  }
  if (text.includes("pcbox") || id === "pc-gamer-entry-r5-5600gt" || text.includes("gabinete kit")) {
    return "/images/pcs/office-pcbox.jpg";
  }
  if (text.includes("kelyx")) {
    return "/images/pcs/office-kelyx.png";
  }

  return product.category === "PC_OFICINA"
    ? "/images/pcs/office-performance.png"
    : "/images/pcs/gamer-gamemax.png";
}

function extractDynamicSpecs(product: Product): Omit<
  ParsedPcSpecs,
  "isOfficialTier" | "isOfficePc" | "tierKey" | "badge" | "badgeColor" | "tierSubtitle" | "tags" | "fallbackImage"
> {
  const rawName = (product.name || "").trim();
  const upper = rawName.toUpperCase();

  // 1. CPU
  let cpu = "Procesador Multinúcleo de Escritorio";
  if (/RYZEN\s*7\s*\(?8700F\)?/i.test(upper)) cpu = "AMD Ryzen 7 8700F (8 Núcleos / 16 Hilos)";
  else if (/RYZEN\s*7\s*\(?8700G\)?/i.test(upper)) cpu = "AMD Ryzen 7 8700G con Radeon 780M";
  else if (/RYZEN\s*7\s*\(?5700G?\)?/i.test(upper)) cpu = "AMD Ryzen 7 Serie 5700 (8 Núcleos / 16 Hilos)";
  else if (/RYZEN\s*7/i.test(upper)) cpu = "AMD Ryzen 7 (8 Núcleos / 16 Hilos)";
  else if (/RYZEN\s*5\s*\(?8500G\)?/i.test(upper)) cpu = "AMD Ryzen 5 8500G (6 Núcleos / 12 Hilos AM5)";
  else if (/RYZEN\s*5\s*\(?5600GT\)?/i.test(upper)) cpu = "AMD Ryzen 5 5600GT (6 Núcleos / 12 Hilos hasta 4.6 GHz)";
  else if (/RYZEN\s*5\s*\(?5600G?\)?/i.test(upper)) cpu = "AMD Ryzen 5 5600 / 5600G (6 Núcleos / 12 Hilos)";
  else if (/RYZEN\s*5\s*\(?3400G?\)?/i.test(upper)) cpu = "AMD Ryzen 5 3400G (4 Núcleos / 8 Hilos)";
  else if (/RYZEN\s*5/i.test(upper)) cpu = "AMD Ryzen 5 (6 Núcleos / 12 Hilos)";
  else if (/RYZEN\s*3\s*\(?3200G?\)?/i.test(upper)) cpu = "AMD Ryzen 3 3200G (4 Núcleos hasta 4.0 GHz)";
  else if (/RYZEN\s*3/i.test(upper)) cpu = "AMD Ryzen 3 Quad-Core";
  else if (/INTEL\s*I7|CORE\s*I7/i.test(upper)) cpu = "Intel Core i7 de Escritorio";
  else if (/INTEL\s*I5\s*\(?10MA\)?/i.test(upper)) cpu = "Intel Core i5 (10ma Generación)";
  else if (/INTEL\s*I5|CORE\s*I5/i.test(upper)) cpu = "Intel Core i5 (6 Núcleos / 12 Hilos)";
  else if (/INTEL\s*I3|CORE\s*I3/i.test(upper)) cpu = "Intel Core i3 Quad-Core de Escritorio";
  else if (/ATHLON/i.test(upper)) cpu = "AMD Athlon Dual-Core con Radeon Graphics";
  else if (/CELERON|PENTIUM/i.test(upper)) cpu = "Procesador Intel de Bajo Consumo";

  // 2. RAM
  let ram = "Memoria RAM DDR4 Alta Velocidad";
  const ramMatch = upper.match(/\b(8|16|32|64)\s*GB(?:\s*(DDR4|DDR5))?/i);
  if (ramMatch) {
    const size = ramMatch[1];
    const ddr = ramMatch[2] ? ramMatch[2].toUpperCase() : /8500G|8700|DDR5|AM5/i.test(upper) ? "DDR5" : "DDR4";
    ram = `${size} GB ${ddr} 3200 MHz`;
  }

  // 3. Storage
  let storage = "Unidad Sólida SSD de Arranque Rápido";
  const storageMatch = upper.match(/\b(120|240|250|256|480|500|512|960)\s*GB|\b(1|2)\s*TB/i);
  if (storageMatch) {
    const rawCap = storageMatch[0].replace(/\s+/g, " ").toUpperCase();
    const isNvme = /NVME|M\.2|512\s*GB|1\s*TB/i.test(upper);
    storage = isNvme ? `SSD ${rawCap} Ultra Rápido` : `SSD ${rawCap} SATA III Alta Velocidad`;
  }

  // 4. GPU
  let gpu = "Gráficos Integrados HD / FHD";
  if (/RTX\s*5060\s*TI/i.test(upper)) gpu = "NVIDIA GeForce RTX 5060 Ti GDDR7";
  else if (/RTX\s*5060/i.test(upper)) gpu = "NVIDIA GeForce RTX 5060 8GB GDDR7";
  else if (/RX\s*9050/i.test(upper)) gpu = "AMD Radeon RX 9050 8GB GDDR6";
  else if (/RX\s*7600/i.test(upper)) gpu = "AMD Radeon RX 7600 8GB GDDR6";
  else if (/RTX\s*3050/i.test(upper)) gpu = "NVIDIA GeForce RTX 3050 Dedicada";
  else if (/\bVIDEO\b/i.test(upper)) gpu = "Placa de Video Dedicada PCIe";
  else if (/5600GT|5600G|5700G|3200|3400|RYZEN/i.test(upper)) gpu = "Gráficos AMD Radeon Vega Integrados";
  else if (/INTEL|CORE\s*I[357]/i.test(upper)) gpu = "Gráficos Intel UHD Integrados (HDMI / VGA)";

  // 5. Motherboard, Gabinete & PSU
  const isAm5 = /8500G|8600G|8700|AM5|DDR5/i.test(upper);
  const isIntel = /INTEL|CORE\s*I[357]|ULTRA/i.test(upper);
  const motherboard = isAm5
    ? "Motherboard Socket AM5 DDR5"
    : isIntel
    ? "Motherboard Intel Chipset H510 / H610"
    : "Motherboard Socket AM4 (A520 / B450)";

  let cabinet = "Gabinete ATX Negro";
  let psu = "Fuente ATX 500W / 550W";

  if (/GAMEMAX/i.test(upper)) {
    cabinet = "Gabinete Gamemax ATX Negro";
    psu = "Fuente ATX 550W / 600W";
  } else if (/PERFORMANCE/i.test(upper)) {
    cabinet = "Gabinete Performance ATX Sobrio";
    psu = "Fuente Performance 550W ATX";
  } else if (/MELODY/i.test(upper)) {
    cabinet = "Gabinete Melody ATX Compacto";
    psu = "Fuente ATX 500W Incluida";
  } else if (/PCBOX/i.test(upper)) {
    cabinet = "Gabinete PCBox ATX Black Kit";
    psu = "Fuente PCBox 500W ATX";
  } else if (/KELYX/i.test(upper)) {
    cabinet = "Gabinete Kelyx ATX Compacto";
    psu = "Fuente Kelyx 500W / 550W";
  }

  return { cpu, gpu, ram, storage, motherboard, psu, cabinet };
}

export function parsePcSpecs(product: Product): ParsedPcSpecs {
  const id = (product.id || "").toLowerCase();
  const fallbackImage = getPcFallbackImage(product);

  // 1. Las 4 PCs Gamer Oficiales Curadas de la Web mantienen sus fichas exactas
  if (id === "pc-gamer-entry-r5-5600gt") {
    return {
      isOfficialTier: true,
      isOfficePc: false,
      tierKey: "entry",
      badge: "PC Gamer Entry",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      tierSubtitle: "Ideal para jugar con fluidez a títulos competitivos y trabajo/estudio",
      cpu: "AMD Ryzen 5 5600GT (6 Núcleos / 12 Hilos hasta 4.6 GHz)",
      gpu: "Gráficos Radeon Vega 7 Integrados",
      ram: "16 GB DDR4 3200 MHz (2x8 Dual Channel)",
      storage: "SSD 480 GB SATA III Ultra Rápido",
      motherboard: "MSI A520M-A PRO (Socket AM4)",
      psu: "Fuente 500W con protecciones activas",
      cabinet: "Gabinete Kit ATX Black",
      tags: ["🎮 CS2", "🎮 Valorant", "🎮 GTA V", "🎮 Fortnite"],
      fallbackImage,
    };
  }

  if (id === "pc-gamer-ultra-r7-rx7600") {
    return {
      isOfficialTier: true,
      isOfficePc: false,
      tierKey: "advanced",
      badge: "PC Gamer Advanced",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      tierSubtitle: "Potencia gráfica dedicada para jugar a todo en calidad Ultra",
      cpu: "AMD Ryzen 5 5600 (6 Núcleos / 12 Hilos hasta 4.4 GHz)",
      gpu: "Gigabyte Radeon RX 9050 GAMING OC 8GB GDDR6",
      ram: "16 GB DDR4 3200 MHz (2x8 Dual Channel)",
      storage: "SSD M.2 NVMe 512 GB PCIe Ultra Rápido",
      motherboard: "MSI A520M-A PRO (Socket AM4)",
      psu: "600W - 650W 80 Plus Bronze",
      cabinet: "Formula V Line Crystal Z1 Black",
      tags: ["🎮 Warzone", "🎮 Cyberpunk 2077", "🎮 RDR 2", "🎮 Forza Horizon 5"],
      fallbackImage,
    };
  }

  if (id === "pc-gamer-nextgen-am5-rtx5060") {
    return {
      isOfficialTier: true,
      isOfficePc: false,
      tierKey: "pro",
      badge: "PC Gamer Pro",
      badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
      tierSubtitle: "Plataforma AM5 de última generación con DLSS 3/4 y trazado de rayos",
      cpu: "AMD Ryzen 5 8500G (6 Núcleos / 12 Hilos hasta 5.0 GHz)",
      gpu: "NVIDIA GeForce RTX 5060 8GB GDDR7",
      ram: "16 GB DDR5 6000 MHz RGB (Corsair Vengeance / Kingston Fury)",
      storage: "SSD M.2 NVMe 1 TB PCIe 4.0 Gen4",
      motherboard: "Biostar / ASRock A620MS DDR5",
      psu: "Formula V Line 700W 80 Plus Bronze",
      cabinet: "Formula V Line Crystal U2M Floe White (Acuario)",
      tags: ["🎮 Cyberpunk RT", "🎮 Black Myth: Wukong", "🎮 GTA 6 Ready", "🎮 Warzone 144Hz"],
      fallbackImage,
    };
  }

  if (id === "pc-gamer-highend-intel-ultra-rtx5060ti") {
    return {
      isOfficialTier: true,
      isOfficePc: false,
      tierKey: "ultra",
      badge: "PC Gamer Ultra",
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      tierSubtitle: "Máximo rendimiento para juegos pesados en 1440p/4K, streaming y render",
      cpu: "AMD Ryzen 7 8700F / Intel Core Ultra 5 245KF",
      gpu: "NVIDIA GeForce RTX 5060 Ti (Memoria GDDR7)",
      ram: "32 GB DDR5 5600/6000 MHz RGB (2x16 Dual Channel)",
      storage: "SSD M.2 NVMe 1 TB PCIe 4.0 Gen4 Alta Velocidad",
      motherboard: "B650M (AM5) o B860 (Intel) Disipación VRM",
      psu: "700W - 750W 80 Plus Bronze / Gold Modular",
      cabinet: "Formula V Line Crystal Z9 Floe Black (Mid-Tower)",
      tags: ["🎮 1440p / 4K Ultra", "🎥 Streaming 1080p60", "⚡ Render 4K", "✨ Ray Tracing Max"],
      fallbackImage,
    };
  }

  // 2. Equipos reales del local (CSV): extraer especificaciones verdaderas sin inventar componentes
  const dyn = extractDynamicSpecs(product);
  const isOffice = product.category === "PC_OFICINA";

  if (isOffice) {
    return {
      isOfficialTier: false,
      isOfficePc: true,
      tierKey: "office",
      badge: "PC Oficina & Hogar",
      badgeColor: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
      tierSubtitle: "Equipo ágil, silencioso y confiable listo para administración, estudio, facturación y uso diario",
      ...dyn,
      tags: ["💼 Oficina & Gestión", "📊 Excel / Facturación", "🎓 Estudio & Zoom", "⚡ Arranque SSD"],
      fallbackImage,
    };
  }

  return {
    isOfficialTier: false,
    isOfficePc: false,
    tierKey: "custom_gamer",
    badge: "PC Gamer Armada",
    badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/25",
    tierSubtitle: "Equipo ensamblado y testeado en nuestro laboratorio para gaming, multitarea y edición",
    ...dyn,
    tags: ["🎮 Gaming 1080p", "⚡ Multitarea Fluida", "🛠️ Armada en Local", "✅ Lista para Usar"],
    fallbackImage,
  };
}
