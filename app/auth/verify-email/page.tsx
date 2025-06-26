"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AlertCircle } from "lucide-react"

const VerifyEmailPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next")

  useEffect(() => {
    if (token_hash && type) {
      const supabase = createClientComponentClient()

      const verifyEmail = async () => {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash,
        })
        if (error) {
          console.error("Error verifying email:", error)
        } else {
          console.log("Email verified successfully!")
        }
      }

      verifyEmail()
    }
  }, [token_hash, type])

  useEffect(() => {
    const supabase = createClientComponentClient()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, redirecting to role selection")
        router.push("/signup/role")
      }
    })

    // クリーンアップ
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  // メール送信完了画面（token_hashがない場合）
  if (!token_hash) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">メールを送信しました</h1>
            <p className="text-gray-600 mt-2">
              認証用のメールを送信しました。メール内のリンクをクリックして認証を完了してください。
            </p>
          </div>

          {/* 注意文を追加 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-yellow-800">
                  📌 注意：メールリンクは同じ端末・同じブラウザで開いてください
                </h3>
                <p className="text-sm text-yellow-700">
                  認証リンクは、<strong>メールを送信した端末と同じブラウザで開く</strong>
                  ことで、ログイン状態を安全に維持できます。
                  <br />
                  他のスマホやブラウザで開いた場合、正しくログインできない場合があります。
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>メールが届かない場合は、迷惑メールフォルダもご確認ください。</p>
          </div>
        </div>
      </div>
    )
  }

  // メール認証処理中画面（token_hashがある場合）
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">メール認証中...</h1>
      <p className="text-sm text-gray-600 mt-2">認証が完了するまで、しばらくお待ちください。</p>
      <p className="text-sm text-gray-600 mt-2">認証完了後、ロール選択画面に自動で遷移します。</p>
    </div>
  )
}

export default VerifyEmailPage
