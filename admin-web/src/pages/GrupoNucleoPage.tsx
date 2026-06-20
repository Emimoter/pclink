import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, Loader2, Save, Search, Import, Tag, AlertCircle, 
  CheckCircle2, RefreshCw, Key, Image as ImageIcon, Settings, Trash2, Edit2,
  Upload, FileSpreadsheet
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { getDb, getFunctionsInstance } from '../lib/firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { guessCategory } from '../lib/catalog/smartCategories'
import { CATEGORY_LABELS } from '../lib/catalog/constants'

interface GrupoNucleoItem {
  id: string
  name: string
  price: number
  stock: number
  images: string[]
  brand: string
  model: string
  tax: number
  currency: string
  category?: string
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

export function GrupoNucleoPage() {
  // Credentials States
  const [clientId, setClientId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [savingCreds, setSavingCreds] = useState(false)
  const [credsStatus, setCredsStatus] = useState<{ success: boolean; msg: string } | null>(null)

  // API Catalog States
  const [catalog, setCatalog] = useState<GrupoNucleoItem[]>([])
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Sync Products in Firestore
  const [syncedProducts, setSyncedProducts] = useState<SyncedProduct[]>([])
  const [loadingSynced, setLoadingSynced] = useState(true)

  // Import Dialog Modal State
  const [selectedItem, setSelectedItem] = useState<GrupoNucleoItem | null>(null)
  const [importing, setImporting] = useState(false)

  // Carga e Importación desde Excel / Lote
  const [loadMethod, setLoadMethod] = useState<'api' | 'excel'>('excel')
  const [excelFileName, setExcelFileName] = useState('')
  const [globalDollarRate, setGlobalDollarRate] = useState<number>(1000)
  const globalIva = 21
  const [globalMargin, setGlobalMargin] = useState<number>(30)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [displayLimit, setDisplayLimit] = useState(20)

  // Filtros y ordenamiento del catálogo
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')
  const [onlyWithStock, setOnlyWithStock] = useState(false)
  const [sortBy, setSortBy] = useState<'category' | 'price_asc' | 'price_desc' | 'name_asc'>('category')

  // Overrides para el modal de importación individual
  const [itemDollarRate, setItemDollarRate] = useState<number>(1000)
  const [itemIva, setItemIva] = useState<number>(21)
  const [itemMargin, setItemMargin] = useState<number>(30)

  // Edit Margin Modal State
  const [editingProduct, setEditingProduct] = useState<SyncedProduct | null>(null)
  const [editMargin, setEditMargin] = useState(20)
  const [savingMargin, setSavingMargin] = useState(false)

  // Synced Products Bulk Selection & Search States
  const [selectedSyncedIds, setSelectedSyncedIds] = useState<Set<string>>(new Set())
  const [syncedSearchQuery, setSyncedSearchQuery] = useState('')
  const [editingBulkMargin, setEditingBulkMargin] = useState(false)
  const [bulkMarginValue, setBulkMarginValue] = useState<number>(30)
  const [savingBulkMargin, setSavingBulkMargin] = useState(false)

  // Active sub-tab inside page
  const [activeTab, setActiveTab] = useState<'catalog' | 'synced' | 'config'>('catalog')

  // Load configured credentials on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const docRef = doc(getDb(), 'settings', 'grupo_nucleo_config')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setClientId(data.clientId || '')
          setUsername(data.username || '')
          setPassword(data.password || '')
        }
      } catch (err) {
        console.error('Error loading config:', err)
      }
    }
    loadConfig()
    loadSyncedProducts()
  }, [])

  // Sincronizar datos individuales del modal cuando cambia el item seleccionado
  useEffect(() => {
    if (selectedItem) {
      setItemDollarRate(globalDollarRate)
      setItemIva(selectedItem.tax !== undefined && selectedItem.tax !== null ? selectedItem.tax : globalIva)
      setItemMargin(globalMargin)
    }
  }, [selectedItem, globalDollarRate, globalIva, globalMargin])

  // Clear selections when switching tabs
  useEffect(() => {
    setSelectedIds(new Set())
    setSelectedSyncedIds(new Set())
  }, [activeTab])

  // Reiniciar el límite de visualización al realizar búsquedas, cambiar de origen o filtrar/ordenar
  useEffect(() => {
    setDisplayLimit(20)
  }, [searchQuery, loadMethod, onlyWithStock, selectedCategoryFilter, sortBy])

  // Load synced products from PClink database
  const loadSyncedProducts = async () => {
    setLoadingSynced(true)
    try {
      const q = query(collection(getDb(), 'products'), where('externalSource', '==', 'grupo_nucleo'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as SyncedProduct))
      setSyncedProducts(list)
    } catch (err) {
      console.error('Error loading synced products:', err)
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

  // Save Credentials to Firestore settings
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCreds(true)
    setCredsStatus(null)
    try {
      const docRef = doc(getDb(), 'settings', 'grupo_nucleo_config')
      await setDoc(docRef, {
        clientId,
        username,
        password,
        updatedAt: Date.now()
      })
      setCredsStatus({ success: true, msg: 'Credenciales guardadas correctamente. Ya podés consultar el catálogo.' })
    } catch (err: any) {
      setCredsStatus({ success: false, msg: `Error al guardar: ${err.message}` })
    } finally {
      setSavingCreds(false)
    }
  }

  // Load Catalog from Grupo Núcleo API
  const handleLoadCatalog = async () => {
    setLoadingCatalog(true)
    setCatalogError(null)
    setCatalog([])
    setSelectedIds(new Set())
    try {
      const getCatalogFunc = httpsCallable<{ }, { success: boolean; catalog?: GrupoNucleoItem[]; exchangeRate?: number; message?: string }>(
        getFunctionsInstance(), 
        'getGrupoNucleoCatalog'
      )
      const result = await getCatalogFunc()
      
      if (result.data?.success && result.data.catalog) {
        setCatalog(result.data.catalog)
        const rate = result.data.exchangeRate || 1000
        setExchangeRate(rate)
        setGlobalDollarRate(rate)
      } else {
        setCatalogError(result.data?.message || 'Error desconocido al consultar el catálogo.')
      }
    } catch (err: any) {
      setCatalogError(err.message || 'Error de conexión con el servidor. Verificá tu login y credenciales.')
    } finally {
      setLoadingCatalog(false)
    }
  }

  // Parse Excel (.xlsx) file
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
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet)
        
        if (rawRows.length === 0) {
          throw new Error('No se encontraron filas de datos en la primera pestaña del archivo.')
        }
        
        // Mapear filas normalizando nombres de columnas case-insensitive
        const parsedItems: GrupoNucleoItem[] = rawRows.map((row, idx) => {
          const normalized: Record<string, any> = {}
          Object.keys(row).forEach(key => {
            normalized[key.toLowerCase().trim()] = row[key]
          })
          
          // Función de búsqueda de columnas tolerante a espacios y mayúsculas
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              const cleanedK = k.toLowerCase().trim()
              if (normalized[cleanedK] !== undefined) return normalized[cleanedK]
              const noSpaces = cleanedK.replace(/\s+/g, '')
              if (normalized[noSpaces] !== undefined) return normalized[noSpaces]
            }
            return undefined
          }
          
          const id = String(getVal('codigo', 'código', 'id fabricante', 'id') || `GN-${idx}`).trim()
          const name = String(getVal('descripcion', 'descripción', 'nombre') || 'Producto sin nombre').trim()
          
          const rawPrice = getVal('precio neto', 'precio', 'neto', 'price') || 0
          const price = parseFloat(rawPrice) || 0
          
          const currency = String(getVal('moneda', 'currency') || 'USD').trim().toUpperCase()
          
          const rawTax = getVal('impuestos', 'impuesto', 'iva', 'tax')
          const tax = rawTax !== undefined && rawTax !== null ? parseFloat(rawTax) : undefined
          
          const rawStock = getVal('stock mdp', 'stock', 'cantidad') || 0
          const stock = parseInt(rawStock, 10) || 0
          
          const brand = String(getVal('marca', 'brand') || 'Genérico').trim()
          const model = String(getVal('linea', 'línea', 'modelo', 'model') || '').trim()
          const category = String(getVal('categoria', 'categoría', 'category') || '').trim()
          
          return {
            id,
            name,
            price,
            stock,
            images: [],
            brand,
            model,
            tax: tax !== undefined ? tax : 21, // Si no está en el excel, lo dejaremos como default después
            currency,
            category
          }
        }).filter(item => item.id && item.name)
        
        setCatalog(parsedItems)
      } catch (err: any) {
        console.error('Error al parsear Excel:', err)
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
      
      // Calculate final pricing in ARS: (costNet * exchange * tax) * (1 + margin)
      const costInARS = selectedItem.currency === 'USD' ? (selectedItem.price * itemDollarRate) : selectedItem.price
      const taxMultiplier = 1 + (itemIva / 100)
      const costWithTax = costInARS * taxMultiplier
      const finalPrice = Math.round(costWithTax * (1 + itemMargin / 100))

      // Auto guess category using name, brand, model
      const guessedCat = guessCategory(selectedItem.name, selectedItem.brand, selectedItem.model)

      // Create new doc in products collection
      const productRef = doc(db, 'products', selectedItem.id)
      await setDoc(productRef, {
        name: selectedItem.name,
        brand: selectedItem.brand || 'Genérico',
        model: selectedItem.model || '',
        price: finalPrice,
        stock: selectedItem.stock,
        images: selectedItem.images.length > 0 ? selectedItem.images : [''],
        category: guessedCat,
        description: `Producto importado de Grupo Núcleo. Cód: ${selectedItem.id}.`,
        externalSource: 'grupo_nucleo',
        externalId: selectedItem.id,
        margin: itemMargin,
        onDemand: true, // Flag as supplier sourced / on demand
        updatedAt: Date.now()
      })

      alert(`¡Producto ${selectedItem.name} importado con éxito!`)
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
          const taxMultiplier = 1 + (taxRate / 100)
          const costWithTax = costInARS * taxMultiplier
          const finalPrice = Math.round(costWithTax * (1 + globalMargin / 100))
          
          const guessedCat = guessCategory(item.name, item.brand, item.model)
          
          const productRef = doc(db, 'products', item.id)
          batch.set(productRef, {
            name: item.name,
            brand: item.brand || 'Genérico',
            model: item.model || '',
            price: finalPrice,
            stock: item.stock,
            images: item.images.length > 0 ? item.images : [''],
            category: guessedCat,
            description: `Producto importado de Grupo Núcleo. Cód: ${item.id}.`,
            externalSource: 'grupo_nucleo',
            externalId: item.id,
            margin: globalMargin,
            onDemand: true,
            updatedAt: Date.now()
          })
        })
        
        await batch.commit()
        successCount += chunk.length
      }
      
      alert(`¡Se importaron ${successCount} productos con éxito en modo bajo pedido (onDemand)!`)
      setSelectedIds(new Set())
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al importar en lote: ${err.message}`)
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
      
      // Retrieve the cost from GN catalog if loaded, or recalculate based on current price
      const gnItem = catalog.find(i => i.id === editingProduct.externalId)
      let finalPrice = editingProduct.price
      
      if (gnItem) {
        const costInARS = gnItem.currency === 'USD' ? (gnItem.price * globalDollarRate) : gnItem.price
        const taxRate = gnItem.tax !== undefined && gnItem.tax !== null ? gnItem.tax : globalIva
        const taxMultiplier = 1 + (taxRate / 100)
        const costWithTax = costInARS * taxMultiplier
        finalPrice = Math.round(costWithTax * (1 + editMargin / 100))
      } else {
        // Fallback: estimate original cost from current price using the old margin
        const estimatedCost = editingProduct.price / (1 + editingProduct.margin / 100)
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
          const gnItem = catalog.find(item => item.id === prod.externalId)
          let finalPrice = prod.price
          
          if (gnItem) {
            const costInARS = gnItem.currency === 'USD' ? (gnItem.price * globalDollarRate) : gnItem.price
            const taxRate = gnItem.tax !== undefined && gnItem.tax !== null ? gnItem.tax : globalIva
            const taxMultiplier = 1 + (taxRate / 100)
            const costWithTax = costInARS * taxMultiplier
            finalPrice = Math.round(costWithTax * (1 + newMargin / 100))
          } else {
            // Fallback: estimate original cost from current price using the old margin
            const estimatedCost = prod.price / (1 + prod.margin / 100)
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

  // Obtener lista única de categorías del distribuidor en el catálogo cargado
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    catalog.forEach(item => {
      if (item.category) {
        cats.add(item.category)
      }
    })
    return Array.from(cats).sort()
  }, [catalog])

  // Filtering and sorting GN catalog client side
  const processedCatalog = useMemo(() => {
    const filtered = catalog.filter(item => {
      const queryStr = searchQuery.toLowerCase()
      const matchesSearch = 
        item.name.toLowerCase().includes(queryStr) || 
        item.id.toLowerCase().includes(queryStr) ||
        item.brand.toLowerCase().includes(queryStr)
      if (!matchesSearch) return false

      // Filtro de stock MDP
      if (onlyWithStock && item.stock <= 0) return false

      // Filtro de categoría del distribuidor
      if (selectedCategoryFilter && item.category !== selectedCategoryFilter) return false

      return true
    })

    // Ordenar según el tipo de orden seleccionado
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
  }, [catalog, searchQuery, onlyWithStock, selectedCategoryFilter, sortBy])

  // Límite de visualización de a 20 productos para no ralentizar el DOM
  const visibleCatalog = useMemo(() => {
    return processedCatalog.slice(0, displayLimit)
  }, [processedCatalog, displayLimit])

  // Helper: check if a GN Item ID is already imported in Firestore
  const isAlreadySynced = (gnId: string) => {
    return syncedProducts.some(p => p.externalId === gnId)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integración Grupo Núcleo</h1>
          <p className="mt-2 text-pclink-muted text-sm max-w-xl">
            Navegá por el catálogo del distribuidor, importá productos que no tenés en stock con márgenes de ganancia personalizados y mantené sus precios y existencias sincronizados cada 24 hs.
          </p>
        </div>
        {exchangeRate && (
          <div className="rounded-xl border border-pclink-cyan/20 bg-pclink-cyan/5 px-4 py-2 text-xs font-mono text-pclink-cyan-light shrink-0">
            Dólar GN: ${exchangeRate.toLocaleString('es-AR')} ARS
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
            <Database className="h-4 w-4" />
            Catálogo del Distribuidor ({processedCatalog.length})
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
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'config'
              ? 'border-pclink-cyan text-white bg-pclink-cyan/5'
              : 'border-transparent text-pclink-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            Configurar Credenciales
          </div>
        </button>
      </div>

      {/* TAB CONTENT: 1. CONFIG CREDENTIALS */}
      {activeTab === 'config' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 max-w-xl space-y-6"
        >
          <div className="flex items-center gap-2 text-sm text-pclink-cyan-light font-bold uppercase tracking-wider">
            <Key className="h-4 w-4" />
            API Credentials
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">ID de Cliente (AFIP/Distribuidor)</label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="Ej. 1823"
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white placeholder:text-pclink-subtle"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">Usuario de API</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Tu usuario"
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white placeholder:text-pclink-subtle"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">Contraseña de API</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white placeholder:text-pclink-subtle"
                required
              />
            </div>

            {credsStatus && (
              <div className={`flex gap-3 rounded-xl border p-4 text-xs ${
                credsStatus.success 
                  ? 'border-pclink-success/40 bg-pclink-success/10 text-emerald-100' 
                  : 'border-pclink-error/40 bg-pclink-error/10 text-red-100'
              }`}>
                {credsStatus.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-pclink-success" /> : <AlertCircle className="h-4 w-4 shrink-0 text-pclink-error" />}
                {credsStatus.msg}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={savingCreds}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep py-2.5 text-xs font-bold text-pclink-bg shadow-[0_0_24px_rgba(0,188,212,0.2)] disabled:opacity-45 cursor-pointer"
              whileTap={{ scale: !savingCreds ? 0.99 : 1 }}
            >
              {savingCreds ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar configuración
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      )}

      {/* TAB CONTENT: 2. BROWSE CATALOG */}
      {activeTab === 'catalog' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Origen de Datos Selector */}
          <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Cargar Catálogo:</span>
              <button
                type="button"
                onClick={() => setLoadMethod('excel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  loadMethod === 'excel'
                    ? 'bg-pclink-cyan text-pclink-bg shadow-[0_0_12px_rgba(0,188,212,0.3)]'
                    : 'text-pclink-muted hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Subir Excel (.xlsx)
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLoadMethod('api')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  loadMethod === 'api'
                    ? 'bg-pclink-cyan text-pclink-bg shadow-[0_0_12px_rgba(0,188,212,0.3)]'
                    : 'text-pclink-muted hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Consultar API
                </div>
              </button>
            </div>
          </div>

          {/* Catalog Controls */}
          {loadMethod === 'api' ? (
            <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
                <input
                  type="search"
                  placeholder="Buscar en el catálogo de la API del distribuidor..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
                />
              </div>
              
              <motion.button
                type="button"
                disabled={loadingCatalog}
                onClick={handleLoadCatalog}
                className="flex items-center gap-2 rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 px-5 py-2 text-xs font-bold text-pclink-cyan-light shadow-[0_0_15px_rgba(0,188,212,0.05)] hover:bg-pclink-cyan/15 disabled:opacity-50 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loadingCatalog ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-pclink-cyan" />
                    Cargando catálogo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 text-pclink-cyan" />
                    Consultar API
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
                <input
                  type="search"
                  placeholder="Buscar en el catálogo Excel cargado..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-pclink-cyan/35 bg-pclink-cyan/5 px-5 py-2 text-xs font-bold text-pclink-cyan-light cursor-pointer hover:bg-pclink-cyan/15 transition-all">
                  <Upload className="h-4 w-4 text-pclink-cyan" />
                  Cargar Excel (.xlsx)
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleExcelUpload}
                    className="hidden"
                  />
                </label>
                {excelFileName && (
                  <span className="text-xs text-pclink-muted font-mono truncate max-w-[200px]" title={excelFileName}>
                    {excelFileName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Pricing Controls & Bulk Actions */}
          {catalog.length > 0 && (
            <div className="glass-panel p-4 flex flex-col gap-4 md:flex-row md:items-end justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-lg">
                <div>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">Valor del Dólar (ARS)</label>
                  <input
                    type="number"
                    value={globalDollarRate}
                    onChange={e => setGlobalDollarRate(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">Margen Comercial (%)</label>
                  <input
                    type="number"
                    value={globalMargin}
                    onChange={e => setGlobalMargin(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  />
                </div>
              </div>

              {selectedIds.size > 0 && (
                <motion.button
                  onClick={handleImportSelected}
                  disabled={importing}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 cursor-pointer shrink-0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Import className="h-4 w-4 text-white" />
                      Importar Seleccionados ({selectedIds.size})
                    </>
                  )}
                </motion.button>
              )}
            </div>
          )}

          {/* Filtros y Ordenamiento */}
          {catalog.length > 0 && (
            <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between text-xs">
              <div className="flex flex-wrap gap-4 items-center flex-1">
                {/* Filtro de Categoría */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-pclink-muted uppercase tracking-wider">Filtrar por Categoría</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={e => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-lg border border-pclink-border bg-pclink-bg/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan max-w-[220px]"
                  >
                    <option value="">Todas las categorías ({uniqueCategories.length})</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Ordenamiento */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-pclink-muted uppercase tracking-wider">Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="rounded-lg border border-pclink-border bg-pclink-bg/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  >
                    <option value="category">Categoría (A-Z)</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                    <option value="name_asc">Nombre: A-Z</option>
                  </select>
                </div>

                {/* Filtro de Stock en MDP */}
                <label className="flex items-center gap-2 cursor-pointer font-bold text-pclink-muted hover:text-white mt-5 select-none">
                  <input
                    type="checkbox"
                    checked={onlyWithStock}
                    onChange={e => setOnlyWithStock(e.target.checked)}
                    className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan h-4 w-4 cursor-pointer"
                  />
                  <span>Sólo con Stock en MDP</span>
                </label>
              </div>
            </div>
          )}

          {catalogError && (
            <div className="flex gap-3 rounded-xl border border-pclink-error/40 bg-pclink-error/10 p-4 text-sm text-red-100">
              <AlertCircle className="h-5 w-5 shrink-0 text-pclink-error" />
              {catalogError}
            </div>
          )}

          {/* Catalog Grid */}
          {loadingCatalog ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              {loadMethod === 'api' 
                ? 'Consultando la API de Grupo Núcleo y parseando el inventario...' 
                : 'Procesando archivo Excel y organizando productos...'}
            </div>
          ) : catalog.length === 0 ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              {loadMethod === 'api'
                ? 'El catálogo está vacío. Presioná "Consultar API" para cargar los productos del distribuidor.'
                : 'Por favor, subí un archivo Excel (.xlsx) para visualizar y seleccionar los productos.'}
            </div>
          ) : processedCatalog.length === 0 ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              No se encontraron coincidencias para tu búsqueda.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[768px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted bg-pclink-elevated/15">
                        <th className="px-4 py-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={processedCatalog.length > 0 && selectedIds.size === processedCatalog.length}
                            onChange={toggleSelectAll}
                            className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                          />
                        </th>
                        <th className="px-6 py-4 font-semibold">Producto</th>
                        <th className="px-6 py-4 font-semibold">Costo Distribuidor</th>
                        <th className="px-6 py-4 font-semibold">Precio Sugerido (Venta)</th>
                        <th className="px-6 py-4 font-semibold text-center">Stock MDP</th>
                        <th className="px-6 py-4 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCatalog.map(item => {
                        const synced = isAlreadySynced(item.id)
                        const isSelected = selectedIds.has(item.id)
                        
                        // Suggested Price calculation in real-time
                        const costInARS = item.currency === 'USD' ? (item.price * globalDollarRate) : item.price
                        const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
                        const salePrice = Math.round(costInARS * (1 + taxRate / 100) * (1 + globalMargin / 100))

                        return (
                          <tr key={item.id} className={`border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0 ${isSelected ? 'bg-pclink-cyan/5' : ''}`}>
                            <td className="px-4 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectProduct(item.id)}
                                className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded-lg border border-pclink-border bg-pclink-elevated/50 flex items-center justify-center shrink-0">
                                  {item.images?.[0] ? (
                                    <img src={item.images[0]} className="h-full w-full object-contain" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 opacity-20" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-white line-clamp-1">{item.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-pclink-cyan-light font-mono">ID: {item.id}</span>
                                    {item.brand && <span className="text-[9px] bg-pclink-elevated px-1.5 py-0.2 rounded text-pclink-muted font-semibold">{item.brand}</span>}
                                    {item.model && <span className="text-[9px] bg-pclink-elevated px-1.5 py-0.2 rounded text-pclink-muted">{item.model}</span>}
                                    {item.category && (
                                      <span className="text-[9px] bg-pclink-cyan/15 px-1.5 py-0.2 rounded text-pclink-cyan-light border border-pclink-cyan/25 font-semibold">
                                        {item.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-white">
                              {item.currency === 'USD' ? `u$s ${item.price.toLocaleString('en-US')}` : `$${item.price.toLocaleString('es-AR')}`}
                              <span className="block text-[10px] text-pclink-muted">IVA: {item.tax}%</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-pclink-cyan-light font-bold">
                              ${salePrice.toLocaleString('es-AR')}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-semibold ${item.stock > 0 ? 'text-white' : 'text-pclink-error'}`}>
                                {item.stock}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {synced ? (
                                <span className="inline-flex rounded-full bg-pclink-success/15 px-3 py-1 text-[10px] font-bold text-pclink-success border border-pclink-success/20">
                                  Ya Importado
                                </span>
                              ) : (
                                <motion.button
                                  type="button"
                                  onClick={() => setSelectedItem(item)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-pclink-cyan/10 border border-pclink-cyan/35 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-pclink-cyan/25 cursor-pointer"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Import className="h-3.5 w-3.5 text-pclink-cyan" />
                                  Importar
                                </motion.button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {processedCatalog.length > displayLimit && (
                <div className="mt-4 flex justify-center">
                  <motion.button
                    type="button"
                    onClick={() => setDisplayLimit(prev => prev + 20)}
                    className="flex items-center gap-2 rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 px-6 py-3 text-xs font-bold text-pclink-cyan-light shadow-[0_0_15px_rgba(0,188,212,0.05)] hover:bg-pclink-cyan/15 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Ver más productos (Mostrando {displayLimit} de {processedCatalog.length})
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: 3. LIST SYNCED PRODUCTS */}
      {activeTab === 'synced' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {loadingSynced ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              Cargando productos sincronizados desde la base de datos...
            </div>
          ) : syncedProducts.length === 0 ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              No tenés ningún producto vinculado con la API de Grupo Núcleo por el momento.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Synced Products Controls */}
              <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
                  <input
                    type="search"
                    placeholder="Buscar en productos sincronizados..."
                    value={syncedSearchQuery}
                    onChange={e => setSyncedSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
                  />
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedSyncedIds.size > 0 && (
                <div className="glass-panel p-4 bg-pclink-cyan/5 border border-pclink-cyan/20 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pclink-cyan-light uppercase tracking-wider">
                      Seleccionados: {selectedSyncedIds.size} {selectedSyncedIds.size === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setEditingBulkMargin(true)
                        setBulkMarginValue(30)
                      }}
                      disabled={savingBulkMargin}
                      className="flex items-center gap-1.5 rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/10 px-4 py-2 text-xs font-bold text-pclink-cyan hover:bg-pclink-cyan/20 disabled:opacity-50 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="h-4 w-4 text-pclink-cyan" />
                      Editar Margen en Lote
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleBulkUnlinkProducts}
                      disabled={savingBulkMargin}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.15)] disabled:opacity-50 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                      Desvincular y Eliminar en Lote
                    </motion.button>
                  </div>
                </div>
              )}

              {filteredSyncedProducts.length === 0 ? (
                <div className="glass-panel py-20 text-center text-pclink-muted">
                  No se encontraron coincidencias para tu búsqueda.
                </div>
              ) : (
                <div className="glass-panel overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted bg-pclink-elevated/15">
                          <th className="px-4 py-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={filteredSyncedProducts.length > 0 && selectedSyncedIds.size === filteredSyncedProducts.length}
                              onChange={() => toggleSelectAllSynced(filteredSyncedProducts)}
                              className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                            />
                          </th>
                          <th className="px-6 py-4 font-semibold">Producto en App</th>
                          <th className="px-6 py-4 font-semibold">Margen</th>
                          <th className="px-6 py-4 font-semibold">Precio App (Final)</th>
                          <th className="px-6 py-4 font-semibold text-center">Stock Activo</th>
                          <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSyncedProducts.map(prod => {
                          const isSelected = selectedSyncedIds.has(prod.id)
                          return (
                            <tr key={prod.id} className={`border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0 ${isSelected ? 'bg-pclink-cyan/5' : ''}`}>
                              <td className="px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectSyncedProduct(prod.id)}
                                  className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 overflow-hidden rounded-lg border border-pclink-border bg-pclink-elevated/50 flex items-center justify-center shrink-0">
                                    {prod.images?.[0] ? (
                                      <img src={prod.images[0]} className="h-full w-full object-contain" />
                                    ) : (
                                      <ImageIcon className="h-4 w-4 opacity-20" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white line-clamp-1">{prod.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-pclink-cyan-light font-mono">SKU/GN: {prod.externalId}</span>
                                      <span className="text-[9px] bg-pclink-cyan/15 px-1.5 py-0.2 rounded text-pclink-cyan-light border border-pclink-cyan/20">
                                        {CATEGORY_LABELS[prod.category as keyof typeof CATEGORY_LABELS] || prod.category}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-emerald-400 font-bold">
                                +{prod.margin}%
                              </td>
                              <td className="px-6 py-4 font-mono text-white">
                                ${prod.price.toLocaleString('es-AR')}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`font-semibold ${prod.stock > 0 ? 'text-white' : 'text-pclink-error'}`}>
                                  {prod.stock}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <motion.button
                                    onClick={() => {
                                      setEditingProduct(prod)
                                      setEditMargin(prod.margin)
                                    }}
                                    className="p-2 rounded-lg bg-pclink-cyan/10 text-pclink-cyan hover:bg-pclink-cyan/20 cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Editar Margen"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleUnlinkProduct(prod)}
                                    className="p-2 rounded-lg bg-pclink-error/10 text-pclink-error hover:bg-pclink-error/20 cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Desvincular y Eliminar"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* IMPORT DIALOG MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-bg/95 p-6 shadow-2xl backdrop-blur-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-base font-bold text-white leading-normal">Importar Producto a PClink</h3>
              <p className="text-xs text-pclink-muted leading-relaxed">
                Estás a punto de importar <strong className="text-white">"{selectedItem.name}"</strong> en modo bajo pedido (`onDemand`). Ajustá los parámetros de conversión:
              </p>

              {/* Conversion Override Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-pclink-elevated/20 p-3 rounded-xl border border-pclink-border/50">
                {selectedItem.currency === 'USD' && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-pclink-muted mb-1 uppercase tracking-wide">Valor del Dólar</label>
                    <input
                      type="number"
                      value={itemDollarRate}
                      onChange={e => setItemDollarRate(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-pclink-border bg-pclink-bg/50 px-2 py-1 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                    />
                  </div>
                )}
                <div className={selectedItem.currency === 'USD' ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1 uppercase tracking-wide">IVA / Impuesto (%)</label>
                  <input
                    type="number"
                    value={itemIva}
                    onChange={e => setItemIva(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-pclink-border bg-pclink-bg/50 px-2 py-1 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  />
                </div>
              </div>

              {/* Estimate Calculations Card */}
              <div className="rounded-xl border border-pclink-border bg-pclink-elevated/45 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-pclink-muted">Costo Distribuidor:</span>
                  <span className="font-mono text-white">
                    {selectedItem.currency === 'USD' ? `u$s ${selectedItem.price}` : `$${selectedItem.price}`} {selectedItem.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pclink-muted">Impuestos (IVA):</span>
                  <span className="font-mono text-white">+{itemIva}%</span>
                </div>
                {selectedItem.currency === 'USD' && (
                  <div className="flex justify-between border-t border-pclink-border/50 pt-1.5 mt-1.5">
                    <span className="text-pclink-muted">Costo en Pesos (u$s * ${itemDollarRate}):</span>
                    <span className="font-mono text-white">${(selectedItem.price * itemDollarRate).toLocaleString('es-AR')} ARS</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-pclink-border/50 pt-1.5 mt-1.5 font-semibold">
                  <span className="text-pclink-cyan-light">Costo Final c/IVA:</span>
                  <span className="font-mono text-white">
                    ${(
                      (selectedItem.currency === 'USD' ? selectedItem.price * itemDollarRate : selectedItem.price) * 
                      (1 + itemIva / 100)
                    ).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Margin Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-pclink-muted">
                  <span>Margen de Ganancia:</span>
                  <span className="text-emerald-400 font-mono text-sm font-bold">+{itemMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={itemMargin}
                  onChange={e => setItemMargin(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-pclink-border rounded-lg appearance-none cursor-pointer accent-pclink-cyan"
                />
              </div>

              {/* Estimate Sale Price */}
              <div className="flex items-center justify-between rounded-xl bg-pclink-cyan/5 border border-pclink-cyan/20 p-4">
                <span className="text-xs font-bold text-pclink-cyan-light uppercase tracking-wider">Precio Sugerido Venta:</span>
                <span className="font-mono text-lg font-bold text-white">
                  ${Math.round(
                    (selectedItem.currency === 'USD' ? selectedItem.price * itemDollarRate : selectedItem.price) * 
                    (1 + itemIva / 100) * 
                    (1 + itemMargin / 100)
                  ).toLocaleString('es-AR')}
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  type="button"
                  onClick={handleImportProduct}
                  disabled={importing}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2 text-xs font-bold text-pclink-bg disabled:opacity-50 cursor-pointer"
                  whileTap={{ scale: !importing ? 0.99 : 1 }}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-pclink-bg" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Import className="h-4 w-4 text-pclink-bg" />
                      Confirmar Importación
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MARGIN MODAL */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingProduct(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-bg/95 p-6 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <h3 className="text-base font-bold text-white leading-normal">Editar Margen de Ganancia</h3>
              <p className="text-xs text-pclink-muted leading-relaxed">
                Modificá el porcentaje de recargo comercial para <strong className="text-white">"{editingProduct.name}"</strong>:
              </p>

              {/* Margin Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-pclink-muted">
                  <span>Margen de Ganancia:</span>
                  <span className="text-emerald-400 font-mono text-sm font-bold">+{editMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={editMargin}
                  onChange={e => setEditMargin(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-pclink-border rounded-lg appearance-none cursor-pointer accent-pclink-cyan"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  onClick={handleUpdateMargin}
                  disabled={savingMargin}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2 text-xs font-bold text-pclink-bg disabled:opacity-50 cursor-pointer"
                  whileTap={{ scale: !savingMargin ? 0.99 : 1 }}
                >
                  {savingMargin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Margen
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT BULK MARGIN MODAL */}
      <AnimatePresence>
        {editingBulkMargin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingBulkMargin(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-bg/95 p-6 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <h3 className="text-base font-bold text-white leading-normal">Editar Margen Comercial en Lote</h3>
              <p className="text-xs text-pclink-muted leading-relaxed">
                Estás por modificar el porcentaje de recargo comercial para los <strong className="text-white">{selectedSyncedIds.size}</strong> productos seleccionados:
              </p>

              {/* Margin Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-pclink-muted">
                  <span>Nuevo Margen:</span>
                  <span className="text-emerald-400 font-mono text-sm font-bold">+{bulkMarginValue}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={bulkMarginValue}
                  onChange={e => setBulkMarginValue(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-pclink-border rounded-lg appearance-none cursor-pointer accent-pclink-cyan"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBulkMargin(false)}
                  className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  type="button"
                  onClick={() => handleBulkUpdateMargin(bulkMarginValue)}
                  disabled={savingBulkMargin}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2 text-xs font-bold text-pclink-bg disabled:opacity-50 cursor-pointer"
                  whileTap={{ scale: !savingBulkMargin ? 0.99 : 1 }}
                >
                  {savingBulkMargin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-pclink-bg" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 text-pclink-bg" />
                      Guardar Cambios ({selectedSyncedIds.size})
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
