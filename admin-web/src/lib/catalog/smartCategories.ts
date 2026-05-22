import type { CategoryIdValue } from './constants'

/**
 * Keyword-to-Category mapping for PClink catalog.
 * Higher priority keywords should be at the top.
 */
const KEYWORD_MAP: Array<{ keywords: string[]; category: CategoryIdValue }> = [
  { keywords: ['rtx', 'gtx', 'radeon', 'placa de video', 'video card', 'gpu'], category: 'GPU' },
  { keywords: ['intel', 'ryzen', 'core i', 'procesador', 'cpu', 'athlon'], category: 'CPU' },
  { keywords: ['motherboard', 'mother', 'placa madre', 'z790', 'b550', 'a520', 'h610'], category: 'MOTHERBOARD' },
  { keywords: ['memoria', 'ram', 'ddr4', 'ddr5', 'fury', 'vengeance'], category: 'RAM' },
  { keywords: ['gabinete', 'case', 'tower', 'atx'], category: 'CASE' },
  { keywords: ['fuente', 'psu', 'power supply', '80 plus', 'bronze', 'gold'], category: 'PSU' },
  { keywords: ['monitor', 'pantalla', 'led', 'pulgadas', 'hz'], category: 'MONITOR' },
  { keywords: ['mouse', 'raton', 'dpi'], category: 'MOUSE' },
  { keywords: ['teclado', 'keyboard', 'mecanico'], category: 'KEYBOARD' },
  { keywords: ['auricular', 'headset', 'headphones', 'audifonos'], category: 'HEADPHONES' },
  { keywords: ['impresora', 'printer', 'tinta', 'toner'], category: 'PRINTER' },
  { keywords: ['cable', 'hdmi', 'displayport', 'usb', 'adaptador'], category: 'CABLES' },
  { keywords: ['disco', 'ssd', 'm.2', 'nvme', 'sata', 'hdd', 'almacenamiento', 'kingston', 'western'], category: 'STORAGE' },
  { keywords: ['cooler', 'refrigeracion', 'fan', 'ventilador', 'water cooling'], category: 'COOLING' },
  { keywords: ['notebook', 'laptop'], category: 'NOTEBOOK' },
  { keywords: ['joystick', 'consola', 'ps5', 'xbox', 'nintendo'], category: 'GAMING' },
  { keywords: ['router', 'wifi', 'access point', 'switch', 'redes'], category: 'NETWORK' },
]

/**
 * Guesses the most likely category based on product name and brand/model strings.
 */
export function guessCategory(name: string, brand?: string, model?: string): CategoryIdValue {
  const fullText = `${name} ${brand || ''} ${model || ''}`.toLowerCase()

  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => fullText.includes(kw))) {
      return entry.category
    }
  }

  return 'OFFERS' // Default fallback
}
