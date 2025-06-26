"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Building2, User, RefreshCw } from "lucide-react"
import { getReceivedLikes } from "@/lib/database"
import { useAuthGuard } from "@/hooks/useAuthGuard"

// Development logging helper
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}

const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.error(...args)
  }
}

// 職種の表示名マッピング
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

interface ReceivedLike {
  id: string
  sender_user_id: string
  sender_type: "company" | "jobseeker"
  created_at: string
  company_profiles?: {
    company_name: string
    company_logo?: string
    job_type: string
    location: string
  }
  jobseeker_profiles?: {
    name: string
    photo_url?: string
    job_type: string
    preferred_location: string
  }
}

export default function LikesCounter() {
  const { isAuthenticated, currentUser } = useAuthGuard()
  const [receivedLikes, setReceivedLikes] = useState<ReceivedLike[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReceivedLikes = async () => {
    if (!isAuthenticated || !currentUser?.id) return

    try {
      devLog("受信いいね取得開始 - ユーザーID:", currentUser.id)
      setIsLoading(true)
      setError(null)

      const likes = await getReceivedLikes(currentUser.id)
      devLog("取得した受信いいね:", likes)
      setReceivedLikes(likes)
    } catch (err) {
      devError("受信いいね取得エラー:", err)
      setError("いいね情報の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReceivedLikes()
  }, [isAuthenticated, currentUser])

  // 職種の表示名を取得
  const getJobTypeLabel = (jobType: string) => {
    return JOB_TYPE_LABELS[jobType] || jobType || "未設定"
  }

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            受信いいね
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            受信いいね
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={fetchReceivedLikes}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchReceivedLikes} variant="outline">
              再試行
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          受信いいね
          <Badge variant="secondary" className="ml-auto">
            {receivedLikes.length}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchReceivedLikes}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {receivedLikes.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">まだいいねを受信していません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivedLikes.map((like) => {
              const profile = like.sender_type === "company" ? like.company_profiles : like.jobseeker_profiles

              if (!profile) {
                devLog("プロフィール情報が見つかりません:", like)
                return null
              }

              const isCompany = like.sender_type === "company"
              const name = isCompany ? (profile as any).company_name : (profile as any).name
              const avatar = isCompany ? (profile as any).company_logo : (profile as any).photo_url
              const jobType = profile.job_type
              const location = isCompany ? (profile as any).location : (profile as any).preferred_location

              return (
                <div
                  key={like.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
                    <AvatarFallback>
                      {isCompany ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{name}</p>
                      <Badge variant="outline" className="text-xs">
                        {isCompany ? "企業" : "求職者"}
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-600 truncate">{getJobTypeLabel(jobType)}</p>
                    <p className="text-xs text-gray-500 truncate">{location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatDate(like.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
