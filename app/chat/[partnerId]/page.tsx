"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { checkUsersMatched, getJobseekerProfile, getCompanyProfile } from "@/lib/database"
import MatchedChat from "@/components/chat/MatchedChat"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageCircle } from "lucide-react"

interface PartnerProfile {
  name?: string
  company_name?: string
  type: "jobseeker" | "company"
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const partnerId = params.partnerId as string

  const [isMatched, setIsMatched] = useState<boolean | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkMatchAndLoadProfile = async () => {
      if (!user || !partnerId || authLoading) return

      try {
        setLoading(true)
        setError(null)

        // Check if users are matched
        const matched = await checkUsersMatched(user.id, partnerId)
        setIsMatched(matched)

        if (matched) {
          // Load partner profile
          const [jobseekerProfile, companyProfile] = await Promise.all([
            getJobseekerProfile(partnerId),
            getCompanyProfile(partnerId),
          ])

          if (jobseekerProfile) {
            setPartnerProfile({
              name: jobseekerProfile.name,
              type: "jobseeker",
            })
          } else if (companyProfile) {
            setPartnerProfile({
              company_name: companyProfile.company_name,
              type: "company",
            })
          }
        }
      } catch (err) {
        console.error("Error checking match status:", err)
        setError("マッチング状況の確認中にエラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    checkMatchAndLoadProfile()
  }, [user, partnerId, authLoading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">エラー</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.back()} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isMatched === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-gray-400 mb-4">
              <MessageCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">チャットできません</h2>
            <p className="text-gray-600 mb-6">
              このユーザーとはまだマッチしていません。
              <br />
              お互いにいいねをしてマッチしてからチャットができるようになります。
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.push("/matches")} className="w-full">
                マッチ一覧に戻る
              </Button>
              <Button variant="outline" onClick={() => router.back()} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isMatched === true) {
    const partnerName = partnerProfile?.name || partnerProfile?.company_name || "相手"

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-3">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">{partnerName}とのチャット</h1>
            </div>
            <div style={{ height: "calc(100vh - 120px)" }}>
              <MatchedChat partnerId={partnerId} partnerName={partnerName} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
