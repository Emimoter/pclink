import type { CategoryIdValue } from './constants'

export type ExclusionReason = 'service_st' | 'internal_li' | 'workshop_part' | 'zero_price' | null

/**
 * Detecta si un artículo del sistema local NO debe publicarse en la web:
 * - Prefijos ST (Servicio Técnico) y LI (Limpieza / Insumos internos)
 * - Repuestos de taller, soldadura o saldos internos sin modelo comercial
 * - Artículos de librería/papelería (resmas) que distorsionan el catálogo de hardware
 */
export function getCatalogExclusionReason(
  id?: string,
  name?: string,
  price?: number,
  checkPrice: boolean = false
): ExclusionReason {
  const cleanId = (id || '').trim()
  const cleanName = (name || '').trim()

  // 1. Prefijo ST (Servicios Técnicos)
  if (/^st(\b|[-_.\s])/i.test(cleanId) || /^st(\b|[-_.\s])/i.test(cleanName)) {
    return 'service_st'
  }

  // 2. Prefijo LI (Insumos internos / Limpieza de taller)
  if (/^li(\b|[-_.\s])/i.test(cleanId) || /^li(\b|[-_.\s])/i.test(cleanName)) {
    return 'internal_li'
  }

  // 3. Repuestos de taller, saldos genéricos, servicios de mano de obra o resmas
  const workshopPatterns = [
    /^pantalla\s+notebook\b/i,
    /^teclado\s+notebook\b/i,
    /^bateria\s+notebook\b/i,
    /^bisagra\s+notebook\b/i,
    /^flex\s+notebook\b/i,
    /^carcasa\s+notebook\b/i,
    /^pin\s+de\s+carga\b/i,
    /^saldo\b/i,
    /\bsoldar\b/i,
    /^repuesto\b/i,
    /^servicio\s+tecnico\b/i,
    /^mano\s+de\s+obra\b/i,
    /^instalacion\s+de\b/i,
    /^formateo\b/i,
    /^resma\b/i,
    /^papel\s+photo\b/i,
  ]

  if (workshopPatterns.some((rx) => rx.test(cleanName))) {
    return 'workshop_part'
  }

  // 4. Precio en $0 o inválido
  if (checkPrice && (typeof price !== 'number' || !Number.isFinite(price) || price <= 0)) {
    return 'zero_price'
  }

  return null
}

export function shouldExcludeFromCatalog(
  id?: string,
  name?: string,
  price?: number,
  checkPrice: boolean = false
): boolean {
  return getCatalogExclusionReason(id, name, price, checkPrice) !== null
}

/**
 * Clasifica un producto de forma precisa evaluando primero qué ES el artículo
 * (sustantivo principal / prefijo) y usando límites de palabra (\b) para evitar
 * falsos positivos como "GRAMOS" -> RAM, "LEDESMA" -> MONITOR o "GAME PAD ... PC" -> PC_ARMADAS.
 */
