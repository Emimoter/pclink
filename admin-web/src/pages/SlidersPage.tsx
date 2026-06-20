import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ImageIcon,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  RotateCcw,
  Upload,
  X,
  Save,
} from 'lucide-react'
import { getDb, getStorageBucket } from '../lib/firebase'
import {
  subscribeToBanners,
  updateBanner,
  deleteBanner,
  addBanner,
  reorderBanners,
  seedDefaultBanners,
  uploadBannerImage,
  type Banner,
} from '../lib/catalog/banners'

const CATEGORIES = [
  'GPU', 'CPU', 'MOTHERBOARD', 'RAM', 'CASE', 'PSU',
  'MONITOR', 'MOUSE', 'KEYBOARD', 'HEADPHONES', 'PRINTER',
  'CABLES', 'STORAGE', 'COOLING', 'NOTEBOOK', 'GAMING', 'NETWORK', 
  'PC_ARMADAS', 'SILLAS_GAMER', 'CARGADORES', 'PARLANTES', 'OFFERS',
] as const

const PRESET_PATHS = ['/products', '/pcclub', '/about', '/auth', '/profile']

interface EditingBanner {
  id: string | null
  targetCategory: string
  targetProductId: string
  targetPath: string
  imageUrl: string | null
  file: File | null
}

const emptyForm: EditingBanner = {
  id: null,
  targetCategory: '',
  targetProductId: '',
  targetPath: '',
  imageUrl: null,
  file: null,
}

