"use client";

import { useState, useEffect, Suspense } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirect);
    }
  }, [user, authLoading, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    setErrorMsg("");

    try {
      if (isLogin) {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update profile display name
        await updateProfile(firebaseUser, {
          displayName: name,
        });

        // Store extra user metadata in Firestore users collection
        await setDoc(doc(db, "users", firebaseUser.uid), {
          uid: firebaseUser.uid,
          name: name,
          email: email,
          phone: phone,
          createdAt: Date.now(),
        });
      }
      router.replace(redirect);
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Ocurrió un error. Intenta de nuevo.";
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        message = "Email o contraseña incorrectos.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "El email ingresado ya está registrado.";
      } else if (err.code === "auth/weak-password") {
        message = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.code === "auth/invalid-email") {
        message = "El email ingresado no es válido.";
      }
      setErrorMsg(message);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingForm(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Verify if document exists in Firestore `/users/{uid}`
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuario",
          email: firebaseUser.email || "",
          phone: firebaseUser.phoneNumber || "",
          createdAt: Date.now(),
        });
      }
      router.replace(redirect);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMsg("Error al iniciar sesión con Google. Intenta de nuevo.");
      }
    } finally {
      setLoadingForm(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 bg-background">
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-2 block">
            Acceso Clientes
          </span>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h1>
          <p className="text-muted text-sm mt-2">
            {isLogin ? "Ingresá a tu cuenta de PC Link" : "Registrate para guardar tus pedidos"}
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-mono"
                  placeholder="2235555555"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
              placeholder="nombre@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all text-primary font-medium"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loadingForm} className="w-full rounded-xl py-6 mt-4">
            {loadingForm ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              "Ingresar"
            ) : (
              "Crear Cuenta"
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-3 text-muted font-bold tracking-wider">O continuar con</span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={loadingForm}
          onClick={handleGoogleSignIn}
          className="w-full rounded-xl py-6 border border-border flex items-center justify-center gap-3 hover:bg-background transition-all font-bold text-sm text-primary"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </Button>

        <div className="mt-8 pt-6 border-t border-border text-center text-sm">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
            }}
            className="text-muted hover:text-accent font-semibold transition-colors"
          >
            {isLogin ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
