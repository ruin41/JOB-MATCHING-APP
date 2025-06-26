"use client"

import { useState, useEffect } from "react"
import { restoreSessionAction, checkSessionStatusAction } from "@/app/actions/auth"

interface User {
  id: string
  email: string
  user_metadata?: {
    user_type?: string
    is_guest?: boolean
  }
}

interface AuthState {
  user: User | null
  userType: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isDemo: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userType: null,
    isLoading: true,
    isAuthenticated: false,
    isDemo: false,
  })

  // セッション復元
  const restoreSession = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      const result = await restoreSessionAction()

      if (result.success) {
        setAuthState({
          user: result.user,
          userType: result.userType,
          isLoading: false,
          isAuthenticated: true,
          isDemo: result.isDemo || false,
        })
      } else {
        setAuthState({
          user: null,
          userType: null,
          isLoading: false,
          isAuthenticated: false,
          isDemo: false,
        })
      }
    } catch (error) {
      console.error("Session restore failed:", error)
      setAuthState({
        user: null,
        userType: null,
        isLoading: false,
        isAuthenticated: false,
        isDemo: false,
      })
    }
  }

  // 軽量なセッション状態チェック
  const checkSessionStatus = async () => {
    try {
      const result = await checkSessionStatusAction()

      if (!result.isAuthenticated) {
        setAuthState((prev) => ({
          ...prev,
          user: null,
          userType: null,
          isAuthenticated: false,
          isDemo: false,
          isLoading: false,
        }))
      }
    } catch (error) {
      console.error("Session status check failed:", error)
    }
  }

  // ログアウト処理（認証状態をリセット）
  const logout = () => {
    console.log("Resetting auth state after logout")
    setAuthState({
      user: null,
      userType: null,
      isLoading: false,
      isAuthenticated: false,
      isDemo: false,
    })
  }

  // 初回マウント時にセッション復元
  useEffect(() => {
    restoreSession()
  }, [])

  // 定期的なセッション状態チェック（オプション）
  useEffect(() => {
    if (!authState.isAuthenticated) return

    const interval = setInterval(
      () => {
        checkSessionStatus()
      },
      5 * 60 * 1000,
    ) // 5分ごと

    return () => clearInterval(interval)
  }, [authState.isAuthenticated])

  return {
    ...authState,
    restoreSession,
    checkSessionStatus,
    logout,
  }
}
