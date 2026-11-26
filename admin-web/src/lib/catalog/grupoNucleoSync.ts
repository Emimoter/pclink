import * as XLSX from 'xlsx'
import { CATEGORY_LABELS, type CategoryIdValue } from './constants'
import { guessCategory } from './smartCategories'

export interface GrupoNucleoItem {
  id: string
  partNumber?: string
  name: string
  price: number
  stock: number
  stockCaba?: number
  images: string[]
  brand: string
  model: string
  linea?: string
  category?: string
  subCategory?: string
  tax: number
  currency: string
}

export interface RecommendedNucleoItem {
  id: string
  partNumber?: string
  name: string
  brand: string
  linea?: string
  supplierCategory?: string
  subCategory?: string
  category: CategoryIdValue
  categoryLabel: string
  costUsd: number
  currency: string
  tax: number
  stockMdp: number
  stockCaba?: number
  suggestedPrice: number
  score: number
  reasons: string[]
  previewImage?: string
}

export interface GrupoNucleoSyncState {
  lastSyncAt: number
  exchangeRate: number
  sourceFileName?: string
  totalCatalogItems: number
  syncedTotal: number
  inStockMdpCount: number
  priceUpdatedCount: number
  hiddenOutOfStockCount: number
  restoredInStockCount: number
  recommendationsCount: number
}

const TIER_1_BRANDS = new Set([
  'AMD', 'INTEL', 'ASUS', 'ASROCK', 'MSI', 'GIGABYTE', 'KINGSTON',
  'WESTERN DIGITAL', 'WD', 'ADATA', 'AOC', 'AGON', 'SAMSUNG', 'LG',
  'HP', 'EPSON', 'BROTHER', 'LOGITECH', 'HYPERX', 'CORSAIR',
  'COOLER MASTER', 'TP-LINK', 'UBIQUITI', 'WACOM', 'AEROCOOL',
  'FORMULA V', 'MICROSOFT', 'JBL', 'REDRAGON', 'RAZER', 'CRUCIAL',
  'THERMALTAKE', 'DEEPCOOL', 'SEASONIC', 'VIEWSONIC', 'LENOVO', 'DELL', 'ACER',
])

const TIER_2_BRANDS = new Set([
  'CUDY', 'MERCUSYS', 'D-LINK', 'PCBOX', 'PANTUM', 'FORZA', 'APC',
  'KLIPXTREME', 'GENIUS', 'NISUTA', 'XTECH', 'PROBATTERY', 'CASE LOGIC', 'HIKVISION',
])

