"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageSquare, X, Building2, User, Zap, Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface MatchSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  matchedUser: {
    id: string | number
    name?: string
    company_name?: string
    avatar_url?: string
    logo_url?: string
    position_title?: string
    job_title?: string
  } | null
  userType: "jobseeker" | "company"
  matchType?: "auto" | "company_reply"
}

export default function MatchSuccessModal({
  isOpen,
  onClose,
  matchedUser,
  userType,
  matchType = "auto",
}: MatchSuccessModalProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  // Early return if matchedUser is null
  if (!matchedUser) {
    return null
  }

  const handleChatNavigation = async () => {
    setIsNavigating(true)
    try {
      // チャット画面に遷移
      const chatUrl = userType === "company" ? "/chat?type=company" : "/chat"
      router.push(chatUrl)
    } catch (error) {
      console.error("チャット画面への遷移に失敗しました:", error)
      setIsNavigating(false)
    }
  }

  const handleContinueSwiping = () => {
    onClose()
  }

  const displayName = userType === "jobseeker" ? matchedUser.company_name || "企業" : matchedUser.name || "求職者"

  const displayImage =
    userType === "jobseeker"
      ? matchedUser.logo_url || "/placeholder.svg?height=80&width=80"
      : matchedUser.avatar_url || "/placeholder.svg?height=80&width=80"

  const displayRole =
    userType === "jobseeker" ? matchedUser.position_title || "募集職種" : matchedUser.job_title || "職種"

  // マッチタイプに応じたメッセージとアイコン
  const getMatchInfo = () => {
    if (matchType === "auto") {
      return {
        icon: <Zap className="h-5 w-5 text-yellow-500" />,
        title: "⚡ 自動マッチ成立！",
        subtitle: "スキル・資格条件を満たしています",
        bgColor: "bg-yellow-50 border-yellow-200",
        textColor: "text-yellow-700",
      }
    } else {
      return {
        icon: <Users className="h-5 w-5 text-purple-500" />,
        title: "💜 相互マッチ成立！",
        subtitle: "お互いに興味を持っています",
        bgColor: "bg-purple-50 border-purple-200",
        textColor: "text-purple-700",
      }
    }
  }

  const matchInfo = getMatchInfo()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold text-purple-600 flex items-center gap-2">
              {matchInfo.icon}
              {matchInfo.title}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* マッチした相手の情報 */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <Avatar className="h-20 w-20 border-4 border-purple-200">
                <AvatarImage src={displayImage || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback className="text-lg">
                  {userType === "jobseeker" ? <Building2 className="h-8 w-8" /> : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1">{displayName}</h3>
            {displayRole && <p className="text-purple-600 font-medium mb-2">{displayRole}</p>}
          </div>

          {/* マッチタイプの説明 */}
          <div className={`${matchInfo.bgColor} border rounded-lg p-4 mb-6`}>
            <p className={`text-sm ${matchInfo.textColor} text-center font-medium`}>{matchInfo.subtitle}</p>
            {matchType === "auto" && (
              <p className={`text-xs ${matchInfo.textColor} text-center mt-1`}>
                条件が一致したため、自動的にマッチしました
              </p>
            )}
          </div>

          {/* 説明文 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 text-center">
              マッチが成立しました！
              <br />
              チャットでコミュニケーションを始めませんか？
            </p>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <Button
              onClick={handleChatNavigation}
              disabled={isNavigating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-base font-medium"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              {isNavigating ? "移動中..." : "チャットを始める"}
            </Button>

            <Button
              variant="outline"
              onClick={handleContinueSwiping}
              disabled={isNavigating}
              className="w-full py-3 text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              スワイプを続ける
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
