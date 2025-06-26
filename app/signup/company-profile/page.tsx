"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, AlertCircle, Loader2 } from "lucide-react"
import { getSkillsAction, createCompanyProfileAction } from "@/app/actions/profile"
import { ImageUpload } from "@/components/ImageUpload"
import { supabase } from "@/lib/supabaseClient"
import { SimpleLocationSelect } from "@/components/SimpleLocationSelect"
import { Badge } from "@/components/ui/badge"

// 募集ポジションの選択肢（16種類）
const JOB_TYPE_OPTIONS = [
  { value: "frontend", label: "フロントエンドエンジニア" },
  { value: "backend", label: "バックエンドエンジニア" },
  { value: "fullstack", label: "フルスタックエンジニア" },
  { value: "mobile", label: "モバイルアプリエンジニア" },
  { value: "data", label: "データエンジニア" },
  { value: "ml", label: "機械学習エンジニア" },
  { value: "ai", label: "AIエンジニア" },
  { value: "devops", label: "DevOpsエンジニア" },
  { value: "security", label: "セキュリティエンジニア" },
  { value: "qa", label: "テストエンジニア / QAエンジニア" },
  { value: "pm", label: "プロダクトマネージャー" },
  { value: "infra", label: "インフラエンジニア" },
  { value: "designer", label: "UI/UXデザイナー" },
  { value: "support", label: "サポートエンジニア" },
  { value: "tech_support", label: "テクニカルサポートエンジニア" },
  { value: "lead", label: "リードエンジニア / エンジニアリングマネージャー" },
]

// 資格・免許の選択肢（統一）
const LICENSE_OPTIONS = [
  "基本情報技術者試験",
  "応用情報技術者試験",
  "ITパスポート試験",
  "情報処理安全確保支援士試験",
  "CompTIA Security+",
  "AWS認定ソリューションアーキテクト – アソシエイト",
  "Microsoft Certified: Azure Fundamentals",
  "LPI認定 Linux技術者（LPIC）",
  "Cisco Certified Network Associate（CCNA）",
  "なし",
]

// Cookie同期用のServer Action
async function syncSessionToCookies(session: any) {
  try {
    const response = await fetch("/api/sync-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        },
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
      }),
    })

    if (!response.ok) {
      throw new Error("Cookie同期に失敗しました")
    }

    console.log("Cookie同期成功")
    return { success: true }
  } catch (error) {
    console.error("Cookie同期エラー:", error)
    return { success: false, error: (error as Error).message }
  }
}

