import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Image as ImageIcon, AlertCircle, Flame, Star, Target, Sparkles, Heart, Wand2, Loader2, Trash2, Tag, Settings, Save } from 'lucide-react'
import { getDb, getFunctionsInstance } from '../lib/firebase'
import { subscribeToProducts, updateProductImageUrls, deleteProduct, updateProductFlag, updateProductCategory, type Product } from '../lib/catalog/products'
import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryIdValue } from '../lib/catalog/constants'
import { ProductEditorSheet } from '../components/ProductEditorSheet'
import { httpsCallable } from 'firebase/functions'
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore'
import { guessCategory } from '../lib/catalog/smartCategories'

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'flash' | 'featured' | 'bestSeller' | 'newArrival' | 'recommended' | 'onDemand'>('all')
  const [selectedCategory, setSelectedCategory] = useState<CategoryIdValue | 'ALL'>('ALL')

  const [processingBatch, setProcessingBatch] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [deletingZeroStock, setDeletingZeroStock] = useState(false)
  const [deletingST, setDeletingST] = useState(false)
  const [categorizing, setCategorizing] = useState(false)
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false)
  const [limitCount, setLimitCount] = useState(20)
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [savingGeminiKey, setSavingGeminiKey] = useState(false)
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false)
  const [generatingBatchDesc, setGeneratingBatchDesc] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const isFiltering = searchQuery !== '' || selectedCategory !== 'ALL' || activeFilter !== 'all'
  const currentLimit = isFiltering ? 1000 : limitCount

  useEffect(() => {
    setLoading(true)
    return subscribeToProducts(getDb(), currentLimit, (data) => {
      setProducts(data)
      setLoading(false)
    })
  }, [currentLimit])

  useEffect(() => {
    async function loadGeminiConfig() {
      try {
        const docRef = doc(getDb(), 'settings', 'gemini_config')
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setGeminiApiKey(docSnap.data().apiKey || '')
        }
      } catch (err) {
        console.error('Error loading Gemini API Key:', err)
      }
    }
    loadGeminiConfig()
  }, [])

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGeminiKey(true)
    try {
      const docRef = doc(getDb(), 'settings', 'gemini_config')
      await setDoc(docRef, {
        apiKey: geminiApiKey,
        updatedAt: Date.now()
      })
      alert('¡API Key de Gemini guardada correctamente!')
      setIsGeminiModalOpen(false)
    } catch (err: any) {
      alert(`Error al guardar API Key: ${err.message}`)
    } finally {
      setSavingGeminiKey(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false

    switch (activeFilter) {
      case 'flash': return !!p.showInFlashDeals
      case 'featured': return !!p.isFeatured
      case 'bestSeller': return !!p.isBestSeller
      case 'newArrival': return !!p.isNewArrival
      case 'recommended': return !!p.inRecommendedFeed
      case 'onDemand': return !!p.onDemand
      default: return true
    }
  })

  const activeProduct = products.find(p => p.id === selectedProductId) || null
  const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0 || !p.images[0])
  const missingCount = productsWithoutImages.length
  const productsWithoutDesc = products.filter(p => !p.description || p.description.trim() === '' || p.description.startsWith('Producto importado'))
  const missingDescCount = productsWithoutDesc.length

  const handleBatchSearchImages = async () => {
    if (productsWithoutImages.length === 0) return

    if (!confirm(`¿Estás seguro que querés buscar fotos de internet para ${productsWithoutImages.length} productos sin foto de forma automática?`)) {
      return
    }

    setProcessingBatch(true)
    setBatchProgress(0)

    try {
      const searchFunc = httpsCallable<{ query: string }, { urls: string[] }>(getFunctionsInstance(), 'searchProductImages')
      
      for (let i = 0; i < productsWithoutImages.length; i++) {
        const product = productsWithoutImages[i]
        
        try {
          const queryStr = `${product.brand} ${product.name} ${product.model} png`
          const res = await searchFunc({ query: queryStr })
          
          if (res.data?.urls && res.data.urls.length > 0) {
            const firstUrl = res.data.urls[0]
            await updateProductImageUrls(getDb(), product.id, [firstUrl])
          }
        } catch (err) {
          console.error(`Error searching image for product ${product.id}:`, err)
        }

        setBatchProgress(i + 1)
        // Retardo prudente entre llamados de 300ms para evitar rate limiting en DDG
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (err: any) {
      alert(`Error en el procesamiento por lote: ${err.message}`)
    } finally {
      setProcessingBatch(false)
      setBatchProgress(0)
    }
  }

  const handleBulkSearchImages = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`¿Estás seguro que querés buscar fotos de internet para los ${selectedIds.size} productos seleccionados de forma automática?`)) {
      return
    }

    setBulkActionLoading(true)
    setBatchProgress(0)

    try {
      const searchFunc = httpsCallable<{ query: string }, { urls: string[] }>(getFunctionsInstance(), 'searchProductImages')
      const idsArray = Array.from(selectedIds)

      for (let i = 0; i < idsArray.length; i++) {
        const id = idsArray[i]
        const product = products.find(p => p.id === id)
        if (!product) continue

        try {
          const queryStr = `${product.brand} ${product.name} ${product.model} png`
          const res = await searchFunc({ query: queryStr })
          
          if (res.data?.urls && res.data.urls.length > 0) {
            const firstUrl = res.data.urls[0]
            await updateProductImageUrls(getDb(), product.id, [firstUrl])
          }
        } catch (err) {
          console.error(`Error searching image for product ${product.id}:`, err)
        }

        setBatchProgress(i + 1)
        // Retardo prudente entre llamados de 300ms para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (err: any) {
      alert(`Error en el procesamiento por lote: ${err.message}`)
    } finally {
      setBulkActionLoading(false)
      setBatchProgress(0)
      setSelectedIds(new Set())
    }
  }

  const handleBatchGenerateDescriptions = async () => {
    if (productsWithoutDesc.length === 0) return

    if (!confirm(`¿Estás seguro que querés generar descripciones con IA para ${productsWithoutDesc.length} productos sin descripción?`)) {
      return
    }

    setGeneratingBatchDesc(true)
    setBatchProgress(0)

    try {
      const genFunc = httpsCallable<{ productIds: string[], override: boolean }, { success: boolean, results: any[] }>(
        getFunctionsInstance(), 
        'generateBatchProductDescriptions'
      )
      
      const BATCH_SIZE = 10
      const idsArray = productsWithoutDesc.map(p => p.id)
      
      for (let i = 0; i < idsArray.length; i += BATCH_SIZE) {
        const batchIds = idsArray.slice(i, i + BATCH_SIZE)
        await genFunc({ productIds: batchIds, override: true })
        setBatchProgress(Math.min(i + BATCH_SIZE, idsArray.length))
      }

      alert('¡Listo! Descripciones generadas exitosamente.')
    } catch (err: any) {
      alert(`Error en la generación por lote: ${err.message}`)
    } finally {
      setGeneratingBatchDesc(false)
      setBatchProgress(0)
    }
  }

  const handleBatchRewriteAllDescriptions = async () => {
    if (products.length === 0) return

    if (!confirm(`¿Estás seguro que querés REESCRIBIR con IA las descripciones de los ${products.length} productos del catálogo? Esto reemplazará las descripciones actuales.`)) {
      return
    }

    setGeneratingBatchDesc(true)
    setBatchProgress(0)

    try {
      const genFunc = httpsCallable<{ productIds: string[], override: boolean }, { success: boolean, results: any[] }>(
        getFunctionsInstance(), 
        'generateBatchProductDescriptions'
      )
      
      const BATCH_SIZE = 10
      const idsArray = products.map(p => p.id)
      
      for (let i = 0; i < idsArray.length; i += BATCH_SIZE) {
        const batchIds = idsArray.slice(i, i + BATCH_SIZE)
        await genFunc({ productIds: batchIds, override: true })
        setBatchProgress(Math.min(i + BATCH_SIZE, idsArray.length))
      }

      alert('¡Listo! Todas las descripciones fueron reescritas exitosamente.')
    } catch (err: any) {
      alert(`Error en la generación por lote: ${err.message}`)
    } finally {
      setGeneratingBatchDesc(false)
      setBatchProgress(0)
    }
  }

  const handleBulkGenerateDescriptions = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`¿Estás seguro que querés autogenerar descripciones con IA para los ${selectedIds.size} productos seleccionados?`)) {
      return
    }

    setBulkActionLoading(true)
    setBatchProgress(0)

    try {
      const genFunc = httpsCallable<{ productIds: string[], override: boolean }, { success: boolean, results: any[] }>(
        getFunctionsInstance(), 
        'generateBatchProductDescriptions'
      )
      
      const BATCH_SIZE = 10
      const idsArray = Array.from(selectedIds)
      
      for (let i = 0; i < idsArray.length; i += BATCH_SIZE) {
        const batchIds = idsArray.slice(i, i + BATCH_SIZE)
        await genFunc({ productIds: batchIds, override: true })
        setBatchProgress(Math.min(i + BATCH_SIZE, idsArray.length))
      }

      alert('¡Listo! Descripciones generadas exitosamente.')
    } catch (err: any) {
      alert(`Error al generar descripciones: ${err.message}`)
    } finally {
      setBulkActionLoading(false)
      setBatchProgress(0)
      setSelectedIds(new Set())
    }
  }

  const handleDeleteZeroStockProducts = async () => {
    setDeletingZeroStock(true)
    try {
      const q = query(collection(getDb(), 'products'), where('stock', '==', 0))
      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        alert('No hay productos con stock 0 en la base de datos.')
        setDeletingZeroStock(false)
        return
      }

      // Filter out products that are on-demand
      const docsToDelete = snapshot.docs.filter(docSnap => !docSnap.data().onDemand)
      if (docsToDelete.length === 0) {
        alert('No hay productos locales con stock 0 (se ignoraron los productos bajo pedido de proveedores).')
        setDeletingZeroStock(false)
        return
      }

      if (!confirm(`¿Estás seguro que querés eliminar permanentemente ${docsToDelete.length} productos locales con stock 0? (Se ignorarán ${snapshot.size - docsToDelete.length} productos bajo pedido de proveedores)`)) {
        setDeletingZeroStock(false)
        return
      }

      for (const docSnap of docsToDelete) {
        await deleteProduct(getDb(), docSnap.id)
      }
    } catch (err: any) {
      alert(`Error eliminando productos: ${err.message}`)
    } finally {
      setDeletingZeroStock(false)
    }
  }

  const handleDeleteSTProducts = async () => {
    setDeletingST(true)
    try {
      const snapshot = await getDocs(collection(getDb(), 'products'))
      const stDocs = snapshot.docs.filter(docSnap => {
        const id = docSnap.id
        const name = docSnap.data().name || ''
        return id.startsWith('ST ') || name.startsWith('ST ')
      })

      if (stDocs.length === 0) {
        alert('No se encontraron productos que comiencen con "ST " en la base de datos.')
        setDeletingST(false)
        return
      }

      if (!confirm(`¿Estás seguro que querés eliminar permanentemente ${stDocs.length} productos que comienzan con "ST "?`)) {
        setDeletingST(false)
        return
      }

      for (const docSnap of stDocs) {
        await deleteProduct(getDb(), docSnap.id)
      }
    } catch (err: any) {
      alert(`Error eliminando productos ST: ${err.message}`)
    } finally {
      setDeletingST(false)
    }
  }

  const handleAutoCategorizeAll = async () => {
    setCategorizing(true)
    try {
      const snapshot = await getDocs(collection(getDb(), 'products'))
      const toUpdate: Array<{ id: string; category: CategoryIdValue }> = []
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        const name = data.name || ''
        const brand = data.brand || ''
        const model = data.model || ''
        const currentCategory = data.category
        
        const guessedCategory = guessCategory(name, brand, model)
        
        if (guessedCategory && guessedCategory !== currentCategory) {
          toUpdate.push({
            id: docSnap.id,
            category: guessedCategory
          })
        }
      }
      
      if (toUpdate.length === 0) {
        alert('Todos los productos ya tienen la categoría correcta según el algoritmo de palabras clave.')
        setCategorizing(false)
        return
      }
      
      if (!confirm(`Se encontraron ${toUpdate.length} productos con categorías sugeridas distintas a las actuales. ¿Querés actualizarlos automáticamente?`)) {
        setCategorizing(false)
        return
      }
      
      for (const item of toUpdate) {
        await updateProductCategory(getDb(), item.id, item.category)
      }
      
      alert(`¡Listo! Se actualizaron las categorías de ${toUpdate.length} productos.`)
    } catch (err: any) {
      alert(`Error auto-categorizando productos: ${err.message}`)
    } finally {
      setCategorizing(false)
    }
  }

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleBulkFlag = async (flagKey: string, newValue: boolean) => {
    setBulkActionLoading(true)
    try {
      for (const id of selectedIds) {
        await updateProductFlag(getDb(), id, flagKey, newValue)
      }
    } catch (err: any) {
      alert(`Error actualizando productos: ${err.message}`)
    } finally {
      setBulkActionLoading(false)
      setSelectedIds(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`¿Estás seguro que querés eliminar permanentemente los ${selectedIds.size} productos seleccionados?`)) return
    setBulkActionLoading(true)
    try {
      for (const id of selectedIds) {
        await deleteProduct(getDb(), id)
      }
    } catch (err: any) {
      alert(`Error eliminando productos: ${err.message}`)
    } finally {
      setBulkActionLoading(false)
      setSelectedIds(new Set())
    }
  }

  const handleBulkCategory = async (category: CategoryIdValue) => {
    setBulkActionLoading(true)
    try {
      for (const id of selectedIds) {
        await updateProductCategory(getDb(), id, category)
      }
    } catch (err: any) {
      alert(`Error actualizando categoría: ${err.message}`)
    } finally {
      setBulkActionLoading(false)
      setSelectedIds(new Set())
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos de la app</h1>
          <p className="mt-2 max-w-xl text-pclink-muted">
            Gestioná tu catálogo en tiempo real. Asigná visibilidad en secciones del Home, subí imágenes y revisá el stock.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative inline-block text-left">
            <motion.button
              type="button"
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              className="flex items-center gap-2 rounded-xl border border-pclink-cyan/35 bg-pclink-cyan/10 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,188,212,0.1)] hover:bg-pclink-cyan/20 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Wand2 className="h-4 w-4 text-pclink-cyan" />
              <span>Herramientas</span>
            </motion.button>

            {toolsMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setToolsMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-pclink-border/50 bg-pclink-bg/95 backdrop-blur-xl shadow-2xl z-40 p-1.5 space-y-1"
                >
                  <button
                    type="button"
                    disabled={processingBatch || missingCount === 0}
                    onClick={() => {
                      setToolsMenuOpen(false)
                      handleBatchSearchImages()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-white hover:bg-pclink-cyan/15 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    {processingBatch ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-pclink-cyan" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-pclink-cyan-light" />
                    )}
                    <span>
                      {processingBatch 
                        ? `Buscando (${batchProgress}/${missingCount})...` 
                        : `Autobuscar ${missingCount} ${missingCount === 1 ? 'foto' : 'fotos'}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={deletingZeroStock}
                    onClick={() => {
                      setToolsMenuOpen(false)
                      handleDeleteZeroStockProducts()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-pclink-error hover:bg-pclink-error/10 disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    {deletingZeroStock ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Limpiar Stock en 0</span>
                  </button>

                  <button
                    type="button"
                    disabled={deletingST}
                    onClick={() => {
                      setToolsMenuOpen(false)
                      handleDeleteSTProducts()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-pclink-error hover:bg-pclink-error/10 disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    {deletingST ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Eliminar productos "ST"</span>
                  </button>

                  <button
                    type="button"
                    disabled={categorizing}
                    onClick={() => {
                      setToolsMenuOpen(false)
                      handleAutoCategorizeAll()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-pclink-cyan-light hover:bg-pclink-cyan/15 disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    {categorizing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Tag className="h-3.5 w-3.5" />
                    )}
                    <span>Auto-categorizar todo</span>
                  </button>

                  <button
                    type="button"
                    disabled={generatingBatchDesc || missingDescCount === 0}
                    onClick={() => {
                      setToolsMenuOpen(false)
                      handleBatchGenerateDescriptions()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-pclink-cyan-light hover:bg-pclink-cyan/15 disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    {generatingBatchDesc ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-pclink-cyan" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5 text-pclink-cyan" />
                    )}
                    <span>
                      {generatingBatchDesc 
                        ? `Generando (${batchProgress}/${missingDescCount})...` 
                        : `Autogenerar ${missingDescCount} descripciones`}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={generatingBatchDesc || products.length === 0}
                    onClick={() => {
                      setToolsMenuOpen(false)
                      handleBatchRewriteAllDescriptions()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-pclink-cyan-light hover:bg-pclink-cyan/15 disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer transition-colors"
                  >
                    {generatingBatchDesc ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-pclink-cyan" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5 text-pclink-cyan" />
                    )}
                    <span>
                      {generatingBatchDesc 
                        ? `Reescribiendo (${batchProgress}/${products.length})...` 
                        : `Reescribir TODAS las descripciones`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setToolsMenuOpen(false)
                      setIsGeminiModalOpen(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-pclink-cyan hover:bg-pclink-cyan/15 cursor-pointer transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-pclink-cyan-light" />
                    <span>Configurar Gemini API</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>

          <motion.button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-4 py-2.5 text-sm font-bold text-pclink-bg shadow-[0_0_20px_rgba(0,188,212,0.25)] cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </motion.button>
        </div>
      </div>

      <div className="glass-panel mt-8 overflow-hidden">
        {/* Buscador Superior */}
        <div className="flex flex-col gap-4 border-b border-pclink-border/40 p-4 sm:flex-row sm:items-center sm:px-6 bg-pclink-elevated/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
            <input
              type="search"
              placeholder="Buscar por nombre, SKU, marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CategoryIdValue | 'ALL')}
            className="rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="ALL">Todas las Categorías</option>
            {CATEGORY_IDS.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
          </select>
          <div className="text-xs text-pclink-muted">
            {filteredProducts.length} productos encontrados
          </div>
        </div>

        {/* Panel de Filtros Rápidos de Secciones del Home */}
        <div className="flex flex-wrap gap-2 border-b border-pclink-border/30 bg-pclink-elevated/5 p-4 px-6 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos', count: products.length },
            { id: 'flash', label: 'Ofertas Flash', icon: Flame, color: 'text-orange-400 border-orange-500/20', count: products.filter(p => p.showInFlashDeals).length },
            { id: 'featured', label: 'Destacados', icon: Star, color: 'text-yellow-400 border-yellow-500/20', count: products.filter(p => p.isFeatured).length },
            { id: 'bestSeller', label: 'Selección PcLink', icon: Target, color: 'text-cyan-400 border-cyan-500/20', count: products.filter(p => p.isBestSeller).length },
            { id: 'newArrival', label: 'Nuevos', icon: Sparkles, color: 'text-purple-400 border-purple-500/20', count: products.filter(p => p.isNewArrival).length },
            { id: 'recommended', label: 'Recomendados', icon: Heart, color: 'text-rose-400 border-rose-500/20', count: products.filter(p => p.inRecommendedFeed).length },
            { id: 'onDemand', label: 'Bajo Pedido', icon: Tag, color: 'text-emerald-400 border-emerald-500/20', count: products.filter(p => p.onDemand).length }
          ].map(({ id, label, icon: Icon, color, count }) => {
            const isSelected = activeFilter === id
            return (
              <button
                key={id}
                onClick={() => setActiveFilter(id as any)}
                className={`relative flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'border-pclink-cyan bg-pclink-cyan/15 text-white shadow-[0_0_15px_rgba(0,188,212,0.1)]' 
                    : 'border-pclink-border/40 bg-pclink-bg/30 text-pclink-muted hover:border-pclink-border hover:text-white'
                }`}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${color}`} />}
                <span>{label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${isSelected ? 'bg-pclink-cyan/20 text-pclink-cyan-light' : 'bg-pclink-elevated text-pclink-subtle'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Barra de Acciones Masivas */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pclink-cyan/30 bg-pclink-cyan/10 p-4 px-6 shadow-inner animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pclink-cyan text-xs font-bold text-pclink-bg">
                {selectedIds.size}
              </span>
              <span className="text-sm font-bold text-pclink-cyan-light">productos seleccionados</span>
              <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-xs text-pclink-muted hover:text-white transition">
                Limpiar
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <select
                disabled={bulkActionLoading}
                onChange={(e) => {
                  if (e.target.value) handleBulkCategory(e.target.value as CategoryIdValue)
                  e.target.value = '' // reset
                }}
                className="rounded-lg border border-pclink-cyan/40 bg-pclink-bg/80 px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
              >
                <option value="">Cambiar Categoría...</option>
                {CATEGORY_IDS.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
              </select>

              <button disabled={bulkActionLoading} onClick={() => handleBulkFlag('showInFlashDeals', true)} className="flex items-center gap-1 rounded-lg bg-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500/30">
                <Flame className="h-3.5 w-3.5" /> + Flash
              </button>
              <button disabled={bulkActionLoading} onClick={() => handleBulkFlag('isFeatured', true)} className="flex items-center gap-1 rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-bold text-yellow-400 hover:bg-yellow-500/30">
                <Star className="h-3.5 w-3.5" /> + Destacar
              </button>

              <button 
                disabled={bulkActionLoading} 
                onClick={handleBulkSearchImages} 
                className="flex items-center gap-1 rounded-lg border border-pclink-cyan/40 bg-pclink-cyan/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-pclink-cyan/20 disabled:opacity-50"
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-pclink-cyan" />
                    <span>Buscando ({batchProgress}/{selectedIds.size})...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5 text-pclink-cyan" />
                    <span>Autobuscar fotos</span>
                  </>
                )}
              </button>

              <button 
                disabled={bulkActionLoading || selectedIds.size === 0} 
                onClick={handleBulkGenerateDescriptions} 
                className="flex items-center gap-1 rounded-lg border border-pclink-cyan/40 bg-pclink-cyan/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-pclink-cyan/20 disabled:opacity-50"
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-pclink-cyan" />
                    <span>Generando ({batchProgress}/{selectedIds.size})...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5 text-pclink-cyan" />
                    <span>Autogenerar descripciones</span>
                  </>
                )}
              </button>
              
              <button disabled={bulkActionLoading} onClick={handleBulkDelete} className="ml-4 flex items-center gap-1 rounded-lg border border-pclink-error/40 bg-pclink-error/10 px-3 py-1.5 text-xs font-bold text-pclink-error hover:bg-pclink-error/20">
                {bulkActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Tabla de Productos */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleAll}
                    className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold text-center">Estado Imagen</th>
                <th className="px-6 py-4 font-semibold">Precio</th>
                <th className="px-6 py-4 font-semibold text-center">Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-pclink-muted">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-pclink-muted">
                    No se encontraron productos en esta sección.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.01 * Math.min(i, 20) }}
                    className={`group border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0 cursor-pointer ${selectedIds.has(p.id) ? 'bg-pclink-cyan/10' : ''}`}
                    onClick={(e) => {
                      // Solo abrir el editor si no se hizo click en el checkbox
                      if ((e.target as HTMLElement).tagName.toLowerCase() !== 'input') {
                        setSelectedProductId(p.id)
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelection(p.id)}
                        className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-pclink-border bg-pclink-elevated/50 flex items-center justify-center shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} className="h-full w-full object-contain" />
                          ) : (
                            <ImageIcon className="h-4 w-4 opacity-20" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white line-clamp-1">{p.name}</p>
                            {p.onDemand && (
                              <span className="inline-flex rounded-full bg-pclink-cyan/15 px-2 py-0.5 text-[9px] font-semibold text-pclink-cyan-light border border-pclink-cyan/20 shrink-0">
                                Bajo Pedido
                              </span>
                            )}
                            {/* Badges visuales de Secciones */}
                            <div className="flex items-center gap-1 shrink-0">
                              {p.showInFlashDeals && <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                              {p.isFeatured && <Star className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                              {p.isBestSeller && <Target className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                              {p.isNewArrival && <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                              {p.inRecommendedFeed && <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-pclink-cyan-light/80 font-mono">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.images?.[0] ? (
                        <span className="inline-flex rounded-full bg-pclink-success/10 px-2 py-0.5 text-[10px] font-bold text-pclink-success">
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pclink-error/10 px-2 py-0.5 text-[10px] font-bold text-pclink-error">
                          <AlertCircle className="h-3 w-3" />
                          Sin imagen
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white font-mono">
                      ${p.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${p.stock > 5 ? 'text-pclink-muted' : 'text-pclink-warning'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-pclink-cyan font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Gestionar
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isFiltering && products.length >= limitCount && (
        <div className="mt-6 flex justify-center">
          <motion.button
            type="button"
            onClick={() => setLimitCount(prev => prev + 20)}
            className="flex items-center gap-2 rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 px-6 py-3 text-sm font-bold text-pclink-cyan-light shadow-[0_0_15px_rgba(0,188,212,0.05)] hover:bg-pclink-cyan/15 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cargar 20 más
          </motion.button>
        </div>
      )}

      <ProductEditorSheet 
        product={activeProduct} 
        onClose={() => setSelectedProductId(null)} 
      />

      {/* GEMINI CONFIG MODAL */}
      <AnimatePresence>
        {isGeminiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsGeminiModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-bg/95 p-6 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <h3 className="text-base font-bold text-white leading-normal">Configurar API Key de Gemini</h3>
              <p className="text-xs text-pclink-muted leading-relaxed">
                Ingresá tu clave de API de Google AI Studio para habilitar la autogeneración de descripciones de productos con IA.
              </p>

              <form onSubmit={handleSaveGeminiKey} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-pclink-cyan uppercase tracking-wider mb-1">API Key</label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white placeholder:text-pclink-subtle focus:outline-none focus:border-pclink-cyan"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGeminiModalOpen(false)}
                    className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold text-pclink-muted hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    disabled={savingGeminiKey}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2 text-xs font-bold text-pclink-bg disabled:opacity-50 cursor-pointer"
                    whileTap={{ scale: !savingGeminiKey ? 0.99 : 1 }}
                  >
                    {savingGeminiKey ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Clave
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
