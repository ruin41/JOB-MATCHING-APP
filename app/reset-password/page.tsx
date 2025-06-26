"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, CheckCircle, AlertCircle } from "lucide-react"
import CancelButton from "@/components/CancelButton"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Supabaseクライアントを作成
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })

      console.log("Sending password reset email to:", email)

      // パスワードリセットメールを送信
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      })

      if (resetError) {
        console.error("Password reset error:", resetError)
        setError(`パスワードリセットに失敗しました: ${resetError.message}`)
      } else {
        console.log("Password reset email sent successfully")
        setIsSuccess(true)
      }
    } catch (err) {
      console.error("Password reset error:", err)
      setError("パスワードリセット処理でエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
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
        {!isSuccess ? (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-end mb-4">
                <CancelButton />
              </div>
              <CardTitle className="text-2xl">パスワードリセット</CardTitle>
              <CardDescription>
                登録されたメールアドレスを入力してください。
                <br />
                パスワードリセット用のリンクをお送りします。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your-email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                    {isLoading ? "送信中..." : "リセットリンクを送信"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-end mb-4">
                <CancelButton />
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">送信完了</CardTitle>
              <CardDescription>
                パスワードリセット用のリンクを
                <br />
                <strong>{email}</strong>
                <br />
                に送信しました。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  メールが届かない場合は、迷惑メールフォルダもご確認ください。
                  <br />
                  リンクの有効期限は24時間です。
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
