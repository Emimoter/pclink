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

/**
 * Direct mapping dictionary for Invid supplier categories to PClink catalog categories.
 */
const INVID_CATEGORY_RULES: Array<{ patterns: string[]; category: CategoryIdValue }> = [
  { patterns: ['placa de video'], category: 'GPU' },
  { patterns: ['micro amd', 'micro intel'], category: 'CPU' },
  { patterns: ['motherboard amd', 'motherboard intel'], category: 'MOTHERBOARD' },
  { patterns: ['memoria ddr3', 'memoria ddr4', 'memoria ddr5', 'memoria sodimm ddr3', 'memoria sodimm ddr4', 'memoria sodimm ddr5'], category: 'RAM' },
  { patterns: ['discos ssd', 'discos ssd m.2', 'd.rigido sata', 'd.rigido sata vig.', 'd.rigido nas', 'd.rigido externo', 'carry disk / enclosure', 'pen drives', 'tarjetas de memoria'], category: 'STORAGE' },
  { patterns: ['gabinete', 'gabinete sin fuente'], category: 'CASE' },
  { patterns: ['fuente alimentacion'], category: 'PSU' },
  { patterns: ['gamers fans,coolers', 'gamers water cooling'], category: 'COOLING' },
  { patterns: ['monitor', 'monitor gamer', 'monitor-corporativo', 'proyector', 'señalización digital', 'sealizacin digital'], category: 'MONITOR' },
  { patterns: ['notebook 14', 'notebook 15.6', 'notebook gamer', 'all in one', 'mini pc', 'tablet pc', 'tablet digitaliz.'], category: 'NOTEBOOK' },
  { patterns: ['sist. inf. amd', 'sist. inf. amd+win', 'sist. inf. intel'], category: 'PC_ARMADAS' },
  { patterns: ['mouse', 'mouse nb', 'mouse wireless', 'gamers mouse cableados', 'gamers mouse wireless', 'gamers mouse pad', 'mouse pad escritorio'], category: 'MOUSE' },
  { patterns: ['teclado', 'teclado multimedia', 'teclado slim', 'teclado wireless', 'gamers teclados', 'numpad'], category: 'KEYBOARD' },
  { patterns: ['auric. bluetooth', 'auric. in ear/vincha', 'auric. pc/notebook', 'auric. smartphone', 'gamers auriculares cableados', 'gamers auriculares dualres', 'gamers auriculares wireless', 'microfono'], category: 'HEADPHONES' },
  { patterns: ['audio', 'parlantes 2.0-ch', 'parlantes 2.1-ch', 'parlantes bluetooth', 'parlantes wood 2.0'], category: 'PARLANTES' },
  { patterns: ['impresora epson', 'impresora hp', 'consumibles'], category: 'PRINTER' },
  { patterns: ['access point indoor', 'access point outdoor', 'router wireless', 'switch no administrable', 'omada / switch administrables', 'placa red ethernet', 'placa red wifi pci', 'placa red wifi usb', 'cable de red utp', 'modem adsl y gpon', 'poe', 'media conv y módulos', 'media conv y mdulos'], category: 'NETWORK' },
  { patterns: ['cables y cargadores', 'adaptador hub', 'accesorios bluetooth'], category: 'CABLES' },
  { patterns: ['power bank'], category: 'CARGADORES' },
  { patterns: ['gamers sillas y escritorios'], category: 'SILLAS_GAMER' },
  { patterns: ['gamepad', 'gamers', 'volante pc', 'volante pc/ps2', 'simulador carrera', 'combos gamer', 'combos', 'kit gab/tec/mou/parl', 'teclado-mouse optico', 'teclado-mouse w.opt.'], category: 'GAMING' },
  { patterns: ['luces', 'smart home', 'streaming', 'estabilizadores', 'ups', 'ups online', 'camara ip', 'camara web 1.3m', 'camara web logitech', 'camaras web full hd', 'heladera'], category: 'OFFERS' },
]

/**
 * Maps Invid supplier category to PClink CategoryId, falling back to name/brand/model keyword guess.
 */
export function matchInvidCategory(invidCategory: string, name?: string, brand?: string, model?: string): CategoryIdValue {
  if (invidCategory) {
    const cleanCat = invidCategory.toLowerCase().replace(/[*"]/g, '').trim()
    for (const rule of INVID_CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (cleanCat.includes(pattern) || pattern.includes(cleanCat)) {
          return rule.category
        }
      }
    }
  }

  return guessCategory(name || '', brand, model)
}

