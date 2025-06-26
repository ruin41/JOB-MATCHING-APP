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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Heart, AlertCircle, Loader2 } from "lucide-react"
import { getSkillsAction, createJobseekerProfileAction } from "@/app/actions/profile"
import { ImageUpload } from "@/components/ImageUpload"
import { supabase } from "@/lib/supabaseClient"
import { SimpleLocationSelect } from "@/components/SimpleLocationSelect"
import { Badge } from "@/components/ui/badge"

// 職種の選択肢（16種類）
const JOB_TYPE_OPTIONS = [
  { value: "inexperienced", label: "未経験" },
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

// 現在の状況の選択肢
const CURRENT_STATUS_OPTIONS = [
  { value: "employed", label: "在職中" },
  { value: "unemployed", label: "離職中" },
  { value: "student", label: "学生" },
  { value: "freelance", label: "フリーランス" },
  { value: "other", label: "その他" },
]

// 転職希望時期の選択肢
const TRANSFER_TIMING_OPTIONS = [
  { value: "immediately", label: "すぐにでも" },
  { value: "within_3months", label: "3ヶ月以内" },
  { value: "within_6months", label: "6ヶ月以内" },
  { value: "within_1year", label: "1年以内" },
  { value: "good_opportunity", label: "良い機会があれば" },
]

// 希望職種の選択肢（職種と同じ）
const DESIRED_JOB_TYPE_OPTIONS = [
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

export default function JobseekerProfilePage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [skills, setSkills] = useState<string[]>([])
  const [skillsByCategory, setSkillsByCategory] = useState<
    Array<{ category: string; skills: Array<{ id: string; name: string; category: string }> }>
  >([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // フォーム状態管理
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    gender: "",
    location: "",
    jobType: "",
    experienceYears: "",
    preferredLocation: "",
    desiredAnnualIncome: "",
    bio: "",
    license: "",
    currentStatus: "",
    desiredTransferTiming: "",
    desiredJobType: "",
  })

  useEffect(() => {
    const checkUserSession = async () => {
      console.log("=== 求職者プロフィール画面: セッション確認開始 ===")

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

          // ユーザータイプが求職者かチェック
          const userType = session.user.user_metadata?.user_type
          if (userType && userType !== "jobseeker") {
            console.log("ユーザータイプが求職者ではありません:", userType)
            setError("求職者アカウントでログインしてください")
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
    setSkills((prev) => (prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("=== 求職者プロフィール登録フォーム送信開始 ===")

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
      submitFormData.append("name", formData.name)
      submitFormData.append("birthDate", formData.birthDate)
      submitFormData.append("gender", formData.gender)
      submitFormData.append("location", formData.location)
      submitFormData.append("jobType", formData.jobType)
      submitFormData.append("experienceYears", formData.experienceYears)
      submitFormData.append("preferredLocation", formData.preferredLocation)
      submitFormData.append("desiredAnnualIncome", formData.desiredAnnualIncome)
      submitFormData.append("bio", formData.bio)
      submitFormData.append("license", formData.license)
      submitFormData.append("currentStatus", formData.currentStatus)
      submitFormData.append("desiredTransferTiming", formData.desiredTransferTiming)
      submitFormData.append("desiredJobType", formData.desiredJobType)

      // プロフィール画像を追加
      if (selectedImage) {
        submitFormData.append("profileImage", selectedImage)
        console.log("プロフィール画像を追加:", selectedImage.name, selectedImage.size, "bytes")
      }

      // スキルを個別に追加
      skills.forEach((skill) => {
        submitFormData.append("skills", skill)
      })

      // ユーザー情報も追加（認証問題の対策）
      submitFormData.append("userId", currentUser.id)
      submitFormData.append("userEmail", currentUser.email)
      submitFormData.append("userType", currentUser.user_metadata?.user_type || "jobseeker")

      console.log("送信データ:", {
        name: formData.name,
        birthDate: formData.birthDate,
        gender: formData.gender,
        location: formData.location,
        jobType: formData.jobType,
        experienceYears: formData.experienceYears,
        preferredLocation: formData.preferredLocation,
        desiredAnnualIncome: formData.desiredAnnualIncome,
        bio: formData.bio,
        license: formData.license,
        currentStatus: formData.currentStatus,
        desiredTransferTiming: formData.desiredTransferTiming,
        desiredJobType: formData.desiredJobType,
        skills: skills,
        hasImage: !!selectedImage,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userType: currentUser.user_metadata?.user_type || "jobseeker",
      })

      console.log("フォーム送信開始")

      const result = await createJobseekerProfileAction(submitFormData)
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
            console.log("求職者スワイプ画面にリダイレクト")
            router.push("/swipe/jobseeker")
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
            <CardTitle className="text-2xl">求職者プロフィール登録</CardTitle>
            <CardDescription>あなたの情報やスキルを入力して、最適な企業とマッチングしましょう</CardDescription>
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
                  <Label>プロフィール画像</Label>
                  <ImageUpload
                    currentImageUrl={undefined}
                    onImageSelect={(file) => setSelectedImage(file)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">氏名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="山田 太郎"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">生年月日</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>性別</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                    className="flex space-x-4"
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">男性</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">女性</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">その他</Label>
                    </div>
                  </RadioGroup>
                </div>

                <SimpleLocationSelect
                  label="現在の居住地"
                  value={formData.location}
                  onChange={(value) => handleInputChange("location", value)}
                  required
                  placeholder="居住地を選択してください"
                  disabled={isLoading}
                />
              </div>

              {/* 職歴・スキル */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">職歴・スキル</h3>

                <div className="space-y-2">
                  <Label htmlFor="jobType">現在の職種 *</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => handleInputChange("jobType", value)}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="職種を選択してください" />
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

                <div className="space-y-2">
                  <Label htmlFor="experienceYears">実務経験年数 *</Label>
                  <Select
                    value={formData.experienceYears}
                    onValueChange={(value) => handleInputChange("experienceYears", value)}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="経験年数を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">未経験</SelectItem>
                      <SelectItem value="1">1年未満</SelectItem>
                      <SelectItem value="2">1-2年</SelectItem>
                      <SelectItem value="3">3-5年</SelectItem>
                      <SelectItem value="6">6-10年</SelectItem>
                      <SelectItem value="11">11年以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>保有スキル</Label>
                  <Select
                    value=""
                    onValueChange={(skillName) => {
                      if (skillName && !skills.includes(skillName)) {
                        setSkills([...skills, skillName])
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
                          .filter((skill) => !skills.includes(skill.name))
                          .map((skill) => (
                            <SelectItem key={skill.id} value={skill.name}>
                              {skill.name}
                            </SelectItem>
                          )),
                      )}
                    </SelectContent>
                  </Select>

                  {/* 選択されたスキルをBadgeで表示 */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => setSkills(skills.filter((s) => s !== skill))}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            disabled={isLoading}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">{skills.length}個のスキルを選択中</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license">保有資格・免許</Label>
                  <Select
                    value={formData.license}
                    onValueChange={(value) => handleInputChange("license", value)}
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

              {/* 転職希望条件 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">転職希望条件</h3>

                <div className="space-y-2">
                  <Label htmlFor="currentStatus">現在の状況 *</Label>
                  <Select
                    value={formData.currentStatus}
                    onValueChange={(value) => handleInputChange("currentStatus", value)}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="現在の状況を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desiredTransferTiming">転職希望時期 *</Label>
                  <Select
                    value={formData.desiredTransferTiming}
                    onValueChange={(value) => handleInputChange("desiredTransferTiming", value)}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="転職希望時期を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSFER_TIMING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desiredJobType">希望職種 *</Label>
                  <Select
                    value={formData.desiredJobType}
                    onValueChange={(value) => handleInputChange("desiredJobType", value)}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="希望職種を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESIRED_JOB_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SimpleLocationSelect
                  label="希望勤務地"
                  value={formData.preferredLocation}
                  onChange={(value) => handleInputChange("preferredLocation", value)}
                  placeholder="希望勤務地を選択してください"
                  disabled={isLoading}
                />

                <div className="space-y-2">
                  <Label htmlFor="desiredAnnualIncome">希望年収（万円）</Label>
                  <Input
                    id="desiredAnnualIncome"
                    type="number"
                    value={formData.desiredAnnualIncome}
                    onChange={(e) => handleInputChange("desiredAnnualIncome", e.target.value)}
                    placeholder="400"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 自己紹介 */}
              <div className="space-y-2">
                <Label htmlFor="bio">自己紹介文 *</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="あなたの経験、スキル、転職への想いなどを教えてください"
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
                  "求職者プロフィール登録完了"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
