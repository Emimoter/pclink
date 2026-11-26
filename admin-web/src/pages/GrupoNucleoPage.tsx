import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database, Loader2, Save, Search, Import, Tag, AlertCircle,
  CheckCircle2, RefreshCw, Key, Image as ImageIcon, Settings, Trash2, Edit2,
  Upload, FileSpreadsheet, Check, Sparkles, SlidersHorizontal, Clock
} from 'lucide-react'
import { getDb, getFunctionsInstance } from '../lib/firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { CATEGORY_LABELS } from '../lib/catalog/constants'
import {
  type GrupoNucleoItem,
  type RecommendedNucleoItem,
  type GrupoNucleoSyncState,
  parseGrupoNucleoExcelBuffer,
  computeRecommendationsFromCatalog,
  guessGrupoNucleoCategory,
} from '../lib/catalog/grupoNucleoSync'

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
  isHidden?: boolean
  hiddenReason?: string | null
  imageVerified?: boolean
}

export function GrupoNucleoPage() {
  // Credentials States
  const [clientId, setClientId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [savingCreds, setSavingCreds] = useState(false)
  const [credsStatus, setCredsStatus] = useState<{ success: boolean; msg: string } | null>(null)

  // Sync & Recommendations States (populated by Monday automation or manual Excel sync)
  const [syncState, setSyncState] = useState<GrupoNucleoSyncState | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedNucleoItem[]>([])
  const [recGeneratedAt, setRecGeneratedAt] = useState<number | null>(null)
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [recCategoryFilter, setRecCategoryFilter] = useState('')
  const [recSearchQuery, setRecSearchQuery] = useState('')
  const [selectedRecIds, setSelectedRecIds] = useState<Set<string>>(new Set())

  // API / Excel Catalog States
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
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null)

  // Carga e Importación desde Excel / Lote
  const [loadMethod, setLoadMethod] = useState<'api' | 'excel'>('excel')
  const [excelFileName, setExcelFileName] = useState('')
  const [globalDollarRate, setGlobalDollarRate] = useState<number>(1630)
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
  const [itemDollarRate, setItemDollarRate] = useState<number>(1630)
  const [itemIva, setItemIva] = useState<number>(21)
  const [itemMargin, setItemMargin] = useState<number>(30)

  // Edit Margin Modal State
  const [editingProduct, setEditingProduct] = useState<SyncedProduct | null>(null)
  const [editMargin, setEditMargin] = useState(30)
  const [savingMargin, setSavingMargin] = useState(false)

  // Synced Products Bulk Selection & Search States
  const [selectedSyncedIds, setSelectedSyncedIds] = useState<Set<string>>(new Set())
  const [syncedSearchQuery, setSyncedSearchQuery] = useState('')
  const [syncedStatusFilter, setSyncedStatusFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [editingBulkMargin, setEditingBulkMargin] = useState(false)
  const [bulkMarginValue, setBulkMarginValue] = useState<number>(30)
  const [savingBulkMargin, setSavingBulkMargin] = useState(false)

  // Active sub-tab inside page
  const [activeTab, setActiveTab] = useState<'recommended' | 'catalog' | 'synced' | 'config'>('recommended')

  // Copy to clipboard feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyName = (id: string, name: string) => {
    navigator.clipboard.writeText(name)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev))
    }, 2000)
  }

  const loadSyncAndRecommendations = async () => {
    setLoadingRecs(true)
    try {
      const db = getDb()
      const [stateSnap, recSnap] = await Promise.all([
        getDoc(doc(db, 'settings', 'grupo_nucleo_sync_state')),
        getDoc(doc(db, 'settings', 'grupo_nucleo_recommendations')),
      ])

      if (stateSnap.exists()) {
        const s = stateSnap.data() as GrupoNucleoSyncState
        setSyncState(s)
        if (s.exchangeRate && s.exchangeRate > 0) {
          setExchangeRate(s.exchangeRate)
          setGlobalDollarRate(s.exchangeRate)
        }
      }

      if (recSnap.exists()) {
        const r = recSnap.data()
        if (Array.isArray(r.items)) {
          setRecommendations(r.items as RecommendedNucleoItem[])
        }
        if (r.generatedAt) setRecGeneratedAt(r.generatedAt)
        if (r.exchangeRate && r.exchangeRate > 0) {
          setExchangeRate(r.exchangeRate)
          setGlobalDollarRate(r.exchangeRate)
        }
        if (typeof r.defaultMargin === 'number') {
          setGlobalMargin(r.defaultMargin)
        }
      }
    } catch (err) {
      console.error('Error loading Grupo Núcleo recommendations:', err)
    } finally {
      setLoadingRecs(false)
    }
  }

  // Load configured credentials, synced products, and weekly recommendations on mount
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
    loadSyncAndRecommendations()
  }, [])

  useEffect(() => {
    if (selectedItem) {
      setItemDollarRate(globalDollarRate)
      setItemIva(selectedItem.tax !== undefined && selectedItem.tax !== null ? selectedItem.tax : globalIva)
      setItemMargin(globalMargin)
    }
  }, [selectedItem, globalDollarRate, globalIva, globalMargin])

  useEffect(() => {
    setSelectedIds(new Set())
    setSelectedSyncedIds(new Set())
    setSelectedRecIds(new Set())
  }, [activeTab])

  useEffect(() => {
    setDisplayLimit(20)
  }, [searchQuery, loadMethod, onlyWithStock, onlyWithPriceChanges, selectedCategoryFilter, sortBy])

  const loadSyncedProducts = async () => {
    setLoadingSynced(true)
    try {
      const q = query(collection(getDb(), 'products'), where('externalSource', '==', 'grupo_nucleo'))
      const snapshot = await getDocs(q)
      const list = snapshot.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data(),
          }) as SyncedProduct
      )
      setSyncedProducts(list)
    } catch (err) {
      console.error('Error loading synced products:', err)
    } finally {
      setLoadingSynced(false)
    }
  }

  // Helper: trigger Cloud Function image verification for newly imported items lacking a pre-verified photo
  const ensureVerifiedImagesForIds = async (ids: string[]) => {
    if (ids.length === 0) return
    try {
      setImportStatusMsg(`Verificando fotos automáticas para ${ids.length} producto(s)...`)
      const resolveFn = httpsCallable<{ productIds: string[] }, { success: boolean }>(
        getFunctionsInstance(),
        'resolveVerifiedProductImages'
      )
      for (let i = 0; i < ids.length; i += 20) {
        await resolveFn({ productIds: ids.slice(i, i + 20) })
      }
    } catch (err) {
      console.warn('Image verification warning:', err)
    } finally {
      setImportStatusMsg(null)
    }
  }

  const syncedIdSet = useMemo(() => {
    const s = new Set<string>()
    syncedProducts.forEach((p) => {
      s.add(p.id)
      if (p.externalId) s.add(p.externalId)
    })
    return s
  }, [syncedProducts])

  const pendingRecommendations = useMemo(() => {
    return recommendations.filter((r) => !syncedIdSet.has(r.id))
  }, [recommendations, syncedIdSet])

  const filteredRecommendations = useMemo(() => {
    const q = recSearchQuery.toLowerCase().trim()
    return pendingRecommendations.filter((r) => {
      if (recCategoryFilter && r.category !== recCategoryFilter) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.categoryLabel.toLowerCase().includes(q)
      )
    })
  }, [pendingRecommendations, recCategoryFilter, recSearchQuery])

  const recCategories = useMemo(() => {
    const map = new Map<string, string>()
    pendingRecommendations.forEach((r) => {
      map.set(r.category, r.categoryLabel)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [pendingRecommendations])

  const filteredSyncedProducts = useMemo(() => {
    const q = syncedSearchQuery.toLowerCase().trim()
    return syncedProducts.filter((p) => {
      const isLive = !p.isHidden && p.stock > 0
      if (syncedStatusFilter === 'active' && !isLive) return false
      if (syncedStatusFilter === 'paused' && isLive) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.externalId.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      )
    })
  }, [syncedProducts, syncedSearchQuery, syncedStatusFilter])

  const activeSyncedCount = useMemo(
    () => syncedProducts.filter((p) => !p.isHidden && p.stock > 0).length,
    [syncedProducts]
  )

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
        updatedAt: Date.now(),
      })
      setCredsStatus({ success: true, msg: 'Credenciales guardadas correctamente. Ya podés consultar el catálogo.' })
    } catch (err: any) {
      setCredsStatus({ success: false, msg: `Error al guardar: ${err.message}` })
    } finally {
      setSavingCreds(false)
    }
  }

  const handleLoadCatalog = async () => {
    setLoadingCatalog(true)
    setCatalogError(null)
    setCatalog([])
    setSelectedIds(new Set())
    try {
      const getCatalogFunc = httpsCallable<
        Record<string, never>,
        { success: boolean; catalog?: GrupoNucleoItem[]; exchangeRate?: number; message?: string }
      >(getFunctionsInstance(), 'getGrupoNucleoCatalog')
      const result = await getCatalogFunc({})

      if (result.data?.success && result.data.catalog) {
        setCatalog(result.data.catalog)
        const rate = result.data.exchangeRate || globalDollarRate
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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExcelFileName(file.name)
    setLoadingCatalog(true)
    setCatalogError(null)
    setCatalog([])
    setSelectedIds(new Set())

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result as ArrayBuffer | undefined
        if (!data) throw new Error('No se pudieron leer los datos del archivo.')

        const parsedItems = parseGrupoNucleoExcelBuffer(data)
        setCatalog(parsedItems)

        // Recalcular recomendaciones frescas en vivo con el nuevo Excel
        const allSnap = await getDocs(collection(getDb(), 'products'))
        const allProds = allSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }))
        const existingPreviews = new Map<string, string>()
        recommendations.forEach((r) => {
          if (r.previewImage) existingPreviews.set(r.id, r.previewImage)
        })
        const freshRecs = computeRecommendationsFromCatalog(
          parsedItems,
          allProds,
          globalDollarRate,
          globalMargin,
          existingPreviews
        )
        setRecommendations(freshRecs)
        setRecGeneratedAt(Date.now())
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

  // Import single product (from Modal)
  const handleImportProduct = async () => {
    if (!selectedItem) return
    setImporting(true)
    try {
      const db = getDb()
      const costInARS = selectedItem.currency === 'USD' ? selectedItem.price * itemDollarRate : selectedItem.price
      const costWithTax = costInARS * (1 + itemIva / 100)

      const syncedProd = syncedProducts.find((p) => p.externalId === selectedItem.id)
      const marginToUse = syncedProd ? (syncedProd.margin ?? itemMargin) : itemMargin
      const finalPrice = Math.round(costWithTax * (1 + marginToUse / 100))

      const guessedCat = guessGrupoNucleoCategory({
        name: selectedItem.name,
        brand: selectedItem.brand,
        model: selectedItem.model,
        linea: selectedItem.linea,
        supplierCategory: selectedItem.category,
        subCategory: selectedItem.subCategory,
      })

      const preVerifiedImg = selectedItem.images?.[0]?.startsWith('https://') ? selectedItem.images[0] : ''
      const hasStock = selectedItem.stock > 0 && finalPrice > 0

      const productRef = doc(db, 'products', selectedItem.id)
      const updateData: Record<string, any> = {
        name: selectedItem.name,
        brand: selectedItem.brand || 'Genérico',
        model: selectedItem.partNumber || selectedItem.model || '',
        price: finalPrice,
        stock: selectedItem.stock,
        category: guessedCat,
        externalSource: 'grupo_nucleo',
        externalId: selectedItem.id,
        margin: marginToUse,
        costUsd: selectedItem.price,
        taxRate: itemIva,
        lastExchangeRate: itemDollarRate,
        onDemand: true,
        updatedAt: Date.now(),
      }

      if (!syncedProd) {
        updateData.description = `Producto oficial distribuido por Grupo Núcleo. Código: ${selectedItem.id}.`
        if (preVerifiedImg) {
          updateData.images = [preVerifiedImg]
          updateData.imageVerified = true
          updateData.imageVerifiedAt = Date.now()
          updateData.isHidden = !hasStock
          updateData.hiddenReason = hasStock ? null : 'out_of_stock'
        } else {
          updateData.images = []
          updateData.imageVerified = false
          updateData.isHidden = true
          updateData.hiddenReason = hasStock ? 'pending_image' : 'out_of_stock'
        }
      }

      await setDoc(productRef, updateData, { merge: true })

      if (!syncedProd && !preVerifiedImg && hasStock) {
        await ensureVerifiedImagesForIds([selectedItem.id])
      }

      setSelectedItem(null)
      await loadSyncedProducts()
      alert(`¡Producto "${selectedItem.name}" importado con éxito!`)
    } catch (err: any) {
      alert(`Error al importar producto: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Import recommended items (1-click or batch)
  const handleImportRecommendations = async (itemsToImport: RecommendedNucleoItem[]) => {
    if (itemsToImport.length === 0) return
    setImporting(true)
    try {
      const db = getDb()
      const idsNeedingImageSearch: string[] = []
      const now = Date.now()

      const batch = writeBatch(db)
      itemsToImport.forEach((rec) => {
        const costInARS = rec.currency === 'USD' ? rec.costUsd * globalDollarRate : rec.costUsd
        const finalPrice = Math.round(costInARS * (1 + rec.tax / 100) * (1 + globalMargin / 100))
        const hasValidPreview = !!rec.previewImage && rec.previewImage.startsWith('https://')
        const hasStock = rec.stockMdp > 0 && finalPrice > 0

        if (!hasValidPreview && hasStock) {
          idsNeedingImageSearch.push(rec.id)
        }

        const productRef = doc(db, 'products', rec.id)
        batch.set(
          productRef,
          {
            name: rec.name,
            brand: rec.brand || 'Genérico',
            model: rec.partNumber || '',
            price: finalPrice,
            stock: rec.stockMdp,
            category: rec.category,
            externalSource: 'grupo_nucleo',
            externalId: rec.id,
            margin: globalMargin,
            costUsd: rec.costUsd,
            taxRate: rec.tax,
            lastExchangeRate: globalDollarRate,
            onDemand: true,
            description: `Producto oficial distribuido por Grupo Núcleo. Código: ${rec.id}.`,
            images: hasValidPreview ? [rec.previewImage!] : [],
            imageVerified: hasValidPreview,
            ...(hasValidPreview ? { imageVerifiedAt: now } : {}),
            isHidden: !(hasStock && hasValidPreview),
            hiddenReason: !hasStock ? 'out_of_stock' : hasValidPreview ? null : 'pending_image',
            updatedAt: now,
          },
          { merge: true }
        )
      })

      await batch.commit()

      if (idsNeedingImageSearch.length > 0) {
        await ensureVerifiedImagesForIds(idsNeedingImageSearch)
      }

      setSelectedRecIds(new Set())
      await loadSyncedProducts()
      alert(`¡Se importaron ${itemsToImport.length} producto(s) recomendados a la tienda!`)
    } catch (err: any) {
      alert(`Error al importar recomendados: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Import selected items from full catalog tab
  const handleImportSelected = async () => {
    if (selectedIds.size === 0) return
    setImporting(true)
    try {
      const db = getDb()
      const itemsToImport = catalog.filter((item) => selectedIds.has(item.id))
      const idsNeedingImageSearch: string[] = []
      const chunkSize = 400
      let successCount = 0
      const now = Date.now()

      for (let i = 0; i < itemsToImport.length; i += chunkSize) {
        const chunk = itemsToImport.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach((item) => {
          const costInARS = item.currency === 'USD' ? item.price * globalDollarRate : item.price
          const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
          const costWithTax = costInARS * (1 + taxRate / 100)

          const syncedProd = syncedProducts.find((p) => p.externalId === item.id)
          const marginToUse = syncedProd ? (syncedProd.margin ?? globalMargin) : globalMargin
          const finalPrice = Math.round(costWithTax * (1 + marginToUse / 100))

          const guessedCat = guessGrupoNucleoCategory({
            name: item.name,
            brand: item.brand,
            model: item.model,
            linea: item.linea,
            supplierCategory: item.category,
            subCategory: item.subCategory,
          })

          const preImg = item.images?.[0]?.startsWith('https://') ? item.images[0] : ''
          const hasStock = item.stock > 0 && finalPrice > 0

          const productRef = doc(db, 'products', item.id)
          const updateData: Record<string, any> = {
            name: item.name,
            brand: item.brand || 'Genérico',
            model: item.partNumber || item.model || '',
            price: finalPrice,
            stock: item.stock,
            category: guessedCat,
            externalSource: 'grupo_nucleo',
            externalId: item.id,
            margin: marginToUse,
            costUsd: item.price,
            taxRate,
            lastExchangeRate: globalDollarRate,
            onDemand: true,
            updatedAt: now,
          }

          if (!syncedProd) {
            updateData.description = `Producto oficial distribuido por Grupo Núcleo. Código: ${item.id}.`
            if (preImg) {
              updateData.images = [preImg]
              updateData.imageVerified = true
              updateData.imageVerifiedAt = now
              updateData.isHidden = !hasStock
              updateData.hiddenReason = hasStock ? null : 'out_of_stock'
            } else {
              updateData.images = []
              updateData.imageVerified = false
              updateData.isHidden = true
              updateData.hiddenReason = hasStock ? 'pending_image' : 'out_of_stock'
              if (hasStock) idsNeedingImageSearch.push(item.id)
            }
          }

          batch.set(productRef, updateData, { merge: true })
        })

        await batch.commit()
        successCount += chunk.length
      }

      if (idsNeedingImageSearch.length > 0) {
        await ensureVerifiedImagesForIds(idsNeedingImageSearch)
      }

      setSelectedIds(new Set())
      await loadSyncedProducts()
      alert(`¡Se importaron ${successCount} productos con fotos verificadas!`)
    } catch (err: any) {
      alert(`Error al importar en lote: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Sincronización integral desde el Excel cargado (actualiza precios, stock MdP, oculta agotados y reactiva repuestos en stock)
  const handleBulkSyncAllLinked = async () => {
    if (catalog.length === 0 || syncedProducts.length === 0) return

    const confirmUpdate = window.confirm(
      `¿Querés sincronizar los ${syncedProducts.length} productos vinculados con este listado (Dólar $${globalDollarRate} ARS)? Se actualizarán precios, stock en Mar del Plata y visibilidad de agotados.`
    )
    if (!confirmUpdate) return

    setImporting(true)
    try {
      const db = getDb()
      const byId = new Map(catalog.map((i) => [i.id, i]))
      const now = Date.now()
      let inStockMdpCount = 0
      let priceUpdatedCount = 0
      let hiddenOutOfStockCount = 0
      let restoredInStockCount = 0
      const idsToVerifyImg: string[] = []

      const chunkSize = 380
      for (let i = 0; i < syncedProducts.length; i += chunkSize) {
        const chunk = syncedProducts.slice(i, i + chunkSize)
        const batch = writeBatch(db)

        chunk.forEach((prod) => {
          const item = byId.get(prod.externalId)
          const manuallyHidden = prod.isHidden === true && prod.hiddenReason === 'manual'
          const productRef = doc(db, 'products', prod.id)

          if (item) {
            const costInARS = item.currency === 'USD' ? item.price * globalDollarRate : item.price
            const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
            const marginToUse = prod.margin ?? globalMargin
            const finalPrice = Math.round(costInARS * (1 + taxRate / 100) * (1 + marginToUse / 100))

            if (finalPrice !== prod.price) priceUpdatedCount++

            if (item.stock > 0 && finalPrice > 0) {
              inStockMdpCount++
              const hasVerified = prod.imageVerified === true && !!prod.images?.[0]
              if (!hasVerified) idsToVerifyImg.push(prod.id)
              const shouldShow = hasVerified && !manuallyHidden
              if (prod.isHidden && shouldShow) restoredInStockCount++

              batch.update(productRef, {
                price: finalPrice,
                stock: item.stock,
                costUsd: item.price,
                taxRate,
                lastExchangeRate: globalDollarRate,
                isHidden: !shouldShow,
                hiddenReason: shouldShow ? null : manuallyHidden ? 'manual' : 'pending_image',
                lastSyncedAt: now,
                updatedAt: now,
              })
            } else {
              hiddenOutOfStockCount++
              batch.update(productRef, {
                ...(finalPrice > 0 ? { price: finalPrice } : {}),
                stock: 0,
                lastExchangeRate: globalDollarRate,
                isHidden: true,
                hiddenReason: manuallyHidden ? 'manual' : 'out_of_stock',
                lastSyncedAt: now,
                updatedAt: now,
              })
            }
          } else {
            hiddenOutOfStockCount++
            batch.update(productRef, {
              stock: 0,
              lastExchangeRate: globalDollarRate,
              isHidden: true,
              hiddenReason: manuallyHidden ? 'manual' : 'out_of_stock',
              lastSyncedAt: now,
              updatedAt: now,
            })
          }
        })

        await batch.commit()
      }

      if (idsToVerifyImg.length > 0) {
        await ensureVerifiedImagesForIds(idsToVerifyImg)
      }

      const newState: GrupoNucleoSyncState = {
        lastSyncAt: now,
        exchangeRate: globalDollarRate,
        sourceFileName: excelFileName || 'Catálogo Manual',
        totalCatalogItems: catalog.length,
        syncedTotal: syncedProducts.length,
        inStockMdpCount,
        priceUpdatedCount,
        hiddenOutOfStockCount,
        restoredInStockCount,
        recommendationsCount: recommendations.length,
      }

      await Promise.all([
        setDoc(doc(db, 'settings', 'grupo_nucleo_sync_state'), newState, { merge: true }),
        setDoc(
          doc(db, 'settings', 'grupo_nucleo_recommendations'),
          {
            generatedAt: now,
            exchangeRate: globalDollarRate,
            defaultMargin: globalMargin,
            sourceFileName: excelFileName || 'Catálogo Manual',
            items: recommendations,
          },
          { merge: true }
        ),
      ])

      setSyncState(newState)
      setExchangeRate(globalDollarRate)
      await loadSyncedProducts()
      alert(
        `Sincronización completa:\n• ${inStockMdpCount} con stock activo en MdP\n• ${priceUpdatedCount} precios actualizados\n• ${hiddenOutOfStockCount} pausados sin stock`
      )
    } catch (err: any) {
      alert(`Error al sincronizar: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleUpdateMargin = async () => {
    if (!editingProduct) return
    setSavingMargin(true)
    try {
      const db = getDb()
      const productRef = doc(db, 'products', editingProduct.id)
      const gnItem = catalog.find((i) => i.id === editingProduct.externalId)
      let finalPrice = editingProduct.price

      if (gnItem) {
        const costInARS = gnItem.currency === 'USD' ? gnItem.price * globalDollarRate : gnItem.price
        const taxRate = gnItem.tax !== undefined && gnItem.tax !== null ? gnItem.tax : globalIva
        finalPrice = Math.round(costInARS * (1 + taxRate / 100) * (1 + editMargin / 100))
      } else {
        const estimatedCost = editingProduct.price / (1 + editingProduct.margin / 100)
        finalPrice = Math.round(estimatedCost * (1 + editMargin / 100))
      }

      await updateDoc(productRef, {
        margin: editMargin,
        price: finalPrice,
        updatedAt: Date.now(),
      })

      setEditingProduct(null)
      loadSyncedProducts()
      alert('¡Margen de ganancia actualizado con éxito!')
    } catch (err: any) {
      alert(`Error al actualizar margen: ${err.message}`)
    } finally {
      setSavingMargin(false)
    }
  }

  const handleUnlinkProduct = async (product: SyncedProduct) => {
    if (!confirm(`¿Estás seguro que querés desvincular y eliminar permanentemente "${product.name}" de tu catálogo?`)) return
    try {
      await deleteDoc(doc(getDb(), 'products', product.id))
      loadSyncedProducts()
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`)
    }
  }

  const toggleSelectSyncedProduct = (id: string) => {
    setSelectedSyncedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllSynced = (filteredSynced: SyncedProduct[]) => {
    if (selectedSyncedIds.size === filteredSynced.length) {
      setSelectedSyncedIds(new Set())
    } else {
      setSelectedSyncedIds(new Set(filteredSynced.map((p) => p.id)))
    }
  }

  const handleBulkUnlinkProducts = async () => {
    if (selectedSyncedIds.size === 0) return
    if (!confirm(`¿Estás seguro que querés desvincular y eliminar permanentemente los ${selectedSyncedIds.size} productos seleccionados?`)) return
    setSavingBulkMargin(true)
    try {
      const db = getDb()
      const idsArray = Array.from(selectedSyncedIds)
      for (let i = 0; i < idsArray.length; i += 400) {
        const chunk = idsArray.slice(i, i + 400)
        const batch = writeBatch(db)
        chunk.forEach((id) => batch.delete(doc(db, 'products', id)))
        await batch.commit()
      }
      setSelectedSyncedIds(new Set())
      loadSyncedProducts()
      alert(`Se desvincularon y eliminaron ${idsArray.length} productos.`)
    } catch (err: any) {
      alert(`Error al eliminar en lote: ${err.message}`)
    } finally {
      setSavingBulkMargin(false)
    }
  }

  const handleBulkUpdateMargin = async (newMargin: number) => {
    if (selectedSyncedIds.size === 0) return
    setSavingBulkMargin(true)
    try {
      const db = getDb()
      const itemsToUpdate = syncedProducts.filter((p) => selectedSyncedIds.has(p.id))
      for (let i = 0; i < itemsToUpdate.length; i += 400) {
        const chunk = itemsToUpdate.slice(i, i + 400)
        const batch = writeBatch(db)
        chunk.forEach((prod) => {
          const gnItem = catalog.find((item) => item.id === prod.externalId)
          let finalPrice = prod.price
          if (gnItem) {
            const costInARS = gnItem.currency === 'USD' ? gnItem.price * globalDollarRate : gnItem.price
            const taxRate = gnItem.tax !== undefined && gnItem.tax !== null ? gnItem.tax : globalIva
            finalPrice = Math.round(costInARS * (1 + taxRate / 100) * (1 + newMargin / 100))
          } else {
            const estimatedCost = prod.price / (1 + prod.margin / 100)
            finalPrice = Math.round(estimatedCost * (1 + newMargin / 100))
          }
          batch.update(doc(db, 'products', prod.id), {
            margin: newMargin,
            price: finalPrice,
            updatedAt: Date.now(),
          })
        })
        await batch.commit()
      }
      setEditingBulkMargin(false)
      setSelectedSyncedIds(new Set())
      loadSyncedProducts()
      alert(`Se actualizó el margen comercial de ${itemsToUpdate.length} productos a +${newMargin}%.`)
    } catch (err: any) {
      alert(`Error al actualizar márgenes en lote: ${err.message}`)
    } finally {
      setSavingBulkMargin(false)
    }
  }

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectRec = (id: string) => {
    setSelectedRecIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllRecs = () => {
    if (selectedRecIds.size === filteredRecommendations.length) {
      setSelectedRecIds(new Set())
    } else {
      setSelectedRecIds(new Set(filteredRecommendations.map((r) => r.id)))
    }
  }

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    catalog.forEach((item) => {
      if (item.category) cats.add(item.category)
    })
    return Array.from(cats).sort()
  }, [catalog])

  const priceChangesCount = useMemo(() => {
    let count = 0
    catalog.forEach((item) => {
      const syncedProd = syncedProducts.find((p) => p.externalId === item.id)
      if (syncedProd) {
        const costInARS = item.currency === 'USD' ? item.price * globalDollarRate : item.price
        const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
        const marginToUse = syncedProd.margin ?? globalMargin
        const calculatedPrice = Math.round(costInARS * (1 + taxRate / 100) * (1 + marginToUse / 100))
        if (calculatedPrice !== syncedProd.price || item.stock !== syncedProd.stock) {
          count++
        }
      }
    })
    return count
  }, [catalog, syncedProducts, globalDollarRate, globalIva, globalMargin])

  const processedCatalog = useMemo(() => {
    const filtered = catalog.filter((item) => {
      const queryStr = searchQuery.toLowerCase()
      const matchesSearch =
        item.name.toLowerCase().includes(queryStr) ||
        item.id.toLowerCase().includes(queryStr) ||
        item.brand.toLowerCase().includes(queryStr)
      if (!matchesSearch) return false
      if (onlyWithStock && item.stock <= 0) return false
      if (selectedCategoryFilter && item.category !== selectedCategoryFilter) return false

      if (onlyWithPriceChanges) {
        const syncedProd = syncedProducts.find((p) => p.externalId === item.id)
        if (!syncedProd) return false
        const costInARS = item.currency === 'USD' ? item.price * globalDollarRate : item.price
        const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
        const marginToUse = syncedProd.margin ?? globalMargin
        const calculatedPrice = Math.round(costInARS * (1 + taxRate / 100) * (1 + marginToUse / 100))
        if (calculatedPrice === syncedProd.price && item.stock === syncedProd.stock) return false
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
      } else if (sortBy === 'price_asc') return a.price - b.price
      else if (sortBy === 'price_desc') return b.price - a.price
      else if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      return 0
    })

    return filtered
  }, [catalog, searchQuery, onlyWithStock, onlyWithPriceChanges, selectedCategoryFilter, sortBy, syncedProducts, globalDollarRate, globalIva, globalMargin])

  const toggleSelectAll = () => {
    if (selectedIds.size === processedCatalog.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedCatalog.map((item) => item.id)))
    }
  }

  const visibleCatalog = useMemo(() => processedCatalog.slice(0, displayLimit), [processedCatalog, displayLimit])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integración Grupo Núcleo</h1>
          <p className="mt-2 text-pclink-muted text-sm max-w-2xl">
            Actualización semanal automática de precios y stock en Mar del Plata todos los lunes, más selección inteligente de productos recomendados listos para sumar a tu catálogo en 1 clic.
          </p>
        </div>
        {exchangeRate && (
          <div className="rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/10 px-4 py-2.5 text-xs font-mono text-pclink-cyan-light shrink-0">
            Dólar GN: <strong>${exchangeRate.toLocaleString('es-AR')} ARS</strong>
          </div>
        )}
      </div>

      {/* Estado de la última sincronización */}
      {syncState && (
        <div className="glass-panel p-4 border border-pclink-cyan/20 bg-pclink-cyan/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-pclink-cyan/15 border border-pclink-cyan/30 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-pclink-cyan" />
            </div>
            <div>
              <p className="font-bold text-white">
                Última actualización de Grupo Núcleo:{' '}
                <span className="text-pclink-cyan-light">
                  {new Date(syncState.lastSyncAt).toLocaleString('es-AR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </p>
              <p className="text-pclink-muted mt-0.5">
                Fuente: <span className="font-mono text-white/80">{syncState.sourceFileName || 'Listado.xlsx'}</span> • {syncState.totalCatalogItems} ítems analizados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold">
              {activeSyncedCount} con stock MdP
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold">
              {syncedProducts.length - activeSyncedCount} pausados s/stock
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-pclink-cyan/15 border border-pclink-cyan/30 text-pclink-cyan-light font-semibold">
              {pendingRecommendations.length} recomendados nuevos
            </span>
          </div>
        </div>
      )}

      {importStatusMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-pclink-cyan/40 bg-pclink-cyan/10 p-4 text-xs font-semibold text-pclink-cyan-light">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{importStatusMsg}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto border-b border-pclink-border/40 gap-2">
        <button
          onClick={() => setActiveTab('recommended')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'recommended'
              ? 'border-pclink-cyan text-white bg-pclink-cyan/5'
              : 'border-transparent text-pclink-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-pclink-cyan" />
            Recomendados ({pendingRecommendations.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('synced')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
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
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'catalog'
              ? 'border-pclink-cyan text-white bg-pclink-cyan/5'
              : 'border-transparent text-pclink-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Database className="h-4 w-4" />
            Catálogo Completo Excel ({processedCatalog.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'config'
              ? 'border-pclink-cyan text-white bg-pclink-cyan/5'
              : 'border-transparent text-pclink-muted hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            Credenciales API
          </div>
        </button>
      </div>

      {/* TAB 1: RECOMENDADOS DE LA SEMANA */}
      {activeTab === 'recommended' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-panel p-4 flex flex-col gap-4 lg:flex-row lg:items-end justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                  Buscar entre recomendados
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
                  <input
                    type="search"
                    placeholder="Marca, modelo, procesador, monitor..."
                    value={recSearchQuery}
                    onChange={(e) => setRecSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-pclink-subtle focus:outline-none focus:border-pclink-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                  Categoría PC Link
                </label>
                <select
                  value={recCategoryFilter}
                  onChange={(e) => setRecCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                >
                  <option value="">Todas ({pendingRecommendations.length})</option>
                  {recCategories.map(([catId, label]) => (
                    <option key={catId} value={catId}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                    Dólar GN
                  </label>
                  <input
                    type="number"
                    value={globalDollarRate}
                    onChange={(e) => setGlobalDollarRate(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                    Margen %
                  </label>
                  <input
                    type="number"
                    value={globalMargin}
                    onChange={(e) => setGlobalMargin(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan font-mono"
                  />
                </div>
              </div>
            </div>

            {selectedRecIds.size > 0 && (
              <motion.button
                onClick={() =>
                  handleImportRecommendations(
                    filteredRecommendations.filter((r) => selectedRecIds.has(r.id))
                  )
                }
                disabled={importing}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] disabled:opacity-50 cursor-pointer shrink-0"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Import className="h-4 w-4" />
                    Importar Seleccionados ({selectedRecIds.size})
                  </>
                )}
              </motion.button>
            )}
          </div>

          {loadingRecs ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              Cargando productos recomendados de la semana...
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="glass-panel py-16 text-center text-pclink-muted space-y-2">
              <p className="font-semibold text-white">No hay recomendados pendientes con ese filtro.</p>
              <p className="text-xs">
                Todos los lunes se renueva automáticamente la selección según el stock de Grupo Núcleo Mar del Plata y los huecos de tu catálogo.
              </p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="px-6 py-3 border-b border-pclink-border/50 bg-pclink-elevated/20 flex flex-wrap items-center justify-between gap-2 text-xs text-pclink-muted">
                <span>
                  Selección curada con <strong>stock inmediato en Mar del Plata</strong> y <strong>foto verificada</strong> lista para publicar.
                </span>
                {recGeneratedAt && (
                  <span>
                    Generado: {new Date(recGeneratedAt).toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted bg-pclink-elevated/15">
                      <th className="px-4 py-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredRecommendations.length > 0 &&
                            selectedRecIds.size === filteredRecommendations.length
                          }
                          onChange={toggleSelectAllRecs}
                          className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                        />
                      </th>
                      <th className="px-5 py-4 font-semibold">Producto Recomendado</th>
                      <th className="px-4 py-4 font-semibold">Motivo / Oportunidad</th>
                      <th className="px-4 py-4 font-semibold">Costo Neto</th>
                      <th className="px-4 py-4 font-semibold">Venta Sugerida (+{globalMargin}%)</th>
                      <th className="px-4 py-4 font-semibold text-center">Stock MdP</th>
                      <th className="px-5 py-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecommendations.map((rec) => {
                      const isSelected = selectedRecIds.has(rec.id)
                      const costArs = rec.currency === 'USD' ? rec.costUsd * globalDollarRate : rec.costUsd
                      const liveSalePrice = Math.round(costArs * (1 + rec.tax / 100) * (1 + globalMargin / 100))

                      return (
                        <tr
                          key={rec.id}
                          className={`border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0 ${
                            isSelected ? 'bg-pclink-cyan/5' : ''
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRec(rec.id)}
                              className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-xl border border-pclink-border bg-white p-1 flex items-center justify-center shrink-0">
                                {rec.previewImage ? (
                                  <img src={rec.previewImage} alt={rec.name} className="h-full w-full object-contain" />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div
                                  onClick={() => handleCopyName(rec.id, rec.name)}
                                  title="Clic para copiar nombre"
                                  className="group flex items-center gap-1.5 cursor-pointer"
                                >
                                  <p className="font-bold text-white group-hover:text-pclink-cyan transition-colors line-clamp-1">
                                    {rec.name}
                                  </p>
                                  {copiedId === rec.id && (
                                    <span className="text-[10px] font-bold text-emerald-400 shrink-0">¡Copiado!</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="text-[10px] text-pclink-cyan-light font-mono">GN #{rec.id}</span>
                                  <span className="text-[10px] bg-pclink-elevated px-1.5 py-0.5 rounded text-pclink-muted font-semibold">
                                    {rec.brand}
                                  </span>
                                  <span className="text-[10px] bg-pclink-cyan/15 px-1.5 py-0.5 rounded text-pclink-cyan-light border border-pclink-cyan/25 font-semibold">
                                    {rec.categoryLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[230px]">
                              {rec.reasons.map((reason, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-mono text-white text-xs">
                            u$s {rec.costUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="block text-[10px] text-pclink-muted font-sans">+ IVA {rec.tax}%</span>
                          </td>
                          <td className="px-4 py-4 font-mono text-pclink-cyan-light font-bold">
                            ${liveSalePrice.toLocaleString('es-AR')}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-xs">
                              {rec.stockMdp}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedItem({
                                    id: rec.id,
                                    partNumber: rec.partNumber,
                                    name: rec.name,
                                    price: rec.costUsd,
                                    stock: rec.stockMdp,
                                    images: rec.previewImage ? [rec.previewImage] : [],
                                    brand: rec.brand,
                                    model: rec.partNumber || '',
                                    linea: rec.linea,
                                    category: rec.supplierCategory,
                                    subCategory: rec.subCategory,
                                    tax: rec.tax,
                                    currency: rec.currency,
                                  })
                                }
                                title="Personalizar margen antes de importar"
                                className="p-2 rounded-xl border border-pclink-border text-pclink-muted hover:text-white hover:border-pclink-cyan/40 cursor-pointer"
                              >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                              </button>
                              <motion.button
                                type="button"
                                disabled={importing}
                                onClick={() => handleImportRecommendations([rec])}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-pclink-cyan/15 border border-pclink-cyan/40 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-pclink-cyan/30 disabled:opacity-50 cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Import className="h-3.5 w-3.5 text-pclink-cyan" />
                                Importar
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
        </motion.div>
      )}

      {/* TAB 2: CONFIG CREDENTIALS */}
      {activeTab === 'config' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 max-w-xl space-y-6"
        >
          <div className="flex items-center gap-2 text-sm text-pclink-cyan-light font-bold uppercase tracking-wider">
            <Key className="h-4 w-4" />
            Credenciales API Directa (Opcional)
          </div>
          <p className="text-xs text-pclink-muted leading-relaxed">
            Actualmente la tienda se actualiza todos los lunes vía correo + <code className="text-white">Listado.xlsx</code>. Si en el futuro Grupo Núcleo aprueba tus credenciales API, podés cargarlas acá para sumar sincronización directa en la nube.
          </p>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                ID de Cliente (AFIP/Distribuidor)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Ej: 12345"
                required
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white placeholder:text-pclink-subtle focus:border-pclink-cyan/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                Usuario de API
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario registrado"
                required
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white placeholder:text-pclink-subtle focus:border-pclink-cyan/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                Contraseña de API
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-4 py-2.5 text-sm text-white placeholder:text-pclink-subtle focus:border-pclink-cyan/60 focus:outline-none"
              />
            </div>

            {credsStatus && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium border ${
                  credsStatus.success
                    ? 'bg-pclink-success/10 border-pclink-success/30 text-emerald-200'
                    : 'bg-pclink-error/10 border-pclink-error/30 text-red-200'
                }`}
              >
                {credsStatus.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {credsStatus.msg}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={savingCreds}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2.5 text-xs font-bold text-pclink-bg shadow-[0_0_20px_rgba(0,188,212,0.2)] disabled:opacity-50 cursor-pointer"
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

      {/* TAB 3: BROWSE FULL EXCEL / API CATALOG */}
      {activeTab === 'catalog' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-pclink-muted uppercase tracking-wider">Cargar Catálogo Manual:</span>
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

          {loadMethod === 'api' ? (
            <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
                <input
                  type="search"
                  placeholder="Buscar en el catálogo de la API del distribuidor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
                />
              </div>

              <motion.button
                type="button"
                disabled={loadingCatalog}
                onClick={handleLoadCatalog}
                className="flex items-center gap-2 rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 px-5 py-2 text-xs font-bold text-pclink-cyan-light hover:bg-pclink-cyan/15 disabled:opacity-50 cursor-pointer"
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-pclink-cyan/35 bg-pclink-cyan/5 px-5 py-2 text-xs font-bold text-pclink-cyan-light cursor-pointer hover:bg-pclink-cyan/15 transition-all">
                  <Upload className="h-4 w-4 text-pclink-cyan" />
                  Cargar Listado.xlsx
                  <input type="file" accept=".xlsx" onChange={handleExcelUpload} className="hidden" />
                </label>
                {excelFileName && (
                  <span className="text-xs text-pclink-muted font-mono truncate max-w-[200px]" title={excelFileName}>
                    {excelFileName}
                  </span>
                )}
              </div>
            </div>
          )}

          {catalog.length > 0 && (
            <div className="glass-panel p-4 flex flex-col gap-4 md:flex-row md:items-end justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-lg">
                <div>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                    Valor del Dólar GN (ARS)
                  </label>
                  <input
                    type="number"
                    value={globalDollarRate}
                    onChange={(e) => setGlobalDollarRate(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1.5 uppercase tracking-wide">
                    Margen Comercial (%)
                  </label>
                  <input
                    type="number"
                    value={globalMargin}
                    onChange={(e) => setGlobalMargin(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBulkSyncAllLinked}
                  disabled={importing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-pclink-cyan/15 border border-pclink-cyan/40 px-4 py-2.5 text-xs font-bold text-white hover:bg-pclink-cyan/25 transition cursor-pointer disabled:opacity-50"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-pclink-cyan" />}
                  Sincronizar los {syncedProducts.length} Vinculados
                </button>

                {selectedIds.size > 0 && (
                  <motion.button
                    onClick={handleImportSelected}
                    disabled={importing}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Import className="h-4 w-4 text-white" />
                    Importar Seleccionados ({selectedIds.size})
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {catalog.length > 0 && (
            <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between text-xs">
              <div className="flex flex-wrap gap-4 items-center flex-1">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-pclink-muted uppercase tracking-wider">Filtrar por Categoría</span>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-lg border border-pclink-border bg-pclink-bg/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan max-w-[220px]"
                  >
                    <option value="">Todas las categorías ({uniqueCategories.length})</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-pclink-muted uppercase tracking-wider">Ordenar por</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-lg border border-pclink-border bg-pclink-bg/50 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  >
                    <option value="category">Categoría (A-Z)</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                    <option value="name_asc">Nombre: A-Z</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-pclink-muted hover:text-white mt-5 select-none">
                  <input
                    type="checkbox"
                    checked={onlyWithStock}
                    onChange={(e) => setOnlyWithStock(e.target.checked)}
                    className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan h-4 w-4 cursor-pointer"
                  />
                  <span>Sólo con Stock en MDP</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-pclink-muted hover:text-white mt-5 select-none">
                  <input
                    type="checkbox"
                    checked={onlyWithPriceChanges}
                    onChange={(e) => setOnlyWithPriceChanges(e.target.checked)}
                    className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan h-4 w-4 cursor-pointer"
                  />
                  <span>Sólo con Cambios ({priceChangesCount})</span>
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

          {loadingCatalog ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              Procesando archivo y actualizando recomendaciones...
            </div>
          ) : catalog.length === 0 ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              Subí manualmente un archivo <code className="text-white">Listado.xlsx</code> si querés explorar el listado completo fuera de los lunes automáticos.
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
                        <th className="px-6 py-4 font-semibold">Precio Sugerido</th>
                        <th className="px-6 py-4 font-semibold text-center">Stock MDP</th>
                        <th className="px-6 py-4 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCatalog.map((item) => {
                        const syncedProd = syncedProducts.find((p) => p.externalId === item.id)
                        const synced = !!syncedProd
                        const isSelected = selectedIds.has(item.id)

                        const costInARS = item.currency === 'USD' ? item.price * globalDollarRate : item.price
                        const taxRate = item.tax !== undefined && item.tax !== null ? item.tax : globalIva
                        const marginToUse = syncedProd ? (syncedProd.margin ?? globalMargin) : globalMargin
                        const salePrice = Math.round(costInARS * (1 + taxRate / 100) * (1 + marginToUse / 100))
                        const hasPriceChange = syncedProd && syncedProd.price !== salePrice

                        return (
                          <tr
                            key={item.id}
                            className={`border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0 ${
                              isSelected ? 'bg-pclink-cyan/5' : ''
                            }`}
                          >
                            <td className="px-4 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectProduct(item.id)}
                                className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div
                                  onClick={() => handleCopyName(item.id, item.name)}
                                  className="group flex items-center gap-1.5 cursor-pointer"
                                >
                                  <p className="font-bold text-white group-hover:text-pclink-cyan transition-colors line-clamp-1">
                                    {item.name}
                                  </p>
                                  {copiedId === item.id && (
                                    <span className="text-[10px] font-bold text-emerald-400">¡Copiado!</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-pclink-cyan-light font-mono">ID: {item.id}</span>
                                  {item.brand && (
                                    <span className="text-[9px] bg-pclink-elevated px-1.5 py-0.2 rounded text-pclink-muted font-semibold">
                                      {item.brand}
                                    </span>
                                  )}
                                  {item.category && (
                                    <span className="text-[9px] bg-pclink-cyan/15 px-1.5 py-0.2 rounded text-pclink-cyan-light border border-pclink-cyan/25 font-semibold">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-white">
                              {item.currency === 'USD' ? `u$s ${item.price.toLocaleString('en-US')}` : `$${item.price.toLocaleString('es-AR')}`}
                              <span className="block text-[10px] text-pclink-muted font-sans">IVA: {item.tax}%</span>
                            </td>
                            <td className="px-6 py-4 font-mono text-pclink-cyan-light font-bold">
                              <span>${salePrice.toLocaleString('es-AR')}</span>
                              {hasPriceChange && syncedProd && (
                                <span className="block text-[10px] line-through text-pclink-muted">
                                  ${syncedProd.price.toLocaleString('es-AR')}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-semibold ${item.stock > 0 ? 'text-white' : 'text-pclink-error'}`}>
                                {item.stock}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {synced ? (
                                hasPriceChange ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedItem(item)}
                                    className="inline-flex items-center gap-1 rounded-xl bg-pclink-warning/10 border border-pclink-warning/35 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-pclink-warning/25 cursor-pointer"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 text-pclink-warning" />
                                    Actualizar
                                  </button>
                                ) : (
                                  <span className="inline-flex rounded-full bg-pclink-success/15 px-3.5 py-1.5 text-[10px] font-bold text-pclink-success border border-pclink-success/20">
                                    Sincronizado
                                  </span>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedItem(item)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-pclink-cyan/10 border border-pclink-cyan/35 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-pclink-cyan/25 cursor-pointer"
                                >
                                  <Import className="h-3.5 w-3.5 text-pclink-cyan" />
                                  Importar
                                </button>
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
                  <button
                    type="button"
                    onClick={() => setDisplayLimit((prev) => prev + 20)}
                    className="flex items-center gap-2 rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/5 px-6 py-3 text-xs font-bold text-pclink-cyan-light hover:bg-pclink-cyan/15 cursor-pointer"
                  >
                    Ver más productos (Mostrando {displayLimit} de {processedCatalog.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 4: LIST SYNCED PRODUCTS */}
      {activeTab === 'synced' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {loadingSynced ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              Cargando productos sincronizados desde la base de datos...
            </div>
          ) : syncedProducts.length === 0 ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              No tenés ningún producto vinculado con Grupo Núcleo por el momento.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
                  <input
                    type="search"
                    placeholder="Buscar en productos sincronizados..."
                    value={syncedSearchQuery}
                    onChange={(e) => setSyncedSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-pclink-border bg-pclink-bg/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-pclink-subtle focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {(['all', 'active', 'paused'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSyncedStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
                        syncedStatusFilter === st
                          ? 'bg-pclink-cyan text-pclink-bg'
                          : 'bg-pclink-elevated/40 text-pclink-muted hover:text-white'
                      }`}
                    >
                      {st === 'all'
                        ? `Todos (${syncedProducts.length})`
                        : st === 'active'
                          ? `En Stock Web (${activeSyncedCount})`
                          : `Pausados s/Stock (${syncedProducts.length - activeSyncedCount})`}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSyncedIds.size > 0 && (
                <div className="glass-panel p-4 bg-pclink-cyan/5 border border-pclink-cyan/20 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                  <span className="text-xs font-bold text-pclink-cyan-light uppercase tracking-wider">
                    Seleccionados: {selectedSyncedIds.size}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBulkMargin(true)
                        setBulkMarginValue(30)
                      }}
                      disabled={savingBulkMargin}
                      className="flex items-center gap-1.5 rounded-xl border border-pclink-cyan/30 bg-pclink-cyan/10 px-4 py-2 text-xs font-bold text-pclink-cyan hover:bg-pclink-cyan/20 cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar Margen en Lote
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkUnlinkProducts}
                      disabled={savingBulkMargin}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Desvincular y Eliminar
                    </button>
                  </div>
                </div>
              )}

              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted bg-pclink-elevated/15">
                        <th className="px-4 py-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredSyncedProducts.length > 0 &&
                              selectedSyncedIds.size === filteredSyncedProducts.length
                            }
                            onChange={() => toggleSelectAllSynced(filteredSyncedProducts)}
                            className="rounded border-pclink-border bg-pclink-bg/50 checked:bg-pclink-cyan accent-pclink-cyan cursor-pointer h-4 w-4"
                          />
                        </th>
                        <th className="px-6 py-4 font-semibold">Producto en Tienda</th>
                        <th className="px-4 py-4 font-semibold">Estado Web</th>
                        <th className="px-4 py-4 font-semibold">Margen</th>
                        <th className="px-4 py-4 font-semibold">Precio Final</th>
                        <th className="px-4 py-4 font-semibold text-center">Stock MdP</th>
                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSyncedProducts.map((prod) => {
                        const isSelected = selectedSyncedIds.has(prod.id)
                        const isLive = !prod.isHidden && prod.stock > 0
                        return (
                          <tr
                            key={prod.id}
                            className={`border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0 ${
                              isSelected ? 'bg-pclink-cyan/5' : ''
                            }`}
                          >
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
                                <div className="h-10 w-10 overflow-hidden rounded-lg border border-pclink-border bg-white p-0.5 flex items-center justify-center shrink-0">
                                  {prod.images?.[0] ? (
                                    <img src={prod.images[0]} className="h-full w-full object-contain" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <div
                                    onClick={() => handleCopyName(prod.id, prod.name)}
                                    className="group flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <p className="font-bold text-white group-hover:text-pclink-cyan transition-colors line-clamp-1">
                                      {prod.name}
                                    </p>
                                    {copiedId === prod.id && (
                                      <span className="text-[10px] font-bold text-emerald-400">
                                        <Check className="inline h-3 w-3" /> ¡Copiado!
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-pclink-cyan-light font-mono">GN: {prod.externalId}</span>
                                    <span className="text-[9px] bg-pclink-cyan/15 px-1.5 py-0.2 rounded text-pclink-cyan-light border border-pclink-cyan/20">
                                      {CATEGORY_LABELS[prod.category as keyof typeof CATEGORY_LABELS] || prod.category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {isLive ? (
                                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                  Visible
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                  Pausado s/stock
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 font-mono text-emerald-400 font-bold">+{prod.margin}%</td>
                            <td className="px-4 py-4 font-mono text-white">${prod.price.toLocaleString('es-AR')}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`font-semibold ${prod.stock > 0 ? 'text-white' : 'text-pclink-error'}`}>
                                {prod.stock}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(prod)
                                    setEditMargin(prod.margin)
                                  }}
                                  className="p-2 rounded-lg bg-pclink-cyan/10 text-pclink-cyan hover:bg-pclink-cyan/20 cursor-pointer"
                                  title="Editar Margen"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUnlinkProduct(prod)}
                                  className="p-2 rounded-lg bg-pclink-error/10 text-pclink-error hover:bg-pclink-error/20 cursor-pointer"
                                  title="Desvincular y Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* IMPORT DIALOG MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-bg/95 p-6 shadow-2xl backdrop-blur-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-base font-bold text-white leading-normal">Importar Producto a PClink</h3>
              <p className="text-xs text-pclink-muted leading-relaxed">
                Estás a punto de importar <strong className="text-white">"{selectedItem.name}"</strong> con verificación automática de imagen:
              </p>

              <div className="grid grid-cols-2 gap-3 bg-pclink-elevated/20 p-3 rounded-xl border border-pclink-border/50">
                {selectedItem.currency === 'USD' && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-pclink-muted mb-1 uppercase tracking-wide">
                      Valor del Dólar
                    </label>
                    <input
                      type="number"
                      value={itemDollarRate}
                      onChange={(e) => setItemDollarRate(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-pclink-border bg-pclink-bg/50 px-2 py-1 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                    />
                  </div>
                )}
                <div className={selectedItem.currency === 'USD' ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
                  <label className="block text-[10px] font-bold text-pclink-muted mb-1 uppercase tracking-wide">
                    IVA / Impuesto (%)
                  </label>
                  <input
                    type="number"
                    value={itemIva}
                    onChange={(e) => setItemIva(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-pclink-border bg-pclink-bg/50 px-2 py-1 text-xs text-white focus:outline-none focus:border-pclink-cyan"
                  />
                </div>
              </div>

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
                <div className="flex justify-between border-t border-pclink-border/50 pt-1.5 mt-1.5 font-semibold">
                  <span className="text-pclink-cyan-light">Costo Final c/IVA:</span>
                  <span className="font-mono text-white">
                    $
                    {Math.round(
                      (selectedItem.currency === 'USD' ? selectedItem.price * itemDollarRate : selectedItem.price) *
                        (1 + itemIva / 100)
                    ).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

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
                  onChange={(e) => setItemMargin(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-pclink-border rounded-lg appearance-none cursor-pointer accent-pclink-cyan"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-pclink-cyan/5 border border-pclink-cyan/20 p-4">
                <span className="text-xs font-bold text-pclink-cyan-light uppercase tracking-wider">Precio Sugerido Venta:</span>
                <span className="font-mono text-lg font-bold text-white">
                  $
                  {Math.round(
                    (selectedItem.currency === 'USD' ? selectedItem.price * itemDollarRate : selectedItem.price) *
                      (1 + itemIva / 100) *
                      (1 + itemMargin / 100)
                  ).toLocaleString('es-AR')}
                </span>
              </div>

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
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
                  Confirmar Importación
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
              <h3 className="text-base font-bold text-white">Editar Margen de Ganancia</h3>
              <p className="text-xs text-pclink-muted">
                Modificá el porcentaje de recargo comercial para <strong className="text-white">"{editingProduct.name}"</strong>:
              </p>
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
                  onChange={(e) => setEditMargin(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-pclink-border rounded-lg appearance-none cursor-pointer accent-pclink-cyan"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateMargin}
                  disabled={savingMargin}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2 text-xs font-bold text-pclink-bg disabled:opacity-50 cursor-pointer"
                >
                  {savingMargin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Margen
                </button>
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
              <h3 className="text-base font-bold text-white">Editar Margen Comercial en Lote</h3>
              <p className="text-xs text-pclink-muted">
                Modificar porcentaje para los <strong className="text-white">{selectedSyncedIds.size}</strong> productos seleccionados:
              </p>
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
                  onChange={(e) => setBulkMarginValue(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-pclink-border rounded-lg appearance-none cursor-pointer accent-pclink-cyan"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBulkMargin(false)}
                  className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateMargin(bulkMarginValue)}
                  disabled={savingBulkMargin}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2 text-xs font-bold text-pclink-bg disabled:opacity-50 cursor-pointer"
                >
                  {savingBulkMargin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Cambios ({selectedSyncedIds.size})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
