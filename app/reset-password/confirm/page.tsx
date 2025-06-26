"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import CancelButton from "@/components/CancelButton"

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // URLからアクセストークンを取得
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (!accessToken) {
      setError("無効なリセットリンクです")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error("Password update error:", updateError)
        setError(`パスワード更新に失敗しました: ${updateError.message}`)
      } else {
        console.log("Password updated successfully")
        setIsSuccess(true)
        // 3秒後にログイン画面にリダイレクト
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (err) {
      console.error("Password update error:", err)
      setError("パスワード更新処理でエラーが発生しました")
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
              <CardTitle className="text-2xl">新しいパスワード設定</CardTitle>
              <CardDescription>新しいパスワードを入力してください。</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">新しいパスワード</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="8文字以上で入力してください"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">パスワード確認</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="パスワードを再入力してください"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {isLoading ? "更新中..." : "パスワードを更新"}
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
              <CardTitle className="text-2xl">パスワード更新完了</CardTitle>
              <CardDescription>
                パスワードが正常に更新されました。
                <br />
                3秒後にログイン画面に移動します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Link href="/login">
                  <Button className="bg-purple-600 hover:bg-purple-700">今すぐログイン</Button>
                </Link>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