function normalizeKey(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function guessGrupoNucleoCategory(item: {
  name: string
  brand?: string
  model?: string
  linea?: string
  supplierCategory?: string
  subCategory?: string
}): CategoryIdValue {
  const cleanName = String(item.name || '').trim()
  const sub = String(item.subCategory || '').toLowerCase()
  const cat = String(item.supplierCategory || '').toLowerCase()
  const fullText = `${cleanName} ${item.brand || ''} ${sub} ${cat}`.toLowerCase()

  if (sub.includes('sillas gamer') || /\bsilla\s+gamer\b/i.test(fullText)) return 'SILLAS_GAMER'
  if (sub.includes('microprocesadores')) return 'CPU'
  if (sub.includes('mothers') || /^(mother|motherboard|mb)\b/i.test(cleanName)) return 'MOTHERBOARD'
  if (sub.includes('memorias') && !sub.includes('memorias sd')) return 'RAM'
  if (sub.includes('discos ssd') || sub.includes('discos rigidos') || sub.includes('pen drive') || sub.includes('memorias sd')) return 'STORAGE'
  if (sub.includes('fuentes') && !sub.includes('cctv')) return 'PSU'
  if (sub.includes('coolers')) return 'COOLING'
  if (cat.includes('monitores') || /^monitor\b/i.test(cleanName)) return 'MONITOR'
  if (cat.includes('notebooks') || /^(notebook|laptop|ultrabook)\b/i.test(cleanName)) return 'NOTEBOOK'
  if (cat.includes('impresoras')) return 'PRINTER'
  if (sub.includes('toners') || sub.includes('cartuchos')) return 'INK_TONER'
  if (cat.includes('conectividad')) return 'NETWORK'
  if (sub.includes('auriculares') || /^auricular/i.test(cleanName)) return 'HEADPHONES'
  if (sub.includes('mouses') || /^mouse\b/i.test(cleanName)) return 'MOUSE'
  if (sub.includes('teclados') || /^(teclado|combo\s+teclado)/i.test(cleanName)) return 'KEYBOARD'
  if (sub.includes('cargadores notebook')) return 'CARGADORES'
  if (sub.includes('parlantes') || /^parlante/i.test(cleanName)) return 'PARLANTES'
  if (sub.includes('cables y adaptadores')) return 'CABLES'
  if (String(item.linea || '').toLowerCase() === 'gaming' || /\b(gamepad|joystick|volante)\b/i.test(fullText)) return 'GAMING'

  return guessCategory(cleanName, item.brand, item.model)
}

export function parseGrupoNucleoExcelBuffer(data: ArrayBuffer): GrupoNucleoItem[] {
  const workbook = XLSX.read(data, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('El archivo Excel está vacío.')

  const worksheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)
  if (rawRows.length === 0) {
    throw new Error('No se encontraron filas de datos en la primera pestaña del archivo.')
  }

  return rawRows
    .map((row, idx) => {
      const normalized: Record<string, unknown> = {}
      Object.keys(row).forEach((key) => {
        normalized[key.toLowerCase().trim()] = row[key]
        normalized[key.toLowerCase().replace(/\s+/g, '')] = row[key]
      })

      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          const cleanedK = k.toLowerCase().trim()
          if (normalized[cleanedK] !== undefined) return normalized[cleanedK]
          const noSpaces = cleanedK.replace(/\s+/g, '')
          if (normalized[noSpaces] !== undefined) return normalized[noSpaces]
        }
        return undefined
      }

      const id = String(getVal('codigo', 'código', 'id') || `GN-${idx}`).trim()
      const partNumber = String(getVal('idfabricante', 'id fabricante') || '').trim()
      const name = String(getVal('descripcion', 'descripción', 'nombre') || '').trim()
      const price = parseFloat(String(getVal('precio neto', 'precio', 'neto', 'price') ?? '0')) || 0
      const currency = String(getVal('moneda', 'currency') || 'USD').trim().toUpperCase()
      const rawTax = String(getVal('impuestos', 'impuesto', 'iva', 'tax') ?? '21').replace('%', '').trim()
      const tax = Number.isFinite(parseFloat(rawTax)) ? parseFloat(rawTax) : 21
      const stock = parseInt(String(getVal('stock mdp', 'stockmdp', 'stock', 'cantidad') ?? '0'), 10) || 0
      const stockCaba = parseInt(String(getVal('stock caba', 'stockcaba') ?? '0'), 10) || 0
      const brand = String(getVal('marca', 'brand') || 'Genérico').trim()
      const linea = String(getVal('linea', 'línea') || '').trim()
      const category = String(getVal('categoria', 'categoría', 'category') || '').trim()
      const subCategory = String(getVal('subcategoria', 'subcategoría', 'subcategory') || '').trim()

      return {
        id,
        partNumber,
        name,
        price,
        stock,
        stockCaba,
        images: [],
        brand,
        model: partNumber || linea,
        linea,
        category,
        subCategory,
        tax,
        currency,
      }
    })
    .filter((item) => item.id && item.name)
}

function isRelevantCandidate(item: GrupoNucleoItem): boolean {
  const linea = String(item.linea || '').toLowerCase().trim()
  const sub = String(item.subCategory || '').toLowerCase().trim()
  const name = String(item.name || '').trim()

  const blockedLineas = new Set([
    'hogar', 'indefinido', 'movilidad', 'iluminacion', 'educacion', 'seguridad', 'bolsos', 'celulares',
  ])
  if (blockedLineas.has(linea)) return false
  if (linea === 'oficina' && !sub.includes('sillas gamer')) return false
  if (linea === 'audio - video') {
    if (!sub.includes('memorias sd') && !(sub.includes('parlantes') && item.price <= 130)) return false
  }

  const excludeRx =
    /\b(mineria|add2psu|riser|solo\s*pkit|x\s*\d+\s*unidades|la\s*caja|repuesto|filmina|rollo\s+de\s+fax|cinta\s+gtc|resma|ficha\s+rj45|modulo\s+sfp|xpon\s+ont|smartslot\s+snmp|educativa\s+c5|hd500|jetson\s+agx|princesas)\b/i
  if (excludeRx.test(name) || sub.includes('mineria') || sub.includes('cintas') || sub.includes('resmas') || sub.includes('rollo de fax')) {
    return false
  }

  if (item.price < 5 || item.price > 750) return false
  return true
}

