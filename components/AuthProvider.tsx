"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"

interface AuthContextType {
  user: any
  userType: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isDemo: boolean
  restoreSession: () => Promise<void>
  checkSessionStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
