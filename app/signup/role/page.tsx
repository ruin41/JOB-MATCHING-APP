"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Users, Building, ArrowRight, Loader2, Shield } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function RoleSelectionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"jobseeker" | "company" | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session check error:", error)
          router.push("/login")
          return
        }

        if (!session?.user) {
          console.log("No authenticated user, redirecting to signup")
          router.push("/signup")
          return
        }

        setUser(session.user)

        // 既にロールが設定されている場合は適切な画面にリダイレクト
        const userType = session.user.user_metadata?.user_type
        if (userType) {
          console.log("User already has role:", userType)

          // プロフィールの存在をチェックしてリダイレクト先を決定
          try {
            let hasProfile = false

            if (userType === "jobseeker") {
              const { data: profile } = await supabase
                .from("jobseeker_profiles")
                .select("id")
                .eq("user_id", session.user.id)
                .single()
              hasProfile = !!profile
            } else if (userType === "company") {
              const { data: profile } = await supabase
                .from("company_profiles")
                .select("id")
                .eq("user_id", session.user.id)
                .single()
              hasProfile = !!profile
            }

            if (hasProfile) {
              // プロフィール作成済み → スワイプ画面
              const redirectPath = userType === "company" ? "/swipe/company" : "/swipe/jobseeker"
              router.push(redirectPath)
            } else {
              // プロフィール未作成 → プロフィール登録画面
              const redirectPath = userType === "company" ? "/signup/company-profile" : "/signup/jobseeker-profile"
              router.push(redirectPath)
            }
          } catch (profileCheckError) {
            console.error("Profile check error:", profileCheckError)
            // エラーの場合はプロフィール登録画面にリダイレクト
            const redirectPath = userType === "company" ? "/signup/company-profile" : "/signup/jobseeker-profile"
            router.push(redirectPath)
          }
          return
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/signup")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleRoleSelection = async (role: "jobseeker" | "company") => {
    if (!user) return

    setIsLoading(true)
    setSelectedRole(role)

    try {
      console.log("=== ロール選択開始 ===")
      console.log("選択されたロール:", role)
      console.log("ユーザーID:", user.id)

      // ユーザーのメタデータを更新
      const { data, error } = await supabase.auth.updateUser({
        data: {
          user_type: role,
        },
      })

      if (error) {
        console.error("Role update error:", error)
        alert("ロールの設定に失敗しました。もう一度お試しください。")
        return
      }

      console.log("ロール更新成功:", data.user?.user_metadata)

      // セッションを強制的に更新して、メタデータの変更を即時反映
      await supabase.auth.refreshSession()
      console.log("セッションを更新しました")

      // public_usersテーブルにもユーザー情報を保存
      const { error: insertError } = await supabase.from("public_users").upsert({
        id: user.id,
        role: role,
      })

      if (insertError) {
        console.error("Public users insert error:", insertError)
        // エラーがあってもプロフィール画面に進む
      }

      // ロールに応じたプロフィール登録画面に遷移
      const profilePath = role === "company" ? "/signup/company-profile" : "/signup/jobseeker-profile"
      console.log("リダイレクト先:", profilePath)
      router.push(profilePath)
    } catch (error) {
      console.error("Role selection error:", error)
      alert("予期しないエラーが発生しました。もう一度お試しください。")
    } finally {
      setIsLoading(false)
      setSelectedRole(null)
    }
  }

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-600">認証が必要です</p>
          <Link href="/signup" className="mt-4 inline-block">
            <Button>サインアップページに戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Job Matching App</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">利用タイプを選択してください</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Job Matching Appでは、求職者と企業の2つの利用タイプがあります。
            <br />
            あなたの目的に合ったタイプを選択してください。
          </p>
          {user?.email && (
            <p className="text-sm text-gray-500 mt-2">
              ログイン中: <strong>{user.email}</strong>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 求職者カード */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">求職者として登録</CardTitle>
              <CardDescription className="text-base">転職・就職活動中の方向け</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                  企業からのスカウトを受け取る
                </li>
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                  気になる企業にアプローチ
                </li>
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                  スワイプで効率的な転職活動
                </li>
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
                  マッチング後は直接連絡可能
                </li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("jobseeker")}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading && selectedRole === "jobseeker" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    設定中...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    求職者として始める
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 企業カード */}
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Building className="w-10 h-10 text-purple-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">企業として登録</CardTitle>
              <CardDescription className="text-base">採用担当者・人事の方向け</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                  優秀な人材を発見・スカウト
                </li>
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                  求職者からのアプローチを受信
                </li>
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                  効率的な採用活動を実現
                </li>
                <li className="flex items-center text-gray-600">
                  <ArrowRight className="w-4 h-4 mr-2 text-purple-600" />
                  マッチング後は直接連絡可能
                </li>
              </ul>
              <Button
                onClick={() => handleRoleSelection("company")}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading && selectedRole === "company" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    設定中...
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 mr-2" />
                    企業として始める
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            登録後、プロフィール情報を入力していただきます。
            <br />
            いつでも設定から変更可能です。
          </p>
        </div>
      </div>
    </div>
  )
}
