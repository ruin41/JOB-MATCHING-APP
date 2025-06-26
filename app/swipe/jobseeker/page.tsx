"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Heart,
  X,
  Building2,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquare,
  Award,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FilterModal, { type FilterCriteria } from "@/components/FilterModal"
import MatchSuccessModal from "@/components/MatchSuccessModal"
import { sendLikeAction } from "@/app/actions/matching"
import { useRouter } from "next/navigation"
import { useAuthGuard } from "@/hooks/useAuthGuard"
import { getCompaniesForJobseeker, getReceivedLikes } from "@/lib/database"

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

// Format salary function
function formatSalary(salary?: number): string {
  if (!salary || salary <= 0) return "応相談"
  return `${salary}万円`
}

// Job type mapping function
function getJobTypeLabel(jobType?: string): string {
  if (!jobType) return "未設定"

  const jobTypeMap: { [key: string]: string } = {
    frontend: "フロントエンドエンジニア",
    backend: "バックエンドエンジニア",
    fullstack: "フルスタックエンジニア",
    mobile: "モバイルアプリエンジニア",
    devops: "DevOpsエンジニア",
    data: "データエンジニア",
    ml: "機械学習エンジニア",
    qa: "QAエンジニア",
    pm: "プロダクトマネージャー",
    designer: "デザイナー",
    sales: "営業",
    marketing: "マーケティング",
    hr: "人事",
    finance: "経理・財務",
    cs: "カスタマーサポート",
    other: "その他",
  }

  return jobTypeMap[jobType] || "未設定"
}

// Safe function to get skills array
function getSkillsArray(skills: any): string[] {
  if (!skills) return []

  if (Array.isArray(skills)) {
    return skills.filter((skill) => skill && typeof skill === "string")
  }

  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills)
      if (Array.isArray(parsed)) {
        return parsed.filter((skill) => skill && typeof skill === "string")
      }
      return skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    } catch {
      return skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }
  }

  return []
}

// Safe function to get licenses array
function getLicensesArray(licenses: any): string[] {
  if (!licenses) return []

  if (Array.isArray(licenses)) {
    return licenses.filter((license) => license && typeof license === "string")
  }

  if (typeof licenses === "string") {
    try {
      const parsed = JSON.parse(licenses)
      if (Array.isArray(parsed)) {
        return parsed.filter((license) => license && typeof license === "string")
      }
      return licenses
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    } catch {
      return licenses
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }
  }

  return []
}

// 会社紹介文の省略表示
function truncateDescription(description: string, maxLength = 150): { text: string; isTruncated: boolean } {
  if (!description || description.length <= maxLength) {
    return { text: description || "", isTruncated: false }
  }
  return { text: description.substring(0, maxLength) + "...", isTruncated: true }
}

