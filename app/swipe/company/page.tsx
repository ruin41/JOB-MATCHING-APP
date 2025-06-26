"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Heart,
  X,
  User,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  MessageSquare,
  Briefcase,
  Users,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CompanyFilterModal, { type CompanyFilterCriteria } from "@/components/CompanyFilterModal"
import MatchSuccessModal from "@/components/MatchSuccessModal"
import { sendLikeAction } from "@/app/actions/matching"
import { useRouter } from "next/navigation"
import { getJobseekersForCompany, getReceivedLikes } from "@/lib/database"

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

// 年齢計算関数
function calculateAge(birthdate?: string): number | null {
  if (!birthdate) return null
  try {
    const birth = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  } catch (error) {
    devError("Error calculating age:", error)
    return null
  }
}

// 職種ラベル変換関数
function getJobTypeLabel(jobType?: string): string {
  if (!jobType) return "未設定"

  const jobTypeLabels: { [key: string]: string } = {
    frontend: "フロントエンドエンジニア",
    backend: "バックエンドエンジニア",
    fullstack: "フルスタックエンジニア",
    mobile: "モバイルアプリエンジニア",
    devops: "DevOpsエンジニア",
    data_scientist: "データサイエンティスト",
    ml_engineer: "機械学習エンジニア",
    qa_engineer: "QAエンジニア",
    security_engineer: "セキュリティエンジニア",
    game_developer: "ゲーム開発者",
    ui_ux_designer: "UI/UXデザイナー",
    product_manager: "プロダクトマネージャー",
    project_manager: "プロジェクトマネージャー",
    sales_engineer: "セールスエンジニア",
    technical_writer: "テクニカルライター",
    consultant: "ITコンサルタント",
    other: "その他",
  }

  return jobTypeLabels[jobType] || jobType
}

// 現在の状況ラベル変換関数
function getCurrentStatusLabel(status?: string): string {
  if (!status) return "未設定"

  const statusLabels: { [key: string]: string } = {
    employed: "現職中",
    unemployed: "離職中",
    student: "学生",
    freelance: "フリーランス",
    other: "その他",
  }

  return statusLabels[status] || status
}

// 転職希望時期ラベル変換関数
function getTransferTimingLabel(timing?: string): string {
  if (!timing) return "未設定"

  const timingLabels: { [key: string]: string } = {
    immediately: "すぐにでも",
    within_1_month: "1ヶ月以内",
    within_3_months: "3ヶ月以内",
    within_6_months: "6ヶ月以内",
    within_1_year: "1年以内",
    undecided: "未定",
  }

  return timingLabels[timing] || timing
}

// 経験年数ラベル変換関数
function getExperienceYearsLabel(years?: string): string {
  if (!years) return "未設定"

  const yearsLabels: { [key: string]: string } = {
    no_experience: "未経験",
    less_than_1_year: "1年未満",
    "1_to_3_years": "1〜3年",
    "3_to_5_years": "3〜5年",
    "5_to_10_years": "5〜10年",
    more_than_10_years: "10年以上",
  }

  return yearsLabels[years] || years
}

// 希望年収フォーマット関数
function formatDesiredSalary(salary?: number): string {
  if (!salary || salary <= 0) return "応相談"
  return `${salary}万円`
}

// 性別フォーマット関数
function formatGender(gender?: string): string {
  if (!gender) return "未設定"

  const genderLabels: { [key: string]: string } = {
    male: "男性",
    female: "女性",
    other: "その他",
    prefer_not_to_say: "回答しない",
  }

  return genderLabels[gender] || "未設定"
}

// スキル配列変換関数
function formatSkillsArray(skills?: string): string[] {
  if (!skills || skills === "none" || skills.trim() === "") return []
  return skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
}

// 自己紹介文の省略表示
function truncateBio(bio: string, maxLength = 100): { text: string; isTruncated: boolean } {
  if (!bio || bio.length <= maxLength) {
    return { text: bio || "", isTruncated: false }
  }
  return { text: bio.substring(0, maxLength) + "...", isTruncated: true }
}

