"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOutAction } from "@/app/actions/auth"

export default function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      console.log("=== ログアウト処理開始 ===")
      const result = await signOutAction()

      console.log("ログアウト結果:", result)

      if (result.success) {
        console.log("ログアウト成功、トップページに遷移")

        // クライアント側でもCookieをクリア
        const cookiesToClear = ["current-user", "demo-user", "supabase-auth-token", "supabase-refresh-token", "sb-user"]

        cookiesToClear.forEach((cookieName) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        })

        // トップページに遷移
        router.push("/")

        // 確実にページをリロードしてセッション状態をクリア
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      } else {
        console.error("ログアウト失敗:", result.error)

        // エラーが発生してもクライアント側でCookieをクリア
        const cookiesToClear = ["current-user", "demo-user", "supabase-auth-token", "supabase-refresh-token", "sb-user"]

        cookiesToClear.forEach((cookieName) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        })

        // エラーが発生してもトップページに遷移
        router.push("/")
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      }
    } catch (error) {
      console.error("ログアウトエラー:", error)

      // エラーが発生してもクライアント側でCookieをクリア
      const cookiesToClear = ["current-user", "demo-user", "supabase-auth-token", "supabase-refresh-token", "sb-user"]

      cookiesToClear.forEach((cookieName) => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })

      // エラーが発生してもトップページに遷移
      router.push("/")
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center w-full justify-start"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "ログアウト中..." : "ログアウト"}
    </Button>
  )
}
