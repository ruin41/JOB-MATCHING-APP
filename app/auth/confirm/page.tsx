"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function AuthConfirmPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const processAuthentication = async () => {
      try {
        console.log("=== Job Matching App - Auth Confirm ===")

        // URLフラグメントから認証トークンを取得
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get("access_token")
          const refreshToken = params.get("refresh_token")
          const type = params.get("type")

          console.log("Auth tokens detected:", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            type,
          })

          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            })

            if (error) {
              console.error("Session setup error:", error)
              setError("メール認証に失敗しました。認証リンクが無効または期限切れの可能性があります。")
              setIsProcessing(false)
              return
            }

            if (data.user) {
              console.log("User authenticated successfully:", data.user.id)
              setUser(data.user)
              setIsSuccess(true)
              window.history.replaceState({}, document.title, window.location.pathname)
              setTimeout(() => router.push("/signup/role"), 2000)
              setIsProcessing(false)
              return
            }
          }
        }

        // 追加のセッション確認
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session check error:", sessionError)
          setError("認証状態の確認中にエラーが発生しました。")
          setIsProcessing(false)
          return
        }

        if (session?.user) {
          console.log("Existing session found:", session.user.id)
          setUser(session.user)
          setIsSuccess(true)
          router.push("/signup/role")
          return
        }

        console.log("No authentication data found")
        setError("メール認証に失敗しました。認証リンクから正しくアクセスしてください。")
        setIsProcessing(false)
      } catch (error) {
        console.error("Authentication processing error:", error)
        setError("予期しないエラーが発生しました。もう一度お試しください。")
        setIsProcessing(false)
      }
    }

    processAuthentication()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">Job Matching App</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isProcessing ? (
            <>
              <div className="w-16 h-16 bg-blue-100 border border-blue-200 rounded-full p-4 mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">メール認証を確認中</CardTitle>
              <CardDescription>認証状態を確認しています。しばらくお待ちください...</CardDescription>
            </>
          ) : isSuccess ? (
            <>
              <div className="w-16 h-16 bg-green-100 border border-green-200 rounded-full p-4 mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">認証完了！</CardTitle>
              <CardDescription>
                メール認証が正常に完了しました。
                <br />
                {user?.email && <><strong>{user.email}</strong> でログインしました。</>}
                <br />
                <span className="text-sm text-gray-600">まもなくロール選択画面に移動します...</span>
              </CardDescription>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 border border-red-200 rounded-full p-4 mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">認証エラー</CardTitle>
              <CardDescription className="text-red-600">{error}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">認証が完了しました。ロール選択画面に移動しています...</p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">認証に問題が発生しました。以下をお試しください：</p>
                <ul className="text-xs text-red-700 mt-2 list-disc list-inside">
                  <li>メールの認証リンクを再度クリック</li>
                  <li>新しいタブで認証リンクを開く</li>
                  <li>ブラウザのキャッシュをクリア</li>
                </ul>
              </div>
              <Link href="/signup">
                <Button variant="outline" className="w-full">サインアップページに戻る</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">ログインページに戻る</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
