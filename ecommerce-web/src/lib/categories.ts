import { 
  Layers, 
  Cpu, 
  Database, 
  Package, 
  Plug, 
  Monitor, 
  Mouse, 
  Keyboard, 
  Headphones, 
  Printer, 
  Cable, 
  HardDrive, 
  Snowflake, 
  Laptop, 
  Gamepad2, 
  Wifi, 
  Droplet,
  Zap
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: any;
}

export const CATEGORIES: Category[] = [
  { id: "GPU", name: "Placas de Video", icon: Layers },
  { id: "CPU", name: "Microprocesadores", icon: Cpu },
  { id: "MOTHERBOARD", name: "Motherboards", icon: Cpu },
  { id: "RAM", name: "Memorias RAM", icon: Database },
  { id: "CASE", name: "Gabinetes", icon: Package },
  { id: "PSU", name: "Fuentes de Poder", icon: Plug },
  { id: "MONITOR", name: "Monitores", icon: Monitor },
  { id: "MOUSE", name: "Mouse", icon: Mouse },
  { id: "KEYBOARD", name: "Teclados", icon: Keyboard },
  { id: "HEADPHONES", name: "Auriculares", icon: Headphones },
  { id: "PRINTER", name: "Impresoras", icon: Printer },
  { id: "CABLES", name: "Cables y Adaptadores", icon: Cable },
  { id: "STORAGE", name: "Almacenamiento", icon: HardDrive },
  { id: "COOLING", name: "Refrigeración", icon: Snowflake },
  { id: "NOTEBOOK", name: "Notebooks", icon: Laptop },
  { id: "GAMING", name: "Accesorios Gaming", icon: Gamepad2 },
  { id: "NETWORK", name: "Redes / Routers", icon: Wifi },
  { id: "INK_TONER", name: "Cartuchos y Tóners", icon: Droplet },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.name;
  return acc;
}, {} as Record<string, string>);

export function getCategoryName(catId: string): string {
  if (!catId) return "Todas";
  const normalized = catId.toUpperCase().replace(/-/g, "_");
  
  // Custom mappings for common routes / variations
  if (normalized === "PC_GAMER" || normalized === "ENSAMBLES") return "PCs Gamer";
  if (normalized === "PROCESADORES") return "Microprocesadores";
  if (normalized === "PERIFERICOS") return "Periféricos";
  if (normalized === "AUDIO") return "Auriculares";
  
  return CATEGORY_MAP[normalized] || catId;
}

export function getFirestoreCategoryKey(urlCat: string): string {
  const normalized = urlCat.toUpperCase().replace(/-/g, "_");
  if (normalized === "PC_GAMER") return "GAMING"; // map assemblies to gaming/custom products
  if (normalized === "PROCESADORES") return "CPU";
  if (normalized === "PERIFERICOS") return "GAMING"; // map peripheral variations
  if (normalized === "AUDIO") return "HEADPHONES";
  return normalized;
}
