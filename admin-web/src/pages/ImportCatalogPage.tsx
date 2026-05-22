import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import Papa from 'papaparse'
import { Upload, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, Download, Database, X } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { getDb } from '../lib/firebase'
import {
  CSV_FIELD_LABELS,
  type CsvFieldKey,
} from '../lib/catalog/constants'
import {
  rowToProductPayload,
  commitProductsToFirestore,
  buildStockMap,
  stockRowToUpdatePayload,
  type Row,
  type ColumnMapping,
  type StockColumnMapping,
  cell,
  parseStock,
  parsePrice,
} from '../lib/catalog/importFirestore'
import { guessCategory } from '../lib/catalog/smartCategories'
import { subscribeToProducts, type Product } from '../lib/catalog/products'

function guessMapping(headers: string[]): ColumnMapping {
  const lower = headers.map((h) => h.toLowerCase().trim())
  const pick = (...cands: string[]) => {
    for (const c of cands) {
      const i = lower.findIndex((h) => h === c || h.includes(c))
      if (i >= 0) return headers[i]!
    }
    return ''
  }
  return {
    id: pick('numero de producto', 'nro de producto', 'codigo', 'código', 'id', 'sku', 'nro', 'numero', 'número', 'articulo', 'artículo'),
    name: pick('nombre', 'producto', 'descripcion', 'descripción', 'titulo', 'título'),
    price: pick('precio', 'price', 'pvp', 'importe', 'valor'),
    stock: pick('cantidad en stock', 'cantidad', 'stock', 'existencia', 'inv'),
    brand: pick('marca', 'brand', 'fabricante'),
    model: pick('modelo', 'model', 'mod'),
  }
}

function guessStockMapping(headers: string[]): StockColumnMapping {
  const lower = headers.map((h) => h.toLowerCase().trim())
  const pick = (...cands: string[]) => {
    for (const c of cands) {
      const i = lower.findIndex((h) => h === c || h.includes(c))
      if (i >= 0) return headers[i]!
    }
    return ''
  }

  const idCol = pick('numero de producto', 'nro de producto', 'codigo', 'código', 'id', 'sku', 'nro', 'numero', 'número', 'articulo', 'artículo')
  let stockCol = pick('cantidad en stock', 'cantidad', 'stock', 'existencia', 'inv')

  // Regla infalible: Si detectamos el ID y es un archivo de 2 columnas, la restante es el Stock
  if (idCol && !stockCol && headers.length === 2) {
    stockCol = headers.find(h => h !== idCol) || ''
  }

  // Fallbacks secundarios por posición si falla la búsqueda por texto
  if (!stockCol && headers.length >= 2) {
    stockCol = headers[1]!
  }
  if (!idCol && headers.length >= 1) {
    return { id: headers[0]!, stock: headers[1] || '' }
  }

  return {
    id: idCol,
    stock: stockCol,
  }
}

