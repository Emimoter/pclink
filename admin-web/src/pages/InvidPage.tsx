import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, Search, Import, Tag, AlertCircle, 
  CheckCircle2, RefreshCw, Trash2, Edit2, Upload, FileSpreadsheet
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getDb } from '../lib/firebase'
import { doc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { matchInvidCategory } from '../lib/catalog/smartCategories'
import { CATEGORY_LABELS } from '../lib/catalog/constants'

interface InvidItem {
  id: string
  name: string
  price: number
  stock: number
  images: string[]
  brand: string
  model: string
  tax: number
  currency: string
  category: string
  partNumber?: string
  ean?: string
  observations?: string
}

interface SyncedProduct {
  id: string
  name: string
  price: number
  stock: number
  category: string
  images: string[]
  margin: number
  externalId: string
  brand?: string
  model?: string
}

export function InvidPage() {
  // Excel Catalog States
  const [catalog, setCatalog] = useState<InvidItem[]>([])
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [excelFileName, setExcelFileName] = useState('')

  // Sync Products in Firestore
  const [syncedProducts, setSyncedProducts] = useState<SyncedProduct[]>([])
  const [loadingSynced, setLoadingSynced] = useState(true)

  // Import Dialog Modal State
  const [selectedItem, setSelectedItem] = useState<InvidItem | null>(null)
  const [importing, setImporting] = useState(false)

  // Global settings
  const [globalDollarRate, setGlobalDollarRate] = useState<number>(1515)
  const globalIva = 21
  const [globalMargin, setGlobalMargin] = useState<number>(30)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [displayLimit, setDisplayLimit] = useState(20)

  // Filtros y ordenamiento del catálogo
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')
  const [onlyWithStock, setOnlyWithStock] = useState(false)
  const [onlyWithPriceChanges, setOnlyWithPriceChanges] = useState(false)
  const [sortBy, setSortBy] = useState<'category' | 'price_asc' | 'price_desc' | 'name_asc'>('category')

  // Overrides para el modal de importación individual
  const [itemDollarRate, setItemDollarRate] = useState<number>(1515)
  const [itemIva, setItemIva] = useState<number>(21)
  const [itemMargin, setItemMargin] = useState<number>(30)

  // Edit Margin Modal State
  const [editingProduct, setEditingProduct] = useState<SyncedProduct | null>(null)
  const [editMargin, setEditMargin] = useState(30)
  const [savingMargin, setSavingMargin] = useState(false)

  // Synced Products Bulk Selection & Search States
  const [selectedSyncedIds, setSelectedSyncedIds] = useState<Set<string>>(new Set())
  const [syncedSearchQuery, setSyncedSearchQuery] = useState('')
  const [editingBulkMargin, setEditingBulkMargin] = useState(false)
  const [bulkMarginValue, setBulkMarginValue] = useState<number>(30)
  const [savingBulkMargin, setSavingBulkMargin] = useState(false)

  // Active sub-tab inside page
  const [activeTab, setActiveTab] = useState<'catalog' | 'synced'>('catalog')

  useEffect(() => {
    loadSyncedProducts()
  }, [])

  // Sincronizar datos individuales del modal cuando cambia el item seleccionado
  useEffect(() => {
    if (selectedItem) {
      setItemDollarRate(globalDollarRate)
      setItemIva(selectedItem.tax !== undefined && selectedItem.tax !== null ? selectedItem.tax : globalIva)
      setItemMargin(globalMargin)
    }
  }, [selectedItem, globalDollarRate, globalMargin])

  // Clear selections when switching tabs
  useEffect(() => {
    setSelectedIds(new Set())
    setSelectedSyncedIds(new Set())
  }, [activeTab])

  // Reiniciar el límite de visualización al realizar búsquedas o filtrar/ordenar
  useEffect(() => {
    setDisplayLimit(20)
  }, [searchQuery, onlyWithStock, onlyWithPriceChanges, selectedCategoryFilter, sortBy])

  // Load synced products from PClink database
  const loadSyncedProducts = async () => {
    setLoadingSynced(true)
    try {
      const q = query(collection(getDb(), 'products'), where('externalSource', '==', 'invid'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as SyncedProduct))
      setSyncedProducts(list)
    } catch (err) {
      console.error('Error al cargar productos sincronizados de Invid:', err)
    } finally {
      setLoadingSynced(false)
    }
  }

  // Filter synced products based on search query
  const filteredSyncedProducts = useMemo(() => {
    if (!syncedSearchQuery) return syncedProducts
    const q = syncedSearchQuery.toLowerCase()
    return syncedProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.id.toLowerCase().includes(q) || 
      p.externalId.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    )
  }, [syncedProducts, syncedSearchQuery])

  // Parse Excel (.xlsx / .xls) file from Invid
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setExcelFileName(file.name)
    setLoadingCatalog(true)
    setCatalogError(null)
    setCatalog([])
    setSelectedIds(new Set())
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        if (!data) throw new Error('No se pudieron leer los datos del archivo.')
        
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('El archivo Excel está vacío.')
        
        const worksheet = workbook.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })
        
        if (rawRows.length === 0) {
          throw new Error('No se encontraron filas de datos en el archivo Excel.')
        }

        let detectedDollar = 1515
        let currentCategory = 'General'
        const parsedItems: InvidItem[] = []

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i]
          if (!row || !Array.isArray(row)) continue

          // Extraer cotización del dólar del encabezado (ej. COTIZACION: TC EFECTIVO / MP 1515)
          const col4Text = String(row[3] || row[0] || '').toUpperCase()
          if (col4Text.includes('COTIZACION') || col4Text.includes('TC EFECTIVO')) {
            const match = col4Text.match(/(?:COTIZACION|TC EFECTIVO|MP)\D*(\d+)/i)
            if (match && match[1]) {
              const rate = parseInt(match[1], 10)
              if (rate > 500 && rate < 5000) {
                detectedDollar = rate
              }
            }
          }

          // Detectar encabezado de sección de categoría en Columna 1 (empieza con '*')
          const col1Text = String(row[0] || '').trim()
          if (col1Text.startsWith('*')) {
            currentCategory = col1Text.replace(/^\*+\s*/, '').trim()
            continue
          }

          // Detectar filas de artículos
          // Formato estándar Invid: Col 0: Familia/Cat, Col 1: Articulo(código), Col 3: Detalle(nombre), Col 4: EAN, Col 5: PartNumber, Col 6: IVA, Col 8: Fabricante, Col 9: Precio
          const colArt = String(row[1] || row[0] || '').trim()
          const colDet = String(row[3] || row[2] || '').trim()
          const colPriceRaw = row[9] !== undefined ? row[9] : (row[8] !== undefined ? row[8] : row[10])

          if (colArt && colDet && colPriceRaw !== undefined && colPriceRaw !== null && i >= 6) {
            const price = typeof colPriceRaw === 'number' ? colPriceRaw : parseFloat(String(colPriceRaw).replace(',', '.'))
            if (!isNaN(price) && price > 0 && colDet.toLowerCase() !== 'detalle') {
              const colIvaRaw = String(row[6] || row[7] || '').toUpperCase()
              let tax = 21
              if (colIvaRaw.includes('10.5') || colIvaRaw.includes('10,5')) {
                tax = 10.5
              } else if (colIvaRaw.includes('21')) {
                tax = 21
              }

              const colBrand = String(row[8] || row[7] || '').trim()
              const colPN = String(row[5] || row[4] || '').trim()
              const colEan = String(row[4] || '').trim()
              const colObs = String(row[10] || row[11] || '').trim()

              parsedItems.push({
                id: colArt,
                name: colDet,
                price: price,
                stock: 10,
                images: [],
                brand: colBrand || 'Genérico',
                model: colPN || '',
                tax: tax,
                currency: 'USD',
                category: currentCategory,
                partNumber: colPN,
                ean: colEan,
                observations: colObs
              })
            }
          }
        }

        if (parsedItems.length === 0) {
          throw new Error('No se detectaron artículos válidos en el formato Excel de Invid.')
        }

        setGlobalDollarRate(detectedDollar)
        setExchangeRate(detectedDollar)
        setCatalog(parsedItems)
      } catch (err: any) {
        console.error('Error al procesar Excel de Invid:', err)
        setCatalogError(`Error al procesar el archivo Excel: ${err.message}`)
      } finally {
        setLoadingCatalog(false)
      }
    }

    reader.onerror = () => {
      setCatalogError('Error al leer el archivo.')
      setLoadingCatalog(false)
    }

    reader.readAsArrayBuffer(file)
  }

  // Import single product into PClink catalog
  const handleImportProduct = async () => {
    if (!selectedItem) return
    setImporting(true)
    try {
      const db = getDb()
      
      const costInARS = selectedItem.currency === 'USD' ? (selectedItem.price * itemDollarRate) : selectedItem.price
      const taxMultiplier = 1 + (itemIva / 100)
      const costWithTax = costInARS * taxMultiplier
      
      const syncedProd = syncedProducts.find(p => p.externalId === selectedItem.id)
      const marginToUse = syncedProd ? (syncedProd.margin ?? itemMargin) : itemMargin
      const finalPrice = Math.round(costWithTax * (1 + marginToUse / 100))

      const matchedCat = matchInvidCategory(selectedItem.category, selectedItem.name, selectedItem.brand, selectedItem.model)
      const productRef = doc(db, 'products', `INVID-${selectedItem.id}`)
      
      const updateData: Record<string, any> = {
        name: selectedItem.name,
        brand: selectedItem.brand || 'Genérico',
        model: selectedItem.model || selectedItem.partNumber || '',
        price: finalPrice,
        stock: selectedItem.stock,
        category: matchedCat,
        externalSource: 'invid',
        externalId: selectedItem.id,
        margin: marginToUse,
        onDemand: true,
        deliveryDays: 4,
        deliveryInfo: 'Entrega estimada en 4 días hábiles dentro de Mar del Plata',
        updatedAt: Date.now()
      }

      if (!syncedProd) {
        updateData.description = `Producto Invid (${selectedItem.category}). Cód: ${selectedItem.id}. PN: ${selectedItem.partNumber || 'N/A'}.`
        updateData.images = selectedItem.images.length > 0 ? selectedItem.images : ['']
      }

      await setDoc(productRef, updateData, { merge: true })

      alert(`¡Producto "${selectedItem.name}" importado con éxito a la categoría ${CATEGORY_LABELS[matchedCat as keyof typeof CATEGORY_LABELS] || matchedCat}!`)
      setSelectedItem(null)
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al importar producto: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Import all selected products in batches of 400
  const handleImportSelected = async () => {
    if (selectedIds.size === 0) return
    setImporting(true)
    try {
      const db = getDb()
      const itemsToImport = catalog.filter(item => selectedIds.has(item.id))
      
      const chunkSize = 400
      let successCount = 0
      
      for (let i = 0; i < itemsToImport.length; i += chunkSize) {
        const chunk = itemsToImport.slice(i, i + chunkSize)
        const batch = writeBatch(db)
        
        chunk.forEach(item => {
          const costInARS = item.currency === 'USD' ? (item.price * globalDollarRate) : item.price
          const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
          const costWithTax = costInARS * (1 + taxRate / 100)
          
          const syncedProd = syncedProducts.find(p => p.externalId === item.id)
          const marginToUse = syncedProd ? (syncedProd.margin ?? globalMargin) : globalMargin
          const finalPrice = Math.round(costWithTax * (1 + marginToUse / 100))

          const matchedCat = matchInvidCategory(item.category, item.name, item.brand, item.model)
          const productRef = doc(db, 'products', `INVID-${item.id}`)
          
          const updateData: Record<string, any> = {
            name: item.name,
            brand: item.brand || 'Genérico',
            model: item.model || item.partNumber || '',
            price: finalPrice,
            stock: item.stock,
            category: matchedCat,
            externalSource: 'invid',
            externalId: item.id,
            margin: marginToUse,
            onDemand: true,
            deliveryDays: 4,
            deliveryInfo: 'Entrega estimada en 4 días hábiles dentro de Mar del Plata',
            updatedAt: Date.now()
          }

          if (!syncedProd) {
            updateData.description = `Producto Invid (${item.category}). Cód: ${item.id}.`
            updateData.images = item.images.length > 0 ? item.images : ['']
          }

          batch.set(productRef, updateData, { merge: true })
        })
        
        await batch.commit()
        successCount += chunk.length
      }
      
      alert(`¡Se importaron ${successCount} productos de Invid con éxito en modo bajo pedido (onDemand)!`)
      setSelectedIds(new Set())
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al importar en lote: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Actualizar en grupo todos los productos con cambios de precio detectados
  const handleBulkUpdatePriceChanges = async () => {
    if (priceChangesCount === 0) return
    
    const confirmUpdate = window.confirm(
      `¿Estás seguro de que querés actualizar el precio de los ${priceChangesCount} productos vinculados que tienen cambios detectados?`
    )
    if (!confirmUpdate) return

    setImporting(true)
    try {
      const db = getDb()
      
      const itemsToUpdate = catalog.filter(item => {
        const syncedProd = syncedProducts.find(p => p.externalId === item.id)
        if (!syncedProd) return false
        
        const costInARS = item.currency === 'USD' ? (item.price * globalDollarRate) : item.price
        const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
        const costWithTax = costInARS * (1 + taxRate / 100)
        const marginToUse = syncedProd.margin ?? globalMargin
        const calculatedPrice = Math.round(costWithTax * (1 + marginToUse / 100))
        
        return calculatedPrice !== syncedProd.price
      })

      if (itemsToUpdate.length === 0) {
        alert('No se encontraron productos con cambios de precio pendientes.')
        return
      }

      const chunkSize = 400
      let successCount = 0
      
      for (let i = 0; i < itemsToUpdate.length; i += chunkSize) {
        const chunk = itemsToUpdate.slice(i, i + chunkSize)
        const batch = writeBatch(db)
        
        chunk.forEach(item => {
          const costInARS = item.currency === 'USD' ? (item.price * globalDollarRate) : item.price
          const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
          const costWithTax = costInARS * (1 + taxRate / 100)
          
          const syncedProd = syncedProducts.find(p => p.externalId === item.id)!
          const marginToUse = syncedProd.margin ?? globalMargin
          const finalPrice = Math.round(costWithTax * (1 + marginToUse / 100))
          
          const productRef = doc(db, 'products', syncedProd.id)
          const updateData: Record<string, any> = {
            name: item.name,
            price: finalPrice,
            stock: item.stock,
            externalSource: 'invid',
            externalId: item.id,
            margin: marginToUse,
            updatedAt: Date.now()
          }

          batch.set(productRef, updateData, { merge: true })
        })
        
        await batch.commit()
        successCount += chunk.length
      }
      
      alert(`¡Se actualizaron ${successCount} precios en grupo con éxito!`)
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al actualizar precios en grupo: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Update margin of already imported product
  const handleUpdateMargin = async () => {
    if (!editingProduct) return
    setSavingMargin(true)
    try {
      const db = getDb()
      const productRef = doc(db, 'products', editingProduct.id)
      
      const invidItem = catalog.find(i => i.id === editingProduct.externalId)
      let finalPrice = editingProduct.price
      
      if (invidItem) {
        const costInARS = invidItem.currency === 'USD' ? (invidItem.price * globalDollarRate) : invidItem.price
        const taxRate = invidItem.tax !== undefined && invidItem.tax !== null ? invidItem.tax : globalIva
        const taxMultiplier = 1 + (taxRate / 100)
        const costWithTax = costInARS * taxMultiplier
        finalPrice = Math.round(costWithTax * (1 + editMargin / 100))
      } else {
        const estimatedCost = editingProduct.price / (1 + (editingProduct.margin ?? globalMargin) / 100)
        finalPrice = Math.round(estimatedCost * (1 + editMargin / 100))
      }

      await updateDoc(productRef, {
        margin: editMargin,
        price: finalPrice,
        updatedAt: Date.now()
      })

      alert('¡Margen de ganancia actualizado con éxito!')
      setEditingProduct(null)
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al actualizar margen: ${err.message}`)
    } finally {
      setSavingMargin(false)
    }
  }

  // Unlink / Delete product from PClink database
  const handleUnlinkProduct = async (product: SyncedProduct) => {
    if (!confirm(`¿Estás seguro que querés desvincular y eliminar permanentemente "${product.name}" de tu catálogo?`)) return
    try {
      const db = getDb()
      const productRef = doc(db, 'products', product.id)
      await deleteDoc(productRef)
      alert('Producto desvinculado y eliminado.')
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`)
    }
  }

  // Toggle selection for a single synced product ID
  const toggleSelectSyncedProduct = (id: string) => {
    setSelectedSyncedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Toggle selection for all filtered synced products
  const toggleSelectAllSynced = (filteredSynced: SyncedProduct[]) => {
    if (selectedSyncedIds.size === filteredSynced.length) {
      setSelectedSyncedIds(new Set())
    } else {
      setSelectedSyncedIds(new Set(filteredSynced.map(p => p.id)))
    }
  }

  // Unlink/Delete all selected synced products in batches of 400
  const handleBulkUnlinkProducts = async () => {
    if (selectedSyncedIds.size === 0) return
    if (!confirm(`¿Estás seguro que querés desvincular y eliminar permanentemente los ${selectedSyncedIds.size} productos seleccionados de tu catálogo?`)) return
    setSavingBulkMargin(true)
    try {
      const db = getDb()
      const idsArray = Array.from(selectedSyncedIds)
      const chunkSize = 400
      let successCount = 0

      for (let i = 0; i < idsArray.length; i += chunkSize) {
        const chunk = idsArray.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach(id => {
          const productRef = doc(db, 'products', id)
          batch.delete(productRef)
        })

        await batch.commit()
        successCount += chunk.length
      }

      alert(`Se desvincularon y eliminaron ${successCount} productos con éxito.`)
      setSelectedSyncedIds(new Set())
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al eliminar en lote: ${err.message}`)
    } finally {
      setSavingBulkMargin(false)
    }
  }

  // Bulk update margin for selected synced products in batches of 400
  const handleBulkUpdateMargin = async (newMargin: number) => {
    if (selectedSyncedIds.size === 0) return
    setSavingBulkMargin(true)
    try {
      const db = getDb()
      const itemsToUpdate = syncedProducts.filter(p => selectedSyncedIds.has(p.id))
      const chunkSize = 400
      let successCount = 0

      for (let i = 0; i < itemsToUpdate.length; i += chunkSize) {
        const chunk = itemsToUpdate.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach(prod => {
          const invidItem = catalog.find(item => item.id === prod.externalId)
          let finalPrice = prod.price
          
          if (invidItem) {
            const costInARS = invidItem.currency === 'USD' ? (invidItem.price * globalDollarRate) : invidItem.price
            const taxRate = invidItem.tax !== undefined && invidItem.tax !== null ? invidItem.tax : globalIva
            const taxMultiplier = 1 + (taxRate / 100)
            const costWithTax = costInARS * taxMultiplier
            finalPrice = Math.round(costWithTax * (1 + newMargin / 100))
          } else {
            const estimatedCost = prod.price / (1 + (prod.margin ?? globalMargin) / 100)
            finalPrice = Math.round(estimatedCost * (1 + newMargin / 100))
          }

          const productRef = doc(db, 'products', prod.id)
          batch.update(productRef, {
            margin: newMargin,
            price: finalPrice,
            updatedAt: Date.now()
          })
        })

        await batch.commit()
        successCount += chunk.length
      }

      alert(`Se actualizó el margen comercial de ${successCount} productos a +${newMargin}%.`)
      setEditingBulkMargin(false)
      setSelectedSyncedIds(new Set())
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al actualizar márgenes en lote: ${err.message}`)
    } finally {
      setSavingBulkMargin(false)
    }
  }

  // Toggle selection for a single product ID
  const toggleSelectProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Toggle selection for all filtered items
  const toggleSelectAll = () => {
    if (selectedIds.size === processedCatalog.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedCatalog.map(item => item.id)))
    }
  }

  // Obtener lista única de categorías de Invid en el catálogo cargado
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    catalog.forEach(item => {
      if (item.category) {
        cats.add(item.category)
      }
    })
    return Array.from(cats).sort()
  }, [catalog])

  // Count how many synced products have price changes compared to the incoming catalog costs
  const priceChangesCount = useMemo(() => {
    let count = 0
    catalog.forEach(item => {
      const syncedProd = syncedProducts.find(p => p.externalId === item.id)
      if (syncedProd) {
        const costInARS = item.currency === 'USD' ? (item.price * globalDollarRate) : item.price
        const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
        const costWithTax = costInARS * (1 + taxRate / 100)
        const marginToUse = syncedProd.margin ?? globalMargin
        const calculatedPrice = Math.round(costWithTax * (1 + marginToUse / 100))
        
        if (calculatedPrice !== syncedProd.price) {
          count++
        }
      }
    })
    return count
  }, [catalog, syncedProducts, globalDollarRate, globalIva, globalMargin])

  // Filtering and sorting Invid catalog client side
  const processedCatalog = useMemo(() => {
    const filtered = catalog.filter(item => {
      const queryStr = searchQuery.toLowerCase()
      const matchesSearch = 
        item.name.toLowerCase().includes(queryStr) || 
        item.id.toLowerCase().includes(queryStr) || 
        item.brand.toLowerCase().includes(queryStr) ||
        (item.partNumber && item.partNumber.toLowerCase().includes(queryStr))
      if (!matchesSearch) return false

      if (onlyWithStock && item.stock <= 0) return false

      if (selectedCategoryFilter && item.category !== selectedCategoryFilter) return false

      if (onlyWithPriceChanges) {
        const syncedProd = syncedProducts.find(p => p.externalId === item.id)
        if (!syncedProd) return false
        
        const costInARS = item.currency === 'USD' ? (item.price * globalDollarRate) : item.price
        const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
        const costWithTax = costInARS * (1 + taxRate / 100)
        const marginToUse = syncedProd.margin ?? globalMargin
        const calculatedPrice = Math.round(costWithTax * (1 + marginToUse / 100))
        
        if (calculatedPrice === syncedProd.price) return false
      }

      return true
    })

    filtered.sort((a, b) => {
      if (sortBy === 'category') {
        const catA = (a.category || '').toLowerCase()
        const catB = (b.category || '').toLowerCase()
        if (catA < catB) return -1
        if (catA > catB) return 1
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'price_asc') {
        return a.price - b.price
      } else if (sortBy === 'price_desc') {
        return b.price - a.price
      } else if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })

    return filtered
  }, [catalog, searchQuery, onlyWithStock, onlyWithPriceChanges, selectedCategoryFilter, sortBy, syncedProducts, globalDollarRate, globalIva, globalMargin])

  const visibleCatalog = useMemo(() => {
    return processedCatalog.slice(0, displayLimit)
  }, [processedCatalog, displayLimit])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integración Grupo Invid</h1>
          <p className="mt-2 text-pclink-muted text-sm max-w-xl">
            Cargá el catálogo oficial en Excel de Invid, importá productos con auto-mapeo a las categorías de PClink, configurá márgenes y actualizá precios en lote.
          </p>
        </div>
        {exchangeRate && (
          <div className="rounded-xl border border-pclink-cyan/20 bg-pclink-cyan/5 px-4 py-2 text-xs font-mono text-pclink-cyan-light shrink-0">
            Dólar Invid: ${exchangeRate.toLocaleString('es-AR')} ARS
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-pclink-border/40 gap-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-pclink-cyan text-white bg-pclink-cyan/5'
              : 'border-transparent text-pclink-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            Catálogo Excel ({processedCatalog.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('synced')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'synced'
              ? 'border-pclink-cyan text-white bg-pclink-cyan/5'
              : 'border-transparent text-pclink-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4" />
            Productos Sincronizados ({syncedProducts.length})
          </div>
        </button>
      </div>

      {/* TAB CONTENT: 1. BROWSE CATALOG */}
      {activeTab === 'catalog' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* File Upload Box & Search */}
          <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
              <input
                type="search"
                placeholder="Buscar por artículo, descripción, marca o código Invid..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
              />
            </div>
            
            <label className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20 cursor-pointer shrink-0">
              {loadingCatalog ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-emerald-400" />
                  {excelFileName ? 'Cambiar Archivo Excel' : 'Cargar Excel Invid'}
                </>
              )}
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
                disabled={loadingCatalog}
                className="hidden"
              />
            </label>
          </div>

          {excelFileName && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 px-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Archivo cargado: <strong>{excelFileName}</strong></span>
            </div>
          )}

          {/* Opciones de Cálculo y Filtros Globales */}
          {catalog.length > 0 && (
            <div className="glass-panel p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pclink-border/30 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Dólar Invid:</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-pclink-cyan">$</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={globalDollarRate}
                        onChange={e => setGlobalDollarRate(parseFloat(e.target.value) || 0)}
                        className="w-24 rounded-lg border border-pclink-border bg-pclink-bg/60 py-1 pl-6 pr-2 text-xs font-bold text-white focus:outline-none focus:border-pclink-cyan"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Margen Global:</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="200"
                        step="1"
                        value={globalMargin}
                        onChange={e => setGlobalMargin(parseFloat(e.target.value) || 0)}
                        className="w-16 rounded-lg border border-pclink-border bg-pclink-bg/60 py-1 px-2 text-xs font-bold text-white text-center focus:outline-none focus:border-pclink-cyan"
                      />
                      <span className="ml-1 text-xs font-bold text-pclink-cyan">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-pclink-muted hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={onlyWithStock}
                      onChange={e => setOnlyWithStock(e.target.checked)}
                      className="rounded border-pclink-border bg-pclink-bg text-pclink-cyan focus:ring-0 cursor-pointer"
                    />
                    <span>Solo en stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-pclink-muted hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={onlyWithPriceChanges}
                      onChange={e => setOnlyWithPriceChanges(e.target.checked)}
                      className="rounded border-pclink-border bg-pclink-bg text-pclink-cyan focus:ring-0 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      Solo con cambios de precio
                      {priceChangesCount > 0 && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          {priceChangesCount}
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Filtros de Categoría y Ordenamiento */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-pclink-muted uppercase tracking-wider">Categoría Invid:</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={e => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-lg border border-pclink-border bg-pclink-bg/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  >
                    <option value="">Todas las categorías ({uniqueCategories.length})</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-pclink-muted uppercase tracking-wider">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="rounded-lg border border-pclink-border bg-pclink-bg/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  >
                    <option value="category">Categoría</option>
                    <option value="name_asc">Nombre A-Z</option>
                    <option value="price_asc">Precio menor a mayor</option>
                    <option value="price_desc">Precio mayor a menor</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Barra de Acciones Masivas */}
          {processedCatalog.length > 0 && (
            <div className="glass-panel p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-pclink-muted hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === processedCatalog.length}
                    onChange={toggleSelectAll}
                    className="rounded border-pclink-border bg-pclink-bg text-pclink-cyan focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Seleccionar Todo ({selectedIds.size} de {processedCatalog.length})
                  </span>
                </label>

                {selectedIds.size > 0 && (
                  <span className="text-pclink-cyan font-bold">
                    • {selectedIds.size} marcados para importar
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {priceChangesCount > 0 && (
                  <motion.button
                    type="button"
                    disabled={importing}
                    onClick={handleBulkUpdatePriceChanges}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 font-bold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Actualizar {priceChangesCount} Precios Modificados
                  </motion.button>
                )}

                {selectedIds.size > 0 && (
                  <motion.button
                    type="button"
                    disabled={importing}
                    onClick={handleImportSelected}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-4 py-1.5 font-bold text-pclink-bg shadow-[0_0_16px_rgba(0,188,212,0.3)] disabled:opacity-50 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Import className="h-3.5 w-3.5" />
                        Importar Seleccionados ({selectedIds.size})
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {/* Catalog Error Alert */}
          {catalogError && (
            <div className="flex items-center gap-3 rounded-2xl border border-pclink-error/40 bg-pclink-error/10 p-4 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-pclink-error" />
              <span>{catalogError}</span>
            </div>
          )}

          {/* Catalog Items Table */}
          {loadingCatalog ? (
            <div className="flex flex-col items-center justify-center p-12 glass-panel">
              <Loader2 className="h-8 w-8 animate-spin text-pclink-cyan mb-2" />
              <p className="text-xs text-pclink-muted">Cargando y procesando catálogo de Invid...</p>
            </div>
          ) : catalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 glass-panel text-center">
              <FileSpreadsheet className="h-10 w-10 text-pclink-muted/40 mb-3" />
              <h3 className="text-sm font-bold text-white">Catálogo de Invid no cargado</h3>
              <p className="text-xs text-pclink-muted max-w-sm mt-1">
                Subí el archivo Excel de Invid para consultar la lista de productos y sincronizar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-pclink-border/40 bg-pclink-surface/30">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-pclink-border/40 bg-pclink-surface/80 font-bold uppercase tracking-wider text-pclink-muted">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === processedCatalog.length}
                          onChange={toggleSelectAll}
                          className="rounded border-pclink-border bg-pclink-bg text-pclink-cyan focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Categoría / Producto</th>
                      <th className="p-3">Marca / PN</th>
                      <th className="p-3">Costo USD</th>
                      <th className="p-3">P.V.P Final (ARS)</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pclink-border/20 text-white">
                    {visibleCatalog.map(item => {
                      const syncedProd = syncedProducts.find(p => p.externalId === item.id)
                      const isSynced = !!syncedProd
                      const isSelected = selectedIds.has(item.id)

                      const costInARS = item.currency === 'USD' ? (item.price * globalDollarRate) : item.price
                      const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
                      const costWithTax = costInARS * (1 + taxRate / 100)

                      const marginToUse = syncedProd ? (syncedProd.margin ?? globalMargin) : globalMargin
                      const calculatedPrice = Math.round(costWithTax * (1 + marginToUse / 100))
                      const hasPriceChange = syncedProd && calculatedPrice !== syncedProd.price

                      const pclinkCat = matchInvidCategory(item.category, item.name, item.brand, item.model)
                      const pclinkCatLabel = CATEGORY_LABELS[pclinkCat as keyof typeof CATEGORY_LABELS] || pclinkCat

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-pclink-cyan/5 ${
                            isSelected ? 'bg-pclink-cyan/10' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(item.id)}
                              className="rounded border-pclink-border bg-pclink-bg text-pclink-cyan focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-pclink-cyan">{item.id}</td>
                          <td className="p-3 max-w-md">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                {item.category}
                              </span>
                              <span className="text-[10px] text-pclink-muted">→</span>
                              <span className="text-[10px] font-semibold text-pclink-cyan-light bg-pclink-cyan/10 px-1.5 py-0.2 rounded">
                                {pclinkCatLabel}
                              </span>
                            </div>
                            <span className="font-semibold text-white line-clamp-1">{item.name}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-white block">{item.brand}</span>
                            <span className="text-[10px] font-mono text-pclink-muted">{item.partNumber || item.model || 'N/A'}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-white">${item.price.toFixed(2)}</td>
                          <td className="p-3 font-mono">
                            <span className="font-bold text-emerald-400 block">${calculatedPrice.toLocaleString('es-AR')}</span>
                            {hasPriceChange && (
                              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                Actual en tienda: ${syncedProd.price.toLocaleString('es-AR')}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {isSynced ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" /> Sincronizado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-pclink-surface px-2 py-0.5 text-[10px] font-semibold text-pclink-muted border border-pclink-border">
                                Sin importar
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="rounded-lg border border-pclink-border bg-pclink-surface/80 px-2.5 py-1 text-xs font-semibold text-white hover:border-pclink-cyan hover:text-pclink-cyan transition-colors cursor-pointer"
                            >
                              {isSynced ? 'Actualizar' : 'Importar'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {processedCatalog.length > visibleCatalog.length && (
                <div className="flex justify-center p-4">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    className="rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 px-6 py-2 text-xs font-bold text-pclink-cyan-light hover:bg-pclink-cyan/15 transition-all cursor-pointer"
                  >
                    Cargar 50 productos más (quedan {processedCatalog.length - visibleCatalog.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: 2. SYNCED PRODUCTS */}
      {activeTab === 'synced' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Controls bar */}
          <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
              <input
                type="search"
                placeholder="Buscar productos sincronizados de Invid..."
                value={syncedSearchQuery}
                onChange={e => setSyncedSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
              />
            </div>

            {selectedSyncedIds.size > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingBulkMargin(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-pclink-bg hover:bg-emerald-400 transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] cursor-pointer"
                >
                  <Tag className="h-3.5 w-3.5" />
                  Cambiar Margen ({selectedSyncedIds.size})
                </button>
                <button
                  onClick={handleBulkUnlinkProducts}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Desvincular ({selectedSyncedIds.size})
                </button>
              </div>
            )}
          </div>

          {/* Synced Table */}
          {loadingSynced ? (
            <div className="flex flex-col items-center justify-center p-12 glass-panel">
              <Loader2 className="h-8 w-8 animate-spin text-pclink-cyan mb-2" />
              <p className="text-xs text-pclink-muted">Cargando productos sincronizados...</p>
            </div>
          ) : filteredSyncedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 glass-panel text-center">
              <AlertCircle className="h-10 w-10 text-pclink-muted/40 mb-3" />
              <h3 className="text-sm font-bold text-white">No hay productos de Invid sincronizados</h3>
              <p className="text-xs text-pclink-muted max-w-sm mt-1">
                Importá artículos desde la pestaña de catálogo para que aparezcan aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-pclink-border/40 bg-pclink-surface/30">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-pclink-border/40 bg-pclink-surface/80 font-bold uppercase tracking-wider text-pclink-muted">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSyncedIds.size > 0 && selectedSyncedIds.size === filteredSyncedProducts.length}
                        onChange={() => toggleSelectAllSynced(filteredSyncedProducts)}
                        className="rounded border-pclink-border bg-pclink-bg text-pclink-cyan focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">ID PClink</th>
                    <th className="p-3">Cód. Invid</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Categoría PClink</th>
                    <th className="p-3">Margen %</th>
                    <th className="p-3">Precio Venta (ARS)</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pclink-border/20 text-white">
                  {filteredSyncedProducts.map(prod => (
                    <tr key={prod.id} className="transition-colors hover:bg-pclink-surface/50">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSyncedIds.has(prod.id)}
                          onChange={() => toggleSelectSyncedProduct(prod.id)}
                          className="rounded border-pclink-border bg-pclink-bg text-pclink-cyan focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono text-pclink-muted">{prod.id}</td>
                      <td className="p-3 font-mono font-bold text-pclink-cyan">{prod.externalId}</td>
                      <td className="p-3 max-w-xs font-semibold text-white line-clamp-1">{prod.name}</td>
                      <td className="p-3 text-pclink-cyan-light font-medium">
                        {CATEGORY_LABELS[prod.category as keyof typeof CATEGORY_LABELS] || prod.category}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{prod.margin ?? globalMargin}%</td>
                      <td className="p-3 font-mono font-bold text-white">${prod.price.toLocaleString('es-AR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod)
                              setEditMargin(prod.margin ?? globalMargin)
                            }}
                            className="p-1.5 text-pclink-muted hover:text-white transition-colors cursor-pointer"
                            title="Editar Margen"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUnlinkProduct(prod)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Desvincular / Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* SINGLE IMPORT MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-pclink-border bg-pclink-surface p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Importar a PClink</span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedItem.name}</h3>
                  <p className="text-xs text-pclink-muted mt-0.5">
                    Cód: {selectedItem.id} | Marca: {selectedItem.brand} | Categoría Invid: {selectedItem.category}
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-pclink-border/60 bg-pclink-bg/50 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-pclink-muted">Costo Invid (USD):</span>
                  <span className="font-mono font-bold text-white">${selectedItem.price.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-pclink-muted">Cotización Dólar:</span>
                  <input
                    type="number"
                    value={itemDollarRate}
                    onChange={e => setItemDollarRate(Number(e.target.value))}
                    className="w-24 rounded-lg border border-pclink-border bg-pclink-bg px-2 py-1 font-mono font-bold text-white focus:border-pclink-cyan focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-pclink-muted">IVA (%):</span>
                  <input
                    type="number"
                    value={itemIva}
                    onChange={e => setItemIva(Number(e.target.value))}
                    className="w-24 rounded-lg border border-pclink-border bg-pclink-bg px-2 py-1 font-mono font-bold text-white focus:border-pclink-cyan focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-pclink-muted">Margen de Ganancia (%):</span>
                  <input
                    type="number"
                    value={itemMargin}
                    onChange={e => setItemMargin(Number(e.target.value))}
                    className="w-24 rounded-lg border border-pclink-border bg-pclink-bg px-2 py-1 font-mono font-bold text-emerald-400 focus:border-pclink-cyan focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-pclink-muted">Categoría PClink asignada:</span>
                  <span className="font-bold text-pclink-cyan">
                    {CATEGORY_LABELS[matchInvidCategory(selectedItem.category, selectedItem.name, selectedItem.brand, selectedItem.model) as keyof typeof CATEGORY_LABELS] || 'General'}
                  </span>
                </div>

                <div className="border-t border-pclink-border/50 pt-3 flex items-center justify-between font-bold text-sm">
                  <span className="text-white">Precio Final Sugerido:</span>
                  <span className="font-mono text-emerald-400 text-base">
                    ${Math.round((selectedItem.price * itemDollarRate * (1 + itemIva/100)) * (1 + itemMargin/100)).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-pclink-muted hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportProduct}
                  disabled={importing}
                  className="flex items-center gap-2 rounded-xl bg-pclink-cyan px-5 py-2 text-xs font-bold text-pclink-bg hover:brightness-110 transition-all shadow-[0_0_16px_rgba(0,188,212,0.3)] cursor-pointer"
                >
                  {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmar Importación
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SINGLE MARGIN EDIT MODAL */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-surface p-6 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-base font-bold text-white">Modificar Margen de Ganancia</h3>
                <p className="text-xs text-pclink-muted mt-1">{editingProduct.name}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-pclink-muted">Margen (%):</label>
                <input
                  type="number"
                  value={editMargin}
                  onChange={e => setEditMargin(Number(e.target.value))}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg px-3 py-2 text-sm font-bold text-white focus:border-pclink-cyan focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateMargin}
                  disabled={savingMargin}
                  className="flex items-center gap-2 rounded-xl bg-pclink-cyan px-5 py-2 text-xs font-bold text-pclink-bg cursor-pointer"
                >
                  {savingMargin && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK MARGIN EDIT MODAL */}
      <AnimatePresence>
        {editingBulkMargin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-surface p-6 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-base font-bold text-white">Margen Masivo</h3>
                <p className="text-xs text-pclink-muted mt-1">Aplicar margen a {selectedSyncedIds.size} productos seleccionados</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-pclink-muted">Nuevo Margen (%):</label>
                <input
                  type="number"
                  value={bulkMarginValue}
                  onChange={e => setBulkMarginValue(Number(e.target.value))}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg px-3 py-2 text-sm font-bold text-white focus:border-pclink-cyan focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingBulkMargin(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleBulkUpdateMargin(bulkMarginValue)}
                  disabled={savingBulkMargin}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-pclink-bg cursor-pointer"
                >
                  {savingBulkMargin && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Aplicar a Seleccionados
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
