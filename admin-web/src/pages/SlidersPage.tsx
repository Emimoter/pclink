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
  'CABLES', 'STORAGE', 'COOLING', 'NOTEBOOK', 'GAMING', 'NETWORK', 'OFFERS',
] as const

interface EditingBanner {
  id: string | null
  title: string
  subtitle: string
  ctaLabel: string
  accentColor: string
  gradientStart: string
  gradientEnd: string
  targetCategory: string
  targetProductId: string
  badge: string
}

const emptyForm: EditingBanner = {
  id: null,
  title: '',
  subtitle: '',
  ctaLabel: 'Ver oferta',
  accentColor: '#00BCD4',
  gradientStart: '#06090C',
  gradientEnd: '#0E2B33',
  targetCategory: '',
  targetProductId: '',
  badge: '',
}

export function SlidersPage() {
  const db = getDb()
  const storage = getStorageBucket()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditingBanner>(emptyForm)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
    setEditing({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      ctaLabel: b.ctaLabel,
      accentColor: b.accentColor,
      gradientStart: b.gradientStart,
      gradientEnd: b.gradientEnd,
      targetCategory: b.targetCategory ?? '',
      targetProductId: b.targetProductId ?? '',
      badge: b.badge ?? '',
    })
  }

  function startNew() {
    setEditing({ ...emptyForm, id: null })
  }

  async function handleSave() {
    if (!editing.title.trim()) return
    const data = {
      title: editing.title.trim(),
      subtitle: editing.subtitle.trim(),
      ctaLabel: editing.ctaLabel.trim() || 'Ver oferta',
      accentColor: editing.accentColor,
      gradientStart: editing.gradientStart,
      gradientEnd: editing.gradientEnd,
      targetCategory: editing.targetCategory || null,
      targetProductId: editing.targetProductId || null,
      badge: editing.badge || null,
      active: true,
      order: editing.id == null ? banners.length : undefined,
    }
    if (editing.id) {
      await updateBanner(db, editing.id, data)
    } else {
      await addBanner(db, data as any)
    }
    setEditing(emptyForm)
  }

  function cancelEdit() {
    setEditing(emptyForm)
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
            Gestioná los banners de la home. Los cambios se reflejan en tiempo real en la app.
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
        {editing.id !== undefined && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel mt-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-pclink-border/60 px-6 py-4">
              <h2 className="font-bold">{editing.id ? 'Editar banner' : 'Nuevo banner'}</h2>
              <button onClick={cancelEdit} className="text-pclink-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">Título</label>
                <input
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">Subtítulo</label>
                <input
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                  value={editing.subtitle}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">CTA</label>
                <input
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                  value={editing.ctaLabel}
                  onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">Badge (ej: FLASH SALE)</label>
                <input
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                  value={editing.badge}
                  onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">Color acento (hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-10 cursor-pointer rounded-xl border border-pclink-border bg-pclink-elevated"
                    value={editing.accentColor}
                    onChange={(e) => setEditing({ ...editing, accentColor: e.target.value })}
                  />
                  <input
                    className="flex-1 rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan font-mono"
                    value={editing.accentColor}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setEditing({ ...editing, accentColor: v })
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">Gradiente inicio (hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-10 cursor-pointer rounded-xl border border-pclink-border bg-pclink-elevated"
                    value={editing.gradientStart}
                    onChange={(e) => setEditing({ ...editing, gradientStart: e.target.value })}
                  />
                  <input
                    className="flex-1 rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan font-mono"
                    value={editing.gradientStart}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setEditing({ ...editing, gradientStart: v })
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">Gradiente fin (hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-10 w-10 cursor-pointer rounded-xl border border-pclink-border bg-pclink-elevated"
                    value={editing.gradientEnd}
                    onChange={(e) => setEditing({ ...editing, gradientEnd: e.target.value })}
                  />
                  <input
                    className="flex-1 rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan font-mono"
                    value={editing.gradientEnd}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setEditing({ ...editing, gradientEnd: v })
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-pclink-muted">Categoría destino (opcional)</label>
                <select
                  className="w-full rounded-xl border border-pclink-border bg-pclink-elevated px-4 py-2.5 text-sm outline-none focus:border-pclink-cyan"
                  value={editing.targetCategory}
                  onChange={(e) => setEditing({ ...editing, targetCategory: e.target.value })}
                >
                  <option value="">— Sin categoría —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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
                className="flex items-center gap-2 rounded-xl bg-pclink-cyan px-5 py-2 text-sm font-bold text-pclink-bg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!editing.title.trim()}
              >
                <Save className="h-4 w-4" />
                Guardar
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
                style={{
                  borderLeft: `4px solid ${b.active ? b.accentColor : 'transparent'}`,
                }}
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
                <div
                  className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-pclink-border"
                  style={{
                    background: `linear-gradient(135deg, ${b.gradientStart}, ${b.gradientEnd})`,
                  }}
                >
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-white/40" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{b.title}</p>
                    {b.badge && (
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: b.accentColor + '22', color: b.accentColor }}
                      >
                        {b.badge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-pclink-muted">{b.subtitle}</p>
                </div>

                {/* Image upload */}
                <label className="cursor-pointer text-pclink-muted hover:text-white">
                  <input
                    ref={fileRef}
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
                <label className="flex cursor-pointer items-center gap-2 text-sm text-pclink-muted">
                  <input
                    type="checkbox"
                    checked={b.active}
                    onChange={() => handleToggleActive(b)}
                    className="accent-pclink-cyan"
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
