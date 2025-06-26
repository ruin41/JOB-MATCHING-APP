"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useAuthGuard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("=== useAuthGuard: 認証チェック開始 ===")

        // Server Actionを使用してサーバーサイドで認証確認
        const { getCurrentUserAction } = await import("@/app/actions/auth")
        const result = await getCurrentUserAction()

        console.log("useAuthGuard認証結果:", result)

        if (result.user) {
          console.log("useAuthGuard: ユーザー認証成功:", result.user.id)
          setIsAuthenticated(true)
          setCurrentUser({
            id: result.user.id,
            email: result.user.email,
            emailConfirmed: result.user.email_confirmed_at ? true : false,
            userType: result.userType,
          })
        } else {
          console.log("useAuthGuard: ユーザー認証失敗、ログイン画面にリダイレクト")
          setIsAuthenticated(false)
          setCurrentUser(null)
          router.push("/login")
          return
        }
      } catch (error) {
        console.error("useAuthGuard認証チェックエラー:", error)
        setIsAuthenticated(false)
        setCurrentUser(null)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  return { isLoading, isAuthenticated, currentUser }
}
