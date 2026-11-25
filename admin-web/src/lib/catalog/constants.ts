/** Coincide con com.pclink.app.domain.model.CategoryId (nombres enum) */
export const CATEGORY_IDS = [
  'PC_ARMADAS',
  'PC_OFICINA',
  'NOTEBOOK',
  'GPU',
  'CPU',
  'MOTHERBOARD',
  'RAM',
  'STORAGE',
  'CASE',
  'PSU',
  'COOLING',
  'MONITOR',
  'MOUSE',
  'KEYBOARD',
  'HEADPHONES',
  'PARLANTES',
  'GAMING',
  'SILLAS_GAMER',
  'PRINTER',
  'INK_TONER',
  'NETWORK',
  'CABLES',
  'CARGADORES',
  'OTROS',
  'OFFERS',
] as const

export type CategoryIdValue = (typeof CATEGORY_IDS)[number]

export const CATEGORY_LABELS: Record<CategoryIdValue, string> = {
  GPU: 'Placas de Video (GPU)',
  CPU: 'Microprocesadores (CPU)',
  MOTHERBOARD: 'Motherboards',
  RAM: 'Memorias RAM',
  CASE: 'Gabinetes',
  PSU: 'Fuentes de Poder (PSU)',
  MONITOR: 'Monitores',
  MOUSE: 'Mouse',
  KEYBOARD: 'Teclados',
  HEADPHONES: 'Auriculares',
  PRINTER: 'Impresoras',
  CABLES: 'Cables y Adaptadores',
  STORAGE: 'Almacenamiento',
  COOLING: 'Refrigeración',
  NOTEBOOK: 'Notebooks',
  GAMING: 'Accesorios Gaming',
  NETWORK: 'Redes / Routers',
  INK_TONER: 'Cartuchos y Tóners',
  PC_ARMADAS: 'PC Gamer',
  PC_OFICINA: 'PC Oficina',
  SILLAS_GAMER: 'Sillas Gamer',
  CARGADORES: 'Cargadores',
  PARLANTES: 'Parlantes',
  OTROS: 'Otros',
  OFFERS: 'Ofertas'
}

export type CsvFieldKey = 'id' | 'name' | 'price' | 'stock' | 'brand' | 'model'

export const CSV_FIELD_LABELS: Record<CsvFieldKey, string> = {
  id: 'ID / Código (opcional)',
  name: 'Nombre',
  price: 'Precio',
  stock: 'Stock',
  brand: 'Marca',
  model: 'Modelo',
}
