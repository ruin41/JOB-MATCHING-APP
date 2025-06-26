"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, AlertCircle } from "lucide-react"
import { PasswordInput } from "@/components/PasswordInput"
import { signInAction } from "@/app/actions/auth"
import { createClient } from "@supabase/supabase-js"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        )

        console.log("=== ログイン画面でのセッションチェック開始 ===")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("セッション取得エラー:", sessionError)
          setCheckingAuth(false)
          return
        }

        if (session?.user) {
          console.log("既存のSupabaseセッション発見:", session.user.id)

          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (userError || !userData.user) {
            console.log("セッションが無効です:", userError?.message)
            await supabase.auth.signOut()
            setCheckingAuth(false)
            return
          }

          console.log("有効なセッションを確認、リダイレクト実行")
          const userType = session.user.user_metadata?.user_type

          if (userType === "company") {
            router.push("/swipe/company")
          } else {
            router.push("/swipe/jobseeker")
          }
          return
        }

        console.log("Supabaseセッションなし、ログイン画面を表示")
      } catch (err) {
        console.error("セッションチェックエラー:", err)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      console.log("=== ログイン処理開始 ===")
      const result = await signInAction(formData)

      if (result.error) {
        console.error("ログインエラー:", result.error)
        setError(result.error)
        return
      }

      if (result.success) {
        console.log("ログイン成功:", result.userType)
        console.log("リダイレクト先:", result.redirectPath)

        // 少し待ってからリダイレクト（セッション確立を確実にする）
        await new Promise((resolve) => setTimeout(resolve, 500))

        const redirectPath =
          result.redirectPath || (result.userType === "company" ? "/swipe/company" : "/swipe/jobseeker")
        window.location.href = redirectPath // router.pushの代わりにlocation.hrefを使用
      }
    } catch (err) {
      console.error("ログイン処理エラー:", err)
      setError("予期しないエラーが発生しました: " + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">JobMatch</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>アカウントにログインして、マッチングを始めましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" placeholder="your-email@example.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">パスワード</Label>
                  <Link href="/reset-password" className="text-sm text-purple-600 hover:underline">
                    パスワードを忘れた方
                  </Link>
                </div>
                <PasswordInput id="password" name="password" required />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{" "}
              <Link href="/signup" className="text-purple-600 hover:underline">
                こちらから登録
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
