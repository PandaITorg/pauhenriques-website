"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { User } from "firebase/auth";

// ===== TYPES =====
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// ===== CONTEXT =====
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// ===== PROVIDER =====
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Importar Firebase Auth dinámicamente solo en el cliente
    // Esto evita errores de SSR durante el prerendering
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const { getClientAuth } = await import("@/lib/firebase-auth");
        const { onAuthStateChanged } = await import("firebase/auth");

        unsubscribe = onAuthStateChanged(getClientAuth(), (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error al inicializar Firebase Auth:", error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Cerrar sesión: eliminar cookie del servidor + sign out de Firebase
  const signOut = useCallback(async () => {
    try {
      // 1. Eliminar la session cookie del servidor
      await fetch("/api/auth/logout", { method: "POST" });
      // 2. Sign out de Firebase client-side
      const { getClientAuth } = await import("@/lib/firebase-auth");
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(getClientAuth());
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== HOOK =====
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
