import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Search, Image as ImageIcon, Loader2, ExternalLink, Tag, Flame, Star, Target, Sparkles, Heart, Wand2 } from 'lucide-react'
import { getDb, getStorageBucket, getFunctionsInstance } from '../lib/firebase'
import { uploadProductImage, updateProductCategory, updateProductName, updateProductFlag, updateProductImageUrls, updateProductDescription, deleteProduct, type Product } from '../lib/catalog/products'
import { CATEGORY_IDS, CATEGORY_LABELS, type CategoryIdValue } from '../lib/catalog/constants'
import { httpsCallable } from 'firebase/functions'

interface Props {
  product: Product | null
  onClose: () => void
}

export function ProductEditorSheet({ product, onClose }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(product?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [description, setDescription] = useState(product?.description || '')
  const [savingDescription, setSavingDescription] = useState(false)
  const [generatingAIDesc, setGeneratingAIDesc] = useState(false)

  useEffect(() => {
    setName(product?.name || '')
  }, [product?.name])

  useEffect(() => {
    setDescription(product?.description || '')
  }, [product?.description])

  if (!product) return null

  const handleDeleteProduct = async () => {
    if (!confirm('¿Estás seguro que querés eliminar este producto? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteProduct(getDb(), product.id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el producto')
      setDeleting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      await uploadProductImage(getStorageBucket(), getDb(), product.id, file)
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleCategoryChange = async (newCat: CategoryIdValue) => {
    setError(null)
    try {
      await updateProductCategory(getDb(), product.id, newCat)
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la categoría')
    }
  }

  const handleFlagToggle = async (flagKey: string, newValue: boolean) => {
    setError(null)
    try {
      await updateProductFlag(getDb(), product.id, flagKey, newValue)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar visibilidad')
    }
  }

  const handleSaveName = async () => {
    if (!name.trim()) {
      setError('El nombre no puede estar vacío')
      return
    }
    if (name.trim() === product.name) return
    setSavingName(true)
    setError(null)
    try {
      await updateProductName(getDb(), product.id, name.trim())
    } catch (err: any) {
      setError(err.message || 'Error al guardar el nombre')
    } finally {
      setSavingName(false)
    }
  }

  const handleSaveDescription = async () => {
    if (description === product.description) return
    setSavingDescription(true)
    setError(null)
    try {
      await updateProductDescription(getDb(), product.id, description)
    } catch (err: any) {
      setError(err.message || 'Error al guardar la descripción')
    } finally {
      setSavingDescription(false)
    }
  }

  const handleGenerateAIDescription = async () => {
    setGeneratingAIDesc(true)
    setError(null)
    try {
      const genFunc = httpsCallable<{ productId: string, override: boolean }, { success: boolean, description: string }>(
        getFunctionsInstance(), 
        'generateProductDescription'
      )
      const res = await genFunc({ productId: product.id, override: true })
      if (res.data?.success && res.data.description) {
        setDescription(res.data.description)
        alert('¡Descripción generada con éxito!')
      } else {
        setError('No se pudo generar la descripción con IA.')
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar descripción con IA.')
      alert(`Error al generar descripción: ${err.message || 'Inténtalo de nuevo.'}`)
    } finally {
      setGeneratingAIDesc(false)
    }
  }

  const handleFetchSuggestions = async () => {
    setFetchingSuggestions(true)
    setError(null)
    try {
      const searchFunc = httpsCallable<{ query: string }, { urls: string[] }>(getFunctionsInstance(), 'searchProductImages')
      const queryStr = `${product.brand} ${product.name} ${product.model} png`
      const res = await searchFunc({ query: queryStr })
      if (res.data?.urls) {
        setSuggestions(res.data.urls)
        if (res.data.urls.length === 0) {
          setError('No se encontraron imágenes sugeridas.')
        }
      } else {
        setError('No se encontraron imágenes.')
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar sugerencias de imágenes.')
    } finally {
      setFetchingSuggestions(false)
    }
  }

  const handleSelectSuggestion = async (url: string) => {
    setError(null)
    try {
      await updateProductImageUrls(getDb(), product.id, [url])
      setSuggestions([]) // Limpiar al guardar con éxito
    } catch (err: any) {
      setError(err.message || 'Error al guardar la imagen seleccionada.')
    }
  }

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} ${product.model} png`)}&tbm=isch`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative h-full w-full max-w-md border-l border-pclink-border bg-pclink-bg p-8 shadow-2xl overflow-y-auto"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Gestionar Producto</h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-pclink-elevated">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 pb-6">
            {/* Preview de Imagen */}
            <div className="group relative aspect-video overflow-hidden rounded-2xl border border-pclink-border bg-pclink-elevated/30">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain p-4" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-pclink-subtle">
                  <ImageIcon className="mb-2 h-10 w-10 opacity-20" />
                  <p className="text-xs">Sin imagen asignada</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <Loader2 className="h-8 w-8 animate-spin text-pclink-cyan" />
                </div>
              )}
            </div>

            {/* Información básica */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-3 w-3 text-pclink-cyan" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-pclink-cyan">Categoría actual</p>
              </div>
              
              <select
                value={product.category}
                onChange={(e) => handleCategoryChange(e.target.value as CategoryIdValue)}
                className="w-full rounded-xl border border-pclink-border bg-pclink-elevated/50 p-2.5 text-sm font-semibold text-white focus:border-pclink-cyan/50 focus:outline-none"
              >
                {CATEGORY_IDS.map(id => (
                  <option key={id} value={id}>{CATEGORY_LABELS[id]}</option>
                ))}
              </select>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pclink-cyan">Nombre del producto</span>
                  {name !== product.name && (
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="flex items-center gap-1 rounded-full bg-pclink-cyan px-3 py-1 text-[10px] font-bold text-pclink-bg transition hover:bg-pclink-cyan-light disabled:opacity-50 cursor-pointer"
                    >
                      {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated/50 p-2.5 text-sm font-semibold text-white focus:border-pclink-cyan/50 focus:outline-none"
                />
                <p className="text-xs text-pclink-muted">{product.brand} · {product.model}</p>
              </div>
            </div>

            {/* Descripción del Producto */}
            <div className="space-y-3 rounded-2xl border border-pclink-border bg-pclink-elevated/20 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-pclink-cyan-light">Descripción</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={generatingAIDesc}
                    className="flex items-center gap-1 rounded-full bg-pclink-cyan/15 border border-pclink-cyan/35 px-2.5 py-1 text-[9px] font-bold text-pclink-cyan-light transition hover:bg-pclink-cyan/25 disabled:opacity-50 cursor-pointer"
                  >
                    {generatingAIDesc ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-pclink-cyan" />
                    ) : (
                      <Wand2 className="h-2.5 w-2.5 text-pclink-cyan" />
                    )}
                    <span>Autogenerar con IA</span>
                  </button>
                  {description !== product.description && (
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      disabled={savingDescription}
                      className="flex items-center gap-1 rounded-full bg-pclink-cyan px-3 py-1 text-[10px] font-bold text-pclink-bg transition hover:bg-pclink-cyan-light disabled:opacity-50"
                    >
                      {savingDescription ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Escribí una descripción detallada del producto acá..."
                className="min-h-[120px] w-full resize-y rounded-xl border border-pclink-border bg-pclink-bg/50 p-3 text-sm text-white placeholder-pclink-muted/50 focus:border-pclink-cyan/50 focus:outline-none"
              />
            </div>

            {/* Toggles de Visibilidad Premium */}
            <div className="space-y-3 rounded-2xl border border-pclink-border bg-pclink-elevated/20 p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-pclink-cyan-light">Visibilidad en Home</h4>
              
              <div className="space-y-2.5">
                {[
                  { key: 'showInFlashDeals', label: 'Oferta Flash', desc: 'Carrusel de ofertas rápidas', icon: Flame, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                  { key: 'isFeatured', label: 'Producto Destacado', desc: 'Grilla de artículos recomendados', icon: Star, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                  { key: 'isBestSeller', label: 'Selección de PcLink', desc: 'Productos seleccionados (Best Sellers)', icon: Target, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
                  { key: 'isNewArrival', label: 'Nuevo Ingreso', desc: 'Artículos recientemente agregados', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                  { key: 'inRecommendedFeed', label: 'Recomendado para vos', desc: 'Feed sugerido personalizado', icon: Heart, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
                ].map(({ key, label, desc, icon: Icon, color }) => {
                  const isActive = !!product[key]
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-pclink-border/30 bg-pclink-bg/40 p-2.5 hover:border-pclink-border/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{label}</p>
                          <p className="text-[9px] text-pclink-muted leading-tight mt-0.5">{desc}</p>
                        </div>
                      </div>
                      
                      {/* Premium Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleFlagToggle(key, !isActive)}
                        className={`relative flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${isActive ? 'bg-pclink-cyan' : 'bg-pclink-elevated'}`}
                      >
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md"
                          style={{ marginLeft: isActive ? '1rem' : '0' }}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Autobuscador de Imágenes Inteligente (IA) */}
            <div className="space-y-3 rounded-2xl border border-pclink-border bg-pclink-elevated/20 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-pclink-cyan-light">Sugerencias con IA</h4>
                {suggestions.length > 0 && (
                  <button 
                    onClick={() => setSuggestions([])}
                    className="text-[9px] font-bold text-pclink-muted hover:text-white transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              
              {suggestions.length === 0 ? (
                <button
                  type="button"
                  disabled={fetchingSuggestions}
                  onClick={handleFetchSuggestions}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan/20 to-pclink-cyan-deep/20 border border-pclink-cyan/35 px-4 py-2.5 text-xs font-bold text-white transition hover:from-pclink-cyan/30 hover:to-pclink-cyan-deep/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetchingSuggestions ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-pclink-cyan" />
                      Buscando en internet...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 text-pclink-cyan" />
                      Sugerir imágenes con IA (Gratis)
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[9px] text-pclink-muted">Hacé click en la foto que más te guste para asignarla:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {suggestions.map((url, i) => (
                      <motion.button
                        key={url}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectSuggestion(url)}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-pclink-border/40 bg-pclink-bg/60 p-1 hover:border-pclink-cyan transition-all flex items-center justify-center shadow-lg"
                      >
                        <img 
                          src={url} 
                          alt={`Sugerencia ${i+1}`} 
                          className="h-full w-full object-contain p-0.5 rounded-lg group-hover:scale-105 transition-transform" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold text-white uppercase">
                          Elegir
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acciones Manuales */}
            <div className="grid gap-2.5">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-pclink-elevated px-4 py-3 text-sm font-bold transition hover:bg-pclink-border">
                <Upload className="h-4 w-4" />
                Subir foto desde PC
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>

              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-pclink-border px-4 py-3 text-sm font-bold transition hover:border-pclink-cyan/40 hover:bg-pclink-cyan/5"
              >
                <Search className="h-4 w-4 text-pclink-cyan" />
                Buscar en Google Imágenes
                <ExternalLink className="h-3 w-3 opacity-40" />
              </a>
              
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteProduct}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-pclink-error/30 bg-pclink-error/10 px-4 py-3 text-sm font-bold text-pclink-error transition hover:bg-pclink-error/20 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Eliminar Producto
              </button>
            </div>

            {error && <p className="text-xs text-pclink-error text-center">{error}</p>}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
