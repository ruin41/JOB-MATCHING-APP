"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "./AuthProvider"

interface SessionGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function SessionGuard({ children, requireAuth = true, redirectTo = "/login" }: SessionGuardProps) {
  const { isAuthenticated, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  return <>{children}</>
}
