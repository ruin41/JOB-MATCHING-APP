import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

interface ChatHeaderProps {
  userType: "jobseeker" | "company"
}

export function ChatHeader({ userType }: ChatHeaderProps) {
  const mypageUrl = userType === "jobseeker" ? "/mypage/jobseeker" : "/mypage/company"
  const swipeUrl = userType === "jobseeker" ? "/swipe/jobseeker" : "/swipe/company"

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">JobMatch</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link href={swipeUrl}>
            <Button variant="ghost" size="sm">
              スワイプ画面
            </Button>
          </Link>
          <Link href={mypageUrl}>
            <Button variant="ghost" size="sm">
              マイページ
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
