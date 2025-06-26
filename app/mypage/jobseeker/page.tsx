"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Edit, Trash2, Key, Mail, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { useState, useEffect } from "react"
import LogoutButton from "@/components/LogoutButton"
import { getJobseekerProfileAction } from "@/app/actions/profile"

// 職種の表示名マッピング（16種類）
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

export default function JobseekerMyPage() {
  const { isLoading, isAuthenticated, currentUser } = useAuthGuard()
  const [profile, setProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // プロフィール情報を取得
  useEffect(() => {
    async function fetchProfile() {
      if (!isAuthenticated || !currentUser) return

      try {
        console.log("求職者マイページ - プロフィール取得開始")
        setIsLoadingProfile(true)
        const result = await getJobseekerProfileAction()

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

  // 年齢計算関数
  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // スキルを配列に変換する関数
  const parseSkills = (skillsString: string) => {
    if (!skillsString) return []
    return skillsString
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0)
  }

  // 職種の表示名を取得
  const getJobTypeLabel = (jobType: string) => {
    return JOB_TYPE_LABELS[jobType] || jobType || "未設定"
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
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()}>再読み込み</Button>
            <Link href="/signup/jobseeker-profile">
              <Button variant="outline">プロフィールを登録する</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
            <Link href="/swipe/jobseeker">
              <Button variant="ghost" size="sm">
                スワイプ画面
              </Button>
            </Link>
            <Link href="/chat">
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
        <h1 className="text-2xl font-bold mb-8">マイページ</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロフィール情報 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">プロフィール</CardTitle>
                  <Link href="/edit/jobseeker">
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
                    <AvatarImage src={profile?.photo_url || "/placeholder.svg"} alt={profile?.name || "ユーザー"} />
                    <AvatarFallback>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{profile?.name || "名前未設定"}</h2>
                    <p className="text-purple-600 font-medium">{getJobTypeLabel(profile?.occupation)}</p>
                    {profile?.birthdate && <p className="text-gray-600">{calculateAge(profile.birthdate)}歳</p>}
                    {profile?.gender && (
                      <p className="text-gray-600">
                        {profile.gender === "male"
                          ? "男性"
                          : profile.gender === "female"
                            ? "女性"
                            : profile.gender === "other"
                              ? "その他"
                              : "回答しない"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">居住地</h3>
                    <p className="text-gray-900">{profile?.location || "未設定"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">希望勤務地</h3>
                    <p className="text-gray-900">{profile?.preferred_location || "未設定"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">経験年数</h3>
                    <p className="text-gray-900">{profile?.experience_years || "未設定"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">希望年収</h3>
                    <p className="text-gray-900">
                      {profile?.desired_annual_income ? `${profile.desired_annual_income}万円` : "未設定"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">現在の状況</h3>
                    <p className="text-gray-900">
                      {profile?.current_status === "employed"
                        ? "現職中"
                        : profile?.current_status === "unemployed"
                          ? "離職中"
                          : profile?.current_status === "student"
                            ? "学生"
                            : profile?.current_status === "freelance"
                              ? "フリーランス"
                              : "未設定"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">転職希望時期</h3>
                    <p className="text-gray-900">
                      {profile?.desired_transfer_timing === "immediately"
                        ? "すぐにでも"
                        : profile?.desired_transfer_timing === "within_1_month"
                          ? "1ヶ月以内"
                          : profile?.desired_transfer_timing === "within_3_months"
                            ? "3ヶ月以内"
                            : profile?.desired_transfer_timing === "within_6_months"
                              ? "6ヶ月以内"
                              : profile?.desired_transfer_timing === "within_1_year"
                                ? "1年以内"
                                : profile?.desired_transfer_timing === "good_opportunity"
                                  ? "良い機会があれば"
                                  : "未設定"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">希望職種</h3>
                    <p className="text-gray-900">{getJobTypeLabel(profile?.desired_job_type)}</p>
                  </div>
                </div>

                {profile?.license && profile.license !== "none" && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">保有資格</h3>
                    <p className="text-gray-900">{profile.license}</p>
                  </div>
                )}

                {profile?.skills && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">スキル</h3>
                    <div className="flex flex-wrap gap-2">
                      {parseSkills(profile.skills).map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile?.bio && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">自己紹介</h3>
                    <p className="text-gray-900 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
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
