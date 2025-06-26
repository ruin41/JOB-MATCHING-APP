"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Building2, AlertCircle, CheckCircle } from "lucide-react"
import { PasswordInput } from "@/components/PasswordInput"
import { signUpCompanyAction } from "@/app/actions/auth"

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUpCompanyAction(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success) {
        setSuccess(true)
        if (!result.session) {
          const email = formData.get("email") as string
          setTimeout(() => {
            router.push("/auth/verify-email?email=" + encodeURIComponent(email))
          }, 2000)
        } else {
          setTimeout(() => {
            router.push("/profile/company")
          }, 2000)
        }
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("予期しないエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">登録完了</CardTitle>
            <CardDescription>
              アカウントの登録が完了しました。
              <br />
              確認メールをお送りしましたので、メールをご確認ください。
            </CardDescription>
          </CardHeader>
        </Card>
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
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">企業登録</CardTitle>
          <CardDescription>アカウントを作成して、優秀な人材とマッチングしましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleRegister}>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company-email">企業メールアドレス</Label>
                <Input id="company-email" name="email" type="email" placeholder="company@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-password">パスワード</Label>
                <PasswordInput id="company-password" name="password" required />
                <p className="text-xs text-gray-500">8文字以上で、英数字を含めてください</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-confirm-password">パスワード（確認）</Label>
                <PasswordInput id="company-confirm-password" name="confirmPassword" required />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? "登録中..." : "登録する"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-600">
            すでにアカウントをお持ちの方は
            <Link href="/login" className="text-purple-600 hover:underline ml-1">
              ログイン
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