export function ImportCatalogPage() {
  const { user } = useAuth()

  // Articles CSV States
  const [rows, setRows] = useState<Row[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    id: '',
    name: '',
    price: '',
    stock: '',
    brand: '',
    model: '',
  })
  const [csvFileName, setCsvFileName] = useState('')

  // Stock CSV States
  const [stockRows, setStockRows] = useState<Row[]>([])
  const [stockHeaders, setStockHeaders] = useState<string[]>([])
  const [stockMapping, setStockMapping] = useState<StockColumnMapping>({
    id: '',
    stock: '',
  })
  const [stockFileName, setStockFileName] = useState('')

  // Shared status states
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvBusy, setCsvBusy] = useState(false)
  const [csvProgress, setCsvProgress] = useState<string | null>(null)
  const [csvDone, setCsvDone] = useState(false)

  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([])
  const [loadingFirestore, setLoadingFirestore] = useState(true)

  useEffect(() => {
    return subscribeToProducts(getDb(), (data) => {
      setFirestoreProducts(data)
      setLoadingFirestore(false)
    })
  }, [])

  const onCsvFile = useCallback((file: File | null) => {
    setCsvError(null)
    setCsvDone(false)
    setRows([])
    setHeaders([])
    if (!file) return

    setCsvFileName(file.name)
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'UTF-8',
      complete: (result) => {
        const data = (result.data as Row[]).filter((r) => Object.values(r).some((v) => String(v || '').trim()))
        if (data.length === 0) {
          setCsvError('El CSV de artículos no tiene filas de datos.')
          return
        }
        const hdrs = result.meta.fields?.filter(Boolean) as string[]
        if (!hdrs?.length) {
          setCsvError('No se detectaron columnas en el CSV de artículos.')
          return
        }
        setHeaders(hdrs)
        setRows(data)
        setMapping(guessMapping(hdrs))
      },
      error: (err) => setCsvError(err.message || 'No se pudo leer el CSV de artículos'),
    })
  }, [])

  const onStockCsvFile = useCallback((file: File | null) => {
    setCsvError(null)
    setCsvDone(false)
    setStockRows([])
    setStockHeaders([])
    if (!file) return

    setStockFileName(file.name)
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'UTF-8',
      complete: (result) => {
        const data = (result.data as Row[]).filter((r) => Object.values(r).some((v) => String(v || '').trim()))
        if (data.length === 0) {
          setCsvError('El CSV de stock no tiene filas de datos.')
          return
        }
        const hdrs = result.meta.fields?.filter(Boolean) as string[]
        if (!hdrs?.length) {
          setCsvError('No se detectaron columnas en el CSV de stock.')
          return
        }
        setStockHeaders(hdrs)
        setStockRows(data)
        setStockMapping(guessStockMapping(hdrs))
      },
      error: (err) => setCsvError(err.message || 'No se pudo leer el CSV de stock'),
    })
  }, [])

  const clearArticlesFile = () => {
    setRows([])
    setHeaders([])
    setCsvFileName('')
    setCsvDone(false)
    setCsvError(null)
  }

  const clearStockFile = () => {
    setStockRows([])
    setStockHeaders([])
    setStockFileName('')
    setCsvDone(false)
    setCsvError(null)
  }

  const importMode = useMemo(() => {
    if (rows.length > 0 && stockRows.length > 0) return 'full'
    if (rows.length > 0) return 'articles'
    if (stockRows.length > 0) return 'stock'
    return 'none'
  }, [rows.length, stockRows.length])

  const canUploadCsv = useMemo(() => {
    if (importMode === 'full') {
      return !!(rows.length > 0 && mapping.name && mapping.price && mapping.id && stockMapping.id && stockMapping.stock)
    }
    if (importMode === 'articles') {
      return !!(rows.length > 0 && mapping.name && mapping.price)
    }
    if (importMode === 'stock') {
      return !!(stockRows.length > 0 && stockMapping.id && stockMapping.stock)
    }
    return false
  }, [importMode, rows.length, mapping.name, mapping.price, mapping.id, stockRows.length, stockMapping.id, stockMapping.stock])

  const runCsvImport = async () => {
    if (!user || !canUploadCsv) return
    setCsvBusy(true)
    setCsvError(null)
    setCsvProgress(null)
    setCsvDone(false)
    try {
      const db = getDb()

      if (importMode === 'full') {
        const stockMap = buildStockMap(stockRows, stockMapping)
        const payloads = rows.map((row, i) => {
          const name = row[mapping.name] || ''
          const brand = mapping.brand ? row[mapping.brand] : ''
          const model = mapping.model ? row[mapping.model] : ''
          const resolvedCategory = guessCategory(name, brand, model)
          
          return rowToProductPayload(row, mapping, resolvedCategory, i, stockMap)
        })

        await commitProductsToFirestore(db, payloads, (done, total) => {
          setCsvProgress(`${done} / ${total}`)
        })
      } else if (importMode === 'articles') {
        const payloads = rows.map((row, i) => {
          const name = row[mapping.name] || ''
          const brand = mapping.brand ? row[mapping.brand] : ''
          const model = mapping.model ? row[mapping.model] : ''
          const resolvedCategory = guessCategory(name, brand, model)
          
          return rowToProductPayload(row, mapping, resolvedCategory, i)
        })

        await commitProductsToFirestore(db, payloads, (done, total) => {
          setCsvProgress(`${done} / ${total}`)
        })
      } else if (importMode === 'stock') {
        const payloads = stockRows
          .map((row) => stockRowToUpdatePayload(row, stockMapping))
          .filter(Boolean) as Array<{ docId: string; data: Record<string, unknown> }>

        await commitProductsToFirestore(db, payloads, (done, total) => {
          setCsvProgress(`${done} / ${total}`)
        })
      }
      
      setCsvDone(true)
      setCsvProgress(null)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Error al escribir en Firestore (¿reglas de seguridad?)'
      setCsvError(msg)
    } finally {
      setCsvBusy(false)
    }
  }

  const handleExportFirestoreCsv = () => {
    if (firestoreProducts.length === 0) return
    
    const csvData = firestoreProducts.map((p) => ({
      id: p.id || '',
      name: p.name || '',
      price: p.price || 0,
      stock: p.stock || 0,
      brand: p.brand || '',
      model: p.model || '',
    }))
    
    const csvContent = Papa.unparse(csvData, {
      quotes: true,
      header: true,
    })
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pclink_catalogo_firestore_${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const setMap = (key: CsvFieldKey, header: string) => {
    setMapping((m) => ({ ...m, [key]: header }))
  }

  const setStockMap = (key: keyof StockColumnMapping, header: string) => {
    setStockMapping((m) => ({ ...m, [key]: header }))
  }

  const previewProducts = useMemo(() => {
    if (importMode === 'full') {
      const stockMap = buildStockMap(stockRows, stockMapping)
      return rows.slice(0, 5).map((row, i) => {
        const idRaw = cell(row, mapping.id)
        const name = row[mapping.name] || `Producto ${i + 1}`
        const brand = mapping.brand ? row[mapping.brand] : ''
        const model = mapping.model ? row[mapping.model] : ''
        const price = parsePrice(cell(row, mapping.price))
        const category = guessCategory(name, brand, model)
        const matchedStock = idRaw ? (stockMap.get(idRaw) ?? null) : null
        
        return {
          id: idRaw || '— (Auto)',
          name,
          category,
          price,
          stock: matchedStock ?? 0,
          stockMatched: matchedStock !== null,
        }
      })
    } else if (importMode === 'articles') {
      return rows.slice(0, 5).map((row, i) => {
        const idRaw = cell(row, mapping.id)
        const name = row[mapping.name] || `Producto ${i + 1}`
        const brand = mapping.brand ? row[mapping.brand] : ''
        const model = mapping.model ? row[mapping.model] : ''
        const price = parsePrice(cell(row, mapping.price))
        const category = guessCategory(name, brand, model)
        const stock = parseStock(cell(row, mapping.stock))
        
        return {
          id: idRaw || '— (Auto)',
          name,
          category,
          price,
          stock,
          stockMatched: false,
        }
      })
    } else if (importMode === 'stock') {
      return stockRows.slice(0, 5).map((row) => {
        const idRaw = cell(row, stockMapping.id)
        const stock = parseStock(cell(row, stockMapping.stock))
        
        return {
          id: idRaw || '—',
          name: '— (Solo Stock)',
          category: '—',
          price: null,
          stock,
          stockMatched: true,
        }
      })
    }
    return []
  }, [importMode, rows, mapping, stockRows, stockMapping])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar/Exportar catálogo</h1>
        <p className="mt-2 text-pclink-muted text-sm">
          Gestioná la base de datos de productos de PClink. Podés importar nuevos archivos CSV o descargar una copia de seguridad del catálogo activo en Firestore.
        </p>
      </div>

      {/* 1. SECCION EXPORTAR */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-pclink-cyan-light font-bold uppercase tracking-wider">
            <Database className="h-4 w-4" />
            Catálogo Activo en Firestore
          </div>
          <span className="rounded-full bg-pclink-cyan/10 px-2.5 py-0.5 text-[11px] font-bold text-pclink-cyan">
            {loadingFirestore ? 'Cargando...' : `${firestoreProducts.length} Productos`}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:items-center">
          <div className="md:col-span-2">
            <p className="text-xs text-pclink-muted leading-relaxed">
              Descargá una copia de seguridad en formato plano <strong className="text-white">.CSV</strong> compatible con Microsoft Excel, Access o cualquier hoja de cálculo. Codificado en UTF-8 con soporte para caracteres especiales.
            </p>
          </div>
          <div>
            <motion.button
              type="button"
              disabled={loadingFirestore || firestoreProducts.length === 0}
              onClick={handleExportFirestoreCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep py-3 text-xs font-bold text-pclink-bg shadow-[0_0_24px_rgba(0,188,212,0.2)] disabled:opacity-45"
              whileTap={{ scale: !loadingFirestore && firestoreProducts.length > 0 ? 0.99 : 1 }}
            >
              {loadingFirestore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar catálogo (CSV)
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 2. SECCION IMPORTAR */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 space-y-6"
      >
        <div className="flex items-center gap-2 text-sm text-pclink-cyan-light font-bold uppercase tracking-wider">
          <FileSpreadsheet className="h-4 w-4" />
          Importar Catálogo (CSV → Firestore)
        </div>

        <div className="rounded-xl border border-pclink-cyan/20 bg-pclink-cyan/5 p-4">
          <p className="text-xs text-pclink-cyan-light leading-relaxed">
            <strong>Inteligencia de Categorías:</strong> Al importar el catálogo, los productos se dividirán automáticamente en las categorías correspondientes (GPU, CPU, RAM, etc.) basándose en su nombre.
          </p>
        </div>

        {/* PANEL DE CARGA DUAL */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* A. Artículos CSV */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-pclink-muted">
              Archivo 1: Catálogo de Artículos (Detalles, Precios)
            </label>
            {csvFileName ? (
              <div className="relative flex items-center justify-between rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 p-4 transition-all">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-pclink-cyan" />
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[200px]">{csvFileName}</p>
                    <p className="text-[10px] text-pclink-cyan-light">{rows.length} filas detectadas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearArticlesFile}
                  className="rounded-lg p-1 text-pclink-muted hover:bg-pclink-elevated hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-pclink-border bg-pclink-bg/40 py-8 transition hover:border-pclink-cyan/40">
                <Upload className="mb-2 h-6 w-6 text-pclink-cyan" />
                <span className="text-xs font-semibold text-white">Elegir catálogo de artículos .csv</span>
                <span className="mt-1 text-[10px] text-pclink-muted">Primera fila = nombres de columnas</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => onCsvFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          {/* B. Stock CSV */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-pclink-muted">
              Archivo 2: Niveles de Stock (Inventario)
            </label>
            {stockFileName ? (
              <div className="relative flex items-center justify-between rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 p-4 transition-all">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-pclink-cyan" />
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[200px]">{stockFileName}</p>
                    <p className="text-[10px] text-pclink-cyan-light">{stockRows.length} filas detectadas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearStockFile}
                  className="rounded-lg p-1 text-pclink-muted hover:bg-pclink-elevated hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-pclink-border bg-pclink-bg/40 py-8 transition hover:border-pclink-cyan/40">
                <Upload className="mb-2 h-6 w-6 text-pclink-cyan" />
                <span className="text-xs font-semibold text-white">Elegir listado de stock .csv</span>
                <span className="mt-1 text-[10px] text-pclink-muted">Primera fila = nombres de columnas</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => onStockCsvFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </div>

        {/* CARTEL INFORMATIVO DEL MODO AUTOMÁTICO */}
        {importMode !== 'none' && (
          <div className="rounded-xl border border-pclink-cyan/20 bg-pclink-cyan/5 p-4 transition-all">
            <p className="text-xs text-pclink-cyan-light leading-relaxed">
              {importMode === 'full' && (
                <>
                  <strong>Modo Fusión (Catálogo + Stock):</strong> Se cargará el catálogo y se cruzará automáticamente con el nivel de stock en memoria usando la columna común seleccionada. ¡Esto optimiza escrituras y costos en Firestore!
                </>
              )}
              {importMode === 'articles' && (
                <>
                  <strong>Modo Solo Catálogo:</strong> Se cargarán los datos de productos descriptivos y precios. Al no subirse un archivo de stock secundario, el stock se inicializará según el mapeo de stock de este archivo o en 0.
                </>
              )}
              {importMode === 'stock' && (
                <>
                  <strong>Modo Solo Stock:</strong> Se actualizarán únicamente los niveles de stock y el timestamp de última actualización de los productos ya registrados en Firestore. No se tocarán fotos, nombres ni precios.
                </>
              )}
            </p>
          </div>
        )}

        {/* SECCION MAPEO DE COLUMNAS */}
        {(headers.length > 0 || stockHeaders.length > 0) && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-pclink-border pb-2">Configuración de Mapeo de Columnas</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Mapeo Artículos */}
              {headers.length > 0 && (
                <div className="space-y-4 rounded-xl border border-pclink-border bg-pclink-elevated/40 p-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-pclink-cyan-light">Columnas del Catálogo</h4>
                  <div className="grid gap-3">
                    {(Object.keys(CSV_FIELD_LABELS) as CsvFieldKey[]).map((key) => (
                      <div key={key}>
                        <label className="mb-1 block text-[11px] text-pclink-muted">{CSV_FIELD_LABELS[key]}</label>
                        <select
                          value={mapping[key]}
                          onChange={(e) => setMap(key, e.target.value)}
                          className="w-full rounded-xl border border-pclink-border bg-pclink-bg/60 px-3 py-1.5 text-xs text-white"
                        >
                          <option value="">—</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-pclink-muted leading-relaxed">
                    Requiere <strong className="text-pclink-cyan-light">Nombre</strong> y <strong className="text-pclink-cyan-light">Precio</strong>. El ID es opcional (si no se mapea, se genera de manera automática). Para el Modo Fusión, asegúrate de mapear el <strong className="text-white">ID / Código</strong> para poder cruzar los datos.
                  </p>
                </div>
              )}

              {/* Mapeo Stock */}
              {stockHeaders.length > 0 && (
                <div className="space-y-4 rounded-xl border border-pclink-border bg-pclink-elevated/40 p-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-pclink-cyan-light">Columnas del Inventario</h4>
                  <div className="grid gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] text-pclink-muted">ID / Código de Enlace (Común)</label>
                      <select
                        value={stockMapping.id}
                        onChange={(e) => setStockMap('id', e.target.value)}
                        className="w-full rounded-xl border border-pclink-border bg-pclink-bg/60 px-3 py-1.5 text-xs text-white"
                      >
                        <option value="">—</option>
                        {stockHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] text-pclink-muted">Cantidad de Stock</label>
                      <select
                        value={stockMapping.stock}
                        onChange={(e) => setStockMap('stock', e.target.value)}
                        className="w-full rounded-xl border border-pclink-border bg-pclink-bg/60 px-3 py-1.5 text-xs text-white"
                      >
                        <option value="">—</option>
                        {stockHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-pclink-muted leading-relaxed">
                    Ambos campos son **obligatorios** para poder cruzar los datos o actualizar los stocks en Firestore de manera individual.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA PREVIA DE LA FUSION */}
        {previewProducts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">Vista Previa de la Importación (Primeras 5 filas)</h3>
            <div className="overflow-x-auto rounded-xl border border-pclink-border">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="border-b border-pclink-border bg-pclink-elevated/80 text-pclink-muted">
                    <th className="px-3 py-2 font-semibold">Código</th>
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Categoría (Auto)</th>
                    <th className="px-3 py-2 font-semibold">Precio</th>
                    <th className="px-3 py-2 font-semibold text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {previewProducts.map((p, i) => (
                    <tr key={i} className="border-b border-pclink-border/50">
                      <td className="px-3 py-2 font-mono text-pclink-cyan-light">{p.id}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-pclink-muted font-medium">{p.name}</td>
                      <td className="px-3 py-2">
                        {p.category !== '—' ? (
                          <span className="rounded-md bg-pclink-cyan/10 px-2 py-0.5 text-[10px] font-bold text-pclink-cyan">
                            {p.category}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-white">
                        {p.price !== null ? `$${p.price.toLocaleString('es-AR')}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {p.stockMatched ? (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                            {p.stock} (Sinc.)
                          </span>
                        ) : (
                          <span className="rounded-md bg-pclink-muted/10 px-2 py-0.5 text-[10px] font-bold text-pclink-muted border border-pclink-border">
                            {p.stock}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-pclink-border px-3 py-2 text-xs text-pclink-muted">
                {importMode === 'stock' ? (
                  <>Mostrando 5 de {stockRows.length} actualizaciones de stock</>
                ) : (
                  <>Mostrando 5 de {rows.length} productos procesados</>
                )}
              </p>
            </div>
          </div>
        )}

        {csvError && (
          <div className="flex gap-3 rounded-xl border border-pclink-error/40 bg-pclink-error/10 p-4 text-sm text-red-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {csvError}
          </div>
        )}

        {csvDone && (
          <div className="flex gap-3 rounded-xl border border-pclink-success/40 bg-pclink-success/10 p-4 text-sm text-emerald-100">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-pclink-success" />
            Importación enviada a Firestore correctamente.
          </div>
        )}

        <motion.button
          type="button"
          disabled={!canUploadCsv || csvBusy}
          onClick={() => void runCsvImport()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep py-3.5 text-sm font-bold text-pclink-bg shadow-[0_0_24px_rgba(0,188,212,0.25)] disabled:opacity-45"
          whileTap={{ scale: canUploadCsv && !csvBusy ? 0.99 : 1 }}
        >
          {csvBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {csvProgress ?? 'Escribiendo…'}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {importMode === 'full' && `Fusionar y Escribir ${rows.length} Productos`}
              {importMode === 'articles' && `Escribir ${rows.length} Productos (Sin Stock secundario)`}
              {importMode === 'stock' && `Actualizar Stock de ${stockRows.length} Productos`}
              {importMode === 'none' && `Escribir catálogo en Firestore`}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}
