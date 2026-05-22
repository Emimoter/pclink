/** Coincide con com.pclink.app.domain.model.CategoryId (nombres enum) */
export const CATEGORY_IDS = [
  'GPU',
  'CPU',
  'MOTHERBOARD',
  'RAM',
  'CASE',
  'PSU',
  'MONITOR',
  'MOUSE',
  'KEYBOARD',
  'HEADPHONES',
  'PRINTER',
  'CABLES',
  'STORAGE',
  'COOLING',
  'NOTEBOOK',
  'GAMING',
  'NETWORK',
  'INK_TONER',
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
