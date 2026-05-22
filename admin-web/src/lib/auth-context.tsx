import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, googleProvider, isFirebaseConfigured, getDb } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

type AuthContextValue = {
  user: User | null
  loading: boolean
  configured: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const configured = isFirebaseConfigured()

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }
    const auth = getFirebaseAuth()
    return onAuthStateChanged(auth, async (u) => {
      if (u && u.email) {
        try {
          const db = getDb()
          const adminDoc = await getDoc(doc(db, 'admins', u.email))
          if (adminDoc.exists()) {
            setUser(u)
          } else {
            await signOut(auth)
            setUser(null)
          }
        } catch (e) {
          await signOut(auth)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
  }, [configured])

  const checkAdminRole = async (email: string | null) => {
    if (!email) throw new Error('access-denied');
    const db = getDb()
    const adminDoc = await getDoc(doc(db, 'admins', email))
    if (!adminDoc.exists()) {
      throw new Error('access-denied')
    }
  }

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    try {
      await checkAdminRole(cred.user.email)
    } catch (e) {
      await signOut(auth)
      throw e
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth()
    const cred = await signInWithPopup(auth, googleProvider)
    try {
      await checkAdminRole(cred.user.email)
    } catch (e) {
      await signOut(auth)
      throw e
    }
  }, [])

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth()
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      signInWithEmail,
      signInWithGoogle,
      logout,
    }),
    [user, loading, configured, signInWithEmail, signInWithGoogle, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
