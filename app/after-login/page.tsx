"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AfterLoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [isWaiting, setIsWaiting] = useState(true)

  useEffect(() => {
    const waitForSession = async () => {
      let attempts = 0
      const maxAttempts = 10
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

      while (attempts < maxAttempts) {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const userType = session.user.user_metadata?.user_type
          if (userType === "company") {
            router.replace("/mypage/company")
          } else if (userType === "jobseeker") {
            router.replace("/mypage/jobseeker")
          } else {
            router.replace("/signup/role-select")
          }
          return
        }

        await delay(300) // 0.3秒待つ
        attempts++
      }

      // セッション取得できなかった場合
      router.replace("/login")
    }

    waitForSession()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      セッションを確認中...
    </div>
  )
}
