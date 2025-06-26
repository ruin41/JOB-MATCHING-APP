"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, User, MapPin, Briefcase, DollarSign, X } from "lucide-react"

// モックデータ - 実際の実装では database.ts の getJobseekersWhoLikedCompany を使用
const MOCK_JOBSEEKERS_WHO_LIKED = [
  {
    id: 1,
    name: "山田 太郎",
    avatar: "/placeholder.svg?height=80&width=80",
    job_type: "フロントエンドエンジニア",
    preferred_location: "東京",
    preferred_salary_min: 5000000,
    preferred_salary_max: 6000000,
    experience_years: "3〜5年",
    bio: "Webフロントエンド開発に5年の経験があります。ユーザー体験を重視したUI/UX設計が得意で、最新のフロントエンド技術に常にキャッチアップしています。",
    jobseeker_skills: [
      { skills: { name: "React" } },
      { skills: { name: "TypeScript" } },
      { skills: { name: "Next.js" } },
    ],
  },
  {
    id: 2,
    name: "佐藤 花子",
    avatar: "/placeholder.svg?height=80&width=80",
    job_type: "バックエンドエンジニア",
    preferred_location: "大阪",
    preferred_salary_min: 6000000,
    preferred_salary_max: 7000000,
    experience_years: "5〜10年",
    bio: "バックエンド開発とクラウドインフラ構築に7年の経験があります。スケーラブルなシステム設計が得意で、チームリーダーとしての経験もあります。",
    jobseeker_skills: [{ skills: { name: "Node.js" } }, { skills: { name: "Python" } }, { skills: { name: "AWS" } }],
  },
  {
    id: 3,
    name: "鈴木 一郎",
    avatar: "/placeholder.svg?height=80&width=80",
    job_type: "フルスタックエンジニア",
    preferred_location: "リモート希望",
    preferred_salary_min: 7000000,
    preferred_salary_max: 8000000,
    experience_years: "3〜5年",
    bio: "フロントエンドからバックエンドまで一貫して開発できるフルスタックエンジニアです。スタートアップでの開発経験があり、新規サービスの立ち上げに携わりたいと考えています。",
    jobseeker_skills: [{ skills: { name: "React" } }, { skills: { name: "Node.js" } }, { skills: { name: "MongoDB" } }],
  },
]

interface CompanyLikesCounterProps {
  onLikesClick?: () => void
}

export default function CompanyLikesCounter({ onLikesClick }: CompanyLikesCounterProps) {
  const [likesCount, setLikesCount] = useState(0)
  const [jobseekersWhoLiked, setJobseekersWhoLiked] = useState<any[]>([])
  const [selectedJobseeker, setSelectedJobseeker] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        setLoading(true)
        // 実際の実装では database.ts の関数を使用
        // const count = await getLikesReceivedCount(companyId)
        // const jobseekers = await getJobseekersWhoLikedCompany(companyId)

        // モックデータを使用
        const count = MOCK_JOBSEEKERS_WHO_LIKED.length
        const jobseekers = MOCK_JOBSEEKERS_WHO_LIKED

        setLikesCount(count)
        setJobseekersWhoLiked(jobseekers)
      } catch (error) {
        console.error("Error fetching likes:", error)
        setLikesCount(0)
        setJobseekersWhoLiked([])
      } finally {
        setLoading(false)
      }
    }

    fetchLikes()
  }, [])

  const handleJobseekerClick = (jobseeker: any) => {
    setSelectedJobseeker(jobseeker)
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "応相談"
    if (min && max) {
      return `${Math.floor(min / 10000)}〜${Math.floor(max / 10000)}万円`
    }
    if (min) return `${Math.floor(min / 10000)}万円〜`
    if (max) return `〜${Math.floor(max / 10000)}万円`
    return "応相談"
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="opacity-70">
        <Heart className="h-4 w-4 mr-1 text-gray-400" />
        読み込み中...
      </Button>
    )
  }

  if (likesCount === 0) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLikesClick}
        className="relative text-purple-600 hover:text-purple-700 hover:bg-purple-50"
      >
        <Heart className="h-4 w-4 mr-1 fill-purple-600" />
        受け取ったいいね
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">{likesCount}</span>
        </span>
      </Button>

      {/* いいねしてくれた求職者一覧モーダル */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              いいねしてくれた求職者
              <Button variant="ghost" size="sm" onClick={() => {}} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {jobseekersWhoLiked.map((jobseeker) => (
              <Card
                key={jobseeker.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleJobseekerClick(jobseeker)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={jobseeker.avatar || "/placeholder.svg"} alt={jobseeker.name} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{jobseeker.name}</h2>
                      <p className="text-purple-600 font-medium">{jobseeker.job_type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 求職者詳細モーダル */}
      {selectedJobseeker && (
        <Dialog open={!!selectedJobseeker} onOpenChange={() => setSelectedJobseeker(null)}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                求職者詳細
                <Button variant="ghost" size="sm" onClick={() => setSelectedJobseeker(null)} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedJobseeker.avatar || "/placeholder.svg"} alt={selectedJobseeker.name} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedJobseeker.name}</h2>
                  <p className="text-purple-600 font-medium">{selectedJobseeker.job_type}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>希望勤務地: {selectedJobseeker.preferred_location}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-5 w-5 mr-2" />
                  <span>
                    希望年収:{" "}
                    {formatSalary(selectedJobseeker.preferred_salary_min, selectedJobseeker.preferred_salary_max)}
                  </span>
                </div>

                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-5 w-5 mr-2" />
                  <span>経験年数: {selectedJobseeker.experience_years}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedJobseeker.jobseeker_skills?.map((skillObj: any, index: number) => (
                    <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {skillObj.skills.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <p className="text-gray-600 text-sm">{selectedJobseeker.bio}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
