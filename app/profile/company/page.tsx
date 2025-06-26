"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Upload, ArrowLeft, Save } from "lucide-react"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { getCompanyProfileAction, getSkillsAction, updateCompanyProfileAction } from "@/app/actions/profile"
import Link from "next/link"
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

export default function CompanyProfileEditPage() {
  const { isLoading, isAuthenticated } = useAuthGuard()
  const router = useRouter()

  // フォーム状態
  const [formData, setFormData] = useState({
    companyName: "",
    jobType: "",
    location: "",
    annualIncome: "",
    companyBio: "",
    requiredLicense: "",
    companyLogo: null as File | null,
  })

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillsByCategory, setSkillsByCategory] = useState<
    Array<{ category: string; skills: Array<{ id: string; name: string; category: string }> }>
  >([])
  const [previewImage, setPreviewImage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // プロフィール情報とスキル情報を取得
  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return

      try {
        setIsLoadingProfile(true)

        // プロフィール情報を取得
        const profileResult = await getCompanyProfileAction()
        if (profileResult.success && profileResult.profile) {
          const profile = profileResult.profile
          setFormData({
            companyName: profile.company_name || "",
            jobType: profile.job_type || "",
            location: profile.location || "",
            annualIncome: profile.annual_income ? profile.annual_income.toString() : "",
            companyBio: profile.company_bio || "",
            requiredLicense: profile.required_license || "",
            companyLogo: null,
          })

          // 必須スキルを設定
          if (profile.required_skills) {
            if (typeof profile.required_skills === "string") {
              setSelectedSkills(profile.required_skills.split(", ").filter(Boolean))
            }
          }

          // プレビュー画像を設定
          if (profile.company_logo) {
            setPreviewImage(profile.company_logo)
          }
        }

        // スキル情報を取得
        const skillsResult = await getSkillsAction()
        if (skillsResult.success) {
          setSkillsByCategory(skillsResult.skillsByCategory || [])
          // デフォルトで最初のカテゴリを展開
        }
      } catch (err) {
        console.error("データ取得エラー:", err)
        setError("データの取得に失敗しました")
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchData()
  }, [isAuthenticated])

  // 入力値の変更処理
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 画像選択処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        companyLogo: file,
      }))

      // プレビュー画像を設定
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // FormDataを構築
      const submitFormData = new FormData()
      submitFormData.append("companyName", formData.companyName)
      submitFormData.append("jobType", formData.jobType)
      submitFormData.append("location", formData.location)
      submitFormData.append("annualIncome", formData.annualIncome)
      submitFormData.append("companyBio", formData.companyBio)
      submitFormData.append("requiredLicense", formData.requiredLicense)

      // 必須スキルをカンマ区切り文字列として追加
      submitFormData.append("requiredSkills", selectedSkills.join(", "))

      // 画像ファイルを追加
      if (formData.companyLogo) {
        submitFormData.append("companyLogo", formData.companyLogo)
      }

      const result = await updateCompanyProfileAction(submitFormData)
      // ... 残りの処理

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("プロフィールを更新しました")
        // 3秒後にマイページにリダイレクト
        setTimeout(() => {
          router.push("/mypage/company")
        }, 3000)
      }
    } catch (err) {
      // ... エラー処理
      console.error("フォーム送信エラー:", err)
      setError("予期しないエラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // リダイレクト中
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/mypage/company">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                マイページに戻る
              </Button>
            </Link>
            <h1 className="text-xl font-bold">企業プロフィール編集</h1>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>企業プロフィール編集</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 企業ロゴ */}
              <div className="space-y-2">
                <Label>企業ロゴ</Label>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={previewImage || "/placeholder.svg"} alt="企業ロゴ" />
                    <AvatarFallback>
                      <Building2 className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="companyLogo"
                    />
                    <Label htmlFor="companyLogo" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          画像を選択
                        </span>
                      </Button>
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG形式（最大5MB）</p>
                  </div>
                </div>
              </div>

              {/* 企業名 */}
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  企業名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="株式会社○○"
                  required
                />
              </div>

              {/* 募集ポジション */}
              <div className="space-y-2">
                <Label htmlFor="jobType">
                  募集ポジション <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.jobType} onValueChange={(value) => handleInputChange("jobType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="募集ポジションを選択" />
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

              {/* 勤務地 */}
              <SimpleLocationSelect
                label="勤務地"
                value={formData.location}
                onChange={(value) => handleInputChange("location", value)}
                required
                placeholder="勤務地を選択してください"
              />

              {/* 想定年収 */}
              <div className="space-y-2">
                <Label htmlFor="annualIncome">想定年収（万円）</Label>
                <Input
                  id="annualIncome"
                  type="number"
                  value={formData.annualIncome}
                  onChange={(e) => handleInputChange("annualIncome", e.target.value)}
                  placeholder="500"
                  min="0"
                />
              </div>

              {/* 必須スキル */}
              <div className="space-y-2">
                <Label>必須スキル</Label>
                <Select
                  value=""
                  onValueChange={(skillName) => {
                    if (skillName && !selectedSkills.includes(skillName)) {
                      setSelectedSkills([...selectedSkills, skillName])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="スキルを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillsByCategory.map((categoryData) =>
                      categoryData.skills
                        .filter((skill) => !selectedSkills.includes(skill.name))
                        .map((skill) => (
                          <SelectItem key={skill.id} value={skill.name}>
                            {skill.name}
                          </SelectItem>
                        )),
                    )}
                  </SelectContent>
                </Select>

                {/* 選択されたスキルをBadgeで表示 */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => setSelectedSkills(selectedSkills.filter((s) => s !== skill))}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-500">選択されたスキル: {selectedSkills.length}個</p>
              </div>

              {/* 必要な資格・免許 */}
              <div className="space-y-2">
                <Label htmlFor="requiredLicense">必要な資格・免許</Label>
                <Select
                  value={formData.requiredLicense}
                  onValueChange={(value) => handleInputChange("requiredLicense", value)}
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

              {/* 自社紹介文 */}
              <div className="space-y-2">
                <Label htmlFor="companyBio">
                  自社紹介文 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="companyBio"
                  value={formData.companyBio}
                  onChange={(e) => handleInputChange("companyBio", e.target.value)}
                  placeholder="自社の特徴や魅力、働く環境について記載してください"
                  rows={5}
                  required
                />
              </div>

              {/* エラー・成功メッセージ */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-green-600 text-sm">{success}</p>
                  <p className="text-green-600 text-xs mt-1">3秒後にマイページに戻ります...</p>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex space-x-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      更新中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      プロフィールを更新
                    </>
                  )}
                </Button>
                <Link href="/mypage/company">
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
