"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Zap, MessageCircle, Target } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        console.log("=== トップページ認証チェック開始 ===")

        // 退会処理直後の場合、すべてのCookieをクリア
        const checkForStaleAuth = () => {
          if (typeof document === "undefined") return false

          const cookies = document.cookie.split(";").reduce(
            (acc, cookie) => {
              const [key, value] = cookie.trim().split("=")
              acc[key] = value
              return acc
            },
            {} as Record<string, string>,
          )

          // 認証関連Cookieが存在するが、実際のユーザーデータが取得できない場合
          const hasAuthCookies = !!(cookies["current-user"] || cookies["demo-user"] || cookies["supabase-auth-token"])

          if (hasAuthCookies) {
            console.log("認証Cookie検出、有効性を確認中...")
            return true
          }
          return false
        }

        if (checkForStaleAuth()) {
          console.log("古い認証情報の可能性があるため、クリーンアップを実行")
        }

        // Server ActionでCookieから認証状態をチェック
        const { getCurrentUserAction, restoreSessionAction } = await import("@/app/actions/auth")
        const result = await getCurrentUserAction()

        console.log("認証チェック結果:", result)

        if (result.user) {
          console.log("ユーザー発見:", result.user.id, "タイプ:", result.userType)
          setUser(result.user)

          // ユーザーのロール状態をチェック
          const userType = result.userType

          if (!userType) {
            // ロールが未設定の場合はロール選択画面へ
            console.log("ロール未設定 → ロール選択画面")
            router.push("/signup/role")
            return
          } else {
            // ロールが設定済みの場合は適切な画面へ
            const redirectPath = userType === "company" ? "/swipe/company" : "/swipe/jobseeker"
            console.log("ロール設定済み → リダイレクト:", redirectPath)
            router.push(redirectPath)
            return
          }
        } else {
          console.log("getCurrentUserActionでユーザーが見つからない")

          // Cookieが存在するかチェック
          const checkCookies = () => {
            if (typeof document === "undefined") return false

            const cookies = document.cookie.split(";").reduce(
              (acc, cookie) => {
                const [key, value] = cookie.trim().split("=")
                acc[key] = value
                return acc
              },
              {} as Record<string, string>,
            )

            console.log("利用可能なCookie:", Object.keys(cookies))

            return !!(cookies["current-user"] || cookies["demo-user"] || cookies["supabase-auth-token"])
          }

          const hasCookies = checkCookies()
          console.log("認証関連Cookieの存在:", hasCookies)

          if (hasCookies) {
            console.log("Cookieが存在するため、セッション復元を試行")

            // リフレッシュトークンでセッション復元を試行
            try {
              const refreshToken = document.cookie
                .split(";")
                .find((cookie) => cookie.trim().startsWith("supabase-refresh-token="))
                ?.split("=")[1]

              if (refreshToken) {
                console.log("リフレッシュトークンでセッション復元を試行")
                const restoreResult = await restoreSessionAction(refreshToken)

                if (restoreResult.success) {
                  console.log("セッション復元成功、再度認証チェック")
                  // セッション復元成功後、再度認証チェック
                  const retryResult = await getCurrentUserAction()

                  if (retryResult.user) {
                    console.log("復元後ユーザー確認:", retryResult.user.id)
                    const userType = retryResult.userType
                    const redirectPath = userType === "company" ? "/swipe/company" : "/swipe/jobseeker"
                    console.log("復元後リダイレクト:", redirectPath)
                    router.push(redirectPath)
                    return
                  }
                } else {
                  console.log("セッション復元失敗:", restoreResult.error)
                }
              } else {
                console.log("リフレッシュトークンが見つからない")
              }
            } catch (restoreError) {
              console.error("セッション復元エラー:", restoreError)
            }

            // セッション復元に失敗した場合、古いCookieをクリア
            console.log("セッション復元失敗、古いCookieをクリア")
            const cookiesToClear = [
              "current-user",
              "demo-user",
              "supabase-auth-token",
              "supabase-refresh-token",
              "sb-user",
            ]

            cookiesToClear.forEach((cookieName) => {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            })
          }

          console.log("認証されていない状態、ホームページを表示")
        }
      } catch (error) {
        console.error("認証チェックエラー:", error)

        // エラーが発生した場合もCookieをクリア
        if (typeof document !== "undefined") {
          const cookiesToClear = [
            "current-user",
            "demo-user",
            "supabase-auth-token",
            "supabase-refresh-token",
            "sb-user",
          ]

          cookiesToClear.forEach((cookieName) => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          })
        }
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuthAndRedirect()
  }, [router])

  // 認証チェック中はローディング表示
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Heart className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">JobMatch</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <span className="text-sm text-gray-600">ようこそ、{user.email}さん</span>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  ログイン
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            あなたに合った企業と、
            <br />
            <span className="text-purple-600">スワイプで出会おう</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            直感的なスワイプUIで、理想の転職先を見つけよう。企業と求職者が簡単・スピーディに相互選択できる新しい転職体験。
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg">
              <Heart className="w-5 h-5 mr-2" />
              JobMatchを始める
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">JobMatchの特徴</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">直感的なスワイプUI</h3>
                <p className="text-gray-600">
                  複雑な検索は不要。気になる企業や人材を左右のスワイプするだけで、簡単にアプローチできます。
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">企業と直接連絡</h3>
                <p className="text-gray-600">マッチング成立後は、企業と求職者がチャットで直接やり取りできます。</p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">スキルマッチング</h3>
                <p className="text-gray-600">
                  求職者の「いいね」と企業の募集スキルが一致していると、自動でマッチング!
                  <br />
                  <br />
                  もしスキル条件が一致していなくても、企業が「いいね」をすればマッチング成立。可能性のある求職者と企業のみがマッチングする、柔軟なマッチングシステムです。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">使い方はとても簡単</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">アカウント登録</h3>
              <p className="text-gray-600">求職者または企業として登録し、プロフィールを作成します。</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">スワイプで選択</h3>
              <p className="text-gray-600">気になる相手を右スワイプ、興味がない場合は左スワイプ。</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">マッチング成立</h3>
              <p className="text-gray-600">
                スキルマッチングorお互いが「いいね」したらマッチング成立!直接連絡を取れます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">JobMatch</span>
          </div>
          <p className="text-gray-400">© 2024 JobMatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