export function computeRecommendationsFromCatalog(
  catalogItems: GrupoNucleoItem[],
  existingProducts: Array<{
    id: string
    externalId?: string
    externalSource?: string
    name?: string
    model?: string
    category?: string
    stock?: number
    price?: number
    isHidden?: boolean
  }>,
  usdRate: number,
  margin: number,
  existingPreviewMap?: Map<string, string>
): RecommendedNucleoItem[] {
  const importedIds = new Set<string>()
  const localNormNames = new Set<string>()
  const localPartNumbers = new Set<string>()
  const activeCatCounts: Record<string, number> = {}

  for (const p of existingProducts) {
    importedIds.add(String(p.id).trim())
    if (p.externalId) importedIds.add(String(p.externalId).trim())

    const isVisibleActive = !p.isHidden && (p.stock || 0) > 0 && (p.price || 0) > 0
    if (isVisibleActive) {
      const cat = p.category || 'OTROS'
      activeCatCounts[cat] = (activeCatCounts[cat] || 0) + 1
      if (p.externalSource !== 'grupo_nucleo') {
        if (p.name) localNormNames.add(normalizeKey(p.name))
        if (p.model && p.model.trim().length >= 5) localPartNumbers.add(p.model.trim().toUpperCase())
      }
    }
  }

  const scored: RecommendedNucleoItem[] = []

  for (const item of catalogItems) {
    if (item.stock <= 0) continue
    if (importedIds.has(item.id)) continue
    if (!isRelevantCandidate(item)) continue
    if (localNormNames.has(normalizeKey(item.name))) continue
    if (item.partNumber && item.partNumber.length >= 5 && localPartNumbers.has(item.partNumber.toUpperCase())) continue

    const category = guessGrupoNucleoCategory({
      name: item.name,
      brand: item.brand,
      model: item.model,
      linea: item.linea,
      supplierCategory: item.category,
      subCategory: item.subCategory,
    })
    const catCount = activeCatCounts[category] || 0
    const categoryLabel = CATEGORY_LABELS[category] || category

    let score = 0
    const reasons: string[] = []

    if (category !== 'OTROS' && category !== 'CABLES') {
      if (catCount <= 8) {
        score += 34
        reasons.push(`Hueco en ${categoryLabel} (${catCount} en web)`)
      } else if (catCount <= 18) {
        score += 22
        reasons.push(`Refuerza ${categoryLabel} (${catCount} en web)`)
      } else if (catCount <= 32) {
        score += 12
      } else {
        score += 4
      }
    } else {
      score += 3
    }

    if (item.stock >= 8) {
      score += 20
      reasons.push(`Alto stock MdP (${item.stock} u.)`)
    } else if (item.stock >= 3) {
      score += 14
      reasons.push(`Stock MdP (${item.stock} u.)`)
    } else {
      score += 6
    }

    const upperBrand = item.brand.toUpperCase().trim()
    if (TIER_1_BRANDS.has(upperBrand)) {
      score += 22
      reasons.push(`Marca top (${item.brand})`)
    } else if (TIER_2_BRANDS.has(upperBrand)) {
      score += 11
    }

    if (item.price >= 18 && item.price <= 380) score += 14
    else if (item.price > 380 && ['NOTEBOOK', 'MONITOR', 'PRINTER', 'CPU', 'MOTHERBOARD', 'GPU'].includes(category)) score += 12
    else if (item.price >= 10) score += 7

    if (['GPU', 'CPU', 'MOTHERBOARD', 'MONITOR', 'NOTEBOOK', 'PRINTER', 'SILLAS_GAMER', 'GAMING'].includes(category)) {
      score += 10
    }

    const costInArs = item.currency === 'USD' ? item.price * usdRate : item.price
    const suggestedPrice = Math.round(costInArs * (1 + item.tax / 100) * (1 + margin / 100))

    scored.push({
      id: item.id,
      partNumber: item.partNumber,
      name: item.name,
      brand: item.brand,
      linea: item.linea,
      supplierCategory: item.category,
      subCategory: item.subCategory,
      category,
      categoryLabel,
      costUsd: item.price,
      currency: item.currency,
      tax: item.tax,
      stockMdp: item.stock,
      stockCaba: item.stockCaba,
      suggestedPrice,
      score,
      reasons: reasons.slice(0, 3),
      previewImage: existingPreviewMap?.get(item.id) || item.images?.[0] || undefined,
    })
  }

  scored.sort((a, b) => b.score - a.score || b.stockMdp - a.stockMdp)

  const diversified: RecommendedNucleoItem[] = []
  const perCat: Record<string, number> = {}
  for (const c of scored) {
    if ((perCat[c.category] || 0) >= 4) continue
    perCat[c.category] = (perCat[c.category] || 0) + 1
    diversified.push(c)
    if (diversified.length >= 30) break
  }

  if (diversified.length < 30) {
    const picked = new Set(diversified.map((x) => x.id))
    for (const c of scored) {
      if (picked.has(c.id)) continue
      diversified.push(c)
      if (diversified.length >= 30) break
    }
  }

  return diversified
}
