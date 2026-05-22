import { motion } from 'framer-motion'
import { LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

export function TopBar() {
  const { user, logout } = useAuth()

  const initial = user?.displayName?.charAt(0) ?? user?.email?.charAt(0) ?? '?'

  return (
    <header className="sticky top-0 z-30 border-b border-pclink-border/60 bg-pclink-bg/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-8">
        <motion.div
          className="flex items-center gap-2 text-pclink-muted"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles className="h-4 w-4 text-pclink-cyan" aria-hidden />
          <span className="text-sm font-medium">Consola de gestión</span>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{user?.displayName || 'Usuario'}</p>
            <p className="max-w-[200px] truncate text-xs text-pclink-muted">{user?.email}</p>
          </div>
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-pclink-elevated text-sm font-bold text-pclink-cyan ring-1 ring-pclink-border"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {initial.toUpperCase()}
          </motion.div>
          <motion.button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-xl border border-pclink-border bg-pclink-elevated/50 px-4 py-2 text-sm font-semibold text-pclink-muted transition hover:border-pclink-cyan/40 hover:text-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-4 w-4" />
            Salir
          </motion.button>
        </div>
      </div>
    </header>
  )
}