export function guessCategory(name: string, brand?: string, model?: string): CategoryIdValue {
  const cleanName = (name || '').trim()
  const nameLower = cleanName.toLowerCase()
  const fullText = `${cleanName} ${brand || ''} ${model || ''}`.toLowerCase().trim()

  // 1. PCs Armadas: PC Gamer queda exclusivo para las configuraciones oficiales "PC Gamer...",
  // mientras que toda PC ensamblada subida desde el CSV del local entra siempre en PC_OFICINA.
  const isDesktopPc =
    /^pc\s+(gamer|armada|ryzen|intel|amd|core|oficina|hogar|escritorio|celeron|pentium|athlon)/i.test(cleanName) ||
    /^computadora\b/i.test(cleanName) ||
    /^mini\s*pc\b/i.test(cleanName) ||
    /^(all\s+in\s+one|aio)\b/i.test(cleanName)

  if (isDesktopPc) {
    const isOfficialGamer = /^pc\s+gamer\b/i.test(cleanName)
    return isOfficialGamer ? 'PC_ARMADAS' : 'PC_OFICINA'
  }

  // 2. Sillas Gamer
  if (/^(silla|sillon|sillón)\b|\b(silla\s+gamer|sillon\s+gamer|sillón\s+gamer|gaming\s+chair)\b/i.test(fullText)) {
    return 'SILLAS_GAMER'
  }

  // 3. Cables, Hubs y Adaptadores de video/datos/corriente (evaluado al inicio si empieza con CABLE / HUB)
  // Excluimos placas de red WiFi y cables de red UTP/Patch cord que van a NETWORK
  if (/^(patch\s*cord|cable\s+utp|cable\s+de\s+red|ficha\s+rj)/i.test(cleanName)) {
    return 'NETWORK'
  }
  if (/^(cable|hub)\b/i.test(cleanName)) {
    return 'CABLES'
  }

  // 4. Cargadores y Power Banks (ANTES que Notebook para que "CARGADOR NOTEBOOK" vaya a CARGADORES)
  if (/^(cargador|fuente\s+notebook)\b|\b(power\s*bank|cargador\s+notebook|cargador\s+usb|charger)\b/i.test(fullText)) {
    return 'CARGADORES'
  }

  // 5. Gabinetes de PC (ANTES que Cooling/Mouse para que "GABINETE ... 5 FAN" o "Gabinete Kit (Teclado-Mouse)" vayan a CASE)
  // Excluimos "GABINETE EXTERNO" (carry disk) que va a STORAGE
  if (/^gabinete\b/i.test(cleanName) && !/^gabinete\s+externo\b/i.test(cleanName)) {
    return 'CASE'
  }

  // 6. Almacenamiento (ANTES que CABLES/USB/NOTEBOOK para capturar Discos Externos USB, Carry Disk, Pendrives, MicroSD, Disco Notebook)
  if (
    /^(disco|ssd|carry\s*disk|gabinete\s+externo|pen\s*drive|pendrive|mem\.?\s*digital|memoria\s+micro\s*sd|tarjeta\s+de\s+memoria)\b/i.test(
      cleanName
    ) ||
    /\b(carry\s*disk|disco\s+externo|disco\s+ssd|disco\s+rigido|disco\s+r[ií]gido|pen\s*drive|pendrive|micro\s*sd|nvme|m\.2\s*(nvme|sata|2280|2230))\b/i.test(
      fullText
    )
  ) {
    return 'STORAGE'
  }

  // 7. Redes y Conectividad WiFi (captura PLACA INAL. USB, MESH, RANGE EXTENDER, ROUTER, SWITCH, ANTENA)
  if (
    /^(router|modem|m[oó]dem|switch|mesh|range\s+extender|repeater|repetidor|access\s+point|placa\s+inal|placa\s+de\s+red|placa\s+red|antena)\b/i.test(
      cleanName
    ) ||
    /\b(router|access\s+point|range\s+extender|tp-?link\s+deco|mercusys\s+halo|wifi\s*6)\b/i.test(fullText)
  ) {
    return 'NETWORK'
  }

  // 8. Adaptadores restantes (USB, HDMI, VGA, Bluetooth, OTG, SATA a USB, etc.)
  if (/^adaptador\b/i.test(cleanName)) {
    return 'CABLES'
  }

  // 9. Cartuchos, Tóners y Drums (ANTES que Impresoras)
  if (/^(cartucho|toner|tóner|tinta|botella\s+de\s+tinta|drum)\b|\b(toner|tóner|cartucho|ink\s+bottle)\b/i.test(fullText)) {
    return 'INK_TONER'
  }

  // 10. Impresoras
  if (/^(impresora|multifuncion|multifunción)\b|\b(impresora|ecotank|laserjet|inktank|deskjet)\b/i.test(fullText)) {
    return 'PRINTER'
  }

  // 11. Refrigeración y Bases Cooler (ANTES que Notebook/CPU)
  if (
    /^(cooler|water\s*cooling|fan|triple\s+fan|pack\s+de\s+\d+\s*fans?|base\s+de\s+notebook|base\s+cooler|pasta\s+termica|pasta\s+térmica)\b/i.test(
      cleanName
    ) ||
    /\b(water\s*cooling|masterliquid|air\s+cooling)\b/i.test(fullText)
  ) {
    return 'COOLING'
  }

  // 12. Periféricos: Auriculares, Parlantes, Teclados, Mouse (ANTES que Gaming/Notebook para que "Auricular Xbox/PS" vaya a HEADPHONES y "Mouse Notebook" a MOUSE)
  if (/^(auricular|auriculares|headset|headphones)\b|\b(auricular|headset|earbuds|earbus)\b/i.test(fullText)) {
    return 'HEADPHONES'
  }
  if (/^(parlante|parlantes|blue\s*tooth\s+parlante|speaker|altavoz|barra\s+de\s+sonido|soundbar)\b/i.test(cleanName)) {
    return 'PARLANTES'
  }
  if (/^(teclado|teclaldo|combo\s+teclado|kit\s+teclado)\b/i.test(cleanName)) {
    return 'KEYBOARD'
  }
  if (/^(mouse|pad\s+de\s+mouse|mouse\s*pad)\b/i.test(cleanName)) {
    return 'MOUSE'
  }

  // 13. Accesorios Gaming / Joysticks / Gamepads / Consolas
  if (/\b(gamepad|game\s+pad|joystick|volante|consola|dual\s*shock|play\s*stick|xbox|ps4|ps5|nintendo)\b/i.test(fullText)) {
    return 'GAMING'
  }

  // 14. Monitores (solo monitores reales, sin matchear "LED" o "Hz" sueltos)
  if (/^monitor\b|\bmonitor\s+(led|lcd|ips|va|gamer|curvo|fhd|qhd)\b/i.test(fullText)) {
    return 'MONITOR'
  }

  // 15. Notebooks reales (solo equipos portátiles, no fundas/bolsos/luces para notebook)
  if (/^(notebook|laptop|macbook|netbook|ultrabook)\b/i.test(cleanName)) {
    return 'NOTEBOOK'
  }

  // 16. Componentes de Hardware Principal (GPU, Motherboard, RAM, CPU, PSU, Case)
  if (
    /^(gpu|vga|video\s+pcie|placa\s+de\s+video|placa\s+video|placa\s+asrock\s+radeon)\b/i.test(cleanName) ||
    /\b(geforce|radeon\s+rx|rtx\s*\d{3,4}|gtx\s*\d{3,4}|gt\s*(210|710|730|1030)|rx\s*(5\d{2}|6\d{3}|7\d{3}|9\d{3}))\b/i.test(fullText)
  ) {
    return 'GPU'
  }

  if (
    /^(mother|motherboard|mb|placa\s+madre)\b/i.test(cleanName) ||
    /\b(motherboard|a520m?|b450m?|b550m?|b650m?|x670e?|x870e?|a620m?|b850m?|h410m?|h510m?|h610m?|b365m?|b760m?|b860m?|z790)\b/i.test(
      fullText
    )
  ) {
    return 'MOTHERBOARD'
  }

  if (
    /^(memoria\s+(ddr|sodimm|udimm|dimm|ram|kingston|corsair|adata|patriot|mushkin)|sodimm\b|udimm\b)/i.test(cleanName) ||
    /\b(ddr2|ddr3|ddr4|ddr5|sodimm|udimm)\b/i.test(fullText)
  ) {
    return 'RAM'
  }

  if (
    /^(micro|microprocesador|procesador|cpu)\b/i.test(cleanName) ||
    /\b(ryzen\s+[3579]|core\s+i[3579]|core\s+ultra|athlon|pentium|celeron)\b/i.test(nameLower)
  ) {
    return 'CPU'
  }

  if (/^fuente\b|\b(power\s+supply|80\s*plus\s*(bronze|gold|silver|white|platinum)?)\b/i.test(fullText)) {
    return 'PSU'
  }

  if (/\b(mid-?tower|full-?tower|tempered\s+glass)\b/i.test(fullText)) {
    return 'CASE'
  }

  // 17. Fallback general: OTROS (cámaras web, micrófonos, UPS/estabilizadores, zapatillas, fundas, soportes, tablets, lectores, pilas, etc.)
  return 'OTROS'
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
  { patterns: ['notebook 14', 'notebook 15.6', 'notebook gamer'], category: 'NOTEBOOK' },
  { patterns: ['all in one', 'mini pc', 'sist. inf. amd', 'sist. inf. amd+win', 'sist. inf. intel'], category: 'PC_OFICINA' },
  { patterns: ['mouse', 'mouse nb', 'mouse wireless', 'gamers mouse cableados', 'gamers mouse wireless', 'gamers mouse pad', 'mouse pad escritorio'], category: 'MOUSE' },
  { patterns: ['teclado', 'teclado multimedia', 'teclado slim', 'teclado wireless', 'gamers teclados', 'numpad', 'teclado-mouse optico', 'teclado-mouse w.opt.'], category: 'KEYBOARD' },
  { patterns: ['auric. bluetooth', 'auric. in ear/vincha', 'auric. pc/notebook', 'auric. smartphone', 'gamers auriculares cableados', 'gamers auriculares dualres', 'gamers auriculares wireless'], category: 'HEADPHONES' },
  { patterns: ['audio', 'parlantes 2.0-ch', 'parlantes 2.1-ch', 'parlantes bluetooth', 'parlantes wood 2.0'], category: 'PARLANTES' },
  { patterns: ['impresora epson', 'impresora hp'], category: 'PRINTER' },
  { patterns: ['consumibles'], category: 'INK_TONER' },
  { patterns: ['access point indoor', 'access point outdoor', 'router wireless', 'switch no administrable', 'omada / switch administrables', 'placa red ethernet', 'placa red wifi pci', 'placa red wifi usb', 'cable de red utp', 'modem adsl y gpon', 'poe', 'media conv y módulos', 'media conv y mdulos'], category: 'NETWORK' },
  { patterns: ['cables y cargadores', 'adaptador hub', 'accesorios bluetooth'], category: 'CABLES' },
  { patterns: ['power bank'], category: 'CARGADORES' },
  { patterns: ['gamers sillas y escritorios'], category: 'SILLAS_GAMER' },
  { patterns: ['gamepad', 'gamers', 'volante pc', 'volante pc/ps2', 'simulador carrera', 'combos gamer', 'combos', 'kit gab/tec/mou/parl'], category: 'GAMING' },
  { patterns: ['microfono', 'tablet pc', 'tablet digitaliz.', 'luces', 'smart home', 'streaming', 'estabilizadores', 'ups', 'ups online', 'camara ip', 'camara web 1.3m', 'camara web logitech', 'camaras web full hd', 'heladera'], category: 'OTROS' },
]

/**
 * Maps Invid supplier category to PClink CategoryId, falling back to name/brand/model keyword guess.
 */
export function matchInvidCategory(invidCategory: string, name?: string, brand?: string, model?: string): CategoryIdValue {
  if (invidCategory) {
    const cleanCat = invidCategory.toLowerCase().replace(/[*"]/g, '').trim()
    for (const rule of INVID_CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (cleanCat === pattern || cleanCat.includes(pattern)) {
          // Si es una PC armada de Invid, dejamos que guessCategory decida si es Gamer u Oficina
          if (rule.category === 'PC_OFICINA' && name) {
            return guessCategory(name, brand, model)
          }
          return rule.category
        }
      }
    }
  }

  return guessCategory(name || '', brand, model)
}