// JobseekerCardコンポーネント
const JobseekerCard = ({
  jobseeker,
  onSwipe,
  isProcessingLike,
}: {
  jobseeker: any
  onSwipe: (liked: boolean) => void
  isProcessingLike: boolean
}) => {
  const [showFullBio, setShowFullBio] = useState(false)
  const age = calculateAge(jobseeker.birthdate)
  const skillsArray = formatSkillsArray(jobseeker.skills)
  const { text: bioText, isTruncated } = truncateBio(jobseeker.bio, 100)

  const displayJobType = jobseeker.desired_job_type || jobseeker.occupation

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 mx-auto sm:mx-0">
            <AvatarImage
              src={jobseeker.photo_url || "/placeholder.svg?height=80&width=80"}
              alt={jobseeker.name || "求職者"}
            />
            <AvatarFallback>
              <User className="h-8 w-8 sm:h-10 sm:w-10" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{jobseeker.name || "未設定"}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-sm text-gray-600 mb-2">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {age ? `${age}歳` : "年齢未設定"}
              </span>
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {formatGender(jobseeker.gender)}
              </span>
            </div>
            {displayJobType && (
              <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                {getJobTypeLabel(displayJobType)}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <div>
              <span className="text-gray-700 font-medium">居住地:</span>
              <span className="ml-1 text-gray-600">{jobseeker.location || "未設定"}</span>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <div>
              <span className="text-gray-700 font-medium">希望勤務地:</span>
              <span className="ml-1 text-gray-600">{jobseeker.preferred_location || "未設定"}</span>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <DollarSign className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <div>
              <span className="text-gray-700 font-medium">希望年収:</span>
              <span className="ml-1 text-gray-600">{formatDesiredSalary(jobseeker.desired_annual_income)}</span>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <Briefcase className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <div>
              <span className="text-gray-700 font-medium">現在の状況:</span>
              <span className="ml-1 text-gray-600">{getCurrentStatusLabel(jobseeker.current_status)}</span>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <div>
              <span className="text-gray-700 font-medium">転職希望時期:</span>
              <span className="ml-1 text-gray-600">{getTransferTimingLabel(jobseeker.desired_transfer_timing)}</span>
            </div>
          </div>

          {jobseeker.experience_years && (
            <div className="flex items-center text-sm">
              <Award className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
              <div>
                <span className="text-gray-700 font-medium">経験年数:</span>
                <span className="ml-1 text-gray-600">{getExperienceYearsLabel(jobseeker.experience_years)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {skillsArray.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">スキル</h4>
              <div className="flex flex-wrap gap-1.5">
                {skillsArray.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-2 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {jobseeker.license && jobseeker.license !== "none" && jobseeker.license.trim() !== "" && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">保有資格</h4>
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">{jobseeker.license}</p>
            </div>
          )}

          {jobseeker.bio && jobseeker.bio.trim() !== "" && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">自己紹介</h4>
              <div className="bg-gray-50 px-3 py-2 rounded">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{showFullBio ? jobseeker.bio : bioText}</p>
                {isTruncated && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-800 flex items-center"
                  >
                    {showFullBio ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        省略表示
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        詳細表示
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between p-4 sm:p-6 pt-0">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full h-12 w-12 sm:h-14 sm:w-14 p-0 border-gray-300 hover:border-red-300 hover:bg-red-50"
          onClick={() => onSwipe(false)}
          disabled={isProcessingLike}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 hover:text-red-500" />
        </Button>

        <Button
          size="lg"
          className="rounded-full h-12 w-12 sm:h-14 sm:w-14 p-0 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          onClick={() => onSwipe(true)}
          disabled={isProcessingLike}
        >
          {isProcessingLike ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function CompanySwipePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [activeTab, setActiveTab] = useState("explore")
  const [jobseekers, setJobseekers] = useState<any[]>([])
  const [allJobseekers, setAllJobseekers] = useState<any[]>([])
  const [likedByJobseekers, setLikedByJobseekers] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentLikedIndex, setCurrentLikedIndex] = useState(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [isLoadingLikedBy, setIsLoadingLikedBy] = useState(false)
  const [isLoadingJobseekers, setIsLoadingJobseekers] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState<CompanyFilterCriteria>({})
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchedUser, setMatchedUser] = useState<any>(null)
  const [matchType, setMatchType] = useState<"auto" | "company_reply">("company_reply")
  const [isProcessingLike, setIsProcessingLike] = useState(false)

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        devLog("=== 企業スワイプ画面: 認証チェック開始 ===")

        const { getCurrentUserAction } = await import("@/app/actions/auth")
        const result = await getCurrentUserAction()

        devLog("企業スワイプ画面認証結果:", result)

        if (result.user) {
          devLog("企業スワイプ画面: ユーザー認証成功:", result.user.id)
          devLog("ユーザータイプ:", result.userType)

          if (result.userType !== "company") {
            devLog("企業ユーザーではありません:", result.userType)
            router.push("/login")
            return
          }

          setCurrentUser(result.user)
          setIsAuthenticated(true)
        } else {
          devLog("企業スワイプ画面: ユーザー認証失敗、ログイン画面にリダイレクト")
          setIsAuthenticated(false)
          router.push("/login")
          return
        }
      } catch (error) {
        devError("企業スワイプ画面認証チェックエラー:", error)
        setIsAuthenticated(false)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Load jobseekers from database
  useEffect(() => {
    const loadJobseekers = async () => {
      if (!isAuthenticated || !currentUser) return

      setIsLoadingJobseekers(true)
      try {
        devLog("=== Loading jobseekers for company ===")
        devLog("Current user:", currentUser)

        const jobseekersData = await getJobseekersForCompany(currentUser.id, 50)
        devLog("Jobseekers loaded:", jobseekersData?.length || 0)

        setAllJobseekers(jobseekersData || [])
        setJobseekers(jobseekersData || [])

        if (!jobseekersData || jobseekersData.length === 0) {
          devLog("No jobseekers found. Check database and RLS policies.")
        }
      } catch (error) {
        devError("Error loading jobseekers:", error)
        setAllJobseekers([])
        setJobseekers([])
      } finally {
        setIsLoadingJobseekers(false)
      }
    }

    loadJobseekers()
  }, [isAuthenticated, currentUser])

  // Filter jobseekers based on criteria
  const filterJobseekers = (jobseekers: any[], criteria: CompanyFilterCriteria) => {
    return jobseekers.filter((jobseeker) => {
      if (criteria.location && !jobseeker.preferred_location?.includes(criteria.location)) {
        return false
      }

      if (criteria.jobType && jobseeker.desired_job_type !== criteria.jobType) {
        return false
      }

      if (criteria.experienceYears && jobseeker.experience_years !== criteria.experienceYears) {
        return false
      }

      if (criteria.skills && criteria.skills.length > 0) {
        const jobseekerSkills = formatSkillsArray(jobseeker.skills || "")
        const hasRequiredSkills = criteria.skills.some((skill) => jobseekerSkills.includes(skill))
        if (!hasRequiredSkills) {
          return false
        }
      }

      return true
    })
  }

  // Apply filters to jobseekers
  useEffect(() => {
    if (!isAuthenticated) return

    const filtered = filterJobseekers(allJobseekers, filterCriteria)
    setJobseekers(filtered)
    setCurrentIndex(0)
  }, [filterCriteria, allJobseekers, isAuthenticated])

  const handleFilterApply = (criteria: CompanyFilterCriteria) => {
    setFilterCriteria(criteria)
  }

  // Load jobseekers who liked the company
  useEffect(() => {
    const loadLikedByJobseekers = async () => {
      if (!isAuthenticated || !currentUser) return

      setIsLoadingLikedBy(true)
      try {
        devLog("=== 企業への受信いいね取得開始 ===")
        devLog("企業ユーザーID:", currentUser.id)

        const receivedLikes = await getReceivedLikes(currentUser.id)
        devLog("取得した受信いいね:", receivedLikes)

        const jobseekerLikes = receivedLikes
          .filter((like: any) => like.sender_type === "jobseeker" && like.jobseeker_profiles)
          .map((like: any) => ({
            ...like.jobseeker_profiles,
            user_id: like.sender_user_id,
            like_id: like.id,
            liked_at: like.created_at,
          }))

        devLog("求職者からのいいね:", jobseekerLikes)
        setLikedByJobseekers(jobseekerLikes)
      } catch (error) {
        devError("Error loading jobseekers who liked company:", error)
        setLikedByJobseekers([])
      } finally {
        setIsLoadingLikedBy(false)
      }
    }

    loadLikedByJobseekers()
  }, [isAuthenticated, currentUser])

  const getCurrentJobseeker = () => {
    if (activeTab === "explore") {
      return jobseekers[currentIndex]
    } else {
      return likedByJobseekers[currentLikedIndex]
    }
  }

  const currentJobseeker = getCurrentJobseeker()
  const currentData = activeTab === "explore" ? jobseekers : likedByJobseekers
  const currentIdx = activeTab === "explore" ? currentIndex : currentLikedIndex

  const handleSwipe = async (liked: boolean) => {
    if (!currentJobseeker || isProcessingLike || !currentUser) return

    setDirection(liked ? "right" : "left")

    if (liked) {
      setIsProcessingLike(true)

      try {
        devLog(`=== 企業がいいね送信 ===`)
        devLog(`求職者: ${currentJobseeker.name}`)

        const result = await sendLikeAction(
          currentUser.id,
          currentJobseeker.user_id || currentJobseeker.id.toString(),
          "company",
        )

        devLog("いいね送信結果:", result)

        if (result.success) {
          const likedUserId = currentJobseeker.user_id || currentJobseeker.id.toString()
          devLog("いいね送信成功 - 対象求職者を一覧から削除:", likedUserId)

          setJobseekers((prev) =>
            prev.filter((jobseeker) => (jobseeker.user_id || jobseeker.id.toString()) !== likedUserId),
          )

          setAllJobseekers((prev) =>
            prev.filter((jobseeker) => (jobseeker.user_id || jobseeker.id.toString()) !== likedUserId),
          )

          if (activeTab === "liked-by") {
            setLikedByJobseekers((prev) =>
              prev.filter((jobseeker) => (jobseeker.user_id || jobseeker.id.toString()) !== likedUserId),
            )
          }

          if (result.isMatch) {
            devLog(`マッチ成立: ${result.matchType}`)
            setMatchedUser(result.matchedUser)
            setMatchType(result.matchType || "company_reply")
            setShowMatchModal(true)
          } else {
            devLog("いいね送信成功、マッチは未成立")
          }
        } else {
          devError("Failed to send like:", result.error)
        }
      } catch (error) {
        devError("Error processing like:", error)
      } finally {
        setIsProcessingLike(false)
      }
    }

    setTimeout(() => {
      if (activeTab === "explore") {
        if (currentIndex >= jobseekers.length - 1) {
          setCurrentIndex(Math.max(0, jobseekers.length - 2))
        }
      } else {
        if (currentLikedIndex >= likedByJobseekers.length - 1) {
          setCurrentLikedIndex(Math.max(0, likedByJobseekers.length - 2))
        }
      }
      setDirection(null)
    }, 300)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setDirection(null)
    if (value === "explore") {
      setCurrentIndex(0)
    } else {
      setCurrentLikedIndex(0)
    }
  }

  const handleNavigation = (direction: "prev" | "next") => {
    if (activeTab === "explore") {
      if (direction === "prev") {
        setCurrentIndex(Math.max(0, currentIndex - 1))
      } else {
        setCurrentIndex(Math.min(jobseekers.length - 1, currentIndex + 1))
      }
    } else {
      if (direction === "prev") {
        setCurrentLikedIndex(Math.max(0, currentLikedIndex - 1))
      } else {
        setCurrentLikedIndex(Math.min(likedByJobseekers.length - 1, currentLikedIndex + 1))
      }
    }
  }

  if (isLoading) {
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">リダイレクト中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">JobMatch</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/chat?type=company">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>マッチ一覧</span>
              </Button>
            </Link>
            <Link href="/mypage/company">
              <Button variant="ghost" size="sm">
                マイページ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-center mb-6 sm:mb-8">人材を探す</h1>

        <div className="flex justify-end mb-4 max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterModalOpen(true)}
            className="text-gray-600 border-gray-300"
          >
            <Filter className="h-4 w-4 mr-2" />
            絞り込む
            {(filterCriteria.location ||
              filterCriteria.skills?.length ||
              filterCriteria.jobType ||
              filterCriteria.experienceYears) && <div className="ml-2 h-2 w-2 bg-purple-600 rounded-full"></div>}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
            <TabsTrigger value="explore">探す</TabsTrigger>
            <TabsTrigger value="liked-by" className="relative">
              受け取ったいいね
              {likedByJobseekers.length > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{likedByJobseekers.length}</span>
                </div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-0">
            {isLoadingJobseekers ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">求職者データを読み込み中...</p>
              </div>
            ) : jobseekers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {allJobseekers.length === 0 ? "求職者が見つかりません" : "条件に合う人材が見つかりません"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {allJobseekers.length === 0 ? "求職者の登録をお待ちください" : "絞り込み条件を変更してみてください"}
                </p>
                {allJobseekers.length > 0 && (
                  <Button
                    onClick={() => setIsFilterModalOpen(true)}
                    variant="outline"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    絞り込み条件を変更
                  </Button>
                )}
              </div>
            ) : currentJobseeker ? (
              <div className="relative">
                <div
                  className={`transform transition-all duration-300 ${
                    direction === "left"
                      ? "translate-x-[-100vw] rotate-[-20deg]"
                      : direction === "right"
                        ? "translate-x-[100vw] rotate-[20deg]"
                        : ""
                  }`}
                >
                  <JobseekerCard
                    jobseeker={currentJobseeker}
                    onSwipe={handleSwipe}
                    isProcessingLike={isProcessingLike}
                  />
                </div>

                <div className="flex justify-center mt-6 space-x-2">
                  {jobseekers.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${index === currentIndex ? "bg-purple-600" : "bg-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="liked-by" className="mt-0">
            {isLoadingLikedBy ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : likedByJobseekers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">まだ求職者からいいねを受け取っていません</h3>
                <p className="text-gray-500 mb-6">求職者からのいいねをお待ちください</p>
                <Button onClick={() => setActiveTab("explore")} className="bg-purple-600 hover:bg-purple-700">
                  人材を探す
                </Button>
              </div>
            ) : currentJobseeker ? (
              <div className="relative">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 max-w-2xl mx-auto">
                  <p className="text-sm text-purple-700 font-medium">
                    💜 この求職者があなたの企業に「いいね」をしました！
                  </p>
                </div>

                <div
                  className={`transform transition-all duration-300 ${
                    direction === "left"
                      ? "translate-x-[-100vw] rotate-[-20deg]"
                      : direction === "right"
                        ? "translate-x-[100vw] rotate-[20deg]"
                        : ""
                  }`}
                >
                  <JobseekerCard
                    jobseeker={currentJobseeker}
                    onSwipe={handleSwipe}
                    isProcessingLike={isProcessingLike}
                  />
                </div>

                <div className="flex justify-center mt-6 space-x-2">
                  {likedByJobseekers.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentLikedIndex ? "bg-purple-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>

        {currentData.length > 0 && (
          <div className="flex justify-between mt-8 max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => handleNavigation("prev")}
              disabled={currentIdx === 0 || direction !== null}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              前へ
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleNavigation("next")}
              disabled={currentIdx === currentData.length - 1 || direction !== null}
            >
              次へ
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      <CompanyFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterApply}
        currentCriteria={filterCriteria}
      />

      <MatchSuccessModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchedUser={matchedUser}
        userType="company"
        matchType={matchType}
      />
    </div>
  )
}
