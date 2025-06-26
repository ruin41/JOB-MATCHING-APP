"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart } from "lucide-react"
import { createUserAction } from "@/app/actions/auth"

export default function UserRegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createUserAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        // 🔹 Create成功後は/mypage/jobseekerにリダイレクト
        router.push("/mypage/jobseeker")
      }
    } catch (err) {
      setError("予期しないエラーが発生しました")
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
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ユーザー新規登録</CardTitle>
          <CardDescription>アカウントを作成してJobMatchを始めましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="6文字以上のパスワード"
                required
                disabled={isLoading}
              />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登録中..." : "アカウントを作成"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちですか？{" "}
              <Link href="/login" className="text-purple-600 hover:underline">
                ログイン
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
