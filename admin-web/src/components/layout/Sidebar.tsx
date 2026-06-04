import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Images,
  Bell,
  UsersRound,
  UploadCloud,
  Gift,
  Truck,
  Database,
} from 'lucide-react'
import clsx from 'clsx'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Estadísticas' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/importar', icon: UploadCloud, label: 'Importar catálogo' },
  { to: '/grupo-nucleo', icon: Database, label: 'Grupo Núcleo' },
  { to: '/sliders', icon: Images, label: 'Sliders' },
  { to: '/notificaciones', icon: Bell, label: 'Notificaciones' },
  { to: '/clientes', icon: UsersRound, label: 'Clientes recurrentes' },
  { to: '/club', icon: Gift, label: 'Club de Puntos' },
  { to: '/envios', icon: Truck, label: 'Envíos' },
] as const

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-pclink-border/80 bg-pclink-surface/95 shadow-[4px_0_24px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 py-8">
        <motion.div
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pclink-cyan to-pclink-cyan-deep text-lg font-black text-pclink-bg shadow-[0_0_24px_rgba(0,188,212,0.35)]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          P
        </motion.div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pclink-muted">PClink</p>
          <p className="text-lg font-bold tracking-tight text-white">Admin</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {links.map((link, i) => {
          const Icon = link.icon
          return (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
          >
            <NavLink
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'text-pclink-bg'
                    : 'text-pclink-muted hover:bg-pclink-elevated/80 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-light shadow-[0_0_20px_rgba(0,188,212,0.35)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          </motion.div>
          )
        })}
      </nav>

      <div className="border-t border-pclink-border/60 p-4">
        <p className="px-2 text-[11px] leading-relaxed text-pclink-muted">
          Panel sincronizado con la app móvil PClink · Firestore
        </p>
      </div>
    </aside>
  )
}
