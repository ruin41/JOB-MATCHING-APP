"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, User, MapPin, Mail, Briefcase, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// サンプルデータ
const SAMPLE_MATCHES = [
  {
    id: 1,
    name: "山田 太郎",
    avatar: "/placeholder.svg?height=80&width=80",
    jobType: "フロントエンドエンジニア",
    location: "東京",
    salary: "500〜600万円",
    experience: "3〜5年",
    skills: ["React", "TypeScript", "Next.js"],
    email: "yamada.taro@example.com",
  },
  {
    id: 2,
    name: "佐藤 花子",
    avatar: "/placeholder.svg?height=80&width=80",
    jobType: "バックエンドエンジニア",
    location: "大阪",
    salary: "600〜700万円",
    experience: "5〜10年",
    skills: ["Node.js", "Python", "AWS"],
    email: "sato.hanako@example.com",
  },
]

export default function CompanyMatchesPage() {
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
            <Link href="/mypage/company">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="企業" />
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-8">マッチした求職者</h1>

        {SAMPLE_MATCHES.length > 0 ? (
          <div className="space-y-4">
            {SAMPLE_MATCHES.map((match) => (
              <Card key={match.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={match.avatar || "/placeholder.svg"} alt={match.name} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h2 className="text-xl font-bold">{match.name}</h2>
                      <p className="text-purple-600 font-medium">{match.jobType}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{match.location}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>{match.salary}</span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          <span>{match.experience}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {match.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 bg-gray-50 p-4 rounded-lg flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900">{match.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">まだマッチがありません</h2>
            <p className="text-gray-500 mb-6">人材を見つけるには、スワイプ画面で「いいね」をしましょう</p>
            <Link href="/swipe/company">
              <Button className="bg-purple-600 hover:bg-purple-700">人材を探す</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