// CompanyCardコンポーネント
const CompanyCard = ({
  company,
  onSwipe,
  isProcessingLike,
}: {
  company: any
  onSwipe: (liked: boolean) => void
  isProcessingLike: boolean
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const skillsArray = getSkillsArray(company.required_skills)
  const licensesArray = getLicensesArray(company.required_licenses)
  const { text: descriptionText, isTruncated } = truncateDescription(
    company.job_description || company.company_bio,
    150,
  )

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 mx-auto sm:mx-0">
            <AvatarImage
              src={company.job_photo || company.company_logo || "/placeholder.svg?height=80&width=80"}
              alt={company.company_name}
            />
            <AvatarFallback>
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{company.company_name}</h2>
            {company.job_title && (
              <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                {company.job_title}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <div>
              <span className="text-gray-700 font-medium">勤務地:</span>
              <span className="ml-1 text-gray-600">{company.location || "未設定"}</span>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <DollarSign className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
            <div>
              <span className="text-gray-700 font-medium">想定年収:</span>
              <span className="ml-1 text-gray-600">{formatSalary(company.annual_income || company.salary)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">募集ポジション</h4>
            <div className="bg-gray-50 px-3 py-2 rounded">
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
                <span>{getJobTypeLabel(company.job_type)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">必須スキル</h4>
            {skillsArray.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skillsArray.map((skill: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-2 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">なし</p>
            )}
          </div>

          {licensesArray.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">必須資格</h4>
              <div className="bg-gray-50 px-3 py-2 rounded">
                {licensesArray.map((license: string, index: number) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <Award className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
                    <span>{license}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(company.job_description || company.company_bio) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                {company.job_description ? "仕事内容" : "会社紹介"}
              </h4>
              <div className="bg-gray-50 px-3 py-2 rounded">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {showFullDescription ? company.job_description || company.company_bio : descriptionText}
                </p>
                {isTruncated && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-800 flex items-center"
                  >
                    {showFullDescription ? (
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

export default function JobseekerSwipePage() {
  const { isLoading, isAuthenticated } = useAuthGuard()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("explore")
  const [companies, setCompanies] = useState<any[]>([])
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [likedByCompanies, setLikedByCompanies] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentLikedIndex, setCurrentLikedIndex] = useState(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [isLoadingLikedBy, setIsLoadingLikedBy] = useState(false)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({})
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchedUser, setMatchedUser] = useState<any>(null)
  const [matchType, setMatchType] = useState<"auto" | "company_reply">("auto")
  const [isProcessingLike, setIsProcessingLike] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!isAuthenticated) return

      try {
        const { getCurrentUserAction } = await import("@/app/actions/auth")
        const result = await getCurrentUserAction()

        if (result.user) {
          setCurrentUser(result.user)
          devLog("Current user loaded:", result.user)
        }
      } catch (error) {
        devError("Error loading current user:", error)
      }
    }

    loadCurrentUser()
  }, [isAuthenticated])

  // Load companies from database
  useEffect(() => {
    const loadCompanies = async () => {
      if (!isAuthenticated || !currentUser) return

      setIsLoadingCompanies(true)
      try {
        devLog("=== Loading companies for jobseeker ===")
        devLog("Current user:", currentUser)

        const companiesData = await getCompaniesForJobseeker(currentUser.id, 50)
        devLog("Companies loaded:", companiesData?.length || 0)

        const sanitizedCompanies = (companiesData || []).map((company) => ({
          ...company,
          required_skills: getSkillsArray(company.required_skills),
          required_licenses: getLicensesArray(company.required_licenses || company.required_license),
        }))

        setAllCompanies(sanitizedCompanies)
        setCompanies(sanitizedCompanies)

        if (!companiesData || companiesData.length === 0) {
          devLog("No companies found. Check database and RLS policies.")
        }
      } catch (error) {
        devError("Error loading companies:", error)
        setAllCompanies([])
        setCompanies([])
      } finally {
        setIsLoadingCompanies(false)
      }
    }

    loadCompanies()
  }, [isAuthenticated, currentUser])

  // Filter companies based on criteria
  const filterCompanies = (companies: any[], criteria: FilterCriteria) => {
    return companies.filter((company) => {
      if (criteria.minSalary) {
        const companySalary = company.annual_income || company.salary
        if (companySalary && companySalary < criteria.minSalary) {
          return false
        }
      }

      if (criteria.location && !company.location?.includes(criteria.location)) {
        return false
      }

      return true
    })
  }

  // Apply filters to companies
  useEffect(() => {
    if (!isAuthenticated) return

    const filtered = filterCompanies(allCompanies, filterCriteria)
    setCompanies(filtered)
    setCurrentIndex(0)
  }, [filterCriteria, allCompanies, isAuthenticated])

  const handleFilterApply = (criteria: FilterCriteria) => {
    setFilterCriteria(criteria)
  }

  // Load companies who liked the user
  useEffect(() => {
    const loadLikedByCompanies = async () => {
      if (!isAuthenticated || !currentUser) return

      setIsLoadingLikedBy(true)
      try {
        devLog("=== 求職者への受信いいね取得開始 ===")
        devLog("求職者ユーザーID:", currentUser.id)

        const receivedLikes = await getReceivedLikes(currentUser.id)
        devLog("取得した受信いいね:", receivedLikes)

        const companyLikes = receivedLikes
          .filter((like: any) => like.sender_type === "company" && like.company_profiles)
          .map((like: any) => ({
            ...like.company_profiles,
            user_id: like.sender_user_id,
            like_id: like.id,
            liked_at: like.created_at,
            required_skills: getSkillsArray(like.company_profiles.required_skills),
            required_licenses: getLicensesArray(like.company_profiles.required_licenses),
          }))

        devLog("企業からのいいね:", companyLikes)
        setLikedByCompanies(companyLikes)
      } catch (error) {
        devError("Error loading companies who liked user:", error)
        setLikedByCompanies([])
      } finally {
        setIsLoadingLikedBy(false)
      }
    }

    loadLikedByCompanies()
  }, [isAuthenticated, currentUser])

  const getCurrentCompany = () => {
    if (activeTab === "explore") {
      return companies[currentIndex]
    } else {
      return likedByCompanies[currentLikedIndex]
    }
  }

  const currentCompany = getCurrentCompany()
  const currentData = activeTab === "explore" ? companies : likedByCompanies
  const currentIdx = activeTab === "explore" ? currentIndex : currentLikedIndex

  const handleSwipe = async (liked: boolean) => {
    if (!currentCompany || isProcessingLike || !currentUser) return

    setDirection(liked ? "right" : "left")

    if (liked) {
      setIsProcessingLike(true)

      try {
        devLog(`=== 求職者がいいね送信 ===`)
        devLog(`企業: ${currentCompany.company_name}`)

        const result = await sendLikeAction(
          currentUser.id,
          currentCompany.user_id || currentCompany.id.toString(),
          "jobseeker",
        )

        devLog("いいね送信結果:", result)

        if (result.success) {
          const likedUserId = currentCompany.user_id || currentCompany.id.toString()
          devLog("いいね送信成功 - 対象企業を一覧から削除:", likedUserId)

          // タブに関係なく、いいねした企業は全ての一覧から削除
          setCompanies((prev) => prev.filter((company) => (company.user_id || company.id.toString()) !== likedUserId))
          setAllCompanies((prev) =>
            prev.filter((company) => (company.user_id || company.id.toString()) !== likedUserId),
          )
          setLikedByCompanies((prev) =>
            prev.filter((company) => (company.user_id || company.id.toString()) !== likedUserId),
          )

          if (result.isMatch) {
            devLog(`マッチ成立: ${result.matchType}`)
            setMatchedUser(result.matchedUser)
            setMatchType(result.matchType || "auto")
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
        if (currentIndex >= companies.length - 1) {
          setCurrentIndex(Math.max(0, companies.length - 2))
        }
      } else {
        if (currentLikedIndex >= likedByCompanies.length - 1) {
          setCurrentLikedIndex(Math.max(0, likedByCompanies.length - 2))
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
        setCurrentIndex(Math.min(companies.length - 1, currentIndex + 1))
      }
    } else {
      if (direction === "prev") {
        setCurrentLikedIndex(Math.max(0, currentLikedIndex - 1))
      } else {
        setCurrentLikedIndex(Math.min(likedByCompanies.length - 1, currentLikedIndex + 1))
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
    return null
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
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>マッチ一覧</span>
              </Button>
            </Link>
            <Link href="/mypage/jobseeker">
              <Button variant="ghost" size="sm">
                マイページ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-center mb-6 sm:mb-8">企業を探す</h1>

        <div className="flex justify-end mb-4 max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterModalOpen(true)}
            className="text-gray-600 border-gray-300"
          >
            <Filter className="h-4 w-4 mr-2" />
            絞り込む
            {(filterCriteria.minSalary || filterCriteria.location) && (
              <div className="ml-2 h-2 w-2 bg-purple-600 rounded-full"></div>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
            <TabsTrigger value="explore">探す</TabsTrigger>
            <TabsTrigger value="liked-by" className="relative">
              受け取ったいいね
              {likedByCompanies.length > 0 && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{likedByCompanies.length}</span>
                </div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-0">
            {isLoadingCompanies ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">企業データを読み込み中...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {allCompanies.length === 0 ? "企業が見つかりません" : "条件に合う企業が見つかりません"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {allCompanies.length === 0 ? "企業の登録をお待ちください" : "絞り込み条件を変更してみてください"}
                </p>
                {allCompanies.length > 0 && (
                  <Button
                    onClick={() => setIsFilterModalOpen(true)}
                    variant="outline"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    絞り込み条件を変更
                  </Button>
                )}
              </div>
            ) : currentCompany ? (
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
                  <CompanyCard company={currentCompany} onSwipe={handleSwipe} isProcessingLike={isProcessingLike} />
                </div>

                <div className="flex justify-center mt-6 space-x-2">
                  {companies.map((_, index) => (
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
            ) : likedByCompanies.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">まだ企業からいいねを受け取っていません</h3>
                <p className="text-gray-500 mb-6">企業からのいいねをお待ちください</p>
                <Button onClick={() => setActiveTab("explore")} className="bg-purple-600 hover:bg-purple-700">
                  企業を探す
                </Button>
              </div>
            ) : currentCompany ? (
              <div className="relative">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 max-w-2xl mx-auto">
                  <p className="text-sm text-purple-700 font-medium">💜 この企業があなたに「いいね」をしました！</p>
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
                  <CompanyCard company={currentCompany} onSwipe={handleSwipe} isProcessingLike={isProcessingLike} />
                </div>

                <div className="flex justify-center mt-6 space-x-2">
                  {likedByCompanies.map((_, index) => (
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterApply}
        currentCriteria={filterCriteria}
      />

      <MatchSuccessModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchedUser={matchedUser}
        userType="jobseeker"
        matchType={matchType}
      />
    </div>
  )
}
