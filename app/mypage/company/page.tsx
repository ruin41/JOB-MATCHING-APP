"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Building2, Edit, Trash2, Key, Mail, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import LogoutButton from "@/components/LogoutButton"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { getCompanyProfileAction } from "@/app/actions/profile"

// 募集職種の表示名マッピング（16種類）
const JOB_TYPE_LABELS: { [key: string]: string } = {
  frontend: "フロントエンドエンジニア",
  backend: "バックエンドエンジニア",
  fullstack: "フルスタックエンジニア",
  mobile: "モバイルアプリエンジニア",
  data: "データエンジニア",
  ml: "機械学習エンジニア",
  ai: "AIエンジニア",
  devops: "DevOpsエンジニア",
  security: "セキュリティエンジニア",
  qa: "テストエンジニア / QAエンジニア",
  pm: "プロダクトマネージャー",
  infra: "インフラエンジニア",
  designer: "UI/UXデザイナー",
  support: "サポートエンジニア",
  tech_support: "テクニカルサポートエンジニア",
  lead: "リードエンジニア / エンジニアリングマネージャー",
}

// 年収をフォーマットする関数
function formatAnnualIncome(income?: number): string {
  if (!income) return "非公開"

  // 万円単位で表示
  if (income >= 10000) {
    return `${Math.floor(income / 10000)}万円`
  }

  return `${income.toLocaleString()}円`
}

// 必須スキルを解析する関数
function parseRequiredSkills(skills: any): string[] {
  console.log("解析前のスキルデータ:", skills, "型:", typeof skills)

  if (!skills) return []

  try {
    // 既に配列の場合
    if (Array.isArray(skills)) {
      console.log("配列として処理:", skills)
      // 配列の各要素をさらに解析
      const flatSkills: string[] = []

      for (const skill of skills) {
        if (typeof skill === "string") {
          // 文字列がJSON配列の場合は解析
          if (skill.startsWith("[") && skill.endsWith("]")) {
            try {
              const parsed = JSON.parse(skill)
              if (Array.isArray(parsed)) {
                flatSkills.push(...parsed.filter((s) => s && typeof s === "string"))
              } else {
                flatSkills.push(skill)
              }
            } catch {
              flatSkills.push(skill)
            }
          } else {
            flatSkills.push(skill)
          }
        } else if (Array.isArray(skill)) {
          flatSkills.push(...skill.filter((s) => s && typeof s === "string"))
        }
      }

      return flatSkills.filter((skill) => skill && skill.trim())
    }

    // 文字列の場合、JSON解析を試行
    if (typeof skills === "string") {
      console.log("文字列として解析を試行:", skills)

      // 段階的にJSON解析
      let parsed = skills
      let parseCount = 0
      const maxParseAttempts = 5 // 無限ループ防止

      while (typeof parsed === "string" && parseCount < maxParseAttempts) {
        const trimmed = parsed.trim()

        // JSON配列またはJSON文字列の形式をチェック
        if (
          (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
          (trimmed.startsWith('"[') && trimmed.endsWith(']"'))
        ) {
          try {
            const newParsed = JSON.parse(trimmed)
            if (newParsed === parsed) break // 解析結果が同じ場合は無限ループ防止
            parsed = newParsed
            parseCount++
            console.log(`JSON解析 ${parseCount}回目:`, parsed)
          } catch (e) {
            console.error(`JSON解析エラー (${parseCount + 1}回目):`, e)
            break
          }
        } else {
          break
        }
      }

      // 最終的に配列になった場合
      if (Array.isArray(parsed)) {
        const flatSkills: string[] = []

        for (const skill of parsed) {
          if (typeof skill === "string" && skill.trim()) {
            flatSkills.push(skill.trim())
          } else if (Array.isArray(skill)) {
            flatSkills.push(...skill.filter((s) => s && typeof s === "string" && s.trim()))
          }
        }

        return flatSkills
      }

      // カンマ区切りの文字列の場合
      if (typeof parsed === "string" && parsed.includes(",")) {
        return parsed
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill)
      }

      // 単一の文字列の場合
      if (typeof parsed === "string" && parsed.trim()) {
        return [parsed.trim()]
      }
    }

    console.log("解析できませんでした、空配列を返します")
    return []
  } catch (error) {
    console.error("スキル解析エラー:", error)
    return []
  }
}