export function SlidersPage() {
  const db = getDb()
  const storage = getStorageBucket()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditingBanner>(emptyForm)
  const [redirectType, setRedirectType] = useState<'none' | 'category' | 'product' | 'path'>('none')
  const [isOpen, setIsOpen] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const listFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return subscribeToBanners(db, (data) => {
      setBanners(data)
      setLoading(false)
    })
  }, [db])

  async function handleSeed() {
    const ok = confirm('¿Restaurar banners por defecto? No afecta banners existentes.')
    if (!ok) return
    await seedDefaultBanners(db)
  }

  function startEdit(b: Banner) {
    const type = b.targetCategory
      ? 'category'
      : b.targetProductId
      ? 'product'
      : b.targetPath
      ? 'path'
      : 'none'

    setEditing({
      id: b.id,
      targetCategory: b.targetCategory ?? '',
      targetProductId: b.targetProductId ?? '',
      targetPath: b.targetPath ?? '',
      imageUrl: b.imageUrl,
      file: null,
    })
    setRedirectType(type)
    setIsOpen(true)
  }

  function startNew() {
    setEditing({ ...emptyForm, id: null })
    setRedirectType('none')
    setIsOpen(true)
  }

  async function handleSave() {
    if (!editing.imageUrl && !editing.file) {
      alert('Por favor, selecciona o sube una imagen para el banner.')
      return
    }

    const data: any = {
      title: '',
      subtitle: '',
      ctaLabel: '',
      accentColor: '#00BCD4',
      gradientStart: '#0A0F14',
      gradientEnd: '#0A0F14',
      targetCategory: redirectType === 'category' ? (editing.targetCategory || null) : null,
      targetProductId: redirectType === 'product' ? (editing.targetProductId || null) : null,
      targetPath: redirectType === 'path' ? (editing.targetPath || null) : null,
      badge: null,
      active: true,
    }

    if (editing.id == null) {
      data.order = banners.length
    }

    try {
      let bannerId = editing.id
      if (bannerId) {
        await updateBanner(db, bannerId, data)
        if (editing.file) {
          setUploadingId(bannerId)
          await uploadBannerImage(storage, db, bannerId, editing.file)
        }
      } else {
        bannerId = await addBanner(db, data as any)
        if (editing.file) {
          setUploadingId(bannerId)
          await uploadBannerImage(storage, db, bannerId, editing.file)
        }
      }
      setEditing(emptyForm)
      setIsOpen(false)
    } catch (err: any) {
      console.error(err)
      alert('Error al guardar el banner: ' + (err.message || err))
    } finally {
      setUploadingId(null)
    }
  }

  function cancelEdit() {
    setEditing(emptyForm)
    setIsOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este banner?')) return
    await deleteBanner(db, id)
  }

  async function handleToggleActive(b: Banner) {
    await updateBanner(db, b.id, { active: !b.active })
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return
    const ids = banners.map((b) => b.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    await reorderBanners(db, ids)
  }

  async function handleMoveDown(index: number) {
    if (index === banners.length - 1) return
    const ids = banners.map((b) => b.id)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    await reorderBanners(db, ids)
  }

  async function handleImageUpload(bannerId: string, file: File) {
    setUploadingId(bannerId)
    try {
      await uploadBannerImage(storage, db, bannerId, file)
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sliders y banners</h1>
          <p className="mt-2 max-w-2xl text-pclink-muted">
            Gestioná los banners deslizables de la tienda web. Sube imágenes optimizadas para tu marca.
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={handleSeed}
            className="flex items-center gap-2 rounded-xl border border-pclink-border px-4 py-2.5 text-sm font-bold text-pclink-muted transition hover:border-pclink-cyan/40 hover:text-pclink-cyan"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar defaults
          </motion.button>
          <motion.button
            type="button"
            onClick={startNew}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep px-4 py-2.5 text-sm font-bold text-pclink-bg shadow-[0_0_20px_rgba(0,188,212,0.25)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            Añadir slide
          </motion.button>
        </div>
      </div>

      {/* Edit/Create Form */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel mt-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-pclink-border/60 px-6 py-4">
              <h2 className="font-bold">{editing.id ? 'Editar slide' : 'Añadir nuevo slide'}</h2>
              <button onClick={cancelEdit} className="text-pclink-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-6 p-6">
              {/* Image upload area */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-pclink-muted">Imagen del Banner</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex aspect-[2/1] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-pclink-border bg-pclink-elevated/20 transition hover:border-pclink-cyan/50 hover:bg-pclink-elevated/40"
                >
                  {editing.file ? (
                    <img 
                      src={URL.createObjectURL(editing.file)} 
                      alt="Preview" 
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                    />
                  ) : editing.imageUrl ? (
                    <img 
                      src={editing.imageUrl} 
                      alt="Current banner" 
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-pclink-muted">
                      <ImageIcon className="h-10 w-10 text-pclink-border group-hover:text-pclink-cyan transition-colors" />
                      <p className="text-sm font-bold text-white group-hover:text-pclink-cyan transition-colors">
                        Haz clic para seleccionar o subir una imagen
                      </p>
                      <p className="text-xs">Formatos aceptados: PNG, JPG, JPEG</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setEditing({ ...editing, file })
                      }
                    }}
                  />
                </div>
                <div className="rounded-xl bg-pclink-cyan/10 border border-pclink-cyan/25 p-3.5 text-xs text-pclink-cyan-light">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <span>💡</span> Medida recomendada: 2000 × 1000 px (relación de aspecto 2:1)
                  </p>
                  <p>
                    Este tamaño asegura que el banner ocupe todo el ancho de la sección y se recorte de forma idéntica y simétrica en la tienda web.
                  </p>
                </div>
              </div>

              {/* Redirection Options */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-pclink-muted">Acción al hacer clic (Redirección)</label>
                  <select
                    className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                    value={redirectType}
                    onChange={(e) => setRedirectType(e.target.value as any)}
                  >
                    <option value="none">Ninguna (No hacer nada)</option>
                    <option value="category">Categoría del catálogo</option>
                    <option value="product">Producto específico</option>
                    <option value="path">Página o enlace personalizado (ej: Login, PClink Club)</option>
                  </select>
                </div>

                {redirectType === 'category' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-pclink-border/40 bg-pclink-elevated/10 p-4 space-y-2"
                  >
                    <label className="block text-xs font-semibold text-pclink-muted uppercase tracking-wider">Categoría destino</label>
                    <select
                      className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                      value={editing.targetCategory}
                      onChange={(e) => setEditing({ ...editing, targetCategory: e.target.value })}
                    >
                      <option value="">— Seleccionar categoría —</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-pclink-muted">Redirigirá al catálogo filtrado por esta categoría en la tienda.</p>
                  </motion.div>
                )}

                {redirectType === 'product' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-pclink-border/40 bg-pclink-elevated/10 p-4 space-y-2"
                  >
                    <label className="block text-xs font-semibold text-pclink-muted uppercase tracking-wider">ID de Producto destino</label>
                    <input
                      className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                      placeholder="Ej: product_123"
                      value={editing.targetProductId}
                      onChange={(e) => setEditing({ ...editing, targetProductId: e.target.value })}
                    />
                    <p className="text-[10px] text-pclink-muted">Redirigirá a la página de detalles de este producto específico.</p>
                  </motion.div>
                )}

                {redirectType === 'path' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-pclink-border/40 bg-pclink-elevated/10 p-4 space-y-4"
                  >
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-pclink-muted uppercase tracking-wider">Seleccionar página de la tienda</label>
                      <select
                        className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                        value={
                          PRESET_PATHS.includes(editing.targetPath)
                            ? editing.targetPath
                            : (editing.targetPath ? 'custom' : '')
                        }
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'custom') {
                            setEditing({ ...editing, targetPath: 'custom_placeholder' })
                          } else {
                            setEditing({ ...editing, targetPath: val })
                          }
                        }}
                      >
                        <option value="">— Seleccionar página —</option>
                        <option value="/products">Tienda / Catálogo (Inicio)</option>
                        <option value="/pcclub">PClink Club</option>
                        <option value="/about">Sobre nosotros</option>
                        <option value="/auth">Iniciar Sesión / Registro</option>
                        <option value="/profile">Mi Perfil</option>
                        <option value="custom">Escribir enlace o ruta manual...</option>
                      </select>
                    </div>

                    {editing.targetPath !== '' && !PRESET_PATHS.includes(editing.targetPath) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5"
                      >
                        <label className="block text-xs font-semibold text-pclink-muted">Enlace o Ruta manual</label>
                        <input
                          className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan font-mono"
                          placeholder="Ej: /cart o https://..."
                          value={editing.targetPath === 'custom_placeholder' ? '' : editing.targetPath}
                          onChange={(e) => setEditing({ ...editing, targetPath: e.target.value })}
                        />
                        <p className="text-[10px] text-pclink-muted">
                          Usa rutas relativas (ej: <code className="text-pclink-cyan font-mono">/cart</code>) para páginas internas de la tienda, o URLs completas para enlaces externos.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-pclink-border/60 px-6 py-4">
              <button
                onClick={cancelEdit}
                className="rounded-xl border border-pclink-border px-5 py-2 text-sm font-bold text-pclink-muted transition hover:border-pclink-cyan/40 hover:text-pclink-cyan"
              >
                Cancelar
              </button>
              <motion.button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-pclink-cyan px-5 py-2 text-sm font-bold text-pclink-bg disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={uploadingId !== null}
              >
                <Save className="h-4 w-4" />
                {uploadingId ? 'Guardando...' : 'Guardar'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner list */}
      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-pclink-elevated" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="glass-panel mt-8 flex flex-col items-center gap-4 py-16">
          <ImageIcon className="h-12 w-12 text-pclink-muted" />
          <p className="text-pclink-muted">No hay banners todavía</p>
          <motion.button
            onClick={startNew}
            className="flex items-center gap-2 rounded-xl bg-pclink-cyan px-5 py-2.5 text-sm font-bold text-pclink-bg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            Crear primer banner
          </motion.button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          <AnimatePresence>
            {banners.map((b, i) => (
              <motion.li
                key={b.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-panel flex items-center gap-4 p-4"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    className="text-pclink-muted hover:text-white disabled:opacity-20"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(i)}
                    disabled={i === banners.length - 1}
                    className="text-pclink-muted hover:text-white disabled:opacity-20"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Preview */}
                <div className="flex h-16 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-pclink-elevated ring-1 ring-pclink-border">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-white/40" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-white">Slide #{i + 1}</p>
                    {b.targetCategory && (
                      <span className="rounded-md bg-pclink-cyan/10 px-2 py-0.5 text-[9px] font-bold text-pclink-cyan uppercase tracking-wider">
                        Categoría: {b.targetCategory}
                      </span>
                    )}
                    {b.targetProductId && (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                        Producto: {b.targetProductId}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-pclink-muted">
                    {b.imageUrl ? 'Imagen subida correctamente' : 'Sin imagen cargada'}
                  </p>
                </div>

                {/* Image upload */}
                <label className="cursor-pointer text-pclink-muted hover:text-white">
                  <input
                    ref={listFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(b.id, file)
                      e.target.value = ''
                    }}
                  />
                  {uploadingId === b.id ? (
                    <span className="text-xs text-pclink-cyan">Subiendo…</span>
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </label>

                {/* Active toggle */}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-pclink-muted select-none">
                  <input
                    type="checkbox"
                    checked={b.active}
                    onChange={() => handleToggleActive(b)}
                    className="accent-pclink-cyan h-4 w-4 rounded border-pclink-border"
                  />
                  Visible
                </label>

                {/* Edit */}
                <motion.button
                  type="button"
                  onClick={() => startEdit(b)}
                  className="rounded-xl border border-pclink-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-pclink-cyan transition hover:bg-pclink-cyan/10"
                  whileTap={{ scale: 0.97 }}
                >
                  Editar
                </motion.button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-pclink-muted hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {banners.length > 0 && (
        <motion.button
          type="button"
          onClick={startNew}
          className="mt-6 w-full rounded-xl border border-dashed border-pclink-border py-4 text-sm font-semibold text-pclink-muted transition hover:border-pclink-cyan/40 hover:text-pclink-cyan"
          whileHover={{ scale: 1.005 }}
        >
          + Añadir slide
        </motion.button>
      )}
    </div>
  )
}
