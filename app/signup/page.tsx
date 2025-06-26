"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // バリデーション
    if (!email || !password || !confirmPassword) {
      setError("すべての項目を入力してください")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("有効なメールアドレスを入力してください")
      setIsLoading(false)
      return
    }

    try {
      // 現在のオリジンを取得
      const currentOrigin = window.location.origin
      console.log("Current origin:", currentOrigin)

      // Supabaseでアカウント作成 - 認証完了画面に直接リダイレクト
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${currentOrigin}/auth/confirm`,
        },
      })

      if (signUpError) {
        console.error("Signup error:", signUpError)
        if (signUpError.message.includes("already registered")) {
          setError("このメールアドレスは既に登録されています")
        } else if (signUpError.message.includes("Password should be")) {
          setError("パスワードは8文字以上で、英数字を含めてください")
        } else {
          setError("登録に失敗しました: " + signUpError.message)
        }
        return
      }

      if (data.user) {
        console.log("User created successfully:", {
          userId: data.user.id,
          email: data.user.email,
          needsConfirmation: !data.session,
        })

        // メール認証が必要な場合は認証画面に遷移
        if (!data.session) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&userType=signup`)
        } else {
          // 即座に認証された場合は認証完了画面に遷移
          router.push("/auth/confirm")
        }
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError("予期しないエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-md">
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">JobMatch</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">アカウント作成</CardTitle>
            <CardDescription>JobMatchへようこそ！まずはアカウントを作成しましょう</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="8文字以上で入力してください"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード確認 *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="パスワードを再入力してください"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    アカウント作成中...
                  </>
                ) : (
                  "アカウント作成"
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                すでにアカウントをお持ちですか？{" "}
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                  ログイン
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
