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
  Zap,
  Armchair,
  Volume2,
  Briefcase,
  Grid
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: any;
}

export const CATEGORIES: Category[] = [
  { id: "PC_ARMADAS", name: "PC Gamer", icon: Monitor },
  { id: "PC_OFICINA", name: "PC Oficina", icon: Briefcase },
  { id: "NOTEBOOK", name: "Notebooks", icon: Laptop },
  { id: "GPU", name: "Placas de Video (GPU)", icon: Layers },
  { id: "CPU", name: "Microprocesadores (CPU)", icon: Cpu },
  { id: "MOTHERBOARD", name: "Motherboards", icon: Cpu },
  { id: "RAM", name: "Memorias RAM", icon: Database },
  { id: "STORAGE", name: "Almacenamiento", icon: HardDrive },
  { id: "CASE", name: "Gabinetes", icon: Package },
  { id: "PSU", name: "Fuentes de Poder (PSU)", icon: Plug },
  { id: "COOLING", name: "Refrigeración", icon: Snowflake },
  { id: "MONITOR", name: "Monitores", icon: Monitor },
  { id: "MOUSE", name: "Mouse", icon: Mouse },
  { id: "KEYBOARD", name: "Teclados", icon: Keyboard },
  { id: "HEADPHONES", name: "Auriculares", icon: Headphones },
  { id: "PARLANTES", name: "Parlantes", icon: Volume2 },
  { id: "GAMING", name: "Accesorios Gaming", icon: Gamepad2 },
  { id: "SILLAS_GAMER", name: "Sillas Gamer", icon: Armchair },
  { id: "PRINTER", name: "Impresoras", icon: Printer },
  { id: "INK_TONER", name: "Cartuchos y Tóners", icon: Droplet },
  { id: "NETWORK", name: "Redes / Routers", icon: Wifi },
  { id: "CABLES", name: "Cables y Adaptadores", icon: Cable },
  { id: "CARGADORES", name: "Cargadores", icon: Plug },
  { id: "OTROS", name: "Otros", icon: Grid },
  { id: "OFFERS", name: "Ofertas", icon: Zap },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.name;
  return acc;
}, {} as Record<string, string>);

export function isPcCategory(catId?: string | null): boolean {
  if (!catId) return false;
  const normalized = catId.toUpperCase().replace(/-/g, "_");
  return normalized === "PC_ARMADAS" || normalized === "PC_GAMER" || normalized === "PC_OFICINA";
}

export function getCategoryName(catId: string): string {
  if (!catId) return "Todas las Categorías";
  const normalized = catId.toUpperCase().replace(/-/g, "_");
  
  if (normalized === "PC_GAMER" || normalized === "ENSAMBLES" || normalized === "PC_ARMADAS") return "PC Gamer";
  if (normalized === "PC_OFICINA" || normalized === "OFICINA") return "PC Oficina";
  if (normalized === "PROCESADORES") return "Microprocesadores (CPU)";
  if (normalized === "PERIFERICOS") return "Periféricos";
  if (normalized === "AUDIO") return "Auriculares";
  if (normalized === "OTROS" || normalized === "VARIOS") return "Otros";
  
  return CATEGORY_MAP[normalized] || catId;
}

export function getFirestoreCategoryKey(urlCat: string): string {
  const normalized = urlCat.toUpperCase().replace(/-/g, "_");
  if (normalized === "PC_GAMER" || normalized === "ENSAMBLES") return "PC_ARMADAS";
  if (normalized === "OFICINA") return "PC_OFICINA";
  if (normalized === "PROCESADORES") return "CPU";
  if (normalized === "PERIFERICOS") return "GAMING";
  if (normalized === "AUDIO") return "HEADPHONES";
  if (normalized === "VARIOS") return "OTROS";
  return normalized;
}
