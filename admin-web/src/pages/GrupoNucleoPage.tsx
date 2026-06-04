import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, Loader2, Save, Search, Import, Tag, AlertCircle, 
  CheckCircle2, RefreshCw, Key, Image as ImageIcon, Settings, Trash2, Edit2
} from 'lucide-react'
import { getDb, getFunctionsInstance } from '../lib/firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'
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
  const [importMargin, setImportMargin] = useState(20)
  const [importing, setImporting] = useState(false)

  // Edit Margin Modal State
  const [editingProduct, setEditingProduct] = useState<SyncedProduct | null>(null)
  const [editMargin, setEditMargin] = useState(20)
  const [savingMargin, setSavingMargin] = useState(false)

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
    try {
      const getCatalogFunc = httpsCallable<{ }, { success: boolean; catalog?: GrupoNucleoItem[]; exchangeRate?: number; message?: string }>(
        getFunctionsInstance(), 
        'getGrupoNucleoCatalog'
      )
      const result = await getCatalogFunc()
      
      if (result.data?.success && result.data.catalog) {
        setCatalog(result.data.catalog)
        setExchangeRate(result.data.exchangeRate || 1000)
      } else {
        setCatalogError(result.data?.message || 'Error desconocido al consultar el catálogo.')
      }
    } catch (err: any) {
      setCatalogError(err.message || 'Error de conexión con el servidor. Verificá tu login y credenciales.')
    } finally {
      setLoadingCatalog(false)
    }
  }

  // Import product into PClink catalog
  const handleImportProduct = async () => {
    if (!selectedItem) return
    setImporting(true)
    try {
      const db = getDb()
      const rate = exchangeRate || 1000
      
      // Calculate final pricing in ARS: (costNet * exchange * tax) * (1 + margin)
      const costInARS = selectedItem.currency === 'USD' ? (selectedItem.price * rate) : selectedItem.price
      const taxMultiplier = 1 + (selectedItem.tax / 100)
      const costWithTax = costInARS * taxMultiplier
      const finalPrice = Math.round(costWithTax * (1 + importMargin / 100))

      // Auto guess category using name, brand, model
      const guessedCat = guessCategory(selectedItem.name, selectedItem.brand, selectedItem.model)

      // Create new doc in products collection
      const productRef = doc(db, 'products', selectedItem.id)
      await setDoc(productRef, {
        name: selectedItem.name,
        brand: selectedItem.brand,
        model: selectedItem.model,
        price: finalPrice,
        stock: selectedItem.stock,
        images: selectedItem.images.length > 0 ? selectedItem.images : [''],
        category: guessedCat,
        description: `Producto importado de Grupo Núcleo. Cód: ${selectedItem.id}.`,
        externalSource: 'grupo_nucleo',
        externalId: selectedItem.id,
        margin: importMargin,
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
      
      if (gnItem && exchangeRate) {
        const costInARS = gnItem.currency === 'USD' ? (gnItem.price * exchangeRate) : gnItem.price
        const taxMultiplier = 1 + (gnItem.tax / 100)
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

  // Filtering GN catalog client side
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const queryStr = searchQuery.toLowerCase()
      const matchesSearch = 
        item.name.toLowerCase().includes(queryStr) || 
        item.id.toLowerCase().includes(queryStr) ||
        item.brand.toLowerCase().includes(queryStr)
      return matchesSearch
    })
  }, [catalog, searchQuery])

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
            Catálogo del Distribuidor ({filteredCatalog.length})
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
          {/* Catalog Controls */}
          <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pclink-muted" />
              <input
                type="search"
                placeholder="Buscar en el catálogo del distribuidor..."
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

          {catalogError && (
            <div className="flex gap-3 rounded-xl border border-pclink-error/40 bg-pclink-error/10 p-4 text-sm text-red-100">
              <AlertCircle className="h-5 w-5 shrink-0 text-pclink-error" />
              {catalogError}
            </div>
          )}

          {/* Catalog Grid */}
          {loadingCatalog ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              Consultando la API de Grupo Núcleo y parseando el inventario...
            </div>
          ) : catalog.length === 0 ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              El catálogo está vacío. Presioná "Consultar API" para cargar los productos del distribuidor.
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="glass-panel py-20 text-center text-pclink-muted">
              No se encontraron coincidencias para tu búsqueda.
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted bg-pclink-elevated/15">
                      <th className="px-6 py-4 font-semibold">Producto</th>
                      <th className="px-6 py-4 font-semibold">Costo Distribuidor</th>
                      <th className="px-6 py-4 font-semibold text-center">Stock GN</th>
                      <th className="px-6 py-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.map(item => {
                      const synced = isAlreadySynced(item.id)
                      return (
                        <tr key={item.id} className="border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0">
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
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-white">
                            {item.currency === 'USD' ? `u$s ${item.price.toLocaleString('en-US')}` : `$${item.price.toLocaleString('es-AR')}`}
                            <span className="block text-[10px] text-pclink-muted">IVA: {item.tax}%</span>
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
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-pclink-border/60 text-xs uppercase tracking-wider text-pclink-muted bg-pclink-elevated/15">
                      <th className="px-6 py-4 font-semibold">Producto en App</th>
                      <th className="px-6 py-4 font-semibold">Margen</th>
                      <th className="px-6 py-4 font-semibold">Precio App (Final)</th>
                      <th className="px-6 py-4 font-semibold text-center">Stock Activo</th>
                      <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncedProducts.map(prod => (
                      <tr key={prod.id} className="border-b border-pclink-border/40 hover:bg-pclink-cyan/5 last:border-0">
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
                    ))}
                  </tbody>
                </table>
              </div>
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
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-pclink-border bg-pclink-bg/95 p-6 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <h3 className="text-base font-bold text-white leading-normal">Importar Producto a PClink</h3>
              <p className="text-xs text-pclink-muted leading-relaxed">
                Estás a punto de importar <strong className="text-white">"{selectedItem.name}"</strong>. Definí el margen de recargo comercial que querés sumarle al costo bruto de Grupo Núcleo:
              </p>

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
                  <span className="font-mono text-white">+{selectedItem.tax}%</span>
                </div>
                {selectedItem.currency === 'USD' && exchangeRate && (
                  <div className="flex justify-between border-t border-pclink-border/50 pt-1.5 mt-1.5">
                    <span className="text-pclink-muted">Costo en Pesos (Dólar oficial GN):</span>
                    <span className="font-mono text-white">${(selectedItem.price * exchangeRate).toLocaleString('es-AR')} ARS</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-pclink-border/50 pt-1.5 mt-1.5 font-semibold">
                  <span className="text-pclink-cyan-light">Costo Final c/IVA:</span>
                  <span className="font-mono text-white">
                    ${(
                      (selectedItem.currency === 'USD' ? selectedItem.price * (exchangeRate || 1000) : selectedItem.price) * 
                      (1 + selectedItem.tax / 100)
                    ).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Margin Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-pclink-muted">
                  <span>Margen de Ganancia:</span>
                  <span className="text-emerald-400 font-mono text-sm font-bold">+{importMargin}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={importMargin}
                  onChange={e => setImportMargin(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-pclink-border rounded-lg appearance-none cursor-pointer accent-pclink-cyan"
                />
              </div>

              {/* Estimate Sale Price */}
              <div className="flex items-center justify-between rounded-xl bg-pclink-cyan/5 border border-pclink-cyan/20 p-4">
                <span className="text-xs font-bold text-pclink-cyan-light uppercase tracking-wider">Precio Sugerido Venta:</span>
                <span className="font-mono text-lg font-bold text-white">
                  ${Math.round(
                    (selectedItem.currency === 'USD' ? selectedItem.price * (exchangeRate || 1000) : selectedItem.price) * 
                    (1 + selectedItem.tax / 100) * 
                    (1 + importMargin / 100)
                  ).toLocaleString('es-AR')}
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold text-pclink-muted hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  onClick={handleImportProduct}
                  disabled={importing}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-5 py-2 text-xs font-bold text-pclink-bg disabled:opacity-50 cursor-pointer"
                  whileTap={{ scale: !importing ? 0.99 : 1 }}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Import className="h-4 w-4" />
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
    </div>
  )
}