export default function CompanyMyPage() {
  const { isLoading, isAuthenticated, currentUser } = useAuthGuard()
  const [profile, setProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // プロフィール情報を取得
  useEffect(() => {
    async function fetchProfile() {
      if (!isAuthenticated || !currentUser) return

      try {
        console.log("企業マイページ - プロフィール取得開始")
        setIsLoadingProfile(true)
        const result = await getCompanyProfileAction()

        if (result.error) {
          console.error("プロフィール取得エラー:", result.error)
          setError(result.error)
        } else if (result.profile) {
          console.log("取得したプロフィール:", result.profile)
          setProfile(result.profile)
        }
      } catch (err) {
        console.error("プロフィール取得エラー:", err)
        setError("プロフィールの取得に失敗しました")
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [isAuthenticated, currentUser])

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

  if (!isAuthenticated || !currentUser) {
    return null // リダイレクト中
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>再読み込み</Button>
        </div>
      </div>
    )
  }

  // 必須スキルを解析
  const parsedSkills = parseRequiredSkills(profile?.required_skills)

  // 募集職種の表示名を取得
  const jobTypeLabel = profile?.job_type ? JOB_TYPE_LABELS[profile.job_type] || profile.job_type : "未設定"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">JobMatch</span>
          </Link>

          <div className="flex space-x-4">
            <Link href="/swipe/company">
              <Button variant="ghost" size="sm">
                スワイプ画面
              </Button>
            </Link>
            <Link href="/chat?type=company">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                マッチ一覧
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-8">企業マイページ</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 企業情報 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">企業プロフィール</CardTitle>
                  <Link href="/profile/company">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.company_logo || "/placeholder.svg"} alt={profile?.company_name} />
                    <AvatarFallback>
                      <Building2 className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{profile?.company_name || "未設定"}</h2>
                    <p className="text-purple-600 font-medium">{jobTypeLabel}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">勤務地</h3>
                    <p className="text-gray-900">{profile?.location || "未設定"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">想定年収</h3>
                    <p className="text-gray-900">{formatAnnualIncome(profile?.annual_income)}</p>
                  </div>
                </div>

                {profile?.required_license && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">必要な資格・免許</h3>
                    <p className="text-gray-900">{profile.required_license}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">必須スキル</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedSkills.length > 0 ? (
                      parsedSkills.map((skill: string, index: number) => (
                        <Badge
                          key={`skill-${index}-${skill}`}
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">スキル情報がありません</p>
                    )}
                  </div>
                  {/* デバッグ情報（開発時のみ表示） */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <p>
                        <strong>デバッグ:</strong>
                      </p>
                      <p>元データ: {JSON.stringify(profile?.required_skills)}</p>
                      <p>解析結果: {JSON.stringify(parsedSkills)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">自社紹介</h3>
                  <p className="text-gray-900 leading-relaxed">{profile?.company_bio || "未設定"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* アカウント設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">アカウント設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* メールアドレス表示 */}
                <div className="border-b border-gray-100 pb-3">
                  <Link href="/settings/email" className="block group">
                    <div className="flex items-center justify-between p-2 rounded-md group-hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">メールアドレス</p>
                          <p className="text-sm text-gray-600">{currentUser?.email || "未設定"}</p>
                        </div>
                      </div>
                      <div className="text-gray-400 group-hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </div>

                <Link href="/reset-password" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    パスワード変更
                  </Button>
                </Link>
                <Link href="/withdraw" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    退会
                  </Button>
                </Link>
                <LogoutButton />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