export default function CompanyProfilePage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [skillsByCategory, setSkillsByCategory] = useState<
    Array<{ category: string; skills: Array<{ id: string; name: string; category: string }> }>
  >([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // フォーム状態管理
  const [formData, setFormData] = useState({
    companyName: "",
    jobType: "",
    location: "",
    annualIncome: "",
    companyBio: "",
    requiredLicense: "",
  })

  useEffect(() => {
    const checkUserSession = async () => {
      console.log("=== 企業プロフィール画面: セッション確認開始 ===")

      try {
        // Supabaseセッション確認
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        console.log("Supabaseセッション確認結果:", { session: !!session, error: sessionError })

        if (sessionError) {
          console.error("セッション取得エラー:", sessionError)
          setError("セッションの取得に失敗しました")
          setIsCheckingAuth(false)
          return
        }

        if (session?.user) {
          console.log("Supabaseセッション有効:", session.user.id, session.user.user_metadata?.user_type)
          setCurrentUser(session.user)

          // ユーザータイプが企業かチェック
          const userType = session.user.user_metadata?.user_type
          if (userType && userType !== "company") {
            console.log("ユーザータイプが企業ではありません:", userType)
            setError("企業アカウントでログインしてください")
            setIsCheckingAuth(false)
            return
          }

          // SupabaseセッションをサーバーサイドのCookieに同期
          console.log("Cookieにセッション情報を同期中...")
          const syncResult = await syncSessionToCookies(session)

          if (syncResult.success) {
            console.log("Cookie同期成功")
          } else {
            console.error("Cookie同期失敗:", syncResult.error)
          }

          setIsCheckingAuth(false)
        } else {
          console.log("Supabaseセッションなし")
          setError("ログインが必要です。ロール選択画面にリダイレクトします。")

          // ロール選択画面にリダイレクト
          setTimeout(() => {
            router.push("/signup/role")
          }, 3000)

          setIsCheckingAuth(false)
        }
      } catch (error) {
        console.error("セッション確認エラー:", error)
        setError("認証状態の確認に失敗しました")
        setIsCheckingAuth(false)
      }
    }

    checkUserSession()
  }, [router])

  useEffect(() => {
    // Load available skills
    const loadSkills = async () => {
      console.log("スキル一覧を読み込み中...")
      try {
        const result = await getSkillsAction()
        if (result.success) {
          setSkillsByCategory(result.skillsByCategory || [])
          console.log("スキル読み込み成功:", result.skillsByCategory?.length, "カテゴリ")
        } else {
          console.error("スキル読み込み失敗")
        }
      } catch (error) {
        console.error("スキル読み込みエラー:", error)
      }
    }

    // セッション確認が完了してからスキルを読み込み
    if (!isCheckingAuth && currentUser) {
      loadSkills()
    }
  }, [isCheckingAuth, currentUser])

  const handleSkillChange = (skillName: string) => {
    setRequiredSkills((prev) => (prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("=== 企業プロフィール登録フォーム送信開始 ===")

    // 送信前にユーザー状態を再確認
    if (!currentUser) {
      setError("ユーザー情報が見つかりません。ページを再読み込みしてください。")
      return
    }

    console.log("送信時のユーザー情報:", currentUser.id, currentUser.user_metadata?.user_type)

    // 送信前にもう一度Cookie同期を実行
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        console.log("送信前のCookie同期実行中...")
        await syncSessionToCookies(session)
      }
    } catch (syncError) {
      console.error("送信前のCookie同期エラー:", syncError)
    }

    setIsLoading(true)
    setError(null)

    try {
      // FormDataを手動で構築
      const submitFormData = new FormData()

      // 基本情報を追加
      submitFormData.append("companyName", formData.companyName)
      submitFormData.append("jobType", formData.jobType)
      submitFormData.append("location", formData.location)
      submitFormData.append("annualIncome", formData.annualIncome)
      submitFormData.append("companyBio", formData.companyBio)
      submitFormData.append("requiredLicense", formData.requiredLicense)

      // 企業ロゴを追加
      if (selectedImage) {
        submitFormData.append("companyLogo", selectedImage)
        console.log("企業ロゴを追加:", selectedImage.name, selectedImage.size, "bytes")
      }

      // 必須スキルをカンマ区切り文字列として追加
      submitFormData.append("requiredSkills", requiredSkills.join(", "))

      // ユーザー情報も追加（認証問題の対策）
      submitFormData.append("userId", currentUser.id)
      submitFormData.append("userEmail", currentUser.email)
      submitFormData.append("userType", currentUser.user_metadata?.user_type || "company")

      console.log("送信データ:", {
        companyName: formData.companyName,
        jobType: formData.jobType,
        location: formData.location,
        annualIncome: formData.annualIncome,
        companyBio: formData.companyBio,
        requiredLicense: formData.requiredLicense,
        requiredSkills: requiredSkills,
        hasLogo: !!selectedImage,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userType: currentUser.user_metadata?.user_type || "company",
      })

      console.log("フォーム送信開始")

      const result = await createCompanyProfileAction(submitFormData)
      console.log("プロフィール作成結果:", result)

      if (result.error) {
        console.error("プロフィール作成エラー:", result.error)
        setError(result.error)
        return
      }

      console.log("プロフィール作成成功")

      // セッション状態を再確認してからリダイレクト
      try {
        console.log("リダイレクト前のセッション確認...")
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("セッション確認エラー:", sessionError)
          setError("セッションの確認に失敗しました。再度ログインしてください。")
          return
        }

        if (session?.user) {
          console.log("セッション有効、Cookie再同期中...")
          // セッション情報を再度Cookieに同期
          await syncSessionToCookies(session)

          // 少し待ってからリダイレクト（Cookie設定の完了を待つ）
          setTimeout(() => {
            console.log("企業スワイプ画面にリダイレクト")
            router.push("/swipe/company")
          }, 500)
        } else {
          console.error("セッション無効")
          setError("セッションが無効です。再度ログインしてください。")
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        }
      } catch (redirectError) {
        console.error("リダイレクト処理エラー:", redirectError)
        setError("リダイレクト処理でエラーが発生しました。")
      }
    } catch (err) {
      console.error("フォーム送信例外:", err)
      setError(`予期しないエラーが発生しました: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // 認証エラーがある場合の表示
  if (error && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">認証エラー</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/signup/role")} className="w-full">
              ロール選択に戻る
            </Button>
            <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
              ログイン画面に戻る
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link href="/" className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">JobMatch</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">企業プロフィール登録</CardTitle>
            <CardDescription>貴社の情報や募集要項を入力して、最適な人材とマッチングしましょう</CardDescription>
            {currentUser && (
              <div className="text-sm text-green-600">
                ログイン中: {currentUser.email} ({currentUser.user_metadata?.user_type || "未設定"})
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* 基本情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本情報</h3>

                <div className="space-y-2">
                  <Label>企業ロゴ</Label>
                  <ImageUpload
                    currentImageUrl={undefined}
                    onImageSelect={(file) => setSelectedImage(file)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">企業名 *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="株式会社〇〇"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobType">募集ポジション *</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => handleInputChange("jobType", value)}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="募集ポジションを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SimpleLocationSelect
                  label="勤務地"
                  value={formData.location}
                  onChange={(value) => handleInputChange("location", value)}
                  required
                  placeholder="勤務地を選択してください"
                  disabled={isLoading}
                />
              </div>

              {/* 採用情報 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">採用情報</h3>

                <div className="space-y-2">
                  <Label>必須スキル</Label>
                  <Select
                    value=""
                    onValueChange={(skillName) => {
                      if (skillName && !requiredSkills.includes(skillName)) {
                        setRequiredSkills([...requiredSkills, skillName])
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="スキルを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillsByCategory.map((categoryData) =>
                        categoryData.skills
                          .filter((skill) => !requiredSkills.includes(skill.name))
                          .map((skill) => (
                            <SelectItem key={skill.id} value={skill.name}>
                              {skill.name}
                            </SelectItem>
                          )),
                      )}
                    </SelectContent>
                  </Select>

                  {/* 選択されたスキルをBadgeで表示 */}
                  {requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {requiredSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => setRequiredSkills(requiredSkills.filter((s) => s !== skill))}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            disabled={isLoading}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">{requiredSkills.length}個のスキルを選択中</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualIncome">想定年収（万円）</Label>
                  <Input
                    id="annualIncome"
                    type="number"
                    value={formData.annualIncome}
                    onChange={(e) => handleInputChange("annualIncome", e.target.value)}
                    placeholder="500"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredLicense">必要な資格・免許</Label>
                  <Select
                    value={formData.requiredLicense}
                    onValueChange={(value) => handleInputChange("requiredLicense", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_OPTIONS.map((license) => (
                        <SelectItem key={license} value={license}>
                          {license}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 自社紹介 */}
              <div className="space-y-2">
                <Label htmlFor="companyBio">自社紹介文 *</Label>
                <Textarea
                  id="companyBio"
                  value={formData.companyBio}
                  onChange={(e) => handleInputChange("companyBio", e.target.value)}
                  placeholder="会社の事業内容、文化、働く環境について教えてください"
                  className="min-h-[120px]"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    登録中...
                  </>
                ) : (
                  "企業プロフィール登録完了"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
