import type { CategoryIdValue } from './constants'

/**
 * Keyword-to-Category mapping for PClink catalog.
 * Higher priority categories (like full notebooks, cooling solutions, motherboards) 
 * are evaluated before basic component categories (like CPU/RAM) to prevent 
 * misclassification of complex items containing sub-components.
 */
const KEYWORD_MAP: Array<{ keywords: string[]; category: CategoryIdValue }> = [
  { keywords: ['notebook', 'laptop'], category: 'NOTEBOOK' },
  { keywords: ['silla', 'sillón gamer', 'gaming chair', 'sillon gamer'], category: 'SILLAS_GAMER' },
  { keywords: ['cargador', 'charger', 'fuente notebook', 'cargador notebook'], category: 'CARGADORES' },
  { keywords: ['parlante', 'speaker', 'altavoz', 'bluetooth speaker', '2.1', 'genius sp'], category: 'PARLANTES' },
  { keywords: ['cooler', 'refrigeracion', 'fan', 'ventilador', 'water cooling', 'cooling'], category: 'COOLING' },
  { keywords: ['motherboard', 'mother', 'placa madre', 'z790', 'b550', 'a520', 'h610'], category: 'MOTHERBOARD' },
  { keywords: ['mouse', 'raton', 'dpi'], category: 'MOUSE' },
  { keywords: ['teclado', 'keyboard', 'mecanico'], category: 'KEYBOARD' },
  { keywords: ['auricular', 'headset', 'headphones', 'audifonos'], category: 'HEADPHONES' },
  { keywords: ['monitor', 'pantalla', 'led', 'pulgadas', 'hz'], category: 'MONITOR' },
  { keywords: ['impresora', 'printer'], category: 'PRINTER' },
  { keywords: ['tinta', 'toner', 'cartucho'], category: 'INK_TONER' },
  { keywords: ['fuente', 'psu', 'power supply', '80 plus', 'bronze', 'gold'], category: 'PSU' },
  { keywords: ['gabinete', 'case', 'tower', 'atx'], category: 'CASE' },
  { keywords: ['router', 'wifi', 'access point', 'switch', 'redes'], category: 'NETWORK' },
  { keywords: ['cable', 'hdmi', 'displayport', 'usb', 'adaptador'], category: 'CABLES' },
  { keywords: ['disco', 'ssd', 'm.2', 'nvme', 'sata', 'hdd', 'almacenamiento', 'kingston', 'western'], category: 'STORAGE' },
  { keywords: ['memoria', 'ram', 'ddr4', 'ddr5', 'fury', 'vengeance'], category: 'RAM' },
  { keywords: ['rtx', 'gtx', 'radeon', 'placa de video', 'video card', 'gpu'], category: 'GPU' },
  { keywords: ['intel', 'ryzen', 'core i', 'procesador', 'cpu', 'athlon'], category: 'CPU' },
  { keywords: ['joystick', 'consola', 'ps5', 'xbox', 'nintendo'], category: 'GAMING' },
]

/**
 * Guesses the most likely category based on product name and brand/model strings.
 */
export function guessCategory(name: string, brand?: string, model?: string): CategoryIdValue {
  const fullText = `${name} ${brand || ''} ${model || ''}`.toLowerCase()

  // Si es una PC armada, clasificarla como PC_ARMADAS
  if (
    fullText.startsWith('pc ') || 
    fullText.includes(' pc ') || 
    fullText.includes('pc gamer') ||
    fullText.includes('computadora') ||
    fullText.startsWith('computadora')
  ) {
    return 'PC_ARMADAS'
  }

  // Si es un combo, evitar que se categorice como componente
  if (fullText.includes('combo')) {
    return 'OFFERS'
  }

  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => fullText.includes(kw))) {
      return entry.category
    }
  }

  return 'OFFERS' // Default fallback
}
