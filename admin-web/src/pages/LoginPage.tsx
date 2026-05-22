import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../lib/auth-context'

function authErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message === 'access-denied') {
    return 'No tienes permisos de administrador para ingresar al panel.'
  }
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/unauthorized-domain':
        return 'Dominio no autorizado. En Firebase → Authentication → Ajustes → Dominios autorizados, agregá 127.0.0.1 y la URL de Hosting (ej. pclink-f6e0d.web.app). O entrá con http://localhost:PUERTO en lugar de 127.0.0.1.'
      case 'auth/operation-not-allowed':
        return 'Método de inicio desactivado. En Authentication → Método de inicio de sesión, habilitá Correo/contraseña y Google.'
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/invalid-login-credentials':
        return 'Correo o contraseña incorrectos.'
      case 'auth/user-not-found':
        return 'No existe un usuario con ese correo.'
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Probá más tarde.'
      case 'auth/popup-closed-by-user':
        return 'Cerraste la ventana de Google antes de terminar.'
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana emergente. Permití ventanas emergentes para este sitio.'
      case 'auth/account-exists-with-different-credential':
        return 'Ese correo ya está registrado con otro proveedor (ej. solo Google o solo correo).'
      case 'auth/network-request-failed':
        return 'Sin conexión o bloqueo de red. Comprobá internet o VPN/firewall.'
      default:
        return `${err.message} [${err.code}]`
    }
  }
  return 'No se pudo iniciar sesión. Revisá la configuración de Firebase.'
}

function GoogleGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { user, loading, configured, signInWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading && configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pclink-bg bg-mesh">
        <motion.div
          className="h-12 w-12 rounded-full border-2 border-pclink-cyan border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  if (!loading && user && configured) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signInWithEmail(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-pclink-bg bg-mesh px-4 py-16">
      <motion.div
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-pclink-cyan/20 blur-[100px]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.45, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-pclink-cyan-deep/25 blur-[110px]"
        animate={{ scale: [1.05, 1, 1.05], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="glass-panel relative z-10 w-full max-w-md p-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pclink-cyan to-pclink-cyan-deep text-lg font-black text-pclink-bg shadow-[0_0_28px_rgba(0,188,212,0.4)]">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PClink Admin</h1>
            <p className="text-sm text-pclink-muted">Acceso para equipo autorizado</p>
          </div>
        </div>

        {!configured && (
          <div className="mb-6 flex gap-3 rounded-xl border border-pclink-warning/30 bg-pclink-warning/10 p-4 text-sm text-amber-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-pclink-warning" />
            <div>
              <p className="font-semibold">Falta configurar Firebase</p>
              <p className="mt-1 text-pclink-muted">
                Copiá <code className="rounded bg-pclink-elevated px-1.5 py-0.5 text-xs">.env.example</code> a{' '}
                <code className="rounded bg-pclink-elevated px-1.5 py-0.5 text-xs">.env</code> en la carpeta{' '}
                <code className="rounded bg-pclink-elevated px-1.5 py-0.5 text-xs">admin-web</code> y completá las
                variables del proyecto.
              </p>
            </div>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 flex gap-3 rounded-xl border border-pclink-error/40 bg-pclink-error/10 p-4 text-sm text-red-100"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-pclink-muted">
              Correo
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-pclink-muted" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-pclink-border bg-pclink-elevated/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-pclink-subtle transition focus:border-pclink-cyan/50 focus:ring-2 focus:ring-pclink-cyan/20 disabled:opacity-50"
                placeholder="vos@empresa.com"
                disabled={!configured || busy}
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-pclink-muted"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-pclink-muted" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-pclink-border bg-pclink-elevated/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-pclink-subtle transition focus:border-pclink-cyan/50 focus:ring-2 focus:ring-pclink-cyan/20 disabled:opacity-50"
                placeholder="••••••••"
                disabled={!configured || busy}
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={!configured || busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pclink-cyan to-pclink-cyan-deep py-3.5 text-sm font-bold text-pclink-bg shadow-[0_0_24px_rgba(0,188,212,0.35)] transition hover:brightness-110 disabled:opacity-45"
            whileHover={{ scale: configured && !busy ? 1.01 : 1 }}
            whileTap={{ scale: configured && !busy ? 0.99 : 1 }}
          >
            Entrar
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-pclink-border" />
          </div>
          <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
            <span className="bg-pclink-surface/90 px-3 text-pclink-muted">o</span>
          </div>
        </div>

        <motion.button
          type="button"
          disabled={!configured || busy}
          onClick={() => void onGoogle()}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-pclink-border bg-pclink-elevated/40 py-3.5 text-sm font-semibold text-white transition hover:border-pclink-cyan/35 hover:bg-pclink-elevated disabled:opacity-45"
          whileHover={{ scale: configured && !busy ? 1.01 : 1 }}
          whileTap={{ scale: configured && !busy ? 0.99 : 1 }}
        >
          <GoogleGlyph />
          Continuar con Google
        </motion.button>

        <p className="mt-8 text-center text-xs text-pclink-muted">
          ¿Problemas de acceso?{' '}
          <span className="text-pclink-cyan-light">Contactá al administrador del proyecto.</span>
        </p>
      </motion.div>
    </div>
  )
}
