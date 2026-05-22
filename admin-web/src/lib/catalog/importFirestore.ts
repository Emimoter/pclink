import { writeBatch, doc, type Firestore } from 'firebase/firestore'
import type { CategoryIdValue, CsvFieldKey } from './constants'

export type Row = Record<string, string>

export type ColumnMapping = Record<CsvFieldKey, string>

export interface StockColumnMapping {
  id: string
  stock: string
}

const BATCH_MAX = 400

export function cell(row: Row, header: string): string {
  if (!header) return ''
  const v = row[header]
  return v == null ? '' : String(v).trim()
}

export function parsePrice(raw: string): number {
  if (!raw) return 0
  let s = raw.replace(/\$/g, '').replace(/\s/g, '').trim()
  // AR: 1.234,56 → 1234.56
  if (s.includes(',') && /^[\d.]+,\d+$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function parseStock(raw: string): number {
  if (!raw) return 0
  const n = parseInt(raw.replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

export function buildStockMap(
  stockRows: Row[],
  stockMapping: StockColumnMapping
): Map<string, number> {
  const map = new Map<string, number>()
  if (!stockMapping.id || !stockMapping.stock) return map

  for (const row of stockRows) {
    const idVal = cell(row, stockMapping.id)
    const qtyVal = cell(row, stockMapping.stock)
    if (idVal) {
      map.set(idVal, parseStock(qtyVal))
    }
  }
  return map
}

export function stockRowToUpdatePayload(
  row: Row,
  stockMapping: StockColumnMapping
): { docId: string; data: { stock: number; updatedAt: number } } | null {
  const idRaw = cell(row, stockMapping.id)
  const qtyRaw = cell(row, stockMapping.stock)
  if (!idRaw) return null

  return {
    docId: idRaw,
    data: {
      stock: parseStock(qtyRaw),
      updatedAt: Date.now(),
    },
  }
}

export function rowToProductPayload(
  row: Row,
  mapping: ColumnMapping,
  category: CategoryIdValue,
  rowIndex: number,
  stockMap?: Map<string, number>
): { docId: string; data: Record<string, unknown> } {
  const idRaw = cell(row, mapping.id)
  const docId =
    idRaw ||
    `import-${category.toLowerCase()}-${Date.now()}-${rowIndex}`

  const name = cell(row, mapping.name)
  const brand = cell(row, mapping.brand)
  const model = cell(row, mapping.model)
  const price = parsePrice(cell(row, mapping.price))

  // If a stockMap is supplied, look up the stock by ID, otherwise fall back to mapping.stock in articles
  let stock = 0
  if (stockMap) {
    if (idRaw && stockMap.has(idRaw)) {
      stock = stockMap.get(idRaw) ?? 0
    }
  } else {
    stock = parseStock(cell(row, mapping.stock))
  }

  const data: Record<string, unknown> = {
    id: docId,
    name: name || `Producto ${rowIndex + 1}`,
    brand: brand || '—',
    model: model || '—',
    category,
    price,
    stock,
    currency: 'ARS',
    updatedAt: Date.now(),
    source: 'admin_csv_import',
  }

  return { docId, data }
}

export async function commitProductsToFirestore(
  db: Firestore,
  items: Array<{ docId: string; data: Record<string, unknown> }>,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  let done = 0
  const total = items.length

  for (let i = 0; i < items.length; i += BATCH_MAX) {
    const chunk = items.slice(i, i + BATCH_MAX)
    const batch = writeBatch(db)
    for (const { docId, data } of chunk) {
      batch.set(doc(db, 'products', docId), data, { merge: true })
    }
    await batch.commit()
    done += chunk.length
    onProgress?.(done, total)
  }
}
